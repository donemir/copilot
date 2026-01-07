<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Section;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoriesController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Fetch sections with their categories
        $sections = $user->sections()
            ->with(['categories' => function ($query) {
                $query->with(['bookmarks' => function ($q) {
                    $q->orderBy('order', 'asc');
                }])->orderBy('order', 'asc');
            }])
            ->orderBy('order', 'asc')
            ->get();

        // Fetch categories without section
        $categoriesWithoutSection = $user->categories()
            ->whereNull('section_id')
            ->with(['bookmarks' => function ($query) {
                $query->orderBy('order', 'asc');
            }])
            ->orderBy('order', 'asc')
            ->get();

        // Initialize default categories if none exist
        if ($sections->isEmpty() && $categoriesWithoutSection->isEmpty()) {
            $defaultCategories = [
                ['name' => 'Web Management'],
                ['name' => 'Productivity'],
                ['name' => 'Web Design Memberships'],
                ['name' => 'Google Properties'],
                ['name' => 'Financial / Business'],
                ['name' => 'Education & Learning'],
            ];

            foreach ($defaultCategories as $index => $categoryData) {
                $user->categories()->create([
                    'name' => $categoryData['name'],
                    'order' => $index
                ]);
            }

            $categoriesWithoutSection = $user->categories()
                ->whereNull('section_id')
                ->with(['bookmarks' => function ($query) {
                    $query->orderBy('order', 'asc');
                }])
                ->orderBy('order', 'asc')
                ->get();
        }

        return Inertia::render('Dashboard/Organizer', [
            'sections' => $sections,
            'categoriesWithoutSection' => $categoriesWithoutSection,
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

    public function storeSection(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $user = auth()->user();
        $maxOrder = $user->sections()->max('order') ?? -1;

        $user->sections()->create([
            'name' => $request->name,
            'order' => $maxOrder + 1,
        ]);

        return redirect()->back();
    }

    public function updateSection(Request $request, $sectionId)
    {
        $section = Section::where('id', $sectionId)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $section->update(['name' => $request->name]);

        return redirect()->back();
    }

    public function destroySection($sectionId)
    {
        $section = Section::where('id', $sectionId)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        // Move categories out of section before deleting
        $section->categories()->update(['section_id' => null]);
        
        $section->delete();

        return redirect()->back();
    }

    public function reorderSections(Request $request)
    {
        $data = $request->validate([
            'sections' => 'required|array',
            'sections.*.id' => 'required|exists:sections,id',
            'sections.*.order' => 'required|integer',
        ]);

        foreach ($data['sections'] as $sectionData) {
            Section::where('id', $sectionData['id'])
                ->where('user_id', auth()->id())
                ->update(['order' => $sectionData['order']]);
        }

        return response()->json(['success' => true]);
    }

    public function moveCategoryToSection(Request $request, $categoryId)
    {
        $category = Category::where('id', $categoryId)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $validated = $request->validate([
            'section_id' => 'nullable|exists:sections,id',
        ]);

        // If moving to a section, verify it belongs to the user
        if ($validated['section_id']) {
            Section::where('id', $validated['section_id'])
                ->where('user_id', auth()->id())
                ->firstOrFail();
        }

        \Log::info('Moving category', [
            'category_id' => $categoryId,
            'old_section_id' => $category->section_id,
            'new_section_id' => $validated['section_id']
        ]);

        // Update the category's section
        $category->section_id = $validated['section_id'];
        $category->save();

        // Get the max order in destination and set this category's order
        if ($validated['section_id']) {
            $maxOrder = Category::where('section_id', $validated['section_id'])
                ->where('user_id', auth()->id())
                ->where('id', '!=', $categoryId)
                ->max('order') ?? -1;
            
            $category->order = $maxOrder + 1;
            $category->save();
        } else {
            $maxOrder = Category::whereNull('section_id')
                ->where('user_id', auth()->id())
                ->where('id', '!=', $categoryId)
                ->max('order') ?? -1;
            
            $category->order = $maxOrder + 1;
            $category->save();
        }

        // Refresh the model to get the latest data from DB
        $category->refresh();

        \Log::info('Category moved successfully', [
            'category_id' => $categoryId,
            'new_section_id' => $category->section_id,
            'new_order' => $category->order
        ]);

        return redirect()->back();
    }
}
