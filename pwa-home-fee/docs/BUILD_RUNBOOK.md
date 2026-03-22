# BUILD RUNBOOK (Do Not Change)

## Stable build path for this project
- Project: `C:\Projects\daily_slills\pwa-home-fee`
- JDK: `C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot`
- Gradle cache home: `C:\Software\gradle-7.4\gradle-repository`

## Commands
```powershell
npm run cap:sync
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot'
$env:Path="$env:JAVA_HOME\\bin;$env:Path"
$env:GRADLE_USER_HOME='C:\Software\gradle-7.4\gradle-repository'
& .\android\gradlew.bat -p android assembleDebug --no-daemon --offline
```

## Output
- `android\app\build\outputs\apk\debug\app-debug.apk`

## Notes
- Prefer offline build with the fixed cache above.
- If lock error appears, clear leftover java/gradle process and retry.
- Keep `android/app/build.gradle` as UTF-8 without BOM.
