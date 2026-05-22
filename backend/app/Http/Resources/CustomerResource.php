<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $matchedFields = null;
        if (!empty($this->matched_fields_raw)) {
            $matchedFields = array_values(array_filter(
                explode(',', $this->matched_fields_raw)
            ));
        }

        return [
            'id'                 => $this->to_user,
            'first_name'         => $this->first_name,
            'last_name'          => $this->last_name,
            'full_name'          => trim("{$this->first_name} {$this->last_name}"),
            'email'              => $this->email,
            'alternative_email'  => $this->alternative_email,
            'tel'                => $this->tel,
            'alternative_tel'    => $this->alternative_tel,
            'status'             => $this->status,
            'do_not_call'        => $this->do_not_call,
            'difficult_customer' => $this->difficult_customer,
            'want_newsletter'    => $this->want_newsletter,
            'careof'             => $this->careof,
            'adress'             => $this->adress,
            'post_nr'            => $this->post_nr,
            'ort'                => $this->ort,
            'pers_nr'            => $this->pers_nr,
            'sex'                => $this->sex,
            'birthdate'          => $this->birthdate,
            'language'           => $this->language,
            'region_code'        => $this->region_code,
            'date_added'         => $this->date_added,
            'first_visit'        => $this->first_visit,
            'updated_at'         => $this->updated_at,
            'last_order'         => $this->last_order ?? null,
            'organization_id'    => $this->organization_id,
            'organization_name'  => $this->organization?->name,
            'comments'           => $this->comments,
            'ledgers'            => $this->ledgers,
            'blocked_fees'       => $this->blocked_fees,
            'reminders'          => $this->reminders,
            'gothia_account'     => $this->gothia_account,
            'credit_check'       => $this->credit_check,
            'sync'               => $this->sync,
            'relevance_score'    => isset($this->relevance_score) ? (int) $this->relevance_score : null,
            'matched_fields'     => $matchedFields,
        ];
    }
}
