<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrganizationResource;
use App\Models\CustomerOrganization;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrganizationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'q'        => 'required|string|min:1|max:50',
            'per_page' => 'integer|min:1|max:50',
        ]);

        $q       = $validated['q'];
        $perPage = min((int) ($validated['per_page'] ?? 15), 50);

        $results = CustomerOrganization::query()
            ->where('id', 'like', $q . '%')
            ->orWhere('name', 'like', '%' . $q . '%')
            ->orderBy('id')
            ->paginate($perPage);

        return OrganizationResource::collection($results);
    }
}
