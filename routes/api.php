<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CustomerController;

Route::get('/customers/search', [CustomerController::class, 'search']);
Route::get('/customers/{id}', [CustomerController::class, 'show'])->where('id', '[0-9]+');
Route::get('/customers', [CustomerController::class, 'index']);
