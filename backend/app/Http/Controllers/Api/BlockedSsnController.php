<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BlockedSsnResource;
use App\Services\BlockedSsnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

class BlockedSsnController extends Controller
{
    public function __construct(private readonly BlockedSsnService $service)
    {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'q' => 'nullable|string|max:200',
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
        ]);

        return BlockedSsnResource::collection($this->service->getList($validated));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ssn' => 'required|string|min:10|max:20',
            'reason' => 'nullable|string|max:1000',
        ]);

        try {
            $blocked = $this->service->block(trim($validated['ssn']), $validated['reason'] ?? null);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new BlockedSsnResource($blocked))->response()->setStatusCode(201);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->unblock($id);

        return response()->json(['message' => 'SSN block removed successfully.']);
    }

    public function destroyBySsn(string $ssn): JsonResponse
    {
        $this->service->unblockBySsn(urldecode($ssn));

        return response()->json(['message' => 'SSN block removed successfully.']);
    }
}
