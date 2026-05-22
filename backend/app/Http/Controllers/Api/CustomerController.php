<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Services\CustomerSearchService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'page'     => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
            'sort_by'  => 'in:to_user,first_name,last_name,last_order',
            'sort_dir' => 'in:asc,desc',
            'status'   => 'array',
            'status.*' => 'in:active,inactive,blocked',
        ]);

        $sortBy  = $validated['sort_by']  ?? 'to_user';
        $sortDir = $validated['sort_dir'] ?? ($sortBy === 'to_user' ? 'desc' : 'asc');
        $perPage = min((int) ($validated['per_page'] ?? 25), 100);

        $query = Customer::query()
            ->selectRaw('customer_profile.*, NULL as last_order, NULL as relevance_score, NULL as matched_fields_raw');

        if (!empty($validated['status'])) {
            $query->whereIn('status', $validated['status']);
        }

        $customers = $query
            ->orderBy($sortBy === 'last_order' ? 'last_order' : $sortBy, $sortDir)
            ->paginate($perPage);

        return CustomerResource::collection($customers);
    }

    public function show(int $id): CustomerResource
    {
        $customer = Customer::query()
            ->selectRaw('customer_profile.*, NULL as last_order, NULL as relevance_score, NULL as matched_fields_raw')
            ->where('to_user', $id)
            ->firstOrFail();

        return new CustomerResource($customer);
    }

    public function search(Request $request, CustomerSearchService $service): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'q'                 => 'required|string|min:1|max:200',
            'status'            => 'array',
            'status.*'          => 'in:active,inactive,blocked',
            'last_order_after'  => 'nullable|date_format:Y-m-d',
            'last_order_before' => 'nullable|date_format:Y-m-d',
            'page'              => 'integer|min:1',
            'per_page'          => 'integer|min:1|max:100',
        ]);

        $results = $service->search($validated);

        return CustomerResource::collection($results);
    }
}
