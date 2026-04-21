## 2.1.9

### Added

- **`StreamingMarkdownFilter`** (`src/messaging/markdown-filter.ts`): streaming character-level Markdown filter replaces `markdownToPlainText`; Markdown goes from effectively stripped to partially preserved (code fences, bold, tables, inline code pass through; H5/H6 headings and images are removed).
- **Outbound hook support** (`src/messaging/outbound-hooks.ts`): `message_sending` (pre-send interception/modification) and `message_sent` (post-send notification) hooks wired into all outbound paths — `sendWeixinOutbound`, `sendMedia`, and the `deliver` callback in `process-message`.
- **`apiGetFetch`**: new GET request wrapper in `api.ts`, shared by QR code and status polling endpoints.
- **`iLink-App-Id` and `iLink-App-ClientVersion` HTTP headers** added to all API requests; values derived from `ilink_appid` and `version` in `package.json`.
- **CDN full-URL support**: `upload_full_url` / `full_url` fields added to API types; server-provided full URLs take precedence over client-constructed CDN URLs for both upload and download.
- **QR login IDC redirect**: `scaned_but_redirect` status handled — polling host switches dynamically via `redirect_host` field without restarting the login session.
- **`ENABLE_CDN_URL_FALLBACK`** flag in `cdn-url.ts` controlling fallback to client-constructed CDN URLs when server omits `full_url`.
- **MEDIA: tag placement hint** added to channel system prompt: the `MEDIA:` directive must appear on its own line.

### Changed

- **QR code fetch uses fixed base URL** `https://ilinkai.weixin.qq.com`; `apiBaseUrl` config is no longer required before initiating login.
- **QR polling error tolerance**: network/gateway errors (e.g. Cloudflare 524) now return `wait` status instead of throwing, keeping the polling loop alive.
- **`apiFetch` renamed to `apiPostFetch`**; all POST API calls updated accordingly.
- **`sendWeixinOutbound`** now applies `StreamingMarkdownFilter` and outbound hooks before sending text.
- **`monitorWeixinProvider`** lazy-imported inside `startAccount` to prevent plugin/provider registry re-entrance during plugin registration.
- **`disableBlockStreaming`** defaulted to `true` in reply dispatch.
- **Config schema**: `logUploadUrl` field replaced by `channelConfigUpdatedAt` (ISO 8601); bumped on every successful login to trigger gateway config reload from disk.
- **Multi-account context isolation docs**: config key updated from `agents.mode per-channel-per-peer` to `session.dmScope per-account-channel-peer`.
- **`triggerWeixinChannelReload()`** always writes `channelConfigUpdatedAt` on login (no longer conditional on absence of channel config).

### Fixed

- **QR login re-entrance** (`channel.ts`): lazy-importing `monitorWeixinProvider` avoids pulling the monitor → process-message → command-auth chain at plugin registration time.
- **Initialization side effect** (`process-message.ts`): lazy-import of auth resolution functions prevents `ensureContextWindowCacheLoaded` from firing during module init, which caused `loadOpenClawPlugins` re-entrance.
- **Media download with `full_url`**: image, voice, file, and video items now download correctly when the server returns `full_url` without `encrypt_query_param`.

### Removed

- **`src/log-upload.ts`** and `registerWeixinCli` CLI subcommand registration removed; use `openclaw plugins uninstall @tencent-weixin/openclaw-weixin` instead.
- **`markdownToPlainText`** from `send.ts` (superseded by `StreamingMarkdownFilter`).
- **`PLUGIN_VERSION`** constant from `compat.ts`.
- **`peerDependencies`** for `openclaw` removed from `package.json`.
- **`mediaUrl` parameter** removed from `sendWeixinOutbound` signature (was unused).

## 2.0.1

### Added

- **Host compatibility check** (`src/compat.ts`): new `assertHostCompatibility()` guard called at plugin `register()` time; throws a descriptive error when the running OpenClaw version is below `>=2026.3.22`.
- **`openclaw.plugin.json` version field**: manifest now declares `"version": "2.0.0"`.
- **`peerDependencies`**: `openclaw >=2026.3.22` added; `minHostVersion` enforcement added to install config.
- **Context token disk persistence**: context tokens are now written to `accounts/{accountId}.context-tokens.json` and restored on gateway start (`restoreContextTokens`), so conversation context survives restarts.
- **`findAccountIdsByContextToken()`**: looks up which registered accounts have an active session with a given recipient — used to auto-resolve sender account for cron deliveries.
- **`resolveOutboundAccountId()`**: automatically selects the correct bot account for outbound messages when `accountId` is not explicitly provided; throws a clear error on ambiguity.
- **`unregisterWeixinAccountId()`**: removes an account from the persistent index file.
- **`clearStaleAccountsForUserId()`**: after a successful QR login, removes other accounts that share the same WeChat `userId`, preventing ambiguous contextToken matches.
- **`clearContextTokensForAccount()`**: clears in-memory and on-disk context tokens for a given account.
- **`blockStreaming` capability + coalesce defaults**: channel now declares `blockStreaming: true` with `minChars: 200` / `idleMs: 3000` defaults.
- **`openclaw openclaw-weixin uninstall` CLI subcommand**: removes the channel config section and then runs `openclaw plugins uninstall`.
- **QR code fallback UX**: improved messages guide users to open the URL in a browser when the terminal QR render fails (messages now in Chinese).
- **README**: added Compatibility table, Uninstall section, and Troubleshooting section.

### Changed

- **`openclaw/plugin-sdk` imports split into subpaths**: e.g. `openclaw/plugin-sdk/core`, `openclaw/plugin-sdk/account-id`, `openclaw/plugin-sdk/channel-config-schema`, `openclaw/plugin-sdk/infra-runtime`, etc. Required by OpenClaw ≥2026.3.22 SDK restructure.
- **`triggerWeixinChannelReload()`**: changed from a no-op stub to a real implementation that writes the `channels.openclaw-weixin.accounts` section to `openclaw.json` before signalling a reload.
- **`loadConfigRouteTag()`**: config section is now cached after first read to avoid repeated file I/O.
- **`clearWeixinAccount()`**: now also removes `{accountId}.sync.json`, `{accountId}.context-tokens.json`, and the `allowFrom` credentials file (previously only removed `{accountId}.json`).
- **Temp/log directory**: all hardcoded `/tmp/openclaw` paths replaced with `resolvePreferredOpenClawTmpDir()` from the SDK.
- **`redactBody()`**: now redacts values of sensitive JSON fields (`context_token`, `bot_token`, `token`, `authorization`) before truncating.
- **Cron delivery hint**: updated to require both `delivery.to` and `delivery.accountId` for multi-account setups.
- **Plugin entry**: `register()` now respects `registrationMode` — skips CLI registration when not in full mode.
- **`sendText` / `sendMedia`**: auto-resolve `accountId` via `resolveOutboundAccountId()` when caller does not provide one.
- **Send success log level**: upgraded from `debug` to `info`.

### Fixed

- Missing `contextToken` no longer causes a hard throw and message refusal; messages are now sent without context (with a warning), matching server-side handling that tolerates missing tokens.
- Error-notice handler no longer silently swallows errors when `contextToken` is absent.
