<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceReminderResource;
use App\Http\Resources\InvoiceResource;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

class InvoiceController extends Controller
{
    public function __construct(private readonly InvoiceService $service) {}

    public function indexForOrder(int $id): AnonymousResourceCollection|JsonResponse
    {
        try {
            return InvoiceResource::collection($this->service->listForOrder($id));
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            return (new InvoiceResource($this->service->getDetails($id)))->response();
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function updateDueDate(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate(['due_date' => 'required|date_format:Y-m-d']);

        return $this->run(fn () => new InvoiceResource($this->service->alterDueDate($id, $validated['due_date'])));
    }

    public function regeneratePaymentLink(int $id): JsonResponse
    {
        return $this->run(fn () => new InvoiceResource($this->service->regeneratePaymentLink($id)));
    }

    public function reminders(int $id): AnonymousResourceCollection|JsonResponse
    {
        try {
            return InvoiceReminderResource::collection($this->service->remindersList($id));
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
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
