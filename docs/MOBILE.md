# Mobile app (Android / iOS)

The app is a Capacitor shell that loads the live site `https://www.opensport.app` (opensport.app redirects there)
(`capacitor.config.ts` → `server.url`). Every web deploy reaches app users without a store update.

- Android APK: GitHub Actions → "Android APK" workflow → artifact `opensport-debug-apk`.
- Local Android: `npm run build && npx cap sync android && npx cap open android` (Android Studio, JDK 21).
- iOS: on a Mac with Xcode: `npm run build && npx cap sync ios && npx cap open ios`.
- Icons/splash: sources in `assets/`, regenerate with `npx @capacitor/assets generate`.
