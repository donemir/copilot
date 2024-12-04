<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class ValidUrl implements Rule
{
    public function passes($attribute, $value)
    {
        // Prepend 'https://' if missing
        if (!preg_match('/^https?:\/\//', $value)) {
            $value = 'https://' . $value;
        }

        // Validate the URL format
        if (!filter_var($value, FILTER_VALIDATE_URL)) {
            return false;
        }

        // Ensure the URL has a valid host with at least one dot (e.g., 'example.com')
        $host = parse_url($value, PHP_URL_HOST);
        if (!$host || !preg_match('/\.[a-z]{2,}$/i', $host)) {
            return false;
        }

        // Update the value in the request (not accessible here)
        // We'll handle updating the request in the controller

        return true;
    }

    public function message()
    {
        return 'Please enter a valid URL.';
    }
}
