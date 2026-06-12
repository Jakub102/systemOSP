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
        Schema::create('firehouse', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            
            $table->string('street')->nullable();
            $table->string('address')->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('city')->nullable();
            
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('firehouse');
    }
};
