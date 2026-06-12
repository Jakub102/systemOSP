<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->string('external_id')->nullable()->unique();
            $table->enum('main_category', ['F', 'LT', 'A', 'M', 'FA']);
            $table->string('sub_category', 100);
            $table->text('description')->nullable();
            $table->timestamp('incident_time');

            $table->string('address', 255);
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            
            $table->enum('status', ['ACTIVE', 'END'])->default('ACTIVE');

            $table->json('raw_payload')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
