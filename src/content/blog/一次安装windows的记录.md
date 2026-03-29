---
title: "一次安装windows的记录"
description: ""
pubDate: "2026-03-29T22:10:00+08:00"
pinned: false
hidden: false
heroImage: "../../assets/cover.svg"
category: "小妙招"
series: ""
tags: ["记录", "Windows"]
---

# 前言

由于必须要去做office相关的工作，而linux对其的支持有极差，正好博主的游戏本坏了，也没打算再修，所以干脆把990pro拆下来装到tb上用来做Windows的载体。

# 镜像

由于博主是linux系统，不太好做系统盘，所以让朋友帮忙做了一个win11专业工作站版的镜像

如果不懂镜像怎么做的朋友可以找其他资料自行制作

# 安装

这一步没什么好说的，就是点点点

# 驱动安装

由于新装的系统是没有任何驱动的，所以需要去用usb有线联网更新Windows去自动补全驱动

# windows的激活

> 一个刷到的邪修：

在Windows的cmd(管理员)里依次输入下面三行命令即可激活Windows专业工作站版本：

``` cmd
slmgr /ipk NRG8B-VKK3Q-CXVCJ-9G2XF-6Q84J
slmgr /skms kms.03k.org
slmgr /ato
```
专业版密钥可以看另一个视频：

@[video](https://www.bilibili.com/video/BV1tUXXYvE4L)
