<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            $table->string('fcm_message_id')->nullable()->after('raw_payload');
            $table->unsignedInteger('fcm_sent_count')->default(0)->after('fcm_message_id');
            $table->timestamp('fcm_dispatched_at')->nullable()->after('fcm_sent_count');

            $table->index(['status', 'incident_time'], 'incidents_status_time_idx');
            $table->index(['main_category', 'created_at'], 'incidents_category_created_idx');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index(['firehouse_id', 'is_active', 'readiness_status'], 'users_readiness_lookup_idx');
        });

        Schema::table('incident_user', function (Blueprint $table) {
            $table->string('attendance_status', 20)->default('pending')->change();
            $table->index(['incident_id', 'attendance_status'], 'incident_user_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('incident_user', function (Blueprint $table) {
            $table->dropIndex('incident_user_status_idx');
            $table->string('attendance_status', 20)->default('end')->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_readiness_lookup_idx');
        });

        Schema::table('incidents', function (Blueprint $table) {
            $table->dropIndex('incidents_status_time_idx');
            $table->dropIndex('incidents_category_created_idx');
            $table->dropColumn(['fcm_message_id', 'fcm_sent_count', 'fcm_dispatched_at']);
        });
    }
};
