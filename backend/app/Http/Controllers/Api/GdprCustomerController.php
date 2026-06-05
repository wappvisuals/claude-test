<?php

namespace App\Http\Controllers\Api;

use App\Enums\GdprExclusionType;
use App\Enums\GdprStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\GdprCustomerResource;
use App\Services\GdprCustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

class GdprCustomerController extends Controller
{
    public function __construct(private readonly GdprCustomerService $service)
    {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'q' => 'nullable|string|max:200',
            'status' => 'array',
            'status.*' => ['string', 'in:' . implode(',', GdprStatus::all())],
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
        ]);

        return GdprCustomerResource::collection($this->service->getList($validated));
    }

    public function exclusionTypes(): JsonResponse
    {
        return response()->json(['data' => GdprExclusionType::options()]);
    }

    public function bulkAction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|in:flag,unflag,anonymize,reject,restore',
            'customers' => 'required|array|min:1',
            'customers.*' => 'integer',
        ]);

        try {
            $this->service->performBulkAction($validated['action'], $validated['customers']);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'GDPR status updated for the selected customers.']);
    }

    public function flag(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'exclusion_type' => ['required', 'string', 'in:' . implode(',', GdprExclusionType::all())],
        ]);

        return $this->run(fn () => new GdprCustomerResource(
            $this->service->setFlag($id, GdprExclusionType::from($validated['exclusion_type']))
        ));
    }

    public function unflag(int $id): JsonResponse
    {
        return $this->run(function () use ($id) {
            $this->service->unflag($id);

            return response()->json(['message' => 'GDPR flag removed successfully.']);
        });
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:' . implode(',', GdprStatus::all())],
        ]);

        return $this->run(fn () => new GdprCustomerResource(
            $this->service->updateStatus($id, GdprStatus::from($validated['status']))
        ));
    }

    public function anonymize(int $id): JsonResponse
    {
        return $this->run(fn () => new GdprCustomerResource($this->service->anonymize($id)));
    }

    public function deanonymize(int $id): JsonResponse
    {
        return $this->run(fn () => new GdprCustomerResource($this->service->deanonymize($id)));
    }

    /**
     * Run a service action, mapping domain errors to 422 JSON responses.
     */
    private function run(callable $fn): JsonResponse
    {
        try {
            $result = $fn();

            return $result instanceof JsonResponse ? $result : $result->response();
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
