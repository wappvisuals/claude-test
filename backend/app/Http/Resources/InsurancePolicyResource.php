<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InsurancePolicyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'request_id' => $this->request_id,
            'external_customer_id' => $this->external_customer_id,
            'product' => $this->product,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'partner_reference' => $this->partner_reference,
            'relationship' => $this->relationship,
            'status' => $this->status,
            'status_message' => $this->status_message,
            'source' => $this->source,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
