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
            'url' => [
                'required',
                function ($attribute, $value, $fail) use ($request) {
                    if (!preg_match('/^https?:\/\//', $value)) {
                        $value = 'https://' . $value;
                    }
    
                    if (!filter_var($value, FILTER_VALIDATE_URL)) {
                        return $fail('Please enter a valid URL.');
                    }
    
                    $host = parse_url($value, PHP_URL_HOST);
                    if (!$host || !preg_match('/\.[a-z]{2,}$/i', $host)) {
                        return $fail('Please enter a valid URL.');
                    }
    
                    $request->merge(['url' => $value]);
                },
            ],
            'description' => 'nullable|string',
            'favicon_url' => 'nullable|url',
        ], [
            'url.required' => 'Please enter a URL.',
        ]);
    
        // Rest of your code...
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
            'url' => [
                'sometimes',
                'required',
                function ($attribute, $value, $fail) use ($request) {
                    if (!preg_match('/^https?:\/\//', $value)) {
                        $value = 'https://' . $value;
                    }
    
                    if (!filter_var($value, FILTER_VALIDATE_URL)) {
                        return $fail('Please enter a valid URL.');
                    }
    
                    $host = parse_url($value, PHP_URL_HOST);
                    if (!$host || !preg_match('/\.[a-z]{2,}$/i', $host)) {
                        return $fail('Please enter a valid URL.');
                    }
    
                    $request->merge(['url' => $value]);
                },
            ],
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
