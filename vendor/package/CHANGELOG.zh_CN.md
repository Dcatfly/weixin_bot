# 变更日志

[English](CHANGELOG.md)

本项目遵循 [Keep a Changelog](https://keepachangelog.com/) 格式。

## 2.3.1

### 新增

- **`notifyStart` / `notifyStop` API：** 账号启动时调用 `ilink/bot/msg/notifystart`，`gateway.stopAccount` 时调用 `ilink/bot/msg/notifystop`，向微信后台上报生命周期事件。
- **自定义 `botAgent` 配置：** `openclaw.json` 新增 `channels.openclaw-weixin.botAgent` 字段，用于声明 UA 风格的 bot 标识。经 `sanitizeBotAgent()` 校验后写入每条请求的 `base_info.bot_agent`，默认值为 `"OpenClaw"`。
- **`iLink-App-Id` / `iLink-App-ClientVersion` 请求头：** 从 `package.json` 字段派生，附加到所有 HTTP 请求。
- **扫码登录新状态：** `scaned_but_redirect`（IDC 切换轮询域名）、`need_verifycode`（通过 stdin 交互输入配对码）、`verify_code_blocked`（输入错误次数过多，刷新二维码）、`binded_redirect`（账号已绑定，优雅退出）。
- **二维码请求携带 `local_token_list`：** 获取二维码时将本地已存账号的 bot token 一并上报，支持账号重绑。
- **CDN `full_url` / `upload_full_url` 支持：** `GetUploadUrlResp` 和 `MediaInfo` 新增服务端直接返回的完整 CDN URL 字段；上传/下载优先使用服务端 URL，`ENABLE_CDN_URL_FALLBACK` 标志控制回退行为。
- **`apiGetFetch` 辅助函数：** 新增 GET 请求封装（用于二维码状态轮询）。
- **`displayQRCode()` 共享函数：** 将终端二维码渲染逻辑抽取为公共函数，供 CLI 和 MCP 登录流程复用。

### 变更

- **扫码固定基准 URL：** `fetchQRCode` 和 `pollQRStatus` 改为始终使用 `https://ilinkai.weixin.qq.com`，不再依赖配置的 `apiBaseUrl`。
- **二维码状态轮询改为 GET：** `pollQRStatus` 改用 `apiGetFetch`（GET 请求）；网络/网关错误视为 `wait` 状态继续轮询，不再抛出异常。
- **多账号会话隔离配置键更名：** 文档由 `agents.mode per-channel-per-peer` 更新为 `session.dmScope per-account-channel-peer`。
- **`apiFetch` 改名并导出为 `apiPostFetch`：** `timeoutMs` 改为可选，省略时不设置客户端超时。
- **移除 `openclaw` `peerDependencies`** 依赖。

## [2.1.9] - 2026-04-20

### 新增

- **外发 hook 支持：** 为所有外发路径（`sendText`、`sendMedia`、`process-message` 中的入站回复 `deliver`）接入 `message_sending`（发送前拦截/修改）和 `message_sent`（发送后通知）hook。hook 逻辑抽取至共享模块 `src/messaging/outbound-hooks.ts`。

### 变更

- **清理：** 移除 `sendWeixinOutbound` 签名中未使用的 `mediaUrl` 参数。

## [2.1.8] - 2026-04-07

### 变更

- **Markdown 过滤器：** `StreamingMarkdownFilter` 放开了更多 Markdown 格式的保留。

## [2.1.7] - 2026-04-07

### 修复

- **插件注册重入：** `channel.ts` 中将 `monitorWeixinProvider` 改为在 `startAccount` 内部懒加载（`await import(...)`），避免插件注册阶段提前拉取 monitor → process-message → command-auth 依赖链，导致 plugin/provider registry 重入。
- **初始化副作用：** `process-message.ts` 中将 `resolveSenderCommandAuthorizationWithRuntime` / `resolveDirectDmAuthorizationOutcome` 改为懒加载，避免模块初始化时触发宿主的 `ensureContextWindowCacheLoaded` 副作用，进而导致 `loadOpenClawPlugins` 重入。

### 变更

- **tool-call 外发路径：** `sendWeixinOutbound` 现在对发送文本应用 `StreamingMarkdownFilter`，与 `process-message` 中的 model-output 路径保持一致。

## [2.1.4] - 2026-04-03

### 变更

- **扫码登录：** 移除 `get_bot_qrcode` 的客户端超时，请求不再因固定时限被 abort（仍受服务端与网络栈限制）。

## [2.1.3] - 2026-04-02

### 新增

- **`StreamingMarkdownFilter`**（`src/messaging/markdown-filter.ts`）：外发文本由原先 `markdownToPlainText` 整段剥离 Markdown，改为流式逐字符过滤；**对 Markdown 从完全不支持变为部分支持**。

### 变更

- **外发文本：** `process-message` 在每次 `deliver` 时用 `StreamingMarkdownFilter`（`feed` / `flush`）处理回复，替代 `markdownToPlainText`。

### 移除

- 从 `src/messaging/send.ts` 删除 **`markdownToPlainText`**（相关用例从 `send.test.ts` 迁至 `markdown-filter.test.ts`）。

## [2.1.2] - 2026-04-02

### 变更

- **登录后配置刷新：** 每次微信登录成功后，在 `openclaw.json` 中更新 `channels.openclaw-weixin.channelConfigUpdatedAt`（ISO 8601），让网关从磁盘重新加载配置；不再写入空的 `accounts: {}` 占位。
- **扫码登录：** `get_bot_qrcode` 客户端超时由 5s 调整为 10s。
- **文档：** 卸载说明改为使用 `openclaw plugins uninstall @tencent-weixin/openclaw-weixin`，与插件 CLI 一致。
- **日志：** `debug-check` 日志不再输出 `stateDir` / `OPENCLAW_STATE_DIR`。

### 移除

- **`openclaw-weixin` 子命令**（删除 `src/weixin-cli.ts` 及 `index.ts` 中的注册）。请使用宿主自带的 `openclaw plugins uninstall …` 卸载流程。

### 修复

- 解决在 **OpenClaw 2026.3.31 及更新版本**上安装插件时出现的 **dangerous code pattern** 提示（宿主插件安装 / 静态检查）。
