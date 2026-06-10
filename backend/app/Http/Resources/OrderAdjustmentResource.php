<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderAdjustmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'type' => $this->type,
            'adj_total' => data_get($this->metadata, 'adj_total'),
            'old_price' => data_get($this->metadata, 'old_price'),
            'new_price' => data_get($this->metadata, 'new_price'),
            'rowid' => data_get($this->metadata, 'rowid'),
            'prod_id' => data_get($this->metadata, 'prod_id'),
            'product_name' => data_get($this->metadata, 'product_name'),
            'comment' => $this->comment,
            'origin' => $this->origin,
            'initiator' => $this->initiator,
            'initiator_name' => $this->whenLoaded('user', fn () => $this->user?->username),
            'created_at' => $this->created_at,
        ];
    }
}
