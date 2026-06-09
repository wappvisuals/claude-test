<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $product = $this->whenLoaded('product');

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'active' => (int) $this->active,
            'status' => $this->active ? 'Active' : 'Cancelled',
            'commitment' => $this->relationLoaded('product') && $this->product
                ? (int) $this->product->time
                : null,
            'i' => $this->i,
            'payment_type' => $this->payment_type,
            'prod_id' => $this->subscription_id,
            'product_name' => $this->relationLoaded('product') && $this->product
                ? $this->product->display_name
                : null,
            'next_shipment' => $this->date($this->next_shipment),
            'date_started' => $this->date($this->date_started),
            'date_cancelled' => $this->date($this->date_cancelled),
            'date_churned' => $this->date($this->date_churned),
            'date_inactivated' => $this->date($this->date_inactivated),
            'days' => $this->daysUntil($this->next_shipment),
            'reference' => $this->ref,
            'ref1' => $this->ref1,
            'ref2' => $this->ref2,
            'cancel_method' => $this->cancel_method,
            'cancel_reason' => $this->relationLoaded('cancelReason') && $this->cancelReason
                ? $this->cancelReason->name
                : null,
            'is_pre_financed' => (bool) $this->is_pre_financed,
            'pre_finance_count' => (int) $this->pre_finance_count,
            'final_invoice' => $this->date($this->final_invoice),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /** Normalize legacy '0000-00-00' sentinels to null. */
    private function date(?string $value): ?string
    {
        return ($value === null || $value === '0000-00-00') ? null : $value;
    }

    /** Whole days from today until the given date (null if no valid date). */
    private function daysUntil(?string $value): ?int
    {
        $date = $this->date($value);
        if (! $date) {
            return null;
        }

        return (int) floor(now()->startOfDay()->diffInDays($date, false));
    }
}
