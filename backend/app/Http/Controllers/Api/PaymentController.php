<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

class PaymentController extends Controller
{
    public function __construct(private readonly PaymentService $service) {}

    public function indexForInvoice(int $id): AnonymousResourceCollection|JsonResponse
    {
        try {
            return PaymentResource::collection($this->service->listForInvoice($id));
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function store(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'sum' => 'required|numeric|min:0',
            'date' => 'nullable|date_format:Y-m-d',
            'reference' => 'nullable|string|max:255',
            'payer_name' => 'nullable|string|max:255',
        ]);

        try {
            return (new PaymentResource($this->service->addManual($id, $validated)))->response();
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
