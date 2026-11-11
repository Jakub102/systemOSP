const { withAndroidManifest } = require("@expo/config-plugins");

// react-native-push-notification nie dodaje sam receiverow do manifestu,
// a bez RNPushNotificationActions przyciski JADĘ / NIE JADĘ nic nie robia
const PKG = "com.dieam.reactnativepushnotification.modules.";

module.exports = function withPushReceivers(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application[0];

    if (!app.receiver) app.receiver = [];

    const receivers = [
      { name: PKG + "RNPushNotificationActions" },
      { name: PKG + "RNPushNotificationPublisher" },
      {
        name: PKG + "RNPushNotificationBootEventReceiver",
        actions: [
          "android.intent.action.BOOT_COMPLETED",
          "android.intent.action.QUICKBOOT_POWERON",
        ],
      },
    ];

    receivers.forEach((r) => {
      const exists = app.receiver.some((x) => x.$["android:name"] === r.name);
      if (exists) return;

      const item = { $: { "android:name": r.name, "android:exported": "false" } };
      if (r.actions) {
        item["intent-filter"] = [
          { action: r.actions.map((a) => ({ $: { "android:name": a } })) },
        ];
      }
      app.receiver.push(item);
    });

    return cfg;
  });
};
