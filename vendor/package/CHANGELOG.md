# Changelog

[简体中文](CHANGELOG.zh_CN.md)

This project follows the [Keep a Changelog](https://keepachangelog.com/) format.

## 2.1.8

### Added

- **`iLink-App-Id` / `iLink-App-ClientVersion` headers**: All API requests (GET and POST) now include `iLink-App-Id` (read from `package.json#ilink_appid`) and `iLink-App-ClientVersion` (semver encoded as `0x00MMNNPP` uint32).
- **`apiGetFetch()`**: New GET fetch wrapper in `api.ts`, used by QR login and status polling; replaces ad-hoc `fetch()` calls with consistent header injection.
- **CDN `full_url` support**: `MediaItem` and upload response now carry server-provided full URLs (`full_url` / `upload_full_url`). When present they are used directly, bypassing client-side CDN URL construction. Client-side fallback controlled by `ENABLE_CDN_URL_FALLBACK`.
- **QR login IDC redirect**: Handles new `scaned_but_redirect` status — polling switches to `redirect_host` dynamically without restarting the login flow.
- **`ilink_appid: "bot"`** added to `package.json`.

### Changed

- **QR login fixed base URL**: `fetchQRCode` and QR status polling always use the fixed endpoint `https://ilinkai.weixin.qq.com`; `apiBaseUrl` is no longer required before login.
- **QR polling resilience**: Network/gateway errors during `pollQRStatus` (e.g. Cloudflare 524) now return `{ status: "wait" }` and retry instead of throwing.
- **Multi-account session scope**: Docs updated — config key changed from `agents.mode per-channel-per-peer` to `session.dmScope per-account-channel-peer`.
- **Compat error message**: No longer embeds a static plugin version string; upgrade path now references `npx @tencent-weixin/openclaw-weixin-cli install`.
- **MEDIA directive system prompt**: Model is now instructed that `MEDIA:` tags must appear on their own line.

### Removed

- **`peerDependencies`** (`openclaw >= 2026.3.22`) removed from `package.json`.

## [2.1.7] - 2026-04-07

### Fixed

- **Plugin registration re-entrance:** Lazy-import `monitorWeixinProvider` inside `startAccount` in `channel.ts` to avoid pulling in the monitor → process-message → command-auth chain at plugin registration time, which could re-enter the plugin/provider registry before the account starts.
- **Initialization side effect:** Lazy-import `resolveSenderCommandAuthorizationWithRuntime` / `resolveDirectDmAuthorizationOutcome` in `process-message.ts` to prevent `ensureContextWindowCacheLoaded` from being triggered during module initialization, which caused `loadOpenClawPlugins` re-entrance.

### Changed

- **Tool-call outbound path:** `sendWeixinOutbound` now applies `StreamingMarkdownFilter` to the outbound text, consistent with the model-output path in `process-message`.

## [2.1.4] - 2026-04-03

### Changed

- **QR login:** Remove client-side timeout for `get_bot_qrcode`; the request is no longer aborted on a fixed deadline (server / stack limits still apply).

## [2.1.3] - 2026-04-02

### Added

- **`StreamingMarkdownFilter`** (`src/messaging/markdown-filter.ts`): outbound text no longer runs through whole-string `markdownToPlainText` stripping; a streaming character filter replaces it, so Markdown goes from **effectively unsupported** to **partially supported**.

### Changed

- **Outbound text path:** `process-message` uses `StreamingMarkdownFilter` (`feed` / `flush`) per deliver chunk instead of `markdownToPlainText`.

### Removed

- **`markdownToPlainText`** from `src/messaging/send.ts` (and its tests from `send.test.ts`); coverage moves to `markdown-filter.test.ts`.

## [2.1.2] - 2026-04-02

### Changed

- **Config reload after login:** On each successful Weixin login, bump `channels.openclaw-weixin.channelConfigUpdatedAt` (ISO 8601) in `openclaw.json` so the gateway reloads config from disk, instead of writing an empty `accounts: {}` placeholder.
- **QR login:** Increase client timeout for `get_bot_qrcode` from 5s to 10s.
- **Docs:** Uninstall instructions now use `openclaw plugins uninstall @tencent-weixin/openclaw-weixin` (aligned with the plugins CLI).
- **Logging:** `debug-check` log line no longer includes `stateDir` / `OPENCLAW_STATE_DIR`.

### Removed

- **`openclaw-weixin` CLI subcommands** (`src/weixin-cli.ts` and registration in `index.ts`). Use the host `openclaw plugins uninstall …` flow instead.

### Fixed

- Resolves the **dangerous code pattern** warning when installing the plugin on **OpenClaw 2026.3.31+** (host plugin install / static checks).
