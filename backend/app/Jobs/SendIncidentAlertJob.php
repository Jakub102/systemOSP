<?php

namespace App\Jobs;

use App\Models\FcmToken;
use App\Models\Incident;
use App\Models\User;
use App\Services\FcmService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendIncidentAlertJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    /**
     * @var list<int>
     */
    public array $backoff = [1, 2, 5, 10];

    public function __construct(
        public int $incidentId,
        public ?int $firehouseId = null,
    ) {
        $this->onQueue('alarms');
    }

    public function handle(FcmService $fcmService): void
    {
        $incident = Incident::find($this->incidentId);

        if (!$incident || $incident->status !== 'ACTIVE') {
            return;
        }

        // Wyłącznie aktywni strażacy w gotowości (readiness_status = active), bez konta systemowego.
        $readyUserIds = User::query()
            ->when($this->firehouseId, fn ($query) => $query->where('firehouse_id', $this->firehouseId))
            ->where('is_active', true)
            ->where('readiness_status', 'active')
            ->whereDoesntHave('roles', fn ($query) => $query->where('name', 'system'))
            ->pluck('id');

        if ($readyUserIds->isEmpty()) {
            Log::warning('Brak strażaków w gotowości dla incydentu.', [
                'incident_id' => $incident->id,
            ]);

            return;
        }

        $tokens = FcmToken::query()
            ->whereIn('user_id', $readyUserIds)
            ->pluck('token')
            ->all();

        $result = $fcmService->sendIncidentAlert($incident, $tokens);

        $incident->update([
            'fcm_message_id' => $result['first_message_id'],
            'fcm_sent_count' => $result['sent_count'],
            'fcm_dispatched_at' => now(),
        ]);
    }
}
