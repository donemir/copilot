<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Category;
use App\Models\User;

class CategoriesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the user to associate categories with
        $user = User::where('email', 'amir.khajedehi@gmail.com')->first();

        if (!$user) {
            $this->command->error('User not found. Please ensure you have a user to associate categories with.');
            return;
        }

        // Define your initial categories and bookmarks
        $categoriesData = [
            [
                'name' => 'Web Management',
                'bookmarks' => [
                    [
                        'url' => 'https://www.cloudways.com/en/',
                        'description' => 'Cloudways Hosting',
                        'pinned' => false,
                    ],
                    // ... (other bookmarks)
                ],
            ],
            [
                'name' => 'Productivity',
                'bookmarks' => [
                    [
                        'url' => 'https://www.lastpass.com/',
                        'description' => 'LastPass Password Manager',
                        'pinned' => false,
                    ],
                    // ... (other bookmarks)
                ],
            ],
            // ... (other categories)
        ];

        foreach ($categoriesData as $categoryData) {
            // Create the category
            $category = $user->categories()->create([
                'name' => $categoryData['name'],
            ]);

            // Create the bookmarks for this category
            foreach ($categoryData['bookmarks'] as $bookmarkData) {
                $category->bookmarks()->create([
                    'user_id' => $user->id,
                    'url' => $bookmarkData['url'],
                    'description' => $bookmarkData['description'],
                    'favicon_url' => $this->getFaviconUrl($bookmarkData['url']),
                    'pinned' => $bookmarkData['pinned'],
                ]);
            }
        }
    }

    // Helper function to get favicon URL
    private function getFaviconUrl($url)
    {
        try {
            $hasProtocol = str_starts_with($url, 'http://') || str_starts_with($url, 'https://');
            $fullUrl = $hasProtocol ? $url : 'http://' . $url;

            $domain = parse_url($fullUrl, PHP_URL_HOST);
            return 'https://icons.duckduckgo.com/ip3/' . $domain . '.ico';
        } catch (\Exception $e) {
            return '';
        }
    }
}

