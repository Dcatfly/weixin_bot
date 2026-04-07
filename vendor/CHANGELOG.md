## 2.1.7

### Added

- **`StreamingMarkdownFilter`** (`src/messaging/markdown-filter.ts`): streaming character-level filter replaces whole-string `markdownToPlainText`; outbound Markdown goes from effectively unsupported to **partially supported**.
- **`apiGetFetch()`**: dedicated GET wrapper for API requests (shared headers, optional timeout).
- **`iLink-App-Id` / `iLink-App-ClientVersion` headers**: added to all API requests, read from `package.json`'s `ilink_appid` and `version` fields.
- **`upload_full_url` / `full_url` fields**: server can return a pre-built CDN URL for uploads and downloads, eliminating client-side URL construction.
- **`scaned_but_redirect` QR status**: new IDC-redirect state during login; polling base URL switches to `redirect_host` transparently.

### Changed

- **QR code fetch uses fixed base URL** (`https://ilinkai.weixin.qq.com`): no longer requires `baseUrl` to be configured before login.
- **QR status polling**: network/gateway errors (e.g. Cloudflare 524) are treated as `wait` and retried instead of thrown.
- **`get_bot_qrcode` timeout**: client-side timeout removed; only `get_qrcode_status` retains a per-poll timeout.
- **Outbound Markdown filtering**: `process-message` deliver path and `sendWeixinOutbound` (tool-call path) both use `StreamingMarkdownFilter` instead of `markdownToPlainText`.
- **Lazy imports in `channel.ts`**: `monitorWeixinProvider` lazy-imported inside `startAccount` to prevent plugin/provider registry re-entrance during registration.
- **Lazy imports in `process-message.ts`**: command-auth functions lazy-imported to prevent `ensureContextWindowCacheLoaded` side-effect at module initialization.
- **`triggerWeixinChannelReload`**: always bumps `channelConfigUpdatedAt` (ISO 8601) on login success; no longer writes empty `accounts: {}` placeholder.
- **Multi-account context isolation** config key changed from `agents.mode per-channel-per-peer` to `session.dmScope per-account-channel-peer`.
- **Media downloadability check**: `encrypt_query_param` OR `full_url` accepted for images, voice, files, and video.
- **Compatibility error message**: updated to suggest `npx @tencent-weixin/openclaw-weixin-cli install` for legacy-host users.
- **`debug-check` log**: no longer includes `stateDir` / `OPENCLAW_STATE_DIR`.
- **`package.json`**: removed `peerDependencies`; added `ilink_appid: "bot"` field.
- **`logUploadUrl`** config field replaced by `channelConfigUpdatedAt`.

### Removed

- **`src/log-upload.ts`** and `registerWeixinCli`: CLI subcommands (`openclaw-weixin uninstall`, `openclaw-weixin logs-upload`) removed from plugin; use `openclaw plugins uninstall @tencent-weixin/openclaw-weixin` instead.
- **`markdownToPlainText`** from `send.ts`; replaced by `StreamingMarkdownFilter`.
- **`openclaw-weixin` CLI registration** from `index.ts`.
- **`PLUGIN_VERSION`** constant from `compat.ts`.

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
