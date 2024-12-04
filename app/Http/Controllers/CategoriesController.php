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
        $user = auth()->user();
        $categories = $user->categories()
            ->with('bookmarks')
            ->get();
    
        // If the user has no categories, create default ones in the database
        if ($categories->isEmpty()) {
            $defaultCategories = [
                ['name' => 'Web Management'],
                ['name' => 'Productivity'],
                ['name' => 'Web Design Memberships'],
                ['name' => 'Google Properties'],
                ['name' => 'Financial / Business'],
                ['name' => 'Education & Learning'],
                // ... other default categories
            ];
    
            foreach ($defaultCategories as $categoryData) {
                $user->categories()->create($categoryData);
            }
    
            // Reload the categories after inserting
            $categories = $user->categories()
                ->with('bookmarks')
                ->get();
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
