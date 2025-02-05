<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserSetting;
use Illuminate\Support\Facades\Auth;

class UserSettingsController extends Controller
{
    /**
     * Update the authenticated user's settings.
     */
    public function update(Request $request)
    {
        // Validate the incoming data. Only "light" and "dark" are allowed.
        $data = $request->validate([
            'theme' => 'required|string|in:light,dark',
        ]);

        $user = Auth::user();

        // Update or create the settings for the user
        $settings = UserSetting::updateOrCreate(
            ['user_id' => $user->id],
            ['theme' => $data['theme']]
        );

        return redirect()->back()->with('success', 'Theme Updated.')->withStatus(303);
    }
}
