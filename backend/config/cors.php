<?php

/*
 * API CORS configuration.
 *
 * FRONTEND_URL supports three formats:
 *   - Single origin:            FRONTEND_URL=https://my-app.vercel.app
 *   - Comma-separated list:     FRONTEND_URL=https://my-app.vercel.app,http://localhost:5173
 *   - Allow all (dev/testing):  FRONTEND_URL=*
 *
 * Set this variable in your .env (local) and in the Railway dashboard (production).
 */

$frontendUrl  = env('FRONTEND_URL', 'http://localhost:5173');
$allowedOrigins = $frontendUrl === '*'
    ? ['*']
    : array_values(array_filter(array_map('trim', explode(',', $frontendUrl))));

return [

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
