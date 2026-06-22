<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'ref' => $this->ref,
            'data' => $this->data,
            'prod_id' => $this->prod_id,
            'sub_id' => $this->sub_id,
            'company_type' => $this->company_type,
            'initiator' => $this->initiator,
            'date' => $this->date_added,
        ];
    }
}
