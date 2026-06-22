<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'sum' => (float) $this->sum,
            'date' => optional($this->date)->toDateString() ?? $this->getRawOriginal('date'),
            'reference' => $this->reference,
            'payer_name' => $this->payer_name,
            'source' => $this->source,
            'is_processed' => (bool) $this->is_processed,
            'created_at' => $this->created_at,
        ];
    }
}
