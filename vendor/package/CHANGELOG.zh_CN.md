# 变更日志

[English](CHANGELOG.md)

本项目遵循 [Keep a Changelog](https://keepachangelog.com/) 格式。

## 2.1.10

### 新增

- **`notifyStart` / `notifyStop`**：频道客户端在启动时调用 `notifyStart`，在优雅关闭时（新增 `stopAccount` 生命周期钩子）调用 `notifyStop` 通知服务端。
- **`iLink-App-Id` 与 `iLink-App-ClientVersion` 请求头**：所有 API 请求现在携带应用标识和版本头，值从 `package.json` 的 `ilink_appid` 字段和 semver → uint32（`0x00MMNNPP`）编码读取。
- **`apiGetFetch`**：共享 GET 请求封装，支持可选超时和公共请求头，二维码获取与状态轮询均通过此函数发起。
- **CDN 服务端直链支持**：接受 API 响应中的 `upload_full_url`（上传）和 `full_url`（下载）字段直接使用；客户端拼接 URL 作为回退（由 `ENABLE_CDN_URL_FALLBACK` 控制）。
- **扫码登录 IDC 跳转**：新增 `scaned_but_redirect` 状态——轮询 host 根据 `redirect_host` 动态切换，无需重启登录流程。

### 变更

- **扫码登录 base URL**：二维码获取与状态轮询固定使用 `https://ilinkai.weixin.qq.com`，不再依赖配置中的 `apiBaseUrl`。
- **扫码状态轮询容错**：网络/网关错误（如 Cloudflare 524 超时）现返回 `wait` 继续轮询，不再抛出异常。
- **兼容性安装提示**：错误信息更新为 `npx @tencent-weixin/openclaw-weixin-cli install`，移除对已废弃 `1.x` 旧版安装方式的引用。
- **`package.json`**：新增 `ilink_appid: "bot"` 字段；移除 `openclaw` 的 `peerDependencies` 声明。

### 移除

- **`PLUGIN_VERSION` 常量**（从 `compat.ts` 中删除）。

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
