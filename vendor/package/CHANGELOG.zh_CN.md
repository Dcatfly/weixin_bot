# 变更日志

[English](CHANGELOG.md)

本项目遵循 [Keep a Changelog](https://keepachangelog.com/) 格式。

## 2.4.2

### 新增

- **自定义 `botAgent` 配置：** 在 `openclaw.json` 的 `channels.openclaw-weixin` 下新增 `botAgent` 选项；每条 API 请求的 `base_info` 中携带 `bot_agent` 字段。遵循 UA 风格语法规范，最大 256 字节，未配置时默认为 `"OpenClaw"`。
- **通道生命周期通知：** 账号启动时调用 `notifyStart()`，停止时调用 `notifyStop()`，向微信后端通知通道客户端状态。
- **服务端直接返回 CDN URL：** `getUploadUrl` 响应新增 `upload_full_url`，支持直接用于上传；入站媒体对象新增 `full_url` 字段，无需客户端自行拼接下载地址。
- **扫码登录状态机扩展：** 新增 `scaned_but_redirect`（IDC 跳转，轮询 host 自动切换）、`need_verifycode` / `verify_code_blocked`（验证码流程）、`binded_redirect`（账号已绑定）等状态处理。
- **新增 API 请求头：** `iLink-App-Id` 和 `iLink-App-ClientVersion`，从 `package.json` 读取，随每条 API 请求发送。

### 变更

- **`channelRuntime` 改由 gateway 注入：** Monitor 不再调用 `waitForWeixinRuntime()`；runtime surface 现在由 gateway context 通过 `MonitorWeixinOpts.channelRuntime` 直接传入。
- **`apiFetch` 重命名为 `apiPostFetch`：** `timeoutMs` 改为可选；不传时不设置客户端超时，由操作系统/TCP 栈保障。
- **多账号会话隔离配置键更新：** `agents.mode per-channel-per-peer` 改为 `session.dmScope per-account-channel-peer`。
- **回复下发禁用 block streaming：** 入站回复 deliver 路径中 `disableBlockStreaming` 改为 `true`。

### 移除

- **`src/runtime.ts`：** 删除；gateway 已直接注入 runtime，无需 `waitForWeixinRuntime()`。
- **`src/log-upload.ts`：** 日志上传模块已删除。
- **`logUploadUrl` 配置项：** 从 `WeixinConfigSchema` 中移除。

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
