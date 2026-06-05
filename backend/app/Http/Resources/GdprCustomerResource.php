<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GdprCustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $customer = $this->customer;
        $customerName = $customer
            ? trim("{$customer->first_name} {$customer->last_name}")
            : null;

        return [
            'id' => (string) $this->id,
            'customer_id' => $this->customer_id,
            'customer_name' => $customerName ?: null,
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'exclusion_type' => $this->exclusion_type?->value,
            'exclusion_description' => $this->exclusion_type?->description(),
            'flagged_at' => $this->flagged_at,
            'anonymized_at' => $this->anonymized_at,
            'restored_at' => $this->restored_at,
            'source' => $this->source,
            'requested_by' => $this->requester ? [
                'id' => $this->requester->id,
                'username' => $this->requester->name,
            ] : null,
        ];
    }
}
