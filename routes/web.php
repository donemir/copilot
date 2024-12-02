<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;

use App\Http\Controllers\CategoriesController;
use App\Http\Controllers\BookmarksController;

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
//    ->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/test', function () {
    return Inertia::render('Dashboard/Test');
})->name('test');
//   ->middleware(['auth', 'verified']); // Apply the middleware if needed

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Categories
    Route::post('/categories', [CategoriesController::class, 'store'])->name('categories.store');
    Route::get('/test', [CategoriesController::class, 'index'])->name('test');
    // Add update and delete routes for categories if needed

    // Bookmarks
    Route::post('/bookmarks', [BookmarksController::class, 'store'])->name('bookmarks.store');
    Route::put('/bookmarks/{bookmark}', [BookmarksController::class, 'update'])->name('bookmarks.update');
    Route::delete('/bookmarks/{bookmark}', [BookmarksController::class, 'destroy'])->name('bookmarks.destroy');
});


Route::get('/uikit/button', function () {
    return Inertia::render('main/uikit/button/page');
})->name('button');







require __DIR__.'/auth.php';
