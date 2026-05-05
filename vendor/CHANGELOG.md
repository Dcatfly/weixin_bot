## 2.4.1

### Added

- **`botAgent` config field**: New optional `channels.openclaw-weixin.botAgent` in `openclaw.json`. Sets a custom `bot_agent` identifier (UA-style, max 256 bytes, e.g. `MyBot/1.2.0`) sent in every API request for log attribution. Sanitized on the way out; falls back to `"OpenClaw"` when unset or invalid.
- **`base_info` in all API requests**: Every outbound API call now includes `{ channel_version, bot_agent }` in the request body. Request headers also gain `iLink-App-Id` and `iLink-App-ClientVersion` values read from `package.json`.
- **`notifyStart` / `notifyStop` API calls**: New lifecycle endpoints to signal channel start/stop to the Weixin backend.
- **`StreamingMarkdownFilter`** (`src/messaging/markdown-filter.ts`): Streaming character-level Markdown filter replaces the whole-string `markdownToPlainText` strip, making Markdown partially supported in outbound text.
- **Outbound hook support** (`src/messaging/outbound-hooks.ts`): `message_sending` (pre-send intercept/modify) and `message_sent` (post-send notification) hooks for all outbound paths — `sendText`, `sendMedia`, and inbound-reply `deliver`.
- **QR login enhancements**: Sends `local_token_list` (up to 10 existing bot tokens) with QR code requests; handles new polling statuses `binded_redirect` (already bound), `scaned_but_redirect` (IDC redirect to new host), `need_verifycode` (2FA entry), and `verify_code_blocked`; auto-refreshes expired QR codes during the wait loop (up to 3 times).
- **Per-user `getConfig` caching** (`WeixinConfigManager`): `getConfig` results cached per user with a random TTL ≤ 24 h and exponential-backoff retry (up to 1 h) on failure.
- **Pre-built `dist/` files**: Package now ships pre-compiled JS and source maps.

### Changed

- **Outbound text path**: `process-message` now uses `StreamingMarkdownFilter` (`feed`/`flush`) per deliver chunk; `sendWeixinOutbound` (tool-call path) does the same.
- **Multi-account session isolation config**: Updated from `agents.mode per-channel-per-peer` → `session.dmScope per-account-channel-peer`.
- **`triggerWeixinChannelReload()`**: Now bumps `channelConfigUpdatedAt` (ISO 8601) in `openclaw.json` on each successful login instead of writing an empty `accounts: {}` placeholder.
- **QR login timeout**: Client-side timeout for `get_bot_qrcode` progressively increased and then removed; request now relies on server/stack limits only.
- **Lazy imports**: `monitorWeixinProvider` (in `channel.ts`) and authorization functions (in `process-message.ts`) use dynamic `await import()` to avoid module-initialization side effects that caused plugin registry re-entrance.
- **LICENSE**: Reformatted to Tencent's MIT format.

### Removed

- **`markdownToPlainText`** from `src/messaging/send.ts` — replaced by `StreamingMarkdownFilter`.
- **`openclaw-weixin` CLI subcommands** (`src/weixin-cli.ts` and its `index.ts` registration) — use `openclaw plugins uninstall @tencent-weixin/openclaw-weixin` instead.
- **`src/log-upload.ts`**: Log upload module removed.

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
