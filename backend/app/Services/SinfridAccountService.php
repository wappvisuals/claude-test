<?php

namespace App\Services;

use App\Enums\AccountPlan;
use App\Models\Customer;
use App\Models\SinfridAccount;
use App\Models\SinfridAccountMember;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Local-DB Sinfrid account management. The legacy Defentry API is not available
 * here, so all operations act on local state only.
 */
class SinfridAccountService
{
    public function getForCustomer(int $customerId): SinfridAccount
    {
        $customer = Customer::query()->where('to_user', $customerId)->first();

        if (!$customer) {
            throw new RuntimeException("Customer not found: $customerId");
        }

        $account = SinfridAccount::query()
            ->with('familyMembers')
            ->where('customer_id', $customerId)
            ->first();

        if (!$account) {
            throw new RuntimeException("Sinfrid account not found for customer: $customerId");
        }

        return $account;
    }

    public function getAlarmsForCustomer(int $customerId, array $params = []): LengthAwarePaginator
    {
        $account = $this->getForCustomer($customerId);
        $perPage = min((int) ($params['per_page'] ?? 25), 100);

        return $account->alarms()
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Synthesize a simple activity feed from local account state (no external API).
     *
     * @return array<int, array{event: string, label: string, date: string|null}>
     */
    public function getActivitiesForCustomer(int $customerId): array
    {
        $account = $this->getForCustomer($customerId);

        $activities = [
            ['event' => 'created', 'label' => 'Account created', 'date' => $account->created_at?->toDateTimeString()],
        ];

        if ($account->activation_date) {
            $activities[] = ['event' => 'activated', 'label' => 'Account activated', 'date' => (string) $account->activation_date];
        }
        if ($account->last_login_at) {
            $activities[] = ['event' => 'login', 'label' => 'Last login', 'date' => $account->last_login_at->toDateTimeString()];
        }
        if ($account->deactivated_at) {
            $activities[] = ['event' => 'deactivated', 'label' => 'Account deactivated', 'date' => $account->deactivated_at->toDateTimeString()];
        }

        usort($activities, static fn ($a, $b) => strcmp((string) $b['date'], (string) $a['date']));

        return $activities;
    }

    public function createFamilyMember(string $accountId, array $data): SinfridAccountMember
    {
        $account = $this->findAccount($accountId);

        $maxMembers = AccountPlan::getMaxMembersCount(
            AccountPlan::getPlanTypeById((int) $account->plan_id) ?? ''
        );
        if ($maxMembers !== null && $account->familyMembers()->count() >= $maxMembers) {
            throw new RuntimeException("This plan allows at most $maxMembers family member(s).");
        }

        return $account->familyMembers()->create([
            'id' => (string) Str::uuid(),
            'ssn' => $data['ssn'],
            'first_name' => $data['first_name'] ?? null,
            'last_name' => $data['last_name'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'status' => true,
        ]);
    }

    public function updateFamilyMember(string $accountId, string $memberId, array $data): SinfridAccountMember
    {
        $member = $this->findMember($accountId, $memberId);
        $member->fill($data);
        $member->save();

        return $member;
    }

    public function removeFamilyMember(string $accountId, string $memberId): void
    {
        $this->findMember($accountId, $memberId)->delete();
    }

    public function updateDetails(string $accountId, array $data): SinfridAccount
    {
        $account = $this->findAccount($accountId);
        $account->fill($data);
        $account->save();

        return $account->load('familyMembers');
    }

    public function handleStatusUpdate(string $accountId, string $action): SinfridAccount
    {
        $account = $this->findAccount($accountId);

        match ($action) {
            'activate' => $this->ensure($account->is_deactivated, "Account is already active.") && $account->reactivate(),
            'deactivate' => $this->ensure(!$account->is_deactivated, "Account is already deactivated.") && $account->deactivate(),
            default => throw new RuntimeException("Invalid action: $action"),
        };

        return $account->fresh('familyMembers');
    }

    public function handlePlanChange(string $accountId, int $planId): SinfridAccount
    {
        if (!AccountPlan::isValidId($planId)) {
            throw new RuntimeException("Invalid plan id: $planId");
        }

        $account = $this->findAccount($accountId);
        $account->update([
            'plan_id' => $planId,
            'type' => AccountPlan::getCategoryById($planId),
        ]);

        return $account->fresh('familyMembers');
    }

    public function delete(string $accountId): void
    {
        $account = $this->findAccount($accountId);
        $account->familyMembers->each->delete();
        $account->delete();
    }

    private function findAccount(string $accountId): SinfridAccount
    {
        $account = SinfridAccount::query()->with('familyMembers')->find($accountId);

        if (!$account) {
            throw new RuntimeException("Sinfrid account not found for ID: $accountId");
        }

        return $account;
    }

    private function findMember(string $accountId, string $memberId): SinfridAccountMember
    {
        $member = SinfridAccountMember::query()
            ->where('account_id', $accountId)
            ->where('id', $memberId)
            ->first();

        if (!$member) {
            throw new RuntimeException("Family member not found: $memberId");
        }

        return $member;
    }

    private function ensure(bool $condition, string $message): bool
    {
        if (!$condition) {
            throw new RuntimeException($message);
        }

        return true;
    }
}
