<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\InsurancePolicy;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Local-DB insurance policy management. The legacy partner API
 * (InsurancePolicyApiInterface) is not available here, so cancel/sync operate
 * on local state only — wire a gateway here if/when the partner is integrated.
 */
class InsurancePolicyService
{
    public function getListForCustomer(int $customerId, array $params = []): LengthAwarePaginator
    {
        if (! Customer::query()->where('to_user', $customerId)->exists()) {
            throw new RuntimeException("Customer not found: $customerId");
        }

        $perPage = min((int) ($params['per_page'] ?? 50), 100);

        return InsurancePolicy::query()
            ->where('customer_id', $customerId)
            ->latest('created_at')
            ->paginate($perPage);
    }

    public function createForCustomer(int $customerId, array $data): InsurancePolicy
    {
        if (! Customer::query()->where('to_user', $customerId)->exists()) {
            throw new RuntimeException("Customer not found: $customerId");
        }

        return InsurancePolicy::query()->create([
            'id' => (string) Str::uuid(),
            'customer_id' => $customerId,
            'product' => $data['product'],
            'start_date' => $data['start_date'],
            'relationship' => $data['relationship'] ?? null,
            'status' => 'active',
            'source' => 'manual',
        ]);
    }

    public function handleCancellation(string $id, array $data): InsurancePolicy
    {
        $policy = $this->find($id);

        $policy->status = 'cancelled';
        $policy->end_date = $data['endDate'];
        $policy->status_message = ! empty($data['reason'])
            ? 'Cancelled: '.$data['reason']
            : 'Cancelled manually';
        $policy->save();

        return $policy;
    }

    /**
     * No external partner to reconcile against — returns current state.
     * Kept so the UI "Sync status" action has a stable endpoint.
     */
    public function handleStatusSync(string $id): InsurancePolicy
    {
        return $this->find($id);
    }

    public function delete(string $id): void
    {
        $this->find($id)->delete();
    }

    private function find(string $id): InsurancePolicy
    {
        $policy = InsurancePolicy::query()->find($id);

        if (! $policy) {
            throw new RuntimeException("Policy not found for ID: $id");
        }

        return $policy;
    }
}
