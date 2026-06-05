<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerChangeResource;
use App\Models\CustomerChange;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerChangeController extends Controller
{
    public function index(Request $request, int $id): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:200',
        ]);

        $perPage = min((int) ($validated['per_page'] ?? 100), 200);

        $changes = CustomerChange::query()
            ->with('user')
            ->where('change_user_id', $id)
            ->orderByDesc('change_batch_id')
            ->orderByDesc('change_id')
            ->paginate($perPage);

        return CustomerChangeResource::collection($changes);
    }
}
