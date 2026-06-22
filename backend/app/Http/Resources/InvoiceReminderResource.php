<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceReminderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workflow_id' => $this->workflow_id,
            'template_id' => $this->template_id,
            'batch' => $this->batch,
            'status' => (int) $this->status,
            'created_at' => $this->created_at,
        ];
    }
}
