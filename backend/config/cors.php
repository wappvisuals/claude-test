<?php

return [

    /*
     * API CORS configuration.
     * Set FRONTEND_URL in your .env to allow a specific frontend origin.
     * Multiple origins can be added to `allowed_origins`.
     */

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
