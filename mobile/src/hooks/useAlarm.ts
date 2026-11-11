import { useState, useEffect, useRef, useCallback } from "react";
import { sendAlarmResponse, cancelAlarmNotification } from "../services/AlarmService";
import { AlarmData } from "../types";

export const ALARM_STATUS = {
  PENDING: "pending",
  GOING: "going",
  NOT_GOING: "not_going",
  NO_ANSWER: "no_answer",
};

// Gdy zgłoszenie nie niesie własnego limitu, przyjmujemy trzy minuty.
const DEFAULT_DEADLINE_MINUTES = 3;

const formatSeconds = (total: number): string =>
  `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;

export const useAlarm = (
  alarmData: AlarmData | null,
  onRespond?: (status: string) => void,
) => {
  const [status, setStatus] = useState<string>(ALARM_STATUS.PENDING);
  const [elapsed, setElapsed] = useState<number>(0); // sekundy od pojawienia się alarmu
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const deadlineSeconds = Math.max(
    0,
    Math.round((alarmData?.responseDeadlineMinutes ?? DEFAULT_DEADLINE_MINUTES) * 60),
  );

  // Strażak odpowiedział - alarm jest zamknięty.
  const isAnswered =
    status === ALARM_STATUS.GOING || status === ALARM_STATUS.NOT_GOING;
  // Limit minął, ale alarm nadal czeka na decyzję.
  const isOverdue = status === ALARM_STATUS.NO_ANSWER;

  // Licznik chodzi od pojawienia się alarmu aż do odpowiedzi. Celowo nie
  // zeruje się po upływie limitu, bo zegar przechodzi wtedy z odliczania
  // na pokazywanie czasu, który upłynął od zgłoszenia.
  useEffect(() => {
    if (!alarmData) return;

    setStatus(ALARM_STATUS.PENDING);
    setElapsed(0);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [alarmData?.alarmId]);

  // Upłynął czas na odpowiedź. Syrena i wibracja milkną (AlarmScreen wiąże je
  // ze statusem PENDING), ale alarm zostaje otwarty, żeby strażak, który
  // dotarł do telefonu później, nadal mógł zadeklarować wyjazd.
  useEffect(() => {
    if (status !== ALARM_STATUS.PENDING || deadlineSeconds === 0) return;
    if (elapsed >= deadlineSeconds) setStatus(ALARM_STATUS.NO_ANSWER);
  }, [elapsed, deadlineSeconds, status]);

  // Po odpowiedzi licznik nie ma już czego mierzyć.
  useEffect(() => {
    if (isAnswered && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [isAnswered]);

  const respond = useCallback(
    async (decision: string) => {
      if (isAnswered || isLoading || !alarmData) return;

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
    [alarmData, isAnswered, isLoading, onRespond],
  );

  const remaining = Math.max(0, deadlineSeconds - elapsed);

  return {
    status,
    elapsed,
    remaining,
    isAnswered,
    isOverdue,
    // Duży zegar: najpierw odliczanie do końca limitu, potem czas od zgłoszenia.
    displayTime: isOverdue ? formatSeconds(elapsed) : formatSeconds(remaining),
    displayLabel: isOverdue ? "czas od zgłoszenia" : "czas na odpowiedź",
    elapsedFormatted: formatSeconds(elapsed),
    isLoading,
    error,
    respond,
  };
};
