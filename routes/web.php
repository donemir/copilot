<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;

use App\Http\Controllers\CategoriesController;
use App\Http\Controllers\BookmarksController;
use App\Http\Controllers\UserSettingsController;

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})
    ->name('dashboard');

    Route::get('/pomodoro', function () {
        return Inertia::render('Pomodoro');
    })
        ->name('pomodoro');
//    ->middleware(['auth', 'verified'])->name('dashboard');

// Route::get('/test', function () {
//     return Inertia::render('Dashboard/Test');
// })->name('test');
Route::get('/organizer', function () {
    return Inertia::render('Dashboard/Organizer');
})->name('organizer');
//   ->middleware(['auth', 'verified']); // Apply the middleware if needed

Route::middleware('auth')->group(function () {

    Route::put('/user-settings', [UserSettingsController::class, 'update'])
         ->name('user-settings.update');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Categories
    Route::post('/categories', [CategoriesController::class, 'store'])->name('categories.store');
    Route::put('/categories/reorder', [CategoriesController::class, 'reorder'])->name('categories.reorder');
    Route::put('/categories/{category}', [CategoriesController::class, 'update'])->name('categories.update');
    Route::delete('/categories/{category}', [CategoriesController::class, 'destroy'])->name('categories.destroy');


    // Route::get('/test', [CategoriesController::class, 'index'])->name('test');
    Route::get('/organizer', [CategoriesController::class, 'index'])->name('organizer');
    // Add update and delete routes for categories if needed

    // Bookmarks
    Route::post('/bookmarks', [BookmarksController::class, 'store'])->name('bookmarks.store');
    Route::post('/bookmarks/update-order', [BookmarksController::class, 'updateOrder'])->name('bookmarks.updateOrder');
    Route::put('/bookmarks/{bookmark}', [BookmarksController::class, 'update'])->name('bookmarks.update');
    Route::delete('/bookmarks/{bookmark}', [BookmarksController::class, 'destroy'])->name('bookmarks.destroy');
});


Route::get('/uikit/button', function () {
    return Inertia::render('main/uikit/button/page');
})->name('button');







require __DIR__.'/auth.php';
