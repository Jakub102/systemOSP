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
        Schema::create('incident_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incident_id')->constrained('incidents')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

            $table->string('attendance_status', 20)->default('end');
            $table->decimal('confirmed_latitude', 10, 8)->nullable();
            $table->decimal('confirmed_longitude', 11, 8)->nullable();
            $table->timestamp('confirmed_at')->nullable();

            $table->timestamps();

            $table->unique(['incident_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incident_user');
    }
};
