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

这篇文章记录一次完整的排障过程，目标是把 OpenClaw 从多错并发的状态恢复至可用。

最终结果：

- `No API key found for provider "openai-codex"` 不再出现。
- `sub2api / gpt-5.3-codex` 能正常返回内容，403 解除。
- Telegram 机器人完成配对后可稳定对话。

为了后续复用，把排障拆成两条主线：模型链路、Telegram 链路。

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

## 三个初始误判

先把错误判断列出来，这比"最终答案"更有参考价值。

1. 看到 `No API key` 就认为是 key 本身无效。
2. 看到 `403 blocked` 就认为是 key 或 model 名配置错误。
3. 看到 Telegram 网络失败，认为 shell 中的代理变量已经够用。

这三个判断后来都被逐一推翻。

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

## 排障方法论总结

这次排障暴露了一个常见误区：按报错文案的字面含义直接修改配置，而不验证实际的运行时状态。

更可靠的做法分四步：

1. 先确认运行时的实际路由，而非只看静态配置文件。
2. 将"本地读取问题"与"上游拒绝问题"分开验证。
3. 对模糊错误（如 403）做最小变量实验，逐一排除 UA、endpoint、body 的影响。
4. 涉及 systemd 服务时，不依赖 shell 环境继承，所有配置显式写入。

报错文案是排障入口，不是结论。

## 安全提醒

排障过程中出现过真实 key 和 token，文章内已做脱敏处理。
修复完成后建议对相关凭据做一次轮换，这不是流程形式，而是降低实际泄漏风险的必要动作。
