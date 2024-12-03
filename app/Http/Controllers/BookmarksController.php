<?php

namespace App\Http\Controllers;

use App\Models\Bookmark;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookmarksController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'url' => 'required|url',
            'description' => 'nullable|string',
            'favicon_url' => 'nullable|url',
        ]);

        $category = Category::where('id', $request->category_id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $category->bookmarks()->create([
            'user_id' => auth()->id(),
            'url' => $request->url,
            'description' => $request->description,
            'favicon_url' => $request->favicon_url,
            'pinned' => false,
        ]);

        return redirect()->back()->with('success', 'Bookmark added successfully.')->withStatus(303);
    }

    public function update(Request $request, Bookmark $bookmark)
    {
        $this->authorize('update', $bookmark);
    
        $request->validate([
            'url' => 'sometimes|required|url',
            'description' => 'nullable|string',
            'favicon_url' => 'nullable|url',
            'pinned' => 'boolean',
            'category_id' => 'nullable|exists:categories,id',
        ]);
    
        if ($request->has('category_id')) {
            Category::where('id', $request->category_id)
                ->where('user_id', auth()->id())
                ->firstOrFail();
        }
    
        $bookmark->update($request->only('url', 'description', 'favicon_url', 'pinned', 'category_id'));
    
        // Return updated categories
        $categories = auth()->user()->categories()->with('bookmarks')->get();
    
        // Return an Inertia response with the correct component name
        return redirect()->route('organizer')->with('success', 'Bookmark updated successfully.')->setStatusCode(303);

    }
   

    public function destroy(Bookmark $bookmark)
    {
        $this->authorize('delete', $bookmark);

        $bookmark->delete();

        return redirect()->back()->with('success', 'Bookmark deleted successfully.')->withStatus(303);
    }
}
