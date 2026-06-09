<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderAdjustmentResource;
use App\Http\Resources\OrderResource;
use App\Services\OrderAdjustmentService;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $service,
        private readonly OrderAdjustmentService $adjustments,
    ) {}

    /** Global order list (status + date-range + search). */
    public function index(Request $request): AnonymousResourceCollection
    {
        return OrderResource::collection($this->service->getList($request->all()));
    }

    /** Per-customer list (customer profile Orders tab) — grouped by product. */
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
            return (new OrderResource($this->service->getDetails($id)))->response();
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        return $this->run(fn () => new OrderResource($this->service->cancel($id, $validated)));
    }

    public function addAdjustment(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:fee,discount',
            'amount' => 'required|numeric|min:0',
            'comment' => 'nullable|string|max:1000',
            'rowid' => 'nullable|string|max:64',
            'prod_id' => 'nullable',
            'product_name' => 'nullable|string|max:255',
        ]);

        return $this->run(fn () => new OrderAdjustmentResource($this->adjustments->store($id, $validated)));
    }

    public function destroyAdjustment(int $id, int $adjustmentId): JsonResponse
    {
        try {
            $this->adjustments->delete($id, $adjustmentId);

            return response()->json(['message' => 'Adjustment removed.']);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
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
