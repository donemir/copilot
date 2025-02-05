<?php

namespace App\Providers;

use App\Models\Bookmark;
use App\Models\Category;
use App\Policies\BookmarkPolicy;
use App\Policies\CategoryPolicy;

use Illuminate\Support\Facades\Auth;

// use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Bookmark::class => BookmarkPolicy::class,
        Category::class => CategoryPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Set "Remember Me" token expiration to 2 weeks
        Auth::extend('session', function ($app, $name, array $config) {
            return new \Illuminate\Auth\SessionGuard($name, Auth::createUserProvider($config['provider']), $app['session.store'], $app['request']);
        });
    
        Auth::viaRequest('remember_token', function ($request) {
            return Auth::guard('web')->user();
        });
    
        config(['auth.remember' => 20160]); // 2 weeks in minutes
    }
}
