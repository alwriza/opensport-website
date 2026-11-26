import type { CapacitorConfig } from "@capacitor/cli";

// The app is a native shell around the live site. It must load the host that serves the
// site directly: opensport.app redirects to www, and Capacitor opens any other host in Chrome.
// It loads https://www.opensport.app,
// so every web deploy reaches app users with no store update.
const config: CapacitorConfig = {
  appId: "app.opensport",
  appName: "OPENsport",
  webDir: "dist",
  server: {
    url: "https://www.opensport.app",
  },
};

export default config;
