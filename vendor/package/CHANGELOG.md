# Changelog

[简体中文](CHANGELOG.zh_CN.md)

This project follows the [Keep a Changelog](https://keepachangelog.com/) format.

## 2.4.2

### Added

- **Custom `botAgent` config:** New `botAgent` option under `channels.openclaw-weixin` in `openclaw.json`. Attached as `bot_agent` in every API request's `base_info`; sanitized with UA-style grammar rules and a 256-byte cap; defaults to `"OpenClaw"`.
- **Channel lifecycle notifications:** `notifyStart()` called on channel account start; `notifyStop()` called on stop — notifying the WeChat backend of the channel client state.
- **Server-provided CDN full URLs:** `getUploadUrl` response supports `upload_full_url` for direct upload; inbound media items include `full_url` for direct download, eliminating client-side URL construction when the server provides it.
- **Extended QR login state machine:** New states `scaned_but_redirect` (IDC redirect — polling host switches transparently), `need_verifycode` / `verify_code_blocked` (verification code flow), and `binded_redirect` (already-bound account).
- **`iLink-App-Id` and `iLink-App-ClientVersion` request headers:** Derived from `package.json`, sent on every API request.

### Changed

- **`channelRuntime` injected by gateway:** Monitor no longer calls `waitForWeixinRuntime()`; the runtime surface is now passed as `MonitorWeixinOpts.channelRuntime` by the gateway context.
- **`apiFetch` renamed to `apiPostFetch`:** `timeoutMs` is now optional — omitting it disables client-side abort and relies on the OS/TCP stack.
- **Multi-account session isolation config key:** `agents.mode per-channel-per-peer` → `session.dmScope per-account-channel-peer`.
- **Block streaming disabled for reply delivery:** `disableBlockStreaming` changed to `true` in the inbound-reply deliver path.

### Removed

- **`src/runtime.ts`:** Removed; `waitForWeixinRuntime()` is no longer needed now that the runtime is injected by the gateway.
- **`src/log-upload.ts`:** Log upload module removed.
- **`logUploadUrl` config option:** Removed from `WeixinConfigSchema`.

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
