<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'by_user' => $this->by_user,
            'customer' => $this->whenLoaded('customer', fn () => [
                'to_user' => $this->customer->to_user,
                'first_name' => $this->customer->first_name,
                'last_name' => $this->customer->last_name,
            ]),
            'prod_id' => $this->prod_id,
            'product_name' => $this->relationLoaded('product') && $this->product
                ? $this->product->display_name
                : null,
            'subscription_id' => $this->subscription_id,
            'date_added' => $this->date_added,
            'date_shipped' => $this->date($this->date_shipped),
            'date_paid' => $this->date($this->date_paid),
            'total' => (float) $this->total,
            'adjusted_total' => $this->when(
                $this->relationLoaded('adjustments'),
                fn () => round((float) $this->total + $this->adjustments->sum(fn ($a) => (float) data_get($a->metadata, 'adj_total', 0)), 2)
            ),
            'total_vat' => (float) $this->total_vat,
            'vat_rate' => $this->vat_rate,
            'payment_method' => $this->payment_method,
            'is_processed' => (bool) $this->is_processed,
            'is_shipped' => (bool) $this->is_shipped,
            'is_paid' => (bool) $this->is_paid,
            'is_cancelled' => $this->is_cancelled,
            'ref' => $this->ref,
            'ref1' => $this->ref1,
            'ref2' => $this->ref2,
            'region_code' => $this->region_code,
            'ip' => $this->ip,
            'invoice_no' => $this->invoice_no,
            'gothia_account' => $this->gothia_account,
            'invoice_partner' => $this->invoicePartnerName(),
            'shipment_center' => $this->shipment_center,
            'partner' => $this->partner,
            'parcel_tracking_id' => $this->parcel_tracking_id,
            'reason' => $this->reason,
            'metadata' => $this->metadata,
            // Normalized line items (detail endpoint only — cart can be a keyed object).
            'line_items' => $this->when($request->routeIs('orders.show'), fn () => $this->normalizedLineItems()),
            'adjustments' => $this->when(
                $this->relationLoaded('adjustments'),
                fn () => OrderAdjustmentResource::collection($this->adjustments)
            ),
        ];
    }

    private function date(?string $value): ?string
    {
        return ($value === null || $value === '0000-00-00') ? null : $value;
    }

    /** Normalize the unserialized cart (array or keyed object) to clean rows. */
    private function normalizedLineItems(): array
    {
        return collect($this->cart_items)
            ->filter(fn ($i) => is_array($i))
            ->map(fn ($i) => [
                'rowid' => $i['rowid'] ?? null,
                'prod_id' => $i['id'] ?? null,
                'name' => $i['name'] ?? null,
                'qty' => $i['qty'] ?? null,
                'price' => $i['price'] ?? null,
                'vat_percent' => $i['vat_percent'] ?? null,
                'subtotal' => $i['subtotal'] ?? null,
            ])
            ->values()
            ->all();
    }

    /** Best-effort invoice-partner label from the gothia ledger number. */
    private function invoicePartnerName(): ?string
    {
        $g = (int) $this->gothia_account;

        return match (true) {
            $g === 1 => 'Internal',
            $g >= 64 && $g <= 66 => 'Capway',
            $g >= 67 && $g <= 70 => 'Riverty',
            $g >= 71 && $g <= 73 => 'KK',
            $g > 100 && $g <= 160 => 'Zoho',
            default => null,
        };
    }
}
