<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FutureOrderJobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'subscription_id' => $this->subscription_id,
            'batch' => $this->batch,
            'status' => $this->status,
            'cycle' => data_get($this->payload, 'cycle'),
            'prod_id' => data_get($this->payload, 'prod_id'),
            'execute_at' => optional($this->execute_at)->toDateTimeString(),
            'created_at' => $this->created_at,
        ];
    }
}
