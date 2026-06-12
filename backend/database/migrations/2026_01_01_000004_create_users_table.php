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
    Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->foreignId('account_id')->constrained('accounts')->onDelete('cascade');
        $table->foreignId('invitation_id')->nullable()->unique()->constrained('invitations');
        $table->foreignId('firehouse_id')->nullable()->constrained('firehouse')->onDelete('set null');

        $table->string('first_name', 30);
        $table->string('last_name', 30);
        $table->string('phone_number', 15)->nullable();
        $table->boolean('is_active')->default(true);
        $table->enum('status', ['READY','IN ACTION', 'UNAVAILABLE'])->default('READY');
        
        $table->timestamp('last_login')->nullable();
        $table->timestamps();
        $table->softDeletes();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
