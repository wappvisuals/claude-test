<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerChangeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'change_id' => $this->change_id,
            'change_batch_id' => $this->change_batch_id,
            'change_action' => $this->change_action,
            'change_field' => $this->change_field,
            'change_old_value' => $this->change_old_value,
            'change_new_value' => $this->change_new_value,
            'change_date' => $this->change_date,
            'user' => $this->user ? [
                'id' => $this->user->id,
                'username' => $this->user->name,
            ] : null,
        ];
    }
}
