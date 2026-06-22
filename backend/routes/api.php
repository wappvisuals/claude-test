<?php

use App\Http\Controllers\Api\BlockedSsnController;
use App\Http\Controllers\Api\CustomerChangeController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\CustomerOrganizationController;
use App\Http\Controllers\Api\CustomerStoreStatsController;
use App\Http\Controllers\Api\FutureOrderController;
use App\Http\Controllers\Api\GdprCustomerController;
use App\Http\Controllers\Api\InsurancePolicyController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\SinfridAccountController;
use App\Http\Controllers\Api\SubscriptionController;
use Illuminate\Support\Facades\Route;

Route::get('/customers/search', [CustomerController::class, 'search']);

// GDPR management
Route::get('/gdpr/customers', [GdprCustomerController::class, 'index']);
Route::get('/gdpr/exclusion-types', [GdprCustomerController::class, 'exclusionTypes']);
Route::post('/gdpr/bulk-action', [GdprCustomerController::class, 'bulkAction']);

// Blocked SSN
Route::get('/blocked-ssn', [BlockedSsnController::class, 'index']);
Route::post('/blocked-ssn', [BlockedSsnController::class, 'store']);
Route::delete('/blocked-ssn/by-ssn/{ssn}', [BlockedSsnController::class, 'destroyBySsn'])->where('ssn', '.*');
Route::delete('/blocked-ssn/{id}', [BlockedSsnController::class, 'destroy'])->where('id', '[0-9]+');

// Insurance policies
Route::post('/policies/{id}/cancel', [InsurancePolicyController::class, 'cancel']);
Route::post('/policies/{id}/sync-status', [InsurancePolicyController::class, 'syncStatus']);
Route::delete('/policies/{id}', [InsurancePolicyController::class, 'destroy']);

// Orders
Route::get('/orders', [OrderController::class, 'index']);
Route::get('/orders/{id}', [OrderController::class, 'show'])->where('id', '[0-9]+')->name('orders.show');
Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel'])->where('id', '[0-9]+');
Route::post('/orders/{id}/adjustments', [OrderController::class, 'addAdjustment'])->where('id', '[0-9]+');
Route::delete('/orders/{id}/adjustments/{adjustmentId}', [OrderController::class, 'destroyAdjustment'])->where(['id' => '[0-9]+', 'adjustmentId' => '[0-9]+']);
Route::post('/orders/{id}/refund', [OrderController::class, 'refund'])->where('id', '[0-9]+');
Route::patch('/orders/{id}/return/{action}', [OrderController::class, 'setReturn'])->where(['id' => '[0-9]+', 'action' => 'set|unset']);
Route::post('/orders/{id}/resend-confirmation', [OrderController::class, 'resendConfirmation'])->where('id', '[0-9]+');
Route::post('/orders/{id}/notes', [OrderController::class, 'addNote'])->where('id', '[0-9]+');

// Invoices & payments
Route::get('/orders/{id}/invoices', [InvoiceController::class, 'indexForOrder'])->where('id', '[0-9]+');
Route::get('/invoices/{id}', [InvoiceController::class, 'show'])->where('id', '[0-9]+');
Route::post('/invoices/{id}/due-date', [InvoiceController::class, 'updateDueDate'])->where('id', '[0-9]+');
Route::post('/invoices/{id}/payment-link', [InvoiceController::class, 'regeneratePaymentLink'])->where('id', '[0-9]+');
Route::get('/invoices/{id}/reminders', [InvoiceController::class, 'reminders'])->where('id', '[0-9]+');
Route::get('/invoices/{id}/payments', [PaymentController::class, 'indexForInvoice'])->where('id', '[0-9]+');
Route::post('/invoices/{id}/payments', [PaymentController::class, 'store'])->where('id', '[0-9]+');

// Subscriptions
Route::get('/subscriptions/{id}', [SubscriptionController::class, 'show'])->where('id', '[0-9]+');
Route::patch('/subscriptions/{id}', [SubscriptionController::class, 'update'])->where('id', '[0-9]+');
Route::post('/subscriptions/{id}/deactivate', [SubscriptionController::class, 'deactivate'])->where('id', '[0-9]+');
Route::post('/subscriptions/{id}/reactivate', [SubscriptionController::class, 'reactivate'])->where('id', '[0-9]+');
Route::post('/subscriptions/{id}/final-invoice/{action}', [SubscriptionController::class, 'finalInvoice'])->where(['id' => '[0-9]+', 'action' => 'set|unset']);
Route::get('/subscriptions/{id}/event-log', [SubscriptionController::class, 'eventLog'])->where('id', '[0-9]+');

// Future orders
Route::get('/subscriptions/{id}/future-orders', [FutureOrderController::class, 'indexForSubscription'])->where('id', '[0-9]+');
Route::post('/subscriptions/{id}/future-orders/generate', [FutureOrderController::class, 'generate'])->where('id', '[0-9]+');
Route::patch('/future-orders/{jobId}', [FutureOrderController::class, 'reschedule'])->where('jobId', '[0-9]+');
Route::post('/future-orders/{jobId}/skip', [FutureOrderController::class, 'skip'])->where('jobId', '[0-9]+');
Route::delete('/future-orders/{jobId}', [FutureOrderController::class, 'cancel'])->where('jobId', '[0-9]+');

// Sinfrid account (account-scoped)
Route::get('/sinfrid-account/plans', [SinfridAccountController::class, 'plans']);
Route::post('/sinfrid-account/{id}/family-members', [SinfridAccountController::class, 'addFamilyMember']);
Route::patch('/sinfrid-account/{id}/family-members/{memberId}', [SinfridAccountController::class, 'updateFamilyMember']);
Route::delete('/sinfrid-account/{id}/family-members/{memberId}', [SinfridAccountController::class, 'removeFamilyMember']);
Route::post('/sinfrid-account/{id}/change-plan/{planId}', [SinfridAccountController::class, 'changePlan'])->where('planId', '[0-9]+');
Route::patch('/sinfrid-account/{id}/{action}', [SinfridAccountController::class, 'updateStatus'])->where('action', 'activate|deactivate');
Route::patch('/sinfrid-account/{id}', [SinfridAccountController::class, 'update']);
Route::delete('/sinfrid-account/{id}', [SinfridAccountController::class, 'destroy']);

// Customer-scoped
Route::get('/customers/{id}/changes', [CustomerChangeController::class, 'index'])->where('id', '[0-9]+');
Route::get('/customers/{id}/store-stats', [CustomerStoreStatsController::class, 'show'])->where('id', '[0-9]+');
Route::get('/customers/{id}/subscriptions', [SubscriptionController::class, 'indexForCustomer'])->where('id', '[0-9]+');
Route::get('/customers/{id}/orders', [OrderController::class, 'indexForCustomer'])->where('id', '[0-9]+');
Route::get('/customers/{id}/policies', [InsurancePolicyController::class, 'index'])->where('id', '[0-9]+');
Route::post('/customers/{id}/policies', [InsurancePolicyController::class, 'store'])->where('id', '[0-9]+');
Route::get('/customers/{id}/sinfrid-account', [SinfridAccountController::class, 'show'])->where('id', '[0-9]+');
Route::post('/customers/{id}/sinfrid-account', [SinfridAccountController::class, 'store'])->where('id', '[0-9]+');
Route::get('/customers/{id}/sinfrid-account/alarms', [SinfridAccountController::class, 'alarms'])->where('id', '[0-9]+');
Route::get('/customers/{id}/sinfrid-account/activities', [SinfridAccountController::class, 'activities'])->where('id', '[0-9]+');
Route::put('/customers/{id}/gdpr/flag', [GdprCustomerController::class, 'flag'])->where('id', '[0-9]+');
Route::delete('/customers/{id}/gdpr/flag', [GdprCustomerController::class, 'unflag'])->where('id', '[0-9]+');
Route::put('/customers/{id}/gdpr/status', [GdprCustomerController::class, 'updateStatus'])->where('id', '[0-9]+');
Route::post('/customers/{id}/gdpr/anonymize', [GdprCustomerController::class, 'anonymize'])->where('id', '[0-9]+');
Route::post('/customers/{id}/gdpr/deanonymize', [GdprCustomerController::class, 'deanonymize'])->where('id', '[0-9]+');

Route::get('/customers/{id}', [CustomerController::class, 'show'])->where('id', '[0-9]+');
Route::patch('/customers/{id}', [CustomerController::class, 'update'])->where('id', '[0-9]+');
Route::get('/customers', [CustomerController::class, 'index']);
Route::get('/organizations', [OrganizationController::class, 'index']);
Route::put('/customers/{id}/organization', [CustomerOrganizationController::class, 'upsert'])->where('id', '[0-9]+');
