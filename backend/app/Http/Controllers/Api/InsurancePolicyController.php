<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InsurancePolicyResource;
use App\Services\InsurancePolicyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

class InsurancePolicyController extends Controller
{
    public function __construct(private readonly InsurancePolicyService $service)
    {
    }

    public function index(Request $request, int $id): AnonymousResourceCollection|JsonResponse
    {
        try {
            return InsurancePolicyResource::collection($this->service->getListForCustomer($id, $request->all()));
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'endDate' => 'required|date_format:Y-m-d',
        ]);

        return $this->run(fn () => new InsurancePolicyResource(
            $this->service->handleCancellation($id, $validated)
        ), 'Policy cancellation initiated.');
    }

    public function syncStatus(string $id): JsonResponse
    {
        return $this->run(fn () => new InsurancePolicyResource(
            $this->service->handleStatusSync($id)
        ), 'Policy status synced.');
    }

    public function destroy(string $id): JsonResponse
    {
        return $this->run(function () use ($id) {
            $this->service->delete($id);

            return response()->json(['message' => 'Insurance policy deleted successfully.']);
        });
    }

    private function run(callable $fn, ?string $message = null): JsonResponse
    {
        try {
            $result = $fn();

            if ($result instanceof JsonResponse) {
                return $result;
            }

            $response = $result->response();
            if ($message) {
                $data = $response->getData(true);
                $data['message'] = $message;
                $response->setData($data);
            }

            return $response;
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
