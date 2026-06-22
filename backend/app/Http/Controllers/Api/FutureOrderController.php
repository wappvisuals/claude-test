<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FutureOrderJobResource;
use App\Services\FutureOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

class FutureOrderController extends Controller
{
    public function __construct(private readonly FutureOrderService $service) {}

    public function indexForSubscription(int $id): AnonymousResourceCollection|JsonResponse
    {
        try {
            return FutureOrderJobResource::collection($this->service->listForSubscription($id));
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function generate(int $id): AnonymousResourceCollection|JsonResponse
    {
        try {
            return FutureOrderJobResource::collection($this->service->generate($id));
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function reschedule(Request $request, int $jobId): JsonResponse
    {
        $validated = $request->validate(['execute_at' => 'required|date']);

        return $this->run(fn () => new FutureOrderJobResource($this->service->reschedule($jobId, $validated['execute_at'])));
    }

    public function skip(int $jobId): JsonResponse
    {
        return $this->run(fn () => new FutureOrderJobResource($this->service->skip($jobId)));
    }

    public function cancel(int $jobId): JsonResponse
    {
        return $this->run(fn () => new FutureOrderJobResource($this->service->cancel($jobId)));
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
