<?php

namespace App\Traits;

use Illuminate\Support\Arr;

/**
 * Records per-field audit entries into `customer_changes` for the customer.
 *
 * Call AFTER a successful update, passing the pre-update attribute snapshot
 * (captured via `getAttributes()` before `update()`), so old/new values are
 * accurate even though Eloquent has already synced the original state.
 *
 * The hosting model must define a `changes()` HasMany relation whose foreign
 * key maps to the customer (change_user_id → to_user).
 */
trait CustomerChangeLogger
{
    /**
     * @param  array<string, mixed>|null  $original  Pre-update attribute snapshot.
     */
    public function logChanges(string $action, ?array $original = null): void
    {
        // Only persisted, relevant changes — skip free-text comments and timestamps.
        $changes = Arr::except($this->getChanges(), ['comments', 'updated_at', 'created_at']);

        if (empty($changes)) {
            return;
        }

        $original = $original ?? $this->getOriginal();
        $batchId = (int) ($this->changes()->max('change_batch_id') ?? 0) + 1;
        $initiator = auth()->id();
        $now = now();

        foreach ($changes as $field => $newValue) {
            $oldValue = $original[$field] ?? null;

            $this->changes()->create([
                'change_initiator_user_id' => $initiator,
                'change_batch_id' => $batchId,
                'change_action' => $action,
                'change_date' => $now,
                'change_field' => $field,
                'change_old_value' => $this->stringifyChangeValue($oldValue),
                'change_new_value' => $this->stringifyChangeValue($newValue),
            ]);
        }
    }

    /**
     * Record a single semantic change (not driven by dirty model attributes) —
     * e.g. blocking an SSN or linking an organization.
     */
    public function logChange(string $action, string $field, mixed $oldValue, mixed $newValue): void
    {
        $this->changes()->create([
            'change_initiator_user_id' => auth()->id(),
            'change_batch_id' => (int) ($this->changes()->max('change_batch_id') ?? 0) + 1,
            'change_action' => $action,
            'change_date' => now(),
            'change_field' => $field,
            'change_old_value' => $this->stringifyChangeValue($oldValue),
            'change_new_value' => $this->stringifyChangeValue($newValue),
        ]);
    }

    private function stringifyChangeValue(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_array($value)) {
            return json_encode($value, JSON_THROW_ON_ERROR);
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        return (string) $value;
    }
}
