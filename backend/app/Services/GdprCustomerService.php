<?php

namespace App\Services;

use App\Enums\GdprExclusionType;
use App\Enums\GdprStatus;
use App\Models\Customer;
use App\Models\GdprCustomer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Crypt;
use RuntimeException;

class GdprCustomerService
{
    /**
     * PII fields to back up / mask, mapped to their masking strategy.
     */
    private const GDPR_FIELDS = [
        'maskInitial' => ['last_name', 'adress'],
        'maskAll' => ['pers_nr', 'tel', 'alternative_tel'],
        'maskEmail' => ['email', 'alternative_email'],
        'maskBirthdate' => ['birthdate'],
    ];

    public function getList(array $params): LengthAwarePaginator
    {
        $perPage = min((int) ($params['per_page'] ?? 25), 100);

        $query = GdprCustomer::query()
            ->with(['customer', 'requester'])
            ->latest('flagged_at');

        if (!empty($params['status'])) {
            $query->whereIn('status', (array) $params['status']);
        }

        if (!empty($params['q'])) {
            $term = trim($params['q']);
            $like = '%' . $term . '%';
            $query->where(function ($w) use ($term, $like) {
                // Match the linked customer's name…
                $w->whereHas('customer', function ($c) use ($like) {
                    $c->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", [$like])
                        ->orWhere('first_name', 'like', $like)
                        ->orWhere('last_name', 'like', $like);
                });
                // …or the customer id directly.
                if (ctype_digit($term)) {
                    $w->orWhere('customer_id', (int) $term);
                }
            });
        }

        return $query->paginate($perPage);
    }

    public function setFlag(int $customerId, GdprExclusionType $exclusionType): GdprCustomer
    {
        $customer = $this->findCustomer($customerId);
        $status = $customer->gdpr?->status;

        if ($status?->isLocked()) {
            throw new RuntimeException("Cannot set GDPR flag: status is '{$status->label()}'.");
        }

        $backup = Crypt::encryptString(json_encode(
            $customer->only($this->backupFields()),
            JSON_THROW_ON_ERROR
        ));

        $gdpr = GdprCustomer::query()->updateOrCreate(
            ['customer_id' => $customerId],
            [
                'status' => GdprStatus::Flagged,
                'exclusion_type' => $exclusionType,
                'flagged_at' => now(),
                'encrypted_backup' => $backup,
                'phone' => $customer->tel,
                'source' => 'manual',
            ]
        );

        return $gdpr->load(['customer', 'requester']);
    }

    public function unflag(int $customerId): void
    {
        $gdpr = $this->findCustomer($customerId)->gdpr;

        if (!$gdpr) {
            throw new RuntimeException("No GDPR flag exists for customer $customerId.");
        }

        $gdpr->delete();
    }

    public function updateStatus(int $customerId, GdprStatus $status): GdprCustomer
    {
        $gdpr = $this->findCustomer($customerId)->gdpr;

        if (!$gdpr) {
            throw new RuntimeException("No GDPR record exists for customer $customerId.");
        }

        $gdpr->status = $status;
        $gdpr->save();

        return $gdpr->load(['customer', 'requester']);
    }

    public function anonymize(int $customerId): GdprCustomer
    {
        return $this->resolveAction(
            $customerId,
            GdprStatus::PendingReview,
            GdprStatus::Anonymized,
            'anonymize',
            function (Customer $customer) {
                $masked = [];
                foreach ($this->fieldMap() as $field => $method) {
                    $value = $customer->{$field};
                    $masked[$field] = $value ? $this->{$method}($value) : $value;
                }

                return $masked;
            }
        );
    }

    public function deanonymize(int $customerId): GdprCustomer
    {
        return $this->resolveAction(
            $customerId,
            GdprStatus::Anonymized,
            GdprStatus::Restored,
            'restore',
            function (Customer $customer, GdprCustomer $gdpr) {
                if (!$gdpr->encrypted_backup) {
                    throw new RuntimeException('No encrypted backup available to restore from.');
                }

                return json_decode(Crypt::decryptString($gdpr->encrypted_backup), true, 512, JSON_THROW_ON_ERROR);
            }
        );
    }

    public function performBulkAction(string $action, array $customerIds): void
    {
        if (empty($customerIds)) {
            throw new RuntimeException('No customers selected for GDPR action.');
        }

        foreach ($customerIds as $customerId) {
            match ($action) {
                'flag' => $this->updateStatus((int) $customerId, GdprStatus::Flagged),
                'unflag' => $this->unflag((int) $customerId),
                'anonymize' => $this->anonymize((int) $customerId),
                'restore' => $this->deanonymize((int) $customerId),
                'reject' => $this->updateStatus((int) $customerId, GdprStatus::Rejected),
                default => throw new RuntimeException("Invalid GDPR bulk action: $action"),
            };
        }
    }

    /**
     * Shared anonymize / restore flow: validate state, apply field changes
     * WITHOUT logging them (PII must not leak into the change log), advance status.
     */
    private function resolveAction(
        int $customerId,
        GdprStatus $expected,
        GdprStatus $target,
        string $action,
        callable $resolver
    ): GdprCustomer {
        $customer = $this->findCustomer($customerId);
        $gdpr = $customer->gdpr;

        if (!$gdpr) {
            throw new RuntimeException("GDPR record not found for customer $customerId.");
        }

        if (!$gdpr->status->is($expected)) {
            throw new RuntimeException("Cannot $action customer: status is '{$gdpr->status->label()}'.");
        }

        $updateData = $resolver($customer, $gdpr);

        // Apply directly + save (no logChanges) so masked/restored PII is not audited.
        foreach ($updateData as $field => $value) {
            $customer->{$field} = $value;
        }
        $customer->save();

        $gdpr->status = $target;
        $gdpr->save();

        return $gdpr->load(['customer', 'requester']);
    }

    private function findCustomer(int $customerId): Customer
    {
        $customer = Customer::query()->with('gdpr')->where('to_user', $customerId)->first();

        if (!$customer) {
            throw new RuntimeException("Customer not found: $customerId");
        }

        return $customer;
    }

    /** @return string[] */
    private function backupFields(): array
    {
        return array_merge(...array_values(self::GDPR_FIELDS));
    }

    /** @return array<string, string> field => masking method */
    private function fieldMap(): array
    {
        $map = [];
        foreach (self::GDPR_FIELDS as $method => $fields) {
            foreach ($fields as $field) {
                $map[$field] = $method;
            }
        }

        return $map;
    }

    private function maskAll(string $value): string
    {
        return preg_replace('/[^-]/u', '*', $value);
    }

    private function maskInitial(string $value): string
    {
        return implode(' ', array_map(
            static fn ($word) => $word ? mb_substr($word, 0, 1) . str_repeat('*', max(0, mb_strlen($word) - 1)) : '',
            explode(' ', $value)
        ));
    }

    private function maskEmail(string $email): string
    {
        if (!str_contains($email, '@')) {
            return str_repeat('*', mb_strlen($email));
        }

        [$local, $domain] = explode('@', $email);
        $maskedLocal = mb_substr($local, 0, 1) . str_repeat('*', max(0, mb_strlen($local) - 1));
        $maskedDomain = implode('.', array_map(
            static fn ($part) => $part ? mb_substr($part, 0, 1) . str_repeat('*', max(0, mb_strlen($part) - 1)) : '',
            explode('.', $domain)
        ));

        return "$maskedLocal@$maskedDomain";
    }

    private function maskBirthdate(string $date, int $visibleChars = 2): string
    {
        return mb_substr($date, 0, $visibleChars) . str_repeat('*', max(0, mb_strlen($date) - $visibleChars));
    }
}
