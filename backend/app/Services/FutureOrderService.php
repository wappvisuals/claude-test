<?php

namespace App\Services;

use App\Models\FutureOrderJob;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use RuntimeException;

/**
 * Local future-order queue. The legacy FutureOrderService pre-generates real
 * `orders` ahead of time via the worker queue, governed by canGenerate/churn/
 * intervals. Here v1 queues simplified job rows in `future_order_jobs` (next
 * cycles from next_shipment + product interval) behind an implicit generator
 * stub — wire real order pre-generation later (see plan §4.1/§6).
 */
class FutureOrderService
{
    private const CYCLES = 3;

    public function listForSubscription(int $subscriptionId): Collection
    {
        $this->findSubscription($subscriptionId);

        return FutureOrderJob::query()
            ->where('subscription_id', $subscriptionId)
            ->orderByRaw('execute_at IS NULL, execute_at ASC')
            ->orderByDesc('id')
            ->get();
    }

    /** Queue the next few future-order cycles for the subscription. */
    public function generate(int $subscriptionId): Collection
    {
        $subscription = $this->findSubscription($subscriptionId);

        $interval = (int) ($subscription->product->intervall ?? 0) ?: 30;
        $start = ($subscription->next_shipment && $subscription->next_shipment !== '0000-00-00')
            ? Carbon::parse($subscription->next_shipment)
            : Carbon::today();
        $batch = 'fo_'.$subscriptionId.'_'.now()->format('YmdHis');

        for ($i = 0; $i < self::CYCLES; $i++) {
            FutureOrderJob::query()->create([
                'subscription_id' => $subscriptionId,
                'batch' => $batch,
                'status' => 'queued',
                'payload' => ['cycle' => $i + 1, 'prod_id' => $subscription->subscription_id],
                'execute_at' => $start->copy()->addDays($interval * $i)->toDateTimeString(),
            ]);
        }

        return $this->listForSubscription($subscriptionId);
    }

    public function reschedule(int $jobId, string $executeAt): FutureOrderJob
    {
        $job = $this->findJob($jobId);
        $job->update(['execute_at' => $executeAt, 'status' => 'queued']);

        return $job->fresh();
    }

    public function skip(int $jobId): FutureOrderJob
    {
        $job = $this->findJob($jobId);
        $job->update(['status' => 'skipped']);

        return $job->fresh();
    }

    public function cancel(int $jobId): FutureOrderJob
    {
        $job = $this->findJob($jobId);
        $job->update(['status' => 'cancelled']);

        return $job->fresh();
    }

    private function findSubscription(int $id): Subscription
    {
        $subscription = Subscription::query()->with('product')->find($id);
        if (! $subscription) {
            throw new RuntimeException("Subscription not found: $id");
        }

        return $subscription;
    }

    private function findJob(int $id): FutureOrderJob
    {
        $job = FutureOrderJob::query()->find($id);
        if (! $job) {
            throw new RuntimeException("Future order job not found: $id");
        }

        return $job;
    }
}
