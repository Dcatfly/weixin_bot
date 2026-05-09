## 2.4.3

### 新增

- **`bot_agent` 请求字段**：所有上行 CGI 请求携带可配置的 `bot_agent`（UA 风格 `name/version (comment)` 语法），由 `sanitizeBotAgent()` 清洗，缺失或非法时回落为 `OpenClaw`。通过 channel 配置中的 `botAgent` 字段设置。
- **外发 hook 支持**：为所有外发路径（`sendText`、`sendMedia`、入站回复 `deliver`）接入 `message_sending`（发送前拦截/修改）和 `message_sent`（发送后通知）hook。逻辑抽取至 `src/messaging/outbound-hooks.ts`。
- **`StreamingMarkdownFilter`**（`src/messaging/markdown-filter.ts`）：流式逐字符 Markdown 过滤器，替代原先整段 `markdownToPlainText` 剥离，外发文本从完全不支持 Markdown 变为部分支持。
- **连接状态通知**：账号启动后发送 `notifyStart`；通过新增的 `gateway.stopAccount` hook 发送 `notifyStop`。
- **扫码时上送 `local_token_list`**：`fetchQRCode` 携带本地最近 10 个 `bot_token`，让服务端识别已绑定 bot 并下发 `binded_redirect`，避免重复建会话。
- **配对码登录流程**：`waitForWeixinLogin` 通过 stdin 提示用户输入 `verify_code`，处理 `need_verifycode` / `verify_code_blocked` 状态，并做有限次重试。
- **`binded_redirect` 处理**：QR 轮询返回 `alreadyConnected: true`；`auth.login` 将其视为成功无操作。
- **npm 包内携带 dist 产物**：`files` 加入 `dist/`，`openclaw.runtimeExtensions` 设为 `["./dist/index.js"]`，宿主直接加载预编译 JS 入口。
- **`openclaw.plugin.json` 频道配置**：声明 `channels` 与 `channelConfigs`，支持 ≥ 2026.4.x 宿主的频道选择 UI。

### 变更

- **扫码登录文案**：调整 QR / 扫码相关提示；移除 `fetchQRCode` / `startWeixinLoginWithQr` 的客户端超时，长轮询仅受服务端与网络栈限制。
- **`sendWeixinOutbound`**：对发送文本应用 `StreamingMarkdownFilter`，与 `process-message` 中的 model-output 路径保持一致。
- **`StreamingMarkdownFilter`**：放开了更多 Markdown 格式的保留。
- **多账号上下文隔离**：配置键从 `agents.mode per-channel-per-peer` 改为 `session.dmScope per-account-channel-peer`。
- **登录后配置刷新**：写入 `channelConfigUpdatedAt`（ISO 8601），不再写入空的 `accounts: {}` 占位。

### 修复

- **`iLink-App-Id` / `iLink-App-ClientVersion` 请求头生产环境为空**：`readPackageJson` 改为从当前模块目录向上逐级查找插件自己的 `package.json`，同时兼容开发态（`src/api/`）和发布态（`dist/src/api/`）布局。
- **`openclaw channels login` 在 `binded_redirect` 场景下被误判为失败**：CLI 现在以 0 退出，不再抛错。
- **Node 24 / undici `TypeError: fetch failed`**：移除 `buildHeaders` 中手动设置的 `Content-Length`，改由 `fetch` 根据请求体自动计算。
- **OpenClaw ≥ 2026.5.x 微信 runtime 初始化超时无限重启**：移除模块作用域的 `pluginRuntime` 全局，改为按调用从网关 ctx 读取 `ctx.channelRuntime`。
- **插件注册重入**：`channel.ts` 中将 `monitorWeixinProvider` 改为在 `startAccount` 内部懒加载，避免注册阶段提前拉取依赖链。
- **初始化副作用**：`process-message.ts` 中将鉴权辅助函数改为懒加载，防止模块初始化时触发 `ensureContextWindowCacheLoaded` 副作用。
- **安装时 dangerous code pattern 警告**：解决在 OpenClaw ≥ 2026.3.31 安装插件时出现的静态检查警告。

### 移除

- **`markdownToPlainText`**（从 `src/messaging/send.ts` 删除）；测试迁至 `markdown-filter.test.ts`。
- **`openclaw-weixin` CLI 子命令**（删除 `src/weixin-cli.ts`）；请使用 `openclaw plugins uninstall @tencent-weixin/openclaw-weixin`。
- **`src/runtime.ts`** 和模块作用域 `pluginRuntime` 全局（由按调用注入的 `ctx.channelRuntime` 取代）。
- **冗余调试脚本**：`scripts/test-full-upload.ts`、`scripts/test-upload-url.ts` 及遗留 `index.ts` 转发文件。

## 2.0.1

### 新增

- **宿主版本兼容性检查**（`src/compat.ts`）：在插件 `register()` 时调用 `assertHostCompatibility()`，若 OpenClaw 版本低于 `>=2026.3.22` 则抛出带有指引信息的错误。
- **`openclaw.plugin.json` 版本字段**：manifest 现在声明 `"version": "2.0.0"`。
- **`peerDependencies`**：新增 `openclaw >=2026.3.22`；安装配置中新增 `minHostVersion` 限制。
- **contextToken 磁盘持久化**：contextToken 现在写入 `accounts/{accountId}.context-tokens.json`，网关启动时自动恢复（`restoreContextTokens`），重启后不再丢失对话上下文。
- **`findAccountIdsByContextToken()`**：查询哪些已注册账号与目标收件人有活跃会话，用于定时任务投递时自动推断发送账号。
- **`resolveOutboundAccountId()`**：调用方未显式提供 `accountId` 时自动选择正确的 Bot 账号；多账号匹配时抛出明确错误。
- **`unregisterWeixinAccountId()`**：从持久化索引文件中移除账号。
- **`clearStaleAccountsForUserId()`**：扫码登录成功后，清理拥有相同 WeChat `userId` 的其他账号，防止 contextToken 匹配歧义。
- **`clearContextTokensForAccount()`**：同时清除指定账号的内存和磁盘 contextToken。
- **`blockStreaming` 能力 + 合并默认值**：Channel 现在声明 `blockStreaming: true`，并设置 `minChars: 200` / `idleMs: 3000` 合并参数。
- **`openclaw openclaw-weixin uninstall` CLI 子命令**：先清理配置文件中的 channel 配置节，再执行 `openclaw plugins uninstall`。
- **二维码降级提示优化**：终端无法渲染二维码时，引导用户用浏览器打开链接扫码（中文提示）。
- **README**：新增兼容性对照表、卸载章节和故障排查章节。

### 变更

- **`openclaw/plugin-sdk` 导入拆分为子路径**：如 `openclaw/plugin-sdk/core`、`openclaw/plugin-sdk/account-id`、`openclaw/plugin-sdk/channel-config-schema`、`openclaw/plugin-sdk/infra-runtime` 等，适配 OpenClaw ≥2026.3.22 SDK 结构调整。
- **`triggerWeixinChannelReload()`**：由空实现改为真实功能，在通知重载前将 `channels.openclaw-weixin.accounts` 写入 `openclaw.json`。
- **`loadConfigRouteTag()`**：配置节首次读取后缓存，避免重复 I/O。
- **`clearWeixinAccount()`**：现在同时删除 `{accountId}.sync.json`、`{accountId}.context-tokens.json` 和 `allowFrom` 授权文件（之前仅删除 `{accountId}.json`）。
- **临时目录/日志目录**：所有硬编码的 `/tmp/openclaw` 路径均改为调用 SDK 的 `resolvePreferredOpenClawTmpDir()`。
- **`redactBody()`**：在截断前先对敏感字段（`context_token`、`bot_token`、`token`、`authorization`）的值进行脱敏替换。
- **定时任务投递提示**：要求同时提供 `delivery.to` 和 `delivery.accountId`，适配多账号场景。
- **插件入口**：`register()` 现在检查 `registrationMode`，非 full 模式下跳过 CLI 注册等重型操作。
- **`sendText` / `sendMedia`**：调用方未提供 `accountId` 时，通过 `resolveOutboundAccountId()` 自动推断。
- **发送成功日志级别**：由 `debug` 提升为 `info`。

### 修复

- 缺少 `contextToken` 时不再硬抛错误并拒绝发送；改为打印 warning 后继续发送（与服务端容忍缺失 token 的行为一致）。
- 错误通知处理器不再因缺少 `contextToken` 而静默丢弃错误通知。
