import { useState, useEffect, useRef, useCallback } from "react";
import { sendAlarmResponse, cancelAlarmNotification } from "./AlarmService";
import { AlarmData } from "./types";

export const ALARM_STATUS = {
  PENDING: "pending",
  GOING: "going",
  NOT_GOING: "not_going",
};

export const useAlarm = (
  alarmData: AlarmData | null,
  onRespond?: (status: string) => void,
) => {
  const [status, setStatus] = useState<string>(ALARM_STATUS.PENDING);
  const [elapsed, setElapsed] = useState<number>(0); // sekundy od pojawienia się alarmu
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Licznik czasu, który upłynął od zgłoszenia (liczy w górę, bez limitu)
  useEffect(() => {
    if (!alarmData || status !== ALARM_STATUS.PENDING) return;

    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [alarmData?.alarmId, status]);

  const respond = useCallback(
    async (decision: string) => {
      if (status !== ALARM_STATUS.PENDING || isLoading || !alarmData) return;

      setIsLoading(true);
      setError(null);

      try {
        await sendAlarmResponse(alarmData.alarmId, decision);

        // Alarm obsłużony - powiadomienie z belki jest już niepotrzebne
        cancelAlarmNotification(alarmData.alarmId);

        if (timerRef.current) clearInterval(timerRef.current);

        const newStatus =
          decision === "going" ? ALARM_STATUS.GOING : ALARM_STATUS.NOT_GOING;

        setStatus(newStatus);
        onRespond?.(newStatus);
      } catch {
        setError("Błąd wysyłania odpowiedzi. Spróbuj jeszcze raz.");
      } finally {
        setIsLoading(false);
      }
    },
    [alarmData, status, isLoading, onRespond],
  );

  const elapsedFormatted = `${Math.floor(elapsed / 60)}:${String(
    elapsed % 60,
  ).padStart(2, "0")}`;

  return {
    status,
    elapsed,
    elapsedFormatted,
    isLoading,
    error,
    respond,
  };
};
