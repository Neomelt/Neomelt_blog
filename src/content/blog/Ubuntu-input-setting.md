---
title: 'Ubuntu系统雾凇输入法配置'
description: '记录下Ubuntu配置雾凇输入法的过程'
pubDate: '2026-02-18'
pinned: false
heroImage: '../../assets/cover.svg'
category: ''
series: ''
tags: ['输入法', 'Ubuntu']
---

## 前言

Linux 下的中文输入法一直是个痛点。默认的 IBus 常常“不够聪明”，而 Rime（中州韵）虽然强大，但默认配置过于简陋，劝退了不少人。

我由于最近买了新电脑，没有配置雾凇所以就一直捏着鼻子使用默认的输入法，但是今天晚上写随笔的时候实在是忍无可忍了，垃圾的词库导致我将很多时间都浪费在找候选词上，所以折腾了一会就换成了一套颜值在线、词库强大、极客感十足的终极方案：Fcitx5 框架 + 雾淞拼音 (Rime-Ice)。

这套方案的优点：

- Fcitx5：轻量、现代，对 Wayland 支持更好。

- 雾淞拼音：长期维护的简体词库，开箱即用，自带日期、拆字、Emoji 等功能。

- 完全离线：隐私安全，没有广告。

## 第一步：卸载旧爱，安装新欢

Ubuntu/Debian 默认通常是 IBus，我们需要先安装 Fcitx5 及其 Rime 引擎。

**注意**：一定要安装 librime-plugin-lua，否则雾淞拼音的“日期/时间”等高级功能无法使用。

```bash
sudo apt update
sudo apt install fcitx5 fcitx5-rime librime-plugin-lua fcitx5-config-qt
```

安装完成后，通过 im-config 切换输入法框架：

``` bash
im-config -n fcitx5
```

> ⚠️ 踩坑点 1：执行完这一步必须重启电脑（或注销），否则系统还在运行 IBus，Fcitx5 无法接管键盘。

## 第二步：部署雾淞拼音 (Rime-Ice)

Rime 的灵魂在于“配置方案”。我们要把默认的“朙月拼音”换成“雾淞拼音”。

推荐使用 git 部署，这样以后更新词库只需要 git pull，非常方便。

``` bash
# 1. 创建 Fcitx5 的 Rime 目录（如果没有）
mkdir -p ~/.local/share/fcitx5/rime

# 2. 进入目录
cd ~/.local/share/fcitx5/rime

# 3. 克隆仓库（--depth 1 减少下载体积）
git clone --depth 1 https://github.com/iDvel/rime-ice.git .
```

## 第三步：关键配置 (Shift 切换 & 激活方案)

这一步是为了符合 Windows/Mac 的使用习惯：按 Shift 键切换中/英文。

在 ~/.local/share/fcitx5/rime 目录下新建（或编辑）default.custom.yaml

``` bash
sudo nano ~/.local/share/fcitx5/rime/default.custom.yaml
## 如果没有这个文件需要自行创建 
```

``` yaml
patch:
  # 1. 只有这一行，Rime 才会真正使用雾淞拼音
  schema_list:
    - schema: rime_ice

  # 2. 覆盖快捷键设置
  "ascii_composer/switch_key":
    Shift_L: commit_code  # 左 Shift：上屏并切换中英
    Shift_R: noop         # 右 Shift：无操作（防止误触）
    Control_L: noop       # 屏蔽 Ctrl 切换，避免与系统快捷键冲突
    Control_R: noop
```
## 第四步：告别“黑白框” (美化)

默认的 Fcitx5 皮肤非常原始（只有黑白文字）。我们可以安装 Material 风格的主题。

```Bash
sudo apt install fcitx5-material-color
```

安装后，打开 Fcitx 5 配置 (Fcitx5 Configuration)：

进入 配置附加组件 (Addons)。

找到 经典用户界面 (Classic UI) -> 点击配置。

主题 (Theme) 选择 Material-Color-Teal 或 Material-Color-Blue。

建议把 字体 (Font) 调大一点（例如 14 或 16）。


## 第五步：踩坑记录 (无法开机自启)
这是我在 Ubuntu (Gnome) 上遇到的最大问题：重启后 Fcitx5 不会自动运行，按快捷键也没反应。

解决方法：强制添加开机自启。

打开终端，直接写入一个自启文件：

```Bash
mkdir -p ~/.config/autostart
cat <<EOF > ~/.config/autostart/fcitx5.desktop
[Desktop Entry]
Type=Application
Exec=/usr/bin/fcitx5 -d
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Name=Fcitx5
Comment=Start Fcitx5 Input Method
EOF
```

> 踩坑点 2：命令里的 -d 参数很重要，它代表后台守护进程运行。如果不加，可能启动失败。

## 常用技巧速查

部署完后，体验简直起飞。这里记录几个开发者常用的功能：

1. 快速输入日期/时间（写 Log 神器）：

输入 rq -> 2026-02-18

输入 sj -> 21:30:00

2. 特殊符号：

输入 v 然后按 1~9，可以快速找箭头、数学符号、序号等。

或者用 / 开头，例如 /xl (希腊字母)。

3. 拆字模式（遇到不认识的字）：

按 u + U 进入拆字。例如输入 uu + huo huo huo -> 焱。

4. Emoji：

直接输拼音：haha -> 😂，xixi -> 🦏。
