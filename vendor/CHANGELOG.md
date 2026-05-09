## 2.4.3

### Added

- **`bot_agent` request field**: outgoing CGI requests carry a configurable `bot_agent` (UA-style `name/version (comment)` grammar); sanitized by `sanitizeBotAgent()`, falls back to `OpenClaw`. Set via `botAgent` in channel config.
- **Outbound hook support**: `message_sending` (pre-send interception) and `message_sent` (post-send notification) hooks for all outbound paths — `sendText`, `sendMedia`, and inbound-reply `deliver`. Logic extracted to `src/messaging/outbound-hooks.ts`.
- **`StreamingMarkdownFilter`** (`src/messaging/markdown-filter.ts`): streaming character-level Markdown filter replaces whole-string `markdownToPlainText` stripping, giving partial Markdown support in outbound text.
- **Connection status notifications**: `notifyStart` emitted after account startup; `notifyStop` emitted via new `gateway.stopAccount` hook.
- **`local_token_list` on QR fetch**: `fetchQRCode` posts up to 10 recent `bot_token`s so the server can recognize already-bound bots and reply with `binded_redirect`.
- **Pair-code login flow**: `waitForWeixinLogin` handles `need_verifycode` / `verify_code_blocked` states via stdin prompt with bounded retries.
- **`binded_redirect` handling**: QR poller returns `alreadyConnected: true`; `auth.login` treats it as a no-op success.
- **Compiled `dist/` in npm tarball**: `files` includes `dist/`; `openclaw.runtimeExtensions` set to `["./dist/index.js"]` so hosts load the prebuilt JS entry directly.
- **`openclaw.plugin.json` channel config**: declares `channels` and `channelConfigs` for hosts ≥ 2026.4.x.

### Changed

- **QR login UX**: reworded QR/scan prompts; removed client-side timeout from `fetchQRCode` / `startWeixinLoginWithQr` (server/stack limits only).
- **`sendWeixinOutbound`**: now applies `StreamingMarkdownFilter` to outbound text, consistent with the model-output path.
- **`StreamingMarkdownFilter`**: preserves more Markdown constructs in outbound text.
- **Multi-account context isolation**: config key changed from `agents.mode per-channel-per-peer` to `session.dmScope per-account-channel-peer`.
- **Config reload after login**: writes `channelConfigUpdatedAt` (ISO 8601) instead of an empty `accounts: {}` placeholder.

### Fixed

- **`iLink-App-Id` / `iLink-App-ClientVersion` headers empty in production**: `readPackageJson` now walks up from the current module directory to find the plugin's own `package.json`, tolerating both dev (`src/api/`) and built (`dist/src/api/`) layouts.
- **`openclaw channels login` false failure on `binded_redirect`**: CLI now exits 0 when the bot is already bound to this OpenClaw.
- **Node 24 / undici `TypeError: fetch failed`**: removed manually-set `Content-Length` header from `buildHeaders`; `fetch` now computes it from the body.
- **OpenClaw ≥ 2026.5.x runtime initialization timeout loop**: replaced module-scope `pluginRuntime` global with per-call `ctx.channelRuntime` from the gateway.
- **Plugin registration re-entrance**: lazy-imported `monitorWeixinProvider` inside `startAccount` to avoid pulling in the monitor chain at registration time.
- **Initialization side effect**: lazy-imported auth helpers in `process-message.ts` to prevent `ensureContextWindowCacheLoaded` triggering during module init.
- **Dangerous code pattern warning** on OpenClaw ≥ 2026.3.31 during plugin install.

### Removed

- **`markdownToPlainText`** from `src/messaging/send.ts`; coverage moved to `markdown-filter.test.ts`.
- **`openclaw-weixin` CLI subcommands** (`src/weixin-cli.ts`). Use `openclaw plugins uninstall @tencent-weixin/openclaw-weixin`.
- **`src/runtime.ts`** and module-scope `pluginRuntime` global (superseded by per-call `ctx.channelRuntime`).
- **Dead debug scripts**: `scripts/test-full-upload.ts`, `scripts/test-upload-url.ts`, and unused legacy `index.ts` re-exports.

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
