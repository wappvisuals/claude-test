<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;

/**
 * Aggregated order/subscription counts for the customer profile stat cards.
 */
class CustomerStoreStatsController extends Controller
{
    public function __construct(
        private readonly SubscriptionService $subscriptions,
        private readonly OrderService $orders,
    ) {}

    public function show(int $id): JsonResponse
    {
        $orderStats = $this->orders->statsForCustomer($id);

        return response()->json(['data' => [
            'subscriptions' => $this->subscriptions->statsForCustomer($id),
            'orders' => [
                'approved' => $orderStats['approved'],
                'pending' => $orderStats['pending'],
            ],
            'last_order' => $orderStats['last_order'],
        ]]);
    }
}
