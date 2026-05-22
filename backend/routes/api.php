<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\CustomerOrganizationController;
use App\Http\Controllers\Api\OrganizationController;

Route::get('/customers/search', [CustomerController::class, 'search']);
Route::get('/customers/{id}', [CustomerController::class, 'show'])->where('id', '[0-9]+');
Route::patch('/customers/{id}', [CustomerController::class, 'update'])->where('id', '[0-9]+');
Route::get('/customers', [CustomerController::class, 'index']);
Route::get('/organizations', [OrganizationController::class, 'index']);
Route::put('/customers/{id}/organization', [CustomerOrganizationController::class, 'upsert'])->where('id', '[0-9]+');
