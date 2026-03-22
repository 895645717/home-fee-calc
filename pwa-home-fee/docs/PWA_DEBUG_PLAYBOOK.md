# PWA DEBUG PLAYBOOK

## Goal

This project has two fast paths:

- Frontend styling and interaction: use live debugging.
- Native changes or final delivery: build an offline APK.

## Run Modes

### Browser PWA

Use it for:

- Quick page preview
- Simple HTML, CSS, or JS checks

Limits:

- Mobile browser has an address bar
- It does not fully match the App shell

### Capacitor Live Debug

Use it for:

- Mobile UI tuning inside the App shell
- Fast iteration without reinstalling APKs

Characteristics:

- Opens inside the app shell
- No browser address bar
- Frontend changes can be refreshed live
- If the PC service stops, the app will time out

### Offline APK

Use it for:

- Final delivery
- Real offline use on the phone
- Native validation

## Recommended Workflow

### Frontend changes

1. Keep phone and PC on the same LAN
2. Connect the phone with wireless ADB
3. Start the local PWA service on port `4173`
4. Use Capacitor Live Reload in the app shell
5. Refresh the phone after frontend edits

### Native changes

These require sync and rebuild:

- `MainActivity.java`
- `capacitor.config.json`
- Android permissions
- status bar or system bar behavior

## Wireless ADB

ADB path:

- `C:\Users\zhouqiyu\android-sdk\platform-tools\adb.exe`

Typical flow:

1. Enable `Wireless debugging` on the phone
2. Run `adb pair IP:pair_port code`
3. Run `adb mdns services`
4. Find `_adb-tls-connect._tcp`
5. Run `adb connect IP:connect_port`
6. Confirm with `adb devices -l`

Notes:

- Pair port and connect port are different
- Prefer the real LAN IP shown on the phone, such as `192.168.x.x`

## Local Service

This project uses port `4173` for live preview.

Health check:

```powershell
http://127.0.0.1:4173/index.html
```

If the phone app times out, check in this order:

1. Is `4173` still serving?
2. Are the phone and PC on the same LAN?
3. Is ADB still connected?

## Commands

```powershell
npm run pwa:start
npm run pwa:check
npm run pwa:stop
npm run android:devices
npm run android:live
```

Scripts:

- [scripts/android-live.ps1](../scripts/android-live.ps1)
- [scripts/android-devices.ps1](../scripts/android-devices.ps1)
- [scripts/start-pwa.ps1](../scripts/start-pwa.ps1)
- [scripts/check-pwa.ps1](../scripts/check-pwa.ps1)

## How To Tell If Live Debug Is Active

The most reliable check:

- Stop the `4173` service and then reopen the app

Result:

- If the app times out, it is using live debug
- If it still works, it is using the offline package

## How To Turn Off Live Debug

1. Stop the `4173` service
2. Run `adb disconnect <connect_port>`

If you want fully offline use again, reinstall the offline APK.

## APK Build

See:

- [BUILD_RUNBOOK.md](./BUILD_RUNBOOK.md)
