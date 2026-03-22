# PWA 与联机调试复盘手册

## 目标

这份文档用于复盘本项目在电脑与安卓手机上的几种运行方式，以及后续最快的调试、部署、排障路径。

核心结论只有一句：

- 看前端样式和交互时，优先用联机调试。
- 改原生配置或要离线独立运行时，再打 APK。

## 三种运行方式

### 1. 浏览器访问 PWA

用途：

- 快速看页面
- 调普通 HTML / CSS / JS
- 不关心浏览器地址栏差异

特点：

- 启动最轻
- 手机浏览器会有地址栏
- 视觉效果和 App 壳不完全一致

### 2. Capacitor 联机调试

用途：

- 想在手机里用 App 壳实时看效果
- 不想每次改一点样式都重新安装 APK

特点：

- 手机里打开的是 App，而不是浏览器标签页
- 没有浏览器地址栏
- 前端改动可以实时刷新
- 电脑服务关闭后，手机会提示网页超时

这是本项目调样式时的首选路线。

### 3. 离线 APK

用途：

- 最终交付
- 电脑关闭后手机仍可独立运行
- 验证真实安装包效果

特点：

- 最稳定
- 每次改动都要重新打包并覆盖安装
- 不适合频繁调样式

## 推荐流程

### 场景 A：调页面样式、间距、文案、按钮尺寸

用联机调试。

标准顺序：

1. 手机和电脑在同一局域网
2. 用无线调试把手机通过 ADB 连上电脑
3. 启动电脑上的本地服务
4. 用 Capacitor Live Reload 在手机 App 壳里看效果
5. 改代码后直接刷新手机页面验证

### 场景 B：改了原生层

例如：

- `MainActivity.java`
- `capacitor.config.json`
- Android 权限
- 状态栏 / 系统栏配置

这类改动要重新同步并重新打 APK，不适合只靠联机调试验证。

### 场景 C：准备长期使用

打离线 APK，覆盖安装到手机。

## 本项目最终稳定的联机调试思路

### 第一步：手机开启无线调试

安卓开发者选项里打开：

- `开发者选项`
- `无线调试`

进入无线调试页面后：

1. 选择“使用配对码配对设备”
2. 记录配对地址和端口
3. 记录配对码

### 第二步：电脑配对并连接手机

固定使用：

- `C:\Users\zhouqiyu\android-sdk\platform-tools\adb.exe`

配对命令示例：

```powershell
C:\Users\zhouqiyu\android-sdk\platform-tools\adb.exe pair 192.168.31.53:41723 300438
```

注意：

- 配对端口和连接端口不是同一个
- 配对成功后，还要再执行一次 `connect`

当 `adb mdns services` 可用时，可自动看到连接端口，例如：

- `_adb-tls-connect._tcp 192.168.31.53:38201`

连接命令示例：

```powershell
C:\Users\zhouqiyu\android-sdk\platform-tools\adb.exe connect 192.168.31.53:38201
```

检查设备：

```powershell
C:\Users\zhouqiyu\android-sdk\platform-tools\adb.exe devices -l
```

看到 `device` 即表示连接成功。

### 第三步：启动本地联机服务

本项目联机调试使用本地 `4173` 端口。

如果只需要静态页面联机访问，可直接在 `dist` 目录启动：

```powershell
python -m http.server 4173
```

启动后可用下面地址检查：

```powershell
http://127.0.0.1:4173/index.html
```

返回 `200 OK` 就说明电脑服务已正常提供页面。

### 第四步：在 App 壳里实时看效果

本项目已经补了联机脚本：

- [scripts-android-live.ps1](C:\Projects\daily_slills\pwa-home-fee\scripts-android-live.ps1)
- [scripts-android-devices.ps1](C:\Projects\daily_slills\pwa-home-fee\scripts-android-devices.ps1)

对应命令：

```powershell
npm run android:devices
npm run android:live
```

用途：

- `android:devices`：检查 ADB 是否识别到手机
- `android:live`：在 App 壳里启动联机调试

## 如何判断当前是不是联机调试

最可靠的方法：

- 关闭电脑 `4173` 服务后再打开手机 App

判断结果：

- 如果 App 报网页超时或无法连接，说明当前是联机调试
- 如果 App 还能正常打开，说明当前是离线包

补充方法：

- 联机调试期间，可以故意加一个明显标识，例如右上角 `LIVE 预览`
- 改动前端代码后，手机刷新能立刻看到变化，也说明当前是联机模式

## 如何关闭联机调试

标准关闭动作：

1. 停掉电脑 `4173` 服务
2. 断开 ADB 连接

断开命令示例：

```powershell
C:\Users\zhouqiyu\android-sdk\platform-tools\adb.exe disconnect 192.168.31.53:38201
```

关闭后：

- 手机里的联机版 App 再打开会提示网页超时
- 如果要恢复独立使用，需要重新安装离线 APK

## APK 打包的稳定路径

本项目最终稳定的离线打包路径已经单独沉淀在：

- [BUILD_RUNBOOK.md](C:\Projects\daily_slills\pwa-home-fee\BUILD_RUNBOOK.md)

固定结论：

- JDK 用 `C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot`
- Gradle 缓存用 `C:\Software\gradle-7.4\gradle-repository`
- 先 `npm run cap:sync`
- 再离线执行 `android\gradlew.bat -p android assembleDebug --no-daemon --offline`

不要随意切换到 `C:\Users\zhouqiyu\.gradle` 作为主构建缓存，否则可能缺少 AGP 依赖。

## 这次排障里最关键的坑

### 1. 浏览器调试和 App 壳效果不同

原因：

- 浏览器有地址栏
- App 壳没有地址栏

结论：

- 视觉微调优先用 App 壳联机调试，不要只看浏览器

### 2. 配对成功不等于已经连上设备

原因：

- ADB 无线调试分为 `pair` 和 `connect` 两步

结论：

- 配对后还要查 `_adb-tls-connect._tcp` 的连接端口，再执行 `adb connect`

### 3. 手机超时不一定是 App 有问题

常见原因：

- 电脑 `4173` 服务没启动
- 手机和电脑不在同一局域网
- ADB 已断开

结论：

- 先查服务，再查网络，再查 ADB

### 4. 调样式时每次重装 APK 太慢

结论：

- 样式阶段走联机调试
- 收尾阶段再打离线 APK

## 后续建议

日常开发按下面分工即可：

1. 调前端：联机调试
2. 验收最终效果：离线 APK
3. 改原生层：重新同步并重新打包

