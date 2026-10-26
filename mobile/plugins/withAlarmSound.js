const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const SOUND_FILE = "syrena.wav";


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
