<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Check if column doesn't exist and add it
        if (!Schema::hasColumn('categories', 'section_id')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->foreignId('section_id')->nullable()->constrained()->onDelete('set null');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('categories', 'section_id')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropForeign(['section_id']);
                $table->dropColumn('section_id');
            });
        }
    }
};