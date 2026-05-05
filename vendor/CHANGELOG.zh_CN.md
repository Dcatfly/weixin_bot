## 2.4.1

### 新增

- **`botAgent` 配置字段**：在 `openclaw.json` 的 `channels.openclaw-weixin` 下新增可选 `botAgent` 字段。用于设置自定义 `bot_agent` 标识（UA 风格，最长 256 字节，如 `MyBot/1.2.0`），随每条 API 请求一同发送，便于后台日志归因。无效值自动清洗，为空时回退为 `"OpenClaw"`。
- **所有 API 请求携带 `base_info`**：每条出站 API 调用的请求体中现在包含 `{ channel_version, bot_agent }`；请求头同步增加从 `package.json` 读取的 `iLink-App-Id` 和 `iLink-App-ClientVersion`。
- **`notifyStart` / `notifyStop` 接口**：新增生命周期通知接口，在 channel 启动/停止时通知微信后端。
- **`StreamingMarkdownFilter`**（`src/messaging/markdown-filter.ts`）：流式逐字符 Markdown 过滤器，取代原先整段 `markdownToPlainText` 剥离方式，外发文本对 Markdown 从完全不支持变为部分支持。
- **外发 hook 支持**（`src/messaging/outbound-hooks.ts`）：为所有外发路径（`sendText`、`sendMedia`、入站回复 `deliver`）接入 `message_sending`（发送前拦截/修改）和 `message_sent`（发送后通知）hook。
- **扫码登录增强**：QR 码请求时附带 `local_token_list`（最多 10 个已有 bot token）；新增轮询状态处理：`binded_redirect`（已绑定）、`scaned_but_redirect`（IDC 重定向至新 host）、`need_verifycode`（两步验证）、`verify_code_blocked`（输入锁定）；等待扫码期间二维码过期可自动刷新（最多 3 次）。
- **按用户缓存 `getConfig`**（`WeixinConfigManager`）：`getConfig` 结果按用户缓存，随机刷新周期 ≤ 24 h，失败时指数退避重试（最长 1 h）。
- **预构建 `dist/` 文件**：npm 包现在随附编译后的 JS 文件及 source map。

### 变更

- **外发文本路径**：`process-message` 现在在每次 `deliver` 时使用 `StreamingMarkdownFilter`（`feed`/`flush`）；`sendWeixinOutbound`（tool-call 路径）同步应用相同过滤器。
- **多账号会话隔离配置**：从 `agents.mode per-channel-per-peer` 改为 `session.dmScope per-account-channel-peer`。
- **`triggerWeixinChannelReload()`**：每次登录成功后改为更新 `openclaw.json` 中的 `channelConfigUpdatedAt`（ISO 8601），不再写入空的 `accounts: {}` 占位。
- **扫码登录超时**：`get_bot_qrcode` 的客户端超时先逐步增大后完全移除，现在依赖服务端/网络栈限制。
- **懒加载优化**：`channel.ts` 中的 `monitorWeixinProvider` 和 `process-message.ts` 中的授权函数改为动态 `await import()`，避免模块初始化阶段产生触发 plugin registry 重入的副作用。
- **LICENSE**：更新为腾讯公司的 MIT 授权格式。

### 移除

- **`markdownToPlainText`**（从 `src/messaging/send.ts` 删除）：由 `StreamingMarkdownFilter` 替代。
- **`openclaw-weixin` CLI 子命令**（删除 `src/weixin-cli.ts` 及 `index.ts` 中的注册）：请使用 `openclaw plugins uninstall @tencent-weixin/openclaw-weixin`。
- **`src/log-upload.ts`**：日志上传模块已删除。

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
