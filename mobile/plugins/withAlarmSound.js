const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const SOUND_FILE = "syrena.wav";

/**
 * Kopiuje dźwięk alarmu do android/app/src/main/res/raw przy prebuildzie.
 * Bez tego kanał powiadomień nie ma czego zagrać, a folder android/ jest
 * generowany (gitignore), więc ręcznie wrzucony plik zniknąłby przy
 * `expo prebuild --clean`.
 *
 * Nazwa pliku musi być w formacie zasobu Androida: małe litery, cyfry
 * i podkreślenia - bez myślników i spacji.
 */
module.exports = function withAlarmSound(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const source = path.join(
        cfg.modRequest.projectRoot,
        "assets",
        "sounds",
        SOUND_FILE,
      );

      if (!fs.existsSync(source)) {
        throw new Error(`[withAlarmSound] Brak pliku dźwięku alarmu: ${source}`);
      }

      const rawDir = path.join(
        cfg.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "raw",
      );

      fs.mkdirSync(rawDir, { recursive: true });
      fs.copyFileSync(source, path.join(rawDir, SOUND_FILE));

      return cfg;
    },
  ]);
};
