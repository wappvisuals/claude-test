<?php

namespace App\Http\Resources;

use App\Enums\AccountPlan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SinfridAccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'type' => $this->type,
            'plan_id' => $this->plan_id,
            'plan_name' => $this->plan_id ? AccountPlan::getPlanTypeById((int) $this->plan_id) : null,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'city' => $this->city,
            'street' => $this->street,
            'zipcode' => $this->zipcode,
            'lang_code' => $this->lang_code,
            'country_code' => $this->country_code,
            'activation_date' => $this->activation_date,
            'email_confirmed' => (bool) $this->email_confirmed,
            'phone_confirmed' => (bool) $this->phone_confirmed,
            'status' => (bool) $this->status,
            'is_active' => $this->is_active,
            'is_deactivated' => $this->is_deactivated,
            'last_login_at' => $this->last_login_at,
            'deactivated_at' => $this->deactivated_at,
            'created_at' => $this->created_at,
            'family_members' => SinfridAccountMemberResource::collection($this->whenLoaded('familyMembers')),
        ];
    }
}
