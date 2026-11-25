import type { CapacitorConfig } from "@capacitor/cli";

// The app is a native shell around the live site: it loads https://opensport.app,
// so every web deploy reaches app users with no store update.
const config: CapacitorConfig = {
  appId: "app.opensport",
  appName: "OPENsport",
  webDir: "dist",
  server: {
    url: "https://opensport.app",
  },
};

export default config;
