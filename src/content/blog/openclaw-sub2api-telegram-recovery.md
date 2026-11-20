---
title: "一次把 OpenClaw 从连环报错拉回可用：sub2api + Telegram 实战排障复盘"
description: "从 No API key、403 blocked 到 Telegram pairing 的完整修复过程，含可复用配置与排障思路。"
pubDate: "2026-02-26"
updatedDate: "2026-02-26"
heroImage: "../../assets/covers/147814765.webp"
category: "工程实践"
series: ""
tags: ["OpenClaw", "sub2api", "Telegram Bot", "排障", "工程复盘"]
---

这篇文章记一下把 OpenClaw 从一连串报错修到可用的过程，免得下次重装又踩一遍。

最后修完的状态：

- `No API key found for provider "openai-codex"` 消掉了。
- `sub2api / gpt-5.3-codex` 能正常回消息，不再报 403。
- Telegram 机器人配对完之后可以正常对话。

整件事其实分两条线：模型链路和 Telegram 链路。

## 故障现象

初始日志中持续出现三类报错：

```text
No API key found for provider "openai-codex"
telegram deleteWebhook failed: Network request for 'deleteWebhook' failed!
telegram setMyCommands failed: Network request for 'setMyCommands' failed!
```

以及一条权限相关提示（后续步骤中用到）：

```text
security audit: device access upgrade requested ...
```

这三类错误不是同一根因，需要分开处理。

## 一开始走偏的三件事

回头看，最浪费时间的是刚看到报错时下的几个想当然的判断：

1. 看到 `No API key`，下意识以为是 key 填错了或者失效了。
2. 看到 `403 blocked`，以为还是 key 或者 model 名不对。
3. 看到 Telegram 连不上，以为终端里配好代理环境变量就行了。

结果这三个全猜错了。

## 第一阶段：`No API key` 是路由与 auth schema 问题

### 先看运行时，而不是静态配置

```bash
openclaw models status --json
```

这一步的关键不在于核对 key 的值，而是确认当前会话实际走的 provider 路径。
输出中仍然存在 `openai-codex` 残留路径被尝试，说明问题不是"没写 key"，而是"系统在尝试走一个已被废弃的 provider"。

### `auth-profiles.json` 有内容不代表能被当前版本正确读取

当时文件中有内容，但结构不符合当前版本的识别格式。整理后的结构（脱敏）：

```json
{
  "version": 1,
  "profiles": {
    "provider:xxx": {
      "type": "api_key",
      "provider": "xxx",
      "key": "sk-***"
    }
  },
  "lastGood": {},
  "usageStats": {}
}
```

处理步骤：先验证 schema 能被正常读取，再把不再使用的 provider 彻底移除，避免旧残留干扰路由。

### 模型侧的最终收敛

只保留 `sub2api/gpt-5.3-codex` 这一条可用路径。
多个 provider 并存时，session 实际走的路径和预期可能不一致，排障结论因此失效。

## 第二阶段：`403 blocked` 是上游策略拦截，而非 key 错误

这是整次排障中最不直观的部分。

### 排除 key 错误的方法

用同一把 key 分别测模型枚举接口和推理接口：

- 枚举接口（`GET /v1/models`）：正常返回
- 推理接口（`POST /v1/responses`）：返回 403

结论：不是完全鉴权失败，而是特定类型的请求被上游策略拒绝。

### 定位到 User-Agent 的过程

控制变量：同一 endpoint、同一 key、同一 body，仅修改请求头。

- SDK 风格 UA：403
- `curl/8.5.0` UA：正常返回

可以确认：上游对客户端指纹（UA）存在拦截策略，并非账号或模型配置问题。

### 修复方案

在 `sub2api` provider 配置中显式覆盖 User-Agent：

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

用新 session 验证：

```bash
openclaw agent --agent main --session-id <new> --message "回复ok" --json
```

返回正常内容，模型链路收口。

## 第三阶段：Telegram 网络失败是进程环境边界问题

shell 中已配置代理，但 gateway 依旧报 `Network request failed`。

原因在于：gateway 是 systemd 用户服务，并非当前终端的子进程。
在 shell 中 `export HTTP_PROXY` 不会注入到已运行的 systemd service 进程。

解决方法是直接在通道配置中写入显式代理：

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

重启后日志中 `setMyCommands/deleteWebhook` 不再循环报错。

## 容易遗漏的步骤：设备权限批准

如果日志中已出现 scope upgrade request，需要执行设备批准：

```bash
openclaw devices approve --latest
```

这一步缺失会导致 CLI 与 gateway 之间的连接持续被拒。

## `dmPolicy = "pairing"` 时机器人只回配对码是预期行为

首次私聊时，机器人只返回 user id 和 pairing code，这不是故障。

拿到 code 后执行批准命令：

```bash
openclaw pairing approve telegram UCJPTR6U
```

批准完成后，后续消息才会进入正常会话。

## 回头看

这次折腾下来最大的教训是别光盯着报错字面意思瞎改配置，还是得先看实际跑起来是什么状态：

1. 先查运行时的真实路由，别只看静态文件。
2. 分清是本地没读到配置，还是请求发出去了被上游拦了。
3. 遇到 403 这种含糊的错，直接控制变量测（UA、endpoint、body 逐个换），比猜快得多。
4. 跑在 systemd 里的服务不要指望继承终端里的代理环境变量，代理直接写进配置文件最省心。

另外，排查过程中终端里出过真实的 key 和 token，文章里都打码了。折腾完顺手把用过的凭据都换了一遍，稳妥一点。
