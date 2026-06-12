// src/hooks/useAlarm.js
// Hook zarządzający stanem alarmu, odliczaniem i retry'ami

import { useState, useEffect, useRef, useCallback } from 'react';
import { sendAlarmResponse, fetchAlarmDetails } from './AlarmService';

export const ALARM_STATUS = {
  PENDING:   'pending',    // oczekuje na odpowiedź
  GOING:     'going',      // jadę
  NOT_GOING: 'not_going',  // nie jadę
  EXPIRED:   'expired',    // minął czas — alarm powtórzony
};

/**
 * useAlarm — centralny hook ekranu alarmowego
 *
 * @param {object} alarmData   - dane alarmu z FCM (parseAlarmData)
 * @param {function} onRespond - callback po wysłaniu odpowiedzi (status)
 */
export const useAlarm = (alarmData, onRespond) => {
  const [status, setStatus]           = useState(ALARM_STATUS.PENDING);
  const [timeLeft, setTimeLeft]       = useState(null);   // sekundy do końca
  const [respondents, setRespondents] = useState([]);     // kto odpowiedział
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState(null);
  const [retryCount, setRetryCount]   = useState(0);

  const timerRef    = useRef(null);
  const pollRef     = useRef(null);

  const deadlineSeconds = (alarmData?.responseDeadlineMinutes || 3) * 60;

  // ── Odliczanie czasu ────────────────────────────────────────
  useEffect(() => {
    if (!alarmData || status !== ALARM_STATUS.PENDING) return;

    setTimeLeft(deadlineSeconds);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [alarmData?.alarmId, status, deadlineSeconds]);

  // Efekt reagujący na koniec odliczania
  useEffect(() => {
    if (timeLeft === 0 && status === ALARM_STATUS.PENDING) {
      clearInterval(timerRef.current);
      handleTimeout();
    }
  }, [timeLeft, status, handleTimeout]);

  // ── Polling składu (co 5 sekund) ───────────────────────────
  useEffect(() => {
    if (!alarmData?.alarmId || status !== ALARM_STATUS.PENDING) return;

    let isMounted = true;
    let timeoutId = null;

    const poll = async () => {
      try {
        const details = await fetchAlarmDetails(alarmData.alarmId);
        if (isMounted) {
          setRespondents(details.respondents || []);
        }
      } catch (e) {
        // polling failure — nie przerywamy działania
      } finally {
        if (isMounted) {
          timeoutId = setTimeout(poll, 5000);
        }
      }
    };

    poll(); // natychmiastowe pierwsze pobranie

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [alarmData?.alarmId, status]);

  // ── Obsługa braku odpowiedzi (timeout) ─────────────────────
  const handleTimeout = useCallback(() => {
    setStatus(ALARM_STATUS.EXPIRED);
    setRetryCount((c) => c + 1);
    // Komponent AlarmScreen wykryje status EXPIRED i powtórzy dźwięk/alarm
    onRespond?.(ALARM_STATUS.EXPIRED);
  }, [onRespond]);

  // ── Wysyłanie odpowiedzi ────────────────────────────────────
  const respond = useCallback(async (decision) => {
    if (status !== ALARM_STATUS.PENDING || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await sendAlarmResponse(alarmData.alarmId, decision);

      clearInterval(timerRef.current);
      clearInterval(pollRef.current);

      const newStatus = decision === 'going'
        ? ALARM_STATUS.GOING
        : ALARM_STATUS.NOT_GOING;

      setStatus(newStatus);
      onRespond?.(newStatus);
    } catch (err) {
      setError('Błąd wysyłania odpowiedzi. Spróbuj jeszcze raz.');
      console.error('Respond error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [alarmData?.alarmId, status, isLoading, onRespond]);

  // ── Pomocnicze gettery ──────────────────────────────────────
  const timeLeftFormatted = timeLeft !== null
    ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`
    : null;

  const goingCount    = respondents.filter(r => r.status === 'going').length;
  const notGoingCount = respondents.filter(r => r.status === 'not_going').length;

  return {
    status,
    timeLeft,
    timeLeftFormatted,
    respondents,
    goingCount,
    notGoingCount,
    isLoading,
    error,
    retryCount,
    respond,       // respond('going') | respond('not_going')
  };
};
