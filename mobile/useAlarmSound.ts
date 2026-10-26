import { useEffect, useRef } from "react";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

const SIREN = require("./assets/sounds/syrena.wav");

/**
 * Zapętlona syrena na czas trwania alarmu, gdy apka jest na wierzchu.
 * Dla apki w tle / ubitej dźwięk gra kanał powiadomień (patrz AlarmService).
 *
 * Uwaga: expo-av odtwarza na strumieniu multimediów - wyciszone multimedia
 * oznaczają cichy alarm, dlatego AlarmScreen dodatkowo wibruje.
 */
export const useAlarmSound = (isActive: boolean) => {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (!isActive) return;

    let cancelled = false;

    const play = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true, // alarm ma przebić przełącznik ciszy
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          allowsRecordingIOS: false,
          playThroughEarpieceAndroid: false,
        });

        const { sound } = await Audio.Sound.createAsync(SIREN, {
          isLooping: true,
          volume: 1.0,
          shouldPlay: true,
        });

        
        if (cancelled) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
      } catch (e) {
        console.warn("Nie udało się odtworzyć syreny:", e);
      }
    };

    play();

    return () => {
      cancelled = true;
      const sound = soundRef.current;
      soundRef.current = null;
      sound?.unloadAsync().catch(() => {}); // unload zatrzymuje odtwarzanie
    };
  }, [isActive]);
};
