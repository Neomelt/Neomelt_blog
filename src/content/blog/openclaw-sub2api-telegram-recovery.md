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

这篇不是“我改了什么配置”的流水账，而是一次完整排障复盘：  
我当时怎么误判、怎么验证、为什么能得出最终结论。

最终稳定状态是：

- WebUI 不再报 `No API key found for provider "openai-codex"`。
- `sub2api/gpt-5.3-codex` 可正常返回内容。
- Telegram Bot 可连通、可配对、可会话。

## 问题拆分：先分层，再动手

起始症状有三条：

1. `No API key found for provider "openai-codex"`
2. `403 Your request was blocked.`
3. Telegram `deleteWebhook/setMyCommands ... Network request failed`

如果把这三条当成一个问题处理，基本必死。  
我最后采用的分层是：

- **模型路由/鉴权层**
- **上游网关策略层**
- **Telegram 通道网络层**

## 第一条线：模型为什么报 `No API key`

### 我一开始的误判

“文件里明明有 key，为什么还说没有 key？是不是 OpenClaw bug？”

这个判断后来证明是错的。  
关键不在“有没有 key”，而在“**key 是不是以当前版本可识别的结构存储**”。

### 我怎么验证这个判断

先看运行时状态，而不是只看静态文件。用：

```bash
openclaw models status --json
```

它会告诉你当前 `resolvedDefault`、`provider`、`auth store` 识别结果。  
当时可以看到会话还在尝试走 `openai-codex`，并且 auth store 中 profile 结构不匹配当前期望。

### `auth-profiles.json` 到底改了什么

旧结构是历史版本风格（key 在，但 schema 不被当前版本消费）。  
当前版本期望类似：

```json
{
  "version": 1,
  "profiles": {
    "provider:label": {
      "type": "api_key",
      "provider": "xxx",
      "key": "sk-***"
    }
  },
  "lastGood": {},
  "usageStats": {}
}
```

我当时做了两件事：

1. 先迁移成当前 schema（验证读取链路恢复）。
2. 后续确认不再使用 `openai-codex` 后，直接清空 `profiles`，避免旧 provider 残留误导路由。

这个“先迁移再清理”的顺序很重要：  
先证明不是文件损坏，再做精简，避免一上来全删导致定位信息丢失。

### 同时做的一个必要动作：路由去残留

我把模型白名单收敛成单一入口，避免 UI 或旧 session 误选：

- 仅保留 `sub2api/gpt-5.3-codex`
- 移除 `openai/*`、`myapi/*` 等历史条目

一句话：**让系统没有“走错路”的机会**。

## 第二条线：为什么会 `403 Your request was blocked.`

### 第二次误判

我最初也怀疑是 key 错误或模型名错误。

但很快被证据推翻：

- `GET /v1/models` 返回 200（说明 key 至少可用于模型查询）
- OpenClaw 元数据里 provider/model 都是目标值（说明请求确实到达上游）
- 只有推理请求失败（`403 blocked`）

这意味着：不是“没到上游”，而是“上游在拒绝某类推理请求”。

### 我怎么一步步锁定到 UA 过滤

做了一个最小探测矩阵（curl）：

- 同 key、同 endpoint，改不同请求头（尤其 `User-Agent`）
- 对比 `OpenAI/JS` 风格 UA 与 `curl` UA 的返回差异

结果是关键证据：

- OpenAI SDK 风格 UA -> 403
- `curl` UA -> 可通过

这就把问题从“鉴权错误”收缩成“**上游风控策略拦截客户端指纹**”。

### 最终修复动作

在 provider 配置显式覆盖请求头：

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

加完后再跑：

```bash
openclaw agent --agent main --session-id <new> --message "回复ok" --json
```

返回从 `403` 变成正常文本，这一步才算闭环。

## 第三条线：Telegram 为什么一直网络失败

### 第三个误判

“我 shell 里已经有 `HTTP_PROXY/HTTPS_PROXY`，服务应该也能走代理。”

这是常见误区。

### 机制解释：为什么 shell 有代理，gateway 还是不通

OpenClaw gateway 是 systemd 用户服务进程，不是你当前终端子进程。  
你的 shell `export` 只对当前会话和其子进程生效，**不会自动注入到已运行的 systemd 服务**。

另外，Telegram 通道内部走的是自己的 fetch 路径（grammY + undici），最佳做法不是赌全局环境变量，而是给通道显式配置。

### 我怎么验证 Telegram 不是 token 问题

先直接调用：

```bash
curl "https://api.telegram.org/bot<token>/getMe"
```

返回 `ok: true`，说明 token 有效。

再用同款代理链路做 API 探测（`getMe/deleteWebhook/setMyCommands`）都 200，说明代理路径本身可用。

### 最终修复动作

在 `channels.telegram` 增加专用代理：

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "dmPolicy": "pairing",
      "botToken": "8775***",
      "proxy": "http://127.0.0.1:7897"
    }
  }
}
```

然后重启服务，观察日志窗口。  
如果配置生效，你会看到 Telegram provider 重启后，不再刷屏 `setMyCommands/deleteWebhook failed`。

## 一个容易漏掉的步骤：设备授权

这次流程里还有一步很多人会忽略：设备/权限批准。  
当 CLI 或控制面出现 scope 升级请求时，需要批准设备权限，否则部分操作会卡在 auth 边界。

我当时执行过：

```bash
openclaw devices approve --latest
```

这一步不总是必需，但在“新设备 + 新会话 + 配置变更频繁”的排障窗口里，建议显式检查一次。

## 为什么“只回配对码”是对的

Telegram 最后阶段我也差点误判。  
当 `dmPolicy = "pairing"` 时，机器人首次只回：

- 你的 Telegram user id
- pairing code
- owner 需要执行的批准命令

例如：

```bash
openclaw pairing approve telegram UCJPTR6U
```

这不是故障，是设计行为。批准后才能进入正常对话。

## 我这次真正走过的弯路

1. **把“有 key”当成“可用 auth”**  
   忽略了 schema 兼容性。
2. **把 403 直接归因为 key 错误**  
   没先做请求头与 endpoint 的对照实验。
3. **把 shell 代理当成系统服务代理**  
   忽略了 systemd 进程环境边界。

复盘最有价值的不是“最后怎么配”，而是“怎么排除错误路径”。

## 最终可复用的排障框架

如果你也遇到类似连环问题，我建议按这个顺序：

1. 先用 `openclaw models status --json` 看真实路由与 provider。
2. 把“本地配置读取失败”与“上游拒绝请求”分开验证。
3. 用最小 curl 矩阵验证 endpoint、model、headers（尤其 UA）。
4. 对 systemd 服务，显式配置通道级代理，不依赖 shell export。
5. Telegram `pairing` 模式下，先批准 pairing code 再测功能。
6. 检查是否有设备权限批准待处理（`devices approve`）。

## 安全提醒

- 文中所有 key/token 都应脱敏，真实值不要进仓库。
- 排障结束后建议轮换一次关键凭据。
- 能放环境变量的就不要硬编码进配置文件。

---

这次最大的收获是：  
**排障深度来自“证据链”，不是“改好了”。**

当你能清楚写出“假设 -> 证据 -> 结论 -> 回归验证”，这篇复盘才真正有复用价值。
