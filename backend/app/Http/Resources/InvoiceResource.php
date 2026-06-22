<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'order_id' => (int) $this->invoice_id,
            'customer_id' => $this->customer_id,
            'sub_account_id' => $this->sub_account_id,
            'region_code' => $this->region_code,
            'provider' => $this->provider,
            'owner' => $this->owner,
            'total' => (float) $this->total,
            'balance' => (float) $this->balance,
            'date' => $this->date(optional($this->date)->toDateString() ?? $this->getRawOriginal('date')),
            'due_date' => $this->date(optional($this->due_date)->toDateString() ?? $this->getRawOriginal('due_date')),
            'status' => $this->status,
            'payment_link' => data_get($this->metadata, 'payment_link'),
            'customer' => $this->whenLoaded('customer', fn () => $this->customer ? [
                'to_user' => $this->customer->to_user,
                'first_name' => $this->customer->first_name,
                'last_name' => $this->customer->last_name,
            ] : null),
            'created_at' => $this->created_at,
        ];
    }

    private function date(?string $value): ?string
    {
        return ($value === null || $value === '0000-00-00') ? null : $value;
    }
}
