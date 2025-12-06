# Release Checklist

## 1. AndroidManifest
- Internet, camera and storage permissions are already added, but if you need other sensors (e.g., record audio, location) add them under the `<manifest>` before `<application>`.
- You can customize `<application android:label>` and `android:icon` so Play Store users see the right branding.

## 2. Production app settings
- The Flutter app reads the base URL from `lib/core/api_config.dart`:
  ```dart
  const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );
  ```
  When building for release, pass your production domain:
  ```powershell
  cd mobile/flutter_app
  flutter build appbundle --release --dart-define=API_BASE_URL=https://tu-dominio.com/api
  ```
  Repeat this whenever you need a different endpoint (staging vs production).

## 3. Signing the release bundle
1. Generate a keystore (adjust alias/passwords and keep them secret):
   ```powershell
   keytool -genkeypair -v -keystore C:\Users\Administrator\release_keystore.jks -alias teoria_key -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Create `android/key.properties` (not checked into git):
   ```properties
   storePassword=TU_STORE_PASSWORD
   keyPassword=TU_KEY_PASSWORD
   keyAlias=teoria_key
   storeFile=C:/Users/Administrator/release_keystore.jks
   ```
3. In `android/app/build.gradle.kts`, load the file near the top:
   ```kotlin
   val keystorePropertiesFile = rootProject.file("key.properties")
   val keystoreProperties = Properties()
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(FileInputStream(keystorePropertiesFile))
   }
   ```
   Extend `android { signingConfigs { release { ... } } }` to point to those values and set `signingConfig = signingConfigs.getByName("release")` inside `buildTypes.release`.
4. Build the signed bundle:
   ```powershell
   flutter build appbundle --release --dart-define=API_BASE_URL=https://tu-dominio.com/api
   ```
   The output is `build/app/outputs/bundle/release/app-release.aab`.

## 4. Testing and rollout
- Use a physical Android device for manual QA or upload the `.aab` to the Play Console internal track before releasing to production.
- Keep `flutter doctor` green and rerun `flutter build appbundle` after updating plugins.
- Remember to update the Play Store metadata (screenshots, privacy policy, contact email) before publishing.
