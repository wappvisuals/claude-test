<?php

namespace App\Services;

use App\Models\BlockedSsn;
use App\Models\Customer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use RuntimeException;

class BlockedSsnService
{
    public function getList(array $params): LengthAwarePaginator
    {
        $perPage = min((int) ($params['per_page'] ?? 25), 100);
        $query = BlockedSsn::query()->with('addedBy')->latest('created_at');

        if (!empty($params['q'])) {
            $term = '%' . $params['q'] . '%';
            $query->where(function ($w) use ($term) {
                $w->where('ssn', 'like', $term)->orWhere('reason', 'like', $term);
            });
        }

        return $query->paginate($perPage);
    }

    public function block(string $ssn, ?string $reason): BlockedSsn
    {
        if (BlockedSsn::isBlocked($ssn)) {
            throw new RuntimeException('SSN is already blocked.');
        }

        $record = BlockedSsn::create([
            'ssn' => $ssn,
            'reason' => $reason,
        ]);

        $this->logToCustomer($ssn, 'block', 'no', 'yes');

        return $record->load('addedBy');
    }

    public function unblock(int $id): void
    {
        $record = BlockedSsn::query()->findOrFail($id);
        $ssn = $record->ssn;
        $record->delete();

        $this->logToCustomer($ssn, 'unblock', 'yes', 'no');
    }

    public function unblockBySsn(string $ssn): void
    {
        $deleted = BlockedSsn::query()->where('ssn', $ssn)->delete();

        if ($deleted > 0) {
            $this->logToCustomer($ssn, 'unblock', 'yes', 'no');
        }
    }

    /**
     * Record the block/unblock in the customer change log, if the SSN belongs to
     * a known customer (change_user_id is a FK to customer_profile.to_user).
     */
    private function logToCustomer(string $ssn, string $action, string $old, string $new): void
    {
        $customer = Customer::query()->where('pers_nr', $ssn)->first();
        $customer?->logChange($action, 'ssn_blocked', $old, $new);
    }
}
