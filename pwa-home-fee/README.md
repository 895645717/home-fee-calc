# Home Fee PWA

生活费计算器，支持水费、电费、燃气费和物业费的按差值结算，可导出明细，并可打包成 Android App 使用。

## Project Layout

```text
android/         Capacitor Android project
docs/            Build and debugging notes
scripts/         Local dev, PWA, and Android helper scripts
src/             Web app source files
tests/           Logic and smoke tests
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

## Android APK Build

离线打包请看：

- [docs/BUILD_RUNBOOK.md](./docs/BUILD_RUNBOOK.md)

联机调试与 PWA 复盘请看：

- [docs/PWA_DEBUG_PLAYBOOK.md](./docs/PWA_DEBUG_PLAYBOOK.md)

## Notes

- 前端样式联调优先用联机调试，不要每次都重装 APK。
- 原生配置变更后，需要重新 `cap:sync` 并重新打包。
- 仓库默认不提交 `dist/`、`node_modules/` 和 Android 构建产物。
