# Changelog

[简体中文](CHANGELOG.zh_CN.md)

This project follows the [Keep a Changelog](https://keepachangelog.com/) format.

## 2.3.1

### Added

- **`notifyStart` / `notifyStop` API:** Channel now calls `ilink/bot/msg/notifystart` on account start and `ilink/bot/msg/notifystop` on `gateway.stopAccount` to signal lifecycle events to the WeChat backend.
- **Custom `botAgent` config:** New `channels.openclaw-weixin.botAgent` field in `openclaw.json` for setting a UA-style bot identifier. Validated by `sanitizeBotAgent()` and included as `bot_agent` in every outbound `base_info`. Defaults to `"OpenClaw"`.
- **`iLink-App-Id` / `iLink-App-ClientVersion` headers:** Derived from `package.json` fields and attached to all HTTP requests.
- **Extended QR login states:** `scaned_but_redirect` (IDC host redirect mid-poll), `need_verifycode` (interactive verify-code input via stdin), `verify_code_blocked` (too many wrong codes, refreshes QR), `binded_redirect` (account already bound, exits gracefully).
- **`local_token_list` in QR request body:** Existing bot tokens from saved accounts are sent alongside the QR code fetch, enabling account re-binding.
- **CDN `full_url` / `upload_full_url` support:** `GetUploadUrlResp` and `MediaInfo` now carry server-provided direct CDN URLs. Upload and download paths prefer these over client-constructed URLs when present; `ENABLE_CDN_URL_FALLBACK` flag controls fallback behaviour.
- **`apiGetFetch` helper:** New GET fetch wrapper (used by the QR status poll).
- **`displayQRCode()` utility:** Shared function for terminal QR rendering, reused across CLI and MCP login flows.

### Changed

- **Fixed QR base URL:** `fetchQRCode` and `pollQRStatus` now always use `https://ilinkai.weixin.qq.com` instead of the configured `apiBaseUrl`.
- **QR status poll switched to GET:** `pollQRStatus` now uses `apiGetFetch` (GET) instead of POST; network/gateway errors are treated as `wait` and retried rather than thrown.
- **Multi-account session config key renamed:** Documentation updated from `agents.mode per-channel-per-peer` to `session.dmScope per-account-channel-peer`.
- **`apiFetch` → `apiPostFetch`:** Renamed and exported; `timeoutMs` is now optional (no client-side timeout when omitted).
- **`openclaw` removed from `peerDependencies`** in `package.json`.

## [2.1.9] - 2026-04-20

### Added

- **Outbound hook support:** Add `message_sending` (pre-send interception/modification) and `message_sent` (post-send notification) hook integration for all outbound paths — `sendText`, `sendMedia`, and the inbound-reply `deliver` in `process-message`. Hook logic is extracted into a shared `src/messaging/outbound-hooks.ts` module.

### Changed

- **Cleanup:** Remove unused `mediaUrl` parameter from `sendWeixinOutbound` signature.

## [2.1.8] - 2026-04-07

### Changed

- **Markdown filter:** `StreamingMarkdownFilter` now preserves more Markdown constructs in outbound text.

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
