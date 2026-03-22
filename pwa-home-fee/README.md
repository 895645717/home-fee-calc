# home-fee-calc

生活费计算器，支持水费、电费、燃气费和物业费的按差值结算，可复制结算明细，并可打包为 Android App。

## Project Layout

```text
android/         Capacitor Android project
docs/            Build and debugging notes
scripts/         Local dev, PWA, and Android helper scripts
src/             Web app source files
tests/           Logic tests
package.json     Main npm entrypoints
```

## Main Commands

```powershell
npm install
npm run test
npm run build:app
npm run cap:sync
```

PWA local preview:

```powershell
npm run build:app
npm run pwa:start
npm run pwa:check
npm run pwa:stop
```

Android live debugging:

```powershell
npm run android:devices
npm run android:live
npm run android:live:first
```

## Docs

- [docs/BUILD_RUNBOOK.md](./docs/BUILD_RUNBOOK.md)
- [docs/PWA_DEBUG_PLAYBOOK.md](./docs/PWA_DEBUG_PLAYBOOK.md)

## Notes

- 调前端样式时，优先用联机调试，不要每次都重装 APK。
- 改原生配置后，需要重新 `cap:sync` 并重新打包。
- 仓库默认不提交 `dist/`、`node_modules/` 和 Android 构建产物。
