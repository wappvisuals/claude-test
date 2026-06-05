<?php

namespace App\Http\Controllers\Api;

use App\Enums\AccountPlan;
use App\Http\Controllers\Controller;
use App\Http\Resources\SinfridAccountMemberResource;
use App\Http\Resources\SinfridAccountResource;
use App\Http\Resources\SinfridAlarmResource;
use App\Services\SinfridAccountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

class SinfridAccountController extends Controller
{
    public function __construct(private readonly SinfridAccountService $service)
    {
    }

    public function show(int $id): JsonResponse
    {
        try {
            return (new SinfridAccountResource($this->service->getForCustomer($id)))->response();
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function store(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'plan_id' => 'required|integer',
            'activation_date' => 'nullable|date_format:Y-m-d',
            'first_name' => 'nullable|string|max:64',
            'last_name' => 'nullable|string|max:64',
            'email' => 'nullable|email|max:128',
            'phone' => 'nullable|string|max:30',
        ]);

        return $this->run(fn () => new SinfridAccountResource($this->service->createForCustomer($id, $validated)), 201);
    }

    public function alarms(Request $request, int $id): AnonymousResourceCollection|JsonResponse
    {
        try {
            return SinfridAlarmResource::collection($this->service->getAlarmsForCustomer($id, $request->all()));
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function activities(int $id): JsonResponse
    {
        try {
            return response()->json(['data' => $this->service->getActivitiesForCustomer($id)]);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    /** Available plans for the change-plan picker. */
    public function plans(): JsonResponse
    {
        return response()->json(['data' => AccountPlan::options()]);
    }

    public function addFamilyMember(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'ssn' => 'required|string|max:30',
            'first_name' => 'nullable|string|max:64',
            'last_name' => 'nullable|string|max:64',
            'email' => 'nullable|email|max:128',
            'phone' => 'nullable|string|max:30',
        ]);

        return $this->run(fn () => new SinfridAccountMemberResource(
            $this->service->createFamilyMember($id, $validated)
        ), 201);
    }

    public function updateFamilyMember(Request $request, string $id, string $memberId): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'nullable|string|max:64',
            'last_name' => 'nullable|string|max:64',
            'email' => 'nullable|email|max:128',
            'phone' => 'nullable|string|max:30',
        ]);

        return $this->run(fn () => new SinfridAccountMemberResource(
            $this->service->updateFamilyMember($id, $memberId, $validated)
        ));
    }

    public function removeFamilyMember(string $id, string $memberId): JsonResponse
    {
        return $this->run(function () use ($id, $memberId) {
            $this->service->removeFamilyMember($id, $memberId);

            return response()->json(['message' => 'Family member removed successfully.']);
        });
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'nullable|string|max:64',
            'last_name' => 'nullable|string|max:64',
            'email' => 'nullable|email|max:128',
            'phone' => 'nullable|string|max:30',
            'city' => 'nullable|string|max:100',
            'street' => 'nullable|string|max:150',
            'zipcode' => 'nullable|string|max:20',
        ]);

        return $this->run(fn () => new SinfridAccountResource($this->service->updateDetails($id, $validated)));
    }

    public function updateStatus(string $id, string $action): JsonResponse
    {
        return $this->run(fn () => new SinfridAccountResource($this->service->handleStatusUpdate($id, $action)));
    }

    public function changePlan(string $id, int $planId): JsonResponse
    {
        return $this->run(fn () => new SinfridAccountResource($this->service->handlePlanChange($id, $planId)));
    }

    public function destroy(string $id): JsonResponse
    {
        return $this->run(function () use ($id) {
            $this->service->delete($id);

            return response()->json(['message' => 'Sinfrid account deleted successfully.']);
        });
    }

    private function run(callable $fn, int $status = 200): JsonResponse
    {
        try {
            $result = $fn();

            return $result instanceof JsonResponse ? $result : $result->response()->setStatusCode($status);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
