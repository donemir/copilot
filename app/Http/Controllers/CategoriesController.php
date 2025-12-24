<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoriesController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Fetch categories ordered by 'order'
        $categories = $user->categories()
            ->with(['bookmarks' => function ($query) {
                $query->orderBy('order', 'asc');
            }])
            ->orderBy('order', 'asc')
            ->get();

        // If the user has no categories, insert default ones and assign orders
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

            foreach ($defaultCategories as $index => $categoryData) {
                $user->categories()->create([
                    'name' => $categoryData['name'],
                    'order' => $index // start from 0 or 1, your choice
                ]);
            }

            $categories = $user->categories()
                ->with(['bookmarks' => function ($query) {
                    $query->orderBy('order', 'asc');
                }])
                ->orderBy('order', 'asc')
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

        $user = auth()->user();

        // Determine the max order currently in use
        $maxOrder = $user->categories()->max('order');
        if (is_null($maxOrder)) {
            $maxOrder = 0;
        }

        // Create new category at the end (maxOrder + 1)
        $category = $user->categories()->create([
            'name' => $request->name,
            'order' => $maxOrder + 1
        ]);

        return redirect()->back();
    }

    public function update(Request $request, Category $category)
    {
        $this->authorize('update', $category);

        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $category->update(['name' => $data['name']]);

        // If using Inertia, you can return a response or just redirect back
        // If you prefer JSON response for axios/fetch usage:
            return redirect()->route('organizer')->with('success', 'Category updated successfully.')->setStatusCode(303);
    }

    public function reorder(Request $request)
    {
        $user = auth()->user();
        $data = $request->validate([
            'categories' => 'required|array',
            'categories.*.id' => 'required|exists:categories,id',
            'categories.*.order' => 'required|integer',
        ]);

        // Ensure all categories belong to the authenticated user
        $categoryIds = array_column($data['categories'], 'id');
        $userCategoryIds = $user->categories()->pluck('id')->toArray();

        foreach ($categoryIds as $catId) {
            if (!in_array($catId, $userCategoryIds)) {
                return response()->json(['error' => 'Invalid category id'], 403);
            }
        }

        // Update categories order
        foreach ($data['categories'] as $catData) {
            Category::where('id', $catData['id'])->update(['order' => $catData['order']]);
        }

        return redirect()->route('organizer')->with('success', 'Categories reordered successfully.')->setStatusCode(303);
    }

    public function destroy(Category $category)
    {
        $this->authorize('delete', $category);

        // Ensure category is empty
        if ($category->bookmarks()->count() > 0) {
            return back()->withErrors(['error' => 'Category not empty']);
        }

        $category->delete();
        return redirect()->back()->with('success', 'Category deleted successfully.');
    }

}
