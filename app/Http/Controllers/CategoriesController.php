<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class CategoriesController extends Controller
{
    public function index()
    {
        $categories = auth()->user()->categories()
            ->with('bookmarks')
            ->get();
    
        // Log the categories to the Laravel log
        Log::info('Categories:', $categories->toArray());
    
        return Inertia::render('Dashboard/Test', [
            'categories' => $categories,
        ]);
    }
    

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $category = auth()->user()->categories()->create([
            'name' => $request->name,
        ]);

        return redirect()->back();
    }

    // Add update and delete methods as needed
}
