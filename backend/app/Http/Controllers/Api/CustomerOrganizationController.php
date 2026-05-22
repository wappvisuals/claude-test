<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Models\CustomerOrganization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerOrganizationController extends Controller
{
    public function upsert(Request $request, int $id): CustomerResource|JsonResponse
    {
        $customer = Customer::where('to_user', $id)->firstOrFail();

        $validated = $request->validate([
            'organization_id' => 'required|string|max:10',
            'name'            => 'nullable|string|max:255',
        ]);

        $orgId    = $validated['organization_id'];
        $orgName  = $validated['name'] ?? null;

        $existing = CustomerOrganization::find($orgId);

        if (!$existing && !$orgName) {
            return response()->json([
                'message' => 'The name field is required when creating a new organization.',
                'errors'  => ['name' => ['The name field is required when creating a new organization.']],
            ], 422);
        }

        CustomerOrganization::updateOrCreate(
            ['id' => $orgId],
            ['name' => $orgName ?? $existing->name],
        );

        $customer->update(['organization_id' => $orgId]);

        return new CustomerResource(
            Customer::query()
                ->selectRaw('customer_profile.*, NULL as last_order, NULL as relevance_score, NULL as matched_fields_raw')
                ->where('to_user', $id)
                ->firstOrFail()
        );
    }
}
