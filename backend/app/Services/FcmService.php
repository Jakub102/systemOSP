<?php

namespace App\Services;

use App\Models\FcmToken;
use App\Models\Incident;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\AndroidConfig;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class FcmService
{
    private const MULTICAST_CHUNK_SIZE = 500;

    public function __construct(protected Messaging $messaging) {}

    /**
     * Wysyła alarm FCM przez sendMulticast() wyłącznie na podane tokeny urządzeń
     * (strażaków w gotowości). Automatycznie usuwa z bazy wygasłe/nieprawidłowe tokeny.
     *
     * @param  list<string>  $tokens
     * @return array{
     *     sent_count: int,
     *     failed_count: int,
     *     invalid_tokens_removed: int,
     *     first_message_id: ?string
     * }
     */
    public function sendIncidentAlert(Incident $incident, array $tokens): array
    {
        $tokens = array_values(array_unique(array_filter($tokens, static fn ($token): bool => is_string($token) && $token !== '')));

        if ($tokens === []) {
            Log::warning('Pominięto wysyłkę FCM — brak zarejestrowanych tokenów urządzeń dla gotowych strażaków.', [
                'incident_id' => $incident->id,
            ]);

            return [
                'sent_count' => 0,
                'failed_count' => 0,
                'invalid_tokens_removed' => 0,
                'first_message_id' => null,
            ];
        }

        $categoryName = Incident::CATEGORY_LABELS[$incident->main_category] ?? 'Zdarzenie';
        $title = $incident->sub_category
            ? "ALARM: {$categoryName} - {$incident->sub_category}"
            : "ALARM: {$categoryName}";

        $displayTimezone = (string) config('app.display_timezone', 'Europe/Warsaw');
        $timeFormatted = $incident->incident_time
            ? $incident->incident_time->copy()->timezone($displayTimezone)->format('d.m.Y H:i')
            : '';

        $body = "Adres: {$incident->address}\nCzas: {$timeFormatted}\nOpis: {$incident->description}";

        $dataPayload = [
            'incident_id' => (string) $incident->id,
            'external_id' => (string) $incident->external_id,
            'main_category' => (string) $incident->main_category,
            'category_name' => (string) $categoryName,
            'sub_category' => (string) $incident->sub_category,
            'description' => (string) $incident->description,
            'incident_time' => (string) $timeFormatted,
            'address' => (string) $incident->address,
        ];

        $androidConfig = AndroidConfig::fromArray([
            'priority' => 'high',
            'notification' => [
                'sound' => 'alarm_siren',
                'channel_id' => 'emergency_alarm_channel',
                'visibility' => 'PUBLIC',
            ],
        ]);

        $message = CloudMessage::new()
            ->withNotification(Notification::create($title, $body))
            ->withData($dataPayload)
            ->withAndroidConfig($androidConfig);

        $sentCount = 0;
        $failedCount = 0;
        $tokensToPrune = [];
        $firstMessageId = null;

        foreach (array_chunk($tokens, self::MULTICAST_CHUNK_SIZE) as $chunk) {
            $report = $this->messaging->sendMulticast($message, $chunk);

            $sentCount += $report->successes()->count();
            $failedCount += $report->failures()->count();

            if ($firstMessageId === null) {
                foreach ($report->successes()->getItems() as $successItem) {
                    $result = $successItem->result();
                    if (is_array($result) && isset($result['name']) && is_string($result['name'])) {
                        $firstMessageId = $result['name'];
                        break;
                    }
                }
            }

            $tokensToPrune = array_merge(
                $tokensToPrune,
                $report->unknownTokens(),
                $report->invalidTokens()
            );
        }

        $tokensToPrune = array_values(array_unique($tokensToPrune));
        $invalidRemoved = 0;

        if ($tokensToPrune !== []) {
            $invalidRemoved = FcmToken::whereIn('token', $tokensToPrune)->delete();
        }

        Log::info('FCM multicast alert processed.', [
            'incident_id' => $incident->id,
            'category' => $incident->main_category,
            'target_tokens' => count($tokens),
            'sent_count' => $sentCount,
            'failed_count' => $failedCount,
            'invalid_tokens_removed' => $invalidRemoved,
            'first_message_id' => $firstMessageId,
        ]);

        return [
            'sent_count' => $sentCount,
            'failed_count' => $failedCount,
            'invalid_tokens_removed' => $invalidRemoved,
            'first_message_id' => $firstMessageId,
        ];
    }
}
