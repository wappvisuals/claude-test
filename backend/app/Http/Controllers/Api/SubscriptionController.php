<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubscriptionResource;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class SubscriptionController extends Controller
{
    public function __construct(private readonly SubscriptionService $service) {}

    /** Per-customer list (customer profile Subscriptions tab) — grouped. */
    public function indexForCustomer(Request $request, int $id): JsonResponse
    {
        try {
            return response()->json($this->service->getListForCustomer($id, $request->all()));
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            return (new SubscriptionResource($this->service->getDetails($id)))->response();
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    /** Edit: change next-shipment date. */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'next_shipment' => 'required|date_format:Y-m-d',
        ]);

        return $this->run(fn () => new SubscriptionResource($this->service->alter($id, $validated)));
    }

    /** Deactivate with reason. */
    public function deactivate(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason_id' => 'nullable|integer',
            'method' => 'nullable|string|max:255',
        ]);

        return $this->run(fn () => new SubscriptionResource($this->service->deactivate($id, $validated)));
    }

    private function run(callable $fn): JsonResponse
    {
        try {
            return $fn()->response();
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
