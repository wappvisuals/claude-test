<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Future-order jobs queued per subscription. The legacy worker queue lives in a
 * generic `jobs` table whose schema collides with Laravel's queue `jobs`, so
 * this is a focused, dedicated table for the admin future-orders feature.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('future_order_jobs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subscription_id')->index();
            $table->string('batch', 50)->nullable();
            $table->enum('status', ['queued', 'done', 'failed', 'skipped', 'cancelled'])->default('queued')->index();
            $table->json('payload')->nullable();
            $table->dateTime('execute_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('future_order_jobs');
    }
};
