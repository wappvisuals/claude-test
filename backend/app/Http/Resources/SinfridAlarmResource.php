<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SinfridAlarmResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'text' => $this->text,
            'severity' => $this->severity,
            'status' => $this->status,
            'category' => $this->category,
            'source' => $this->source,
            'coachme_available' => (bool) $this->coachme_available,
            'coachme_description' => $this->coachme_description,
            'date' => $this->date,
            'created_at' => $this->created_at,
        ];
    }
}
