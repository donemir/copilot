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
    
        // If the user has no categories, provide default ones
        if ($categories->isEmpty()) {
            $defaultCategories = [
                ['name' => 'Web Management', 'bookmarks' => []],
                ['name' => 'Productivity', 'bookmarks' => []],
                ['name' => 'Web Design Memberships', 'bookmarks' => []],
                ['name' => 'Google Properties', 'bookmarks' => []],
                ['name' => 'Financial / Business', 'bookmarks' => []],
                ['name' => 'Education & Learning', 'bookmarks' => []],
                // ... other default categories
            ];
    
            foreach ($defaultCategories as $categoryData) {
                $categories->push((object) $categoryData);
            }
        }
    
        return Inertia::render('Dashboard/Organizer', [
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
