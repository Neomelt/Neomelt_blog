---
title: "用 Tailscale 远程访问自己的机器"
description: "没有公网 IP、不动路由器，在家用浏览器直接打开远端主机上的 ComfyUI。记录一下 Tailscale 的原理、配置过程和踩过的坑。"
pubDate: "2026-07-22T00:17:00+08:00"
pinned: false
hidden: false
heroImage: "../../assets/cover.svg"
category: "工程实践"
series: ""
tags: ["Tailscale", "WireGuard", "NAT", "内网穿透", "ComfyUI"]
---

最近把 Tailscale 用进了日常工作流，感觉实在太顺手了，值得专门写一篇。本着从第一性原理出发的思考，所以先从网络的现实约束讲起，捋清楚为什么只能这么做，再落到具体的命令上。

## 先看效果

远端有一台带 RTX 5060 Ti 的 Linux 主机，上面跑着 ComfyUI 出图服务，只监听 `127.0.0.1:8188`。而我人在家里，轻薄本浏览器直接打开一个域名，就是完整的原生 Web 界面——注意这不是远程桌面串流，是真的在浏览器里操作（直接避免了远程桌面串流时的卡顿感）：

![家里笔记本浏览器直开远端主机上的 ComfyUI](../../../public/blog/tailscale-remote-access/comfyui-via-tsnet.png)

全程不需要公网 IP、不需要自建服务器、不需要动路由器，而且这个服务**从头到尾没有暴露给公网，甚至没有暴露给它所在局域网里的任何人**。

下面从头捋一遍这是怎么做到的。

## 两台机器互访，到底需要什么

先不急着谈工具。远程访问这件事说到底就需要三样东西：

1. 得有个地址，能被路由到对方；
2. 路径上每一跳（路由器、防火墙、NAT）都愿意帮你把包转过去；
3. 公网不可信，所以还得能确认对方是谁，并且把流量加密。

麻烦在于，前两条在今天的互联网上**默认不成立**。IPv4 地址早在 2011 年就分配殆尽，绝大多数设备拿到的是私网地址（`192.168.x` / `10.x`），躲在 NAT 后共享少数公网出口。而 NAT 说白了就是个单向阀：

> 出站连接及其回包放行；没有映射表项的入站包，一律丢弃。

于是家里的笔记本和远端主机各自躲在 NAT 后面，谁都没法被对方连进来。这不是哪里坏了，也不是配置没弄对，纯粹是 IPv4 地址不够用、大家只能共享出口带来的结果：

![NAT 困境与打洞推导](../../../public/blog/tailscale-remote-access/nat-punch.svg)

## 只剩三条路

入站被堵死之后，能走的路其实就剩三条：

| 路线 | 思路 | 代价 |
|---|---|---|
| A. 制造公网可达点 | 买 VPS 做中转（frp 等）；或路由器端口映射 | 服务器钱和维护；映射需要你没有的路由器权限，家宽还常无公网 IPv4 |
| B. 放弃网络层，搬画面 | 远控软件（RustDesk / 向日葵） | 得到的是"屏幕"不是"网络"：画质延迟受限，无法 curl / SSH / 调 API |
| C. 钻 NAT 的空子 | 出站反正是允许的，那就让两边各自出站，在中间碰头 | 几乎没有，见下 |

路线 C 展开就是 NAT 打洞。两边先各自出站连一个会合点，把"我的公网映射地址和端口"跟"我的公钥"交换一下，然后同时朝对方的映射地址发包。两边的 NAT 都以为这是自家发起的会话，各自建了表项，回包就放行了，洞打通之后就是纯点对点直连。碰上少数严苛 NAT 打不通，就退回"两边都出站连一个中继，由它转发"，无非多一跳；因为只依赖出站，这条路总是走得通。

到这里路线 C 还差两块，正好各有一个成熟的东西能填上。前面第 3 条要的信任交给 WireGuard，密钥对就是身份，全程加密，跑在内核态，性能损耗基本可以不管。另外还需要一个"介绍人"服务，管公钥分发、地址簿和打洞撮合，注意它只负责介绍，数据流量不经它的手。

把这一套连打洞带中继带密钥管理全自动化到"装上就通"，就是 Tailscale。它没造什么新技术，就是认了 NAT 这个现实，然后把绕过去的路给修好了。

## 名词对照

上面推导出来的每个角色，Tailscale 里都有个对应的叫法：

| 推导中的角色 | Tailscale 名词 | 说明 |
|---|---|---|
| "我的设备们"这个信任集合 | tailnet | 边界 = 登录了你账号的设备（本质是一组 WireGuard 公钥） |
| 虚拟地址 | `100.x.y.z` | 取自 CGNAT 保留段 100.64.0.0/10，不与家用网段冲突 |
| 会合点 / 介绍人 | 控制面（login.tailscale.com） | 分发公钥与地址簿、撮合打洞；不经手流量 |
| 打洞失败的兜底中继 | DERP | 全球部署，只转发密文 |
| 给地址起名 | MagicDNS | `设备名.tailnet名.ts.net` 自动解析 |
| 把本机服务开门给 tailnet | tailscale serve | 反代 + 自动 HTTPS，仅网内可见 |
| serve 的公网版 | tailscale funnel | 会暴露到互联网——本文用不到，不确定就永远别开 |

组网后的全景是这样的：

![Tailscale 组网架构](../../../public/blog/tailscale-remote-access/architecture.svg)

个人免费额度 100 台设备，这个场景绰绰有余。

## 实操：远端主机安装

安装按官方文档手动来，一共四步，不用 `curl | sh` 那种黑箱。国内网络实测 `pkgs.tailscale.com` 和控制面均直连可达，无需代理：

```bash
# 1. 加官方 apt 源（noble = Ubuntu 24.04，其他版本换代号）
curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/noble.noarmor.gpg \
  -o /usr/share/keyrings/tailscale-archive-keyring.gpg
curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/noble.tailscale-keyring.list \
  -o /etc/apt/sources.list.d/tailscale.list

# 2. 装的是数据面守护进程 tailscaled（WireGuard 隧道就归它管）
apt-get update && apt-get install -y tailscale

# 3. 入网 = 把本机公钥注册进你的 tailnet：
#    会打印 https://login.tailscale.com/a/xxxx 链接，任意设备浏览器打开登录即可
tailscale up

# 4. 授权日常用户免 sudo 管理（serve 等命令不再要 root）
tailscale set --operator=你的用户名
```

建议把四步存成脚本 `sudo bash tailscale-setup.sh` 一次跑完。跑完 `tailscale ip -4` 能看到本机的 `100.x` 身份。

**前置检查一项**：被远程访问的机器不能自动休眠。GNOME 下看
`gsettings get org.gnome.settings-daemon.plugins.power sleep-inactive-ac-timeout`，
为 `0` 即永不休眠（type 字段哪怕是 `suspend`，timeout 为 0 就不会生效）。

## 客户端（笔记本 / 手机）

装官方客户端（tailscale.com/download，手机在应用商店搜），**登录同一个账号**就行。前面名词对照里说过，tailnet 就是"登录了你账号的所有设备"，所以不存在单独的"组网"步骤——不用填对方 IP，也不用交换什么配置，客户端登录完，这台设备就已经在网里了。

任一设备上验证：

```bash
$ tailscale status
100.94.159.89  neomelt-b760m-h-ddr4  linux  -
100.84.35.92   fedora                linux  -
```

两台都在，组网完成。此刻 SSH 已经天然可用——远端 sshd 本来就在监听，只是过去你"够不着"它，现在可达性有了：

```bash
ssh neomelt@100.94.159.89
```

## 实操：把 ComfyUI 开给 tailnet

先说清一件事，一个服务监听哪个地址，其实就等于它决定信任谁。

监听 `0.0.0.0` 是信任整个局域网，而 ComfyUI 压根没有登录认证，等于把一扇没锁的门开给同网段所有人。监听 `127.0.0.1` 只信任本机，安全，但家里就用不上了。我想要的是第三种，只信任我自己那几台设备，而这正好就是 tailnet。

`tailscale serve` 就是把边界从"本机"外扩到"tailnet"的那扇门。远端主机上一条命令：

```bash
tailscale serve --bg 8188
```

有两点要注意。第一次跑会提示 tailnet 还没启用 Serve，命令打印一个 `login.tailscale.com/f/serve?...` 链接，然后就开始轮询等着，看着像卡死了，其实是等你去浏览器点一下启用，这是个一次性开关，点完命令自己就继续了。之后网内任何设备打开 `https://设备名.tailnet名.ts.net` 就能到。这里用 HTTPS 是因为浏览器对明文页面有各种功能限制，而 ts.net 的证书是自动签的，你什么都不用配，首次访问慢几秒就是在签证书。

顺手再挂一个静态目录，翻出图产物用（与反代共存于同一域名）：

```bash
tailscale serve --bg --set-path /outputs /home/neomelt/ComfyUI/output
```

```text
$ tailscale serve status
https://neomelt-b760m-h-ddr4.tail8bd030.ts.net (tailnet only)
|-- /         proxy http://127.0.0.1:8188
|-- /outputs/ path  /home/neomelt/ComfyUI/output
```

一次请求的完整路径是这样。注意 ComfyUI 从头到尾只监听回环，门开在 tailscaled 上，而 tailscaled 只认自己 tailnet 里的成员：

![serve 请求路径](../../../public/blog/tailscale-remote-access/serve-path.svg)

## 日常使用

```bash
# 远端主机上起服务（>> 追加日志；zsh 开了 noclobber 的话 > 第二次会翻车）
nohup ~/ComfyUI/start.sh >> ~/ComfyUI/comfyui.log 2>&1 &

# 停服务（按端口杀，不误伤；pkill 按名字匹配有相对路径的坑）
fuser -k 8188/tcp

# 人在家里远程起停：先 SSH 上去，再执行上面两条
ssh neomelt@100.94.159.89
```

浏览器收藏两个地址就够了：主界面 `https://xxx.ts.net`，出图目录 `https://xxx.ts.net/outputs/WAI/`。

## 运维速查

```bash
tailscale status                  # 所有节点在线状态
tailscale ip -4                   # 本机 100.x 地址
tailscale serve status            # 当前反代路由表
tailscale serve --https=443 off   # 关掉全部反代
tailscale down / up               # 本机断开 / 恢复入网
```

## 避坑与排障

下面都是我实际踩过的坑：

- serve 第一次运行时看起来像卡住了，其实是在等你去管理台点启用，不是 bug（前面 ComfyUI 一节说过）。
- serve 的配置是持久的，机器重启后反代路由会自动恢复；但被反代的服务本身（ComfyUI）不归它管，得自己拉起来，不然页面 502。
- 浏览器的代理插件可能会劫持 `.ts.net` 域名，走了代理反而解析失败，把这个域名加进直连规则就好。
- DERP 中继在国内的延迟我没实测过。打洞成功走 P2P 的体验很好；如果两端都在严苛 NAT 后面只能走中继，延迟怎么样我没有数据，不打包票。

页面打不开的时候，按顺序查三层就行：先确认自己这台设备入网了，再确认对面那台机器在线，最后确认它上面的服务还活着。一层没问题再查下一层，问题出在哪一层很快就能定位：

![三步排障](../../../public/blog/tailscale-remote-access/troubleshoot.svg)

## 最后说说安全

tailnet 的本质是"你账号名下的 WireGuard 公钥集合"，一台设备能不能进来由密钥决定，跟它在哪个网络里没有关系——其实这就是"零信任"这个词最朴素的意思。流量全程加密，就算走 DERP 中继，中继手里拿到的也只是密文。

另外再强调一遍 serve 和 funnel 的区别：serve 只开给 tailnet 内部，funnel 是直接暴露到公网。像 ComfyUI 这种没有任何认证的服务，只能用 serve。

Tailscale 还有一些这篇没用到的功能：ACL（控制哪台设备能访问哪台的哪个端口）、Tailscale SSH、exit node（把全部流量从某台设备出去）、tailnet sharing（把单台设备分享给别人的账号），有需要可以再研究。

## 附：环境与版本

- 服务端：Ubuntu 24.04 (noble)，tailscale 1.98.9，2026-07-18 配置
- 客户端：Fedora 笔记本 + 手机
- 被反代服务：ComfyUI 0.28.0（监听 127.0.0.1:8188）
- 网络环境：远端局域网（无公网 IP、无路由器权限）↔ 家庭宽带，实测组网与访问正常
- 文中所有命令都在上述环境里实际跑过
