<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BlockedSsnResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ssn' => $this->ssn,
            'reason' => $this->reason,
            'added_by' => $this->addedBy ? [
                'id' => $this->addedBy->id,
                'username' => $this->addedBy->name,
            ] : null,
            'created_at' => $this->created_at,
        ];
    }
}
