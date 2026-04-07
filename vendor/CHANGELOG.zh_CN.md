## 2.1.7

### 新增

- **`StreamingMarkdownFilter`**（`src/messaging/markdown-filter.ts`）：流式逐字符 Markdown 过滤器，取代原有整段 `markdownToPlainText`；外发 Markdown 从完全不支持变为**部分支持**。
- **`apiGetFetch()`**：专用 GET 请求封装，共享统一请求头，支持可选超时。
- **`iLink-App-Id` / `iLink-App-ClientVersion` 请求头**：所有 API 请求均附带，值从 `package.json` 的 `ilink_appid` 和 `version` 字段读取。
- **`upload_full_url` / `full_url` 字段**：服务端可直接返回预拼接的 CDN 上传/下载 URL，无需客户端自行构造。
- **`scaned_but_redirect` 扫码状态**：登录流程中新增 IDC 跳转状态，自动将轮询 base URL 切换至 `redirect_host`。

### 变更

- **扫码获取二维码改用固定 base URL**（`https://ilinkai.weixin.qq.com`）：登录前无需配置 `baseUrl`。
- **扫码状态轮询**：网络/网关错误（如 Cloudflare 524）改为返回 `wait` 继续重试，不再抛出异常。
- **`get_bot_qrcode` 超时**：移除客户端超时限制；仅 `get_qrcode_status` 保留单次轮询超时。
- **外发 Markdown 过滤**：`process-message` deliver 路径与 `sendWeixinOutbound`（tool-call 路径）均改用 `StreamingMarkdownFilter`，不再使用 `markdownToPlainText`。
- **`channel.ts` 懒加载**：`monitorWeixinProvider` 改为在 `startAccount` 内部懒加载，避免插件注册阶段触发 plugin/provider registry 重入。
- **`process-message.ts` 懒加载**：command-auth 相关函数改为调用时懒加载，防止模块初始化时触发 `ensureContextWindowCacheLoaded` 副作用。
- **`triggerWeixinChannelReload`**：登录成功后无条件写入 `channelConfigUpdatedAt`（ISO 8601），不再写入空的 `accounts: {}` 占位。
- **多账号上下文隔离配置键**：由 `agents.mode per-channel-per-peer` 改为 `session.dmScope per-account-channel-peer`。
- **媒体可下载性判断**：图片、语音、文件、视频均支持 `encrypt_query_param` 或 `full_url` 任一存在即可下载。
- **兼容性错误提示**：旧宿主用户提示改为使用 `npx @tencent-weixin/openclaw-weixin-cli install`。
- **`debug-check` 日志**：不再输出 `stateDir` / `OPENCLAW_STATE_DIR`。
- **`package.json`**：移除 `peerDependencies`；新增 `ilink_appid: "bot"` 字段。
- **`logUploadUrl` 配置字段**：由 `channelConfigUpdatedAt` 替代。

### 移除

- **`src/log-upload.ts`** 及 `registerWeixinCli`：插件 CLI 子命令（`openclaw-weixin uninstall`、`openclaw-weixin logs-upload`）已移除；请改用 `openclaw plugins uninstall @tencent-weixin/openclaw-weixin`。
- **`markdownToPlainText`**（`send.ts`）：由 `StreamingMarkdownFilter` 替代。
- **`index.ts` 中的 `openclaw-weixin` CLI 注册**。
- **`compat.ts` 中的 `PLUGIN_VERSION` 常量**。

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
