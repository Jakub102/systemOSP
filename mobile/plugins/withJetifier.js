const { withGradleProperties } = require("@expo/config-plugins");

/**
 * Wlacza Jetifier przy kazdym prebuildzie.
 *
 * react-native-push-notification (stara, nieutrzymywana paczka) ciagnie za soba
 * pre-AndroidX com.android.support:appcompat-v7, ktore duplikuje klasy
 * android.support.v4.* obecne juz w androidx.core. Bez Jetifiera build pada na
 * zadaniu checkDebugDuplicateClasses.
 *
 * Wpis musi byc pluginem, a nie recznym dopiskiem w android/gradle.properties,
 * bo ten katalog jest generowany i `expo prebuild --clean` go kasuje.
 */
const KEY = "android.enableJetifier";

module.exports = function withJetifier(config) {
  return withGradleProperties(config, (cfg) => {
    const exists = cfg.modResults.some(
      (item) => item.type === "property" && item.key === KEY,
    );
    if (exists) return cfg;

    cfg.modResults.push({
      type: "comment",
      value:
        "Jetifier: react-native-push-notification ciagnie pre-AndroidX support-compat, " +
        "ktory bez tego duplikuje klasy androidx.core (patrz plugins/withJetifier.js)",
    });
    cfg.modResults.push({ type: "property", key: KEY, value: "true" });

    return cfg;
  });
};
