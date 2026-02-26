---
title: '一次把 OpenClaw 从连环报错拉回可用：sub2api + Telegram 实战排障复盘'
description: '从 No API key、403 blocked 到 Telegram pairing 的完整修复过程，含可复用配置与排障思路。'
pubDate: '2026-02-26'
updatedDate: '2026-02-26'
heroImage: '../../assets/cover.svg'
category: '工程实践'
series: ''
tags: ['OpenClaw', 'sub2api', 'Telegram Bot', '排障', '工程复盘']
---

这篇文章记录一次完整的生产级排障：  
目标很明确，就是把 OpenClaw 从“WebUI 报错 + Telegram 不通”的状态，恢复到可稳定对话。

最终结果：

- WebUI 不再出现 `No API key found for provider "openai-codex"`。
- 自定义模型提供方 `sub2api` 可正常返回内容。
- Telegram Bot 能正常接收消息并进入会话（配对后可用）。

为了后续复用，我把排障过程按时间线拆成了两条主线：模型链路、Telegram 链路。

## 故障现象

一开始看起来像是“单点问题”，其实是多个问题叠加：

1. WebUI 直接报错：
   `Agent failed before reply: No API key found for provider "openai-codex"`
2. Telegram 网关持续报错：
   `deleteWebhook/setMyCommands ... Network request failed`
3. 切换到自定义 provider 后又出现：
   `403 Your request was blocked.`

这三个错误不是同一个根因，需要拆开处理。

## 第一阶段：模型链路修复

### 1) 先把 `openai-codex` 历史依赖清理干净

最早问题是 OpenClaw 还在走 `openai-codex` 的鉴权路径，而当前使用的是普通 API Key 和第三方网关。

处理点：

- 修正 `auth-profiles.json` 结构（确保 schema 有效）。
- 移除历史 provider 残留，避免 WebUI/会话误选旧模型。
- 将默认模型收敛为 `sub2api/gpt-5.3-codex`。

核心思路是“单一事实来源”：  
只保留一个可用 provider，避免混杂 `openai/openai-codex/myapi/sub2api` 多路并存导致的路由漂移。

### 2) 配置切到 `sub2api`（Responses API）

最终使用的模型配置形态如下（脱敏示意）：

```json
{
  "models": {
    "providers": {
      "sub2api": {
        "baseUrl": "https://gmn.chuangzuoli.com",
        "api": "openai-responses",
        "apiKey": "sk-***",
        "models": [
          {
            "id": "gpt-5.3-codex",
            "api": "openai-responses"
          }
        ]
      }
    }
  }
}
```

### 3) 新阻塞：`403 Your request was blocked.`

这一步最容易误判成“key 错了”。  
实际上 `GET /v1/models` 是通的，说明 key 和鉴权头至少部分有效。

真正关键点在于：该网关对某些客户端指纹做了拦截（典型是 OpenAI SDK 风格请求）。

### 4) 关键突破：自定义请求头绕过上游拦截

在 provider 配置中增加 `headers` 后，请求恢复正常：

```json
{
  "models": {
    "providers": {
      "sub2api": {
        "headers": {
          "User-Agent": "curl/8.5.0"
        }
      }
    }
  }
}
```

加上这一条后，模型调用从 `403` 恢复为可返回 `ok`。  
这说明故障点不是本地鉴权文件，而是上游网关策略。

## 第二阶段：Telegram 链路修复

模型通了之后，Telegram 依旧报 `Network request failed`。

### 1) 先验证 Bot Token 本身

直接调用 Telegram API `getMe` 验证，返回 `ok=true`，确认 token 有效。  
也就是说不是 BotFather 新 token 配置错误。

### 2) 根因：网关进程的 Telegram 网络路径不可达

虽然 shell 下有代理，但 OpenClaw 的 Telegram 通道不一定自动走系统环境。  
这时候最稳妥做法是给 Telegram 通道显式配置代理：

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "8775***",
      "dmPolicy": "pairing",
      "proxy": "http://127.0.0.1:7897"
    }
  }
}
```

热重载/重启后，日志不再持续刷 `deleteWebhook/setMyCommands failed`。

### 3) “只回一条配对码”是正常行为

很多人会把这一步当 bug。  
但当 `dmPolicy = "pairing"` 时，首次私聊只会回：

- 你的 Telegram user id
- pairing code
- 需要 owner 执行的 approve 命令

批准命令示例：

```bash
openclaw pairing approve telegram UCJPTR6U
```

批准后再发消息，才能进入正常会话。

## 最终状态

修复完成后的状态可以归纳为：

1. 默认模型固定为 `sub2api/gpt-5.3-codex`。
2. `openai-codex` 历史鉴权依赖被移除，不再误触。
3. `sub2api` 增加 `User-Agent` 覆盖后，不再触发 403。
4. Telegram 通过 `channels.telegram.proxy` 走专用代理。
5. 首次 DM 配对批准后，Bot 可稳定回复。

## 可复用的排障清单

如果你也遇到类似问题，可以按这个顺序走：

1. 先确认“当前会话实际使用的 provider/model”，不要只看配置文件。
2. 拆分“本地鉴权问题”和“上游网关策略问题”，分别验证。
3. 用最小 HTTP 探测确认：`models`、`responses`、`chat/completions` 各自状态。
4. 对第三方网关，优先考虑是否存在 UA/Headers 风控。
5. Telegram 失败时，优先验证 token，然后配置 channel 级 proxy。
6. `pairing` 模式下看到配对码是预期行为，不是故障。

## 安全提醒

- 不要把真实 `apiKey`、`botToken` 提交到仓库。
- 排障时建议用脱敏日志和临时密钥。
- 修复完成后，建议轮换一次关键 token。

---

这次修复最核心的经验是：  
**同一条错误链路里，常常有多个独立故障叠加。**

把模型侧和消息通道侧拆开做“分层诊断”，远比盲目改配置有效。
