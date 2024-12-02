<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;


class Bookmark extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'user_id',
        'url',
        'description',
        'favicon_url',
        'pinned',
    ];

    protected $casts = [
        'pinned' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
