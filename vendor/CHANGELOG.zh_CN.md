## 2.1.9

### 新增

- **`StreamingMarkdownFilter`**（`src/messaging/markdown-filter.ts`）：流式逐字符 Markdown 过滤器，替代原有 `markdownToPlainText`；代码块、加粗、表格、行内代码等保留传递，H5/H6 标题和图片标记被移除，Markdown 从几乎完全剥除变为部分支持。
- **外发 hook 支持**（`src/messaging/outbound-hooks.ts`）：为所有外发路径（`sendWeixinOutbound`、`sendMedia`、`process-message` 中的 `deliver` 回调）接入 `message_sending`（发送前拦截/修改）和 `message_sent`（发送后通知）hook。
- **`apiGetFetch`**：`api.ts` 中新增 GET 请求封装，供二维码和状态轮询接口共用。
- **`iLink-App-Id` 与 `iLink-App-ClientVersion` HTTP 请求头**：所有 API 请求均附带，值从 `package.json` 的 `ilink_appid` 和 `version` 字段读取。
- **CDN 完整 URL 支持**：API 类型中新增 `upload_full_url` / `full_url` 字段；服务端直接下发的完整 URL 优先于客户端拼接的 CDN URL，适用于上传和下载。
- **扫码登录 IDC 重定向**：新增 `scaned_but_redirect` 状态处理，通过 `redirect_host` 字段动态切换轮询地址，无需重新发起登录。
- **`ENABLE_CDN_URL_FALLBACK`** 开关（`cdn-url.ts`）：控制服务端未返回 `full_url` 时是否回退到客户端拼接 CDN URL。
- **MEDIA: 标签位置提示**：Channel 系统提示中新增说明，`MEDIA:` 指令必须单独占一行。

### 变更

- **扫码请求改用固定 base URL** `https://ilinkai.weixin.qq.com`，发起登录前不再要求配置 `apiBaseUrl`。
- **QR 轮询容错**：网络/网关错误（如 Cloudflare 524）不再抛出异常，改为返回 `wait` 状态，保持轮询继续运行。
- **`apiFetch` 重命名为 `apiPostFetch`**，所有 POST 调用同步更新。
- **`sendWeixinOutbound`** 在发送前应用 `StreamingMarkdownFilter` 和外发 hook。
- **`monitorWeixinProvider`** 改为在 `startAccount` 内部懒加载，避免插件注册阶段触发 plugin/provider registry 重入。
- **`disableBlockStreaming`** 在回复 dispatch 中默认改为 `true`。
- **配置 schema**：`logUploadUrl` 字段替换为 `channelConfigUpdatedAt`（ISO 8601），每次登录成功后更新，触发网关从磁盘重新加载配置。
- **多账号上下文隔离文档**：配置项由 `agents.mode per-channel-per-peer` 更新为 `session.dmScope per-account-channel-peer`。
- **`triggerWeixinChannelReload()`**：每次登录均写入 `channelConfigUpdatedAt`，不再受原有条件判断限制。

### 修复

- **注册重入**（`channel.ts`）：懒加载 `monitorWeixinProvider`，避免插件注册阶段拉取 monitor → process-message → command-auth 依赖链导致注册表重入。
- **初始化副作用**（`process-message.ts`）：授权解析函数改为懒加载，防止模块初始化时触发 `ensureContextWindowCacheLoaded`，进而导致 `loadOpenClawPlugins` 重入。
- **`full_url` 媒体下载**：图片、语音、文件、视频在服务端仅返回 `full_url`（无 `encrypt_query_param`）时，现可正常下载。

### 移除

- **`src/log-upload.ts`** 及 `index.ts` 中的 `registerWeixinCli` CLI 子命令注册已删除；请改用 `openclaw plugins uninstall @tencent-weixin/openclaw-weixin`。
- **`markdownToPlainText`** 从 `send.ts` 移除（已由 `StreamingMarkdownFilter` 取代）。
- **`PLUGIN_VERSION`** 常量从 `compat.ts` 移除。
- **`package.json` 中 `openclaw` 的 `peerDependencies` 声明**移除。
- **`sendWeixinOutbound` 的 `mediaUrl` 参数**移除（此参数从未被使用）。

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
