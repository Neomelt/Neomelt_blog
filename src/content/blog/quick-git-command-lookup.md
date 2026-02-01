---
title: 'git命令速查'
description: '速查'
pubDate: '2025-1-31'
pinned: true
heroImage: '../../assets/cover.svg'
category: '知识'
series: ''
tags: ['git', "速查"]
---

## Main Porcelain Commands（主要高层指令）

### 1. `git add`
```bash
git add <file>
git add .
```
> **用途**：将文件内容添加到索引（暂存区）

| 选项 | 说明 |
|------|------|
| `-n, --dry-run` | 不实际添加文件，只显示哪些文件将被添加。 |
| `-v, --verbose` | 详细模式，显示每个添加文件的状态。 |
| `-f, --force` | 允许添加被 .gitignore 忽略的文件。 |
| `-i, --interactive` | 交互式添加，进入交互界面选择要暂存的内容。 |
| `-p, --patch` | 交互式选择补丁（hunks），允许只暂存一个文件中的部分改动。 |
| `-e, --edit` | 在编辑器中打开差异，允许手动编辑暂存内容。 |
| `-u, --update` | 更新已追踪文件的索引，不处理新文件。 |
| `-A, --all, --no-ignore-removal` | 暂存所有改动（新增、修改、删除）。 |
| `--no-all, --ignore-removal` | 暂存新增和修改，但不暂存删除。 |
| `-N, --intent-to-add` | 记下路径，稍后再添加内容（对 git diff 可见但未暂存）。 |
| `--refresh` | 不添加文件，只刷新索引中的统计信息。 |
| `--ignore-errors` | 如果某些文件因为错误无法添加，继续添加其他文件。 |
| `--ignore-missing` | 与 --refresh 配合使用，忽略丢失的文件。 |
| `--no-warn-embedded-repo` | 不警告嵌入式仓库。 |
| `--renormalize` | 对所有追踪文件应用“清洁”过滤。 |
| `--chmod=(+|-)x` | 强制修改被添加文件的可执行权限。 |
| `--pathspec-from-file=<file>` | 从文件中读取路径规范。 |
| `--pathspec-file-nul` | 配合上一个参数，路径规范由 NUL 字符分隔。 |
| `--` | 分隔选项和路径规范，防止文件名与选项冲突。 |

### 2. `git bisect`
```bash
git bisect start
git bisect bad
git bisect good <commit>
```
> **用途**：使用二分查找定位引入 Bug 的提交

| 选项 | 说明 |
|------|------|
| `start [<bad> [<good>...]] [--] [<pathspec>...]` | 启动二分查找。 |
| `bad [<rev>]` | 标记当前（或指定）版本为“坏”。 |
| `good [<rev>...]` | 标记一个或多个版本为“好”。 |
| `new [<rev>] / old [<rev>]` | 用于非 Bug 类（如性能）的查找替代词。 |
| `terms [--term-good <term> --term-bad <term>]` | 设置查找的术语。 |
| `skip [(<rev>|<range>)...]` | 跳过指定的提交（如该提交无法编译）。 |
| `reset [<commit>]` | 退出二分查找并回到指定分支。 |
| `visualize / view` | 查看当前查找范围。 |
| `replay <logfile>` | 从日志文件重放查找过程。 |
| `log` | 显示当前的查找日志。 |
| `run <cmd> <args>...` | 通过运行脚本自动进行二分查找。 |

### 3. `git branch`
```bash
git branch <branch-name>
git branch -d <branch-name>
```
> **用途**：列出、创建或删除分支

| 选项 | 说明 |
|------|------|
| `-a, --all` | 显示本地和远程所有分支。 |
| `-r, --remotes` | 只显示远程追踪分支。 |
| `-v, --verbose` | 显示每个分支的最后一次提交 ID 和注释。 |
| `-vv` | 显示与远程分支的追踪关系和领先/落后数。 |
| `-q, --quiet` | 安静模式。 |
| `--show-current` | 只打印当前分支名称。 |
| `-f, --force` | 强制创建或重命名分支。 |
| `-m, --move` | 重命名分支。 |
| `-M` | 强制重命名。 |
| `-c, --copy` | 拷贝分支。 |
| `-C` | 强制拷贝。 |
| `-d, --delete` | 删除已合并的分支。 |
| `-D` | 强制删除分支（无论是否合并）。 |
| `-l, --list` | 显示分支列表（默认）。 |
| `--create-reflog` | 为新分支创建 reflog。 |
| `--edit-description` | 打开编辑器编辑分支描述。 |
| `--set-upstream-to=<remote/branch>` | 设置本地分支追踪远程分支。 |
| `--unset-upstream` | 移除上游追踪关系。 |
| `--contains [<commit>]` | 列出包含特定提交的分支。 |
| `--no-contains [<commit>]` | 列出不包含特定提交的分支。 |
| `--merged [<commit>]` | 列出已合并到当前分支的分支。 |
| `--no-merged [<commit>]` | 列出尚未合并的分支。 |
| `--sort=<key>` | 按特定字段（如 authordate）排序。 |
| `--points-at <object>` | 列出指向特定对象的分支。 |
| `--format <format>` | 自定义输出格式。 |

### 4. `git checkout`
```bash
git checkout <branch>
git checkout -b <new-branch>
```
> **用途**：切换分支或恢复工作树文件

| 选项 | 说明 |
|------|------|
| `-q, --quiet` | 安静模式，不显示反馈。 |
| `--[no-]progress` | 强制显示进度。 |
| `-b <new_branch>` | 创建并切换到新分支。 |
| `-B <new_branch>` | 创建（或重置）并切换到新分支。 |
| `-l` | 为新分支创建 reflog。 |
| `-d, --detach` | 切换到指向某个提交的状态（分离头指针状态）。 |
| `-t, --track` | 为新分支设置上游（upstream）追踪。 |
| `--guess / --no-guess` | 如果分支名不存在，尝试从远程库匹配。 |
| `--orphan <new_branch>` | 创建一个没有任何历史的新分支。 |
| `-2, --ours` | 在冲突合并中检出“我们的”版本。 |
| `-3, --theirs` | 在冲突合并中检出“他们的”版本。 |
| `-m, --merge` | 切换分支时，尝试合并当前未保存的修改。 |
| `--conflict=<style>` | 指定冲突显示样式（merge 或 diff3）。 |
| `-p, --patch` | 交互式选择部分代码块进行恢复。 |
| `--overlay / --no-overlay` | 指定是否允许检出时删除工作区的文件。 |
| `--pathspec-from-file=<file>` | 从文件中读取路径规范。 |
| `--pathspec-file-nul` | 路径规范由 NUL 字符分隔。 |
| `--ignore-other-worktrees` | 忽略该分支是否在其他工作树中已被检出。 |
| `--recurse-submodules / --no-recurse-submodules` | 递归更新子模块。 |

### 5. `git cherry-pick`
```bash
git cherry-pick <commit>
```
> **用途**：将现有提交引入的更改应用到当前分支

| 选项 | 说明 |
|------|------|
| `<commit>...` | 指定要拣选的提交。 |
| `-e, --edit` | 拣选后允许在编辑器中修改提交信息。 |
| `--cleanup=<mode>` | 设置提交信息的清理方式。 |
| `-x` | 在提交信息末尾追加“cherry picked from commit ...”的说明。 |
| `-r` | (已废弃) 过去用于 -x 的参数。 |
| `-m, --mainline <parent-number>` | 拣选合并提交时，指定父分支编号。 |
| `-n, --no-commit` | 只应用更改到工作区和暂存区，不自动生成提交。 |
| `-s, --signoff` | 在提交信息中添加 Signed-off-by 标签。 |
| `-S[<keyid>], --gpg-sign[=<keyid>]` | 进行 GPG 签名。 |
| `--ff` | 如果当前 HEAD 是拣选提交的父级，则执行快进。 |
| `--allow-empty` | 允许拣选空提交。 |
| `--allow-empty-message` | 允许空提交信息。 |
| `--keep-redundant-commits` | 保留那些不产生改动的提交。 |
| `--strategy=<strategy>` | 选择合并策略（如 recursive, resolve）。 |
| `-X, --strategy-option=<option>` | 向合并策略传递特定选项。 |
| `--rerere-autoupdate / --no-rerere-autoupdate` | 如果可能，自动更新冲突解决记录。 |
| `--abort` | 取消拣选过程。 |
| `--continue` | 解决冲突后继续。 |
| `--skip` | 跳过当前提交，继续拣选序列中的下一个。 |
| `--quit` | 退出当前拣选，保留当前状态但不继续。 |

### 6. `git clean`
```bash
git clean -fd
```
> **用途**：从工作树中删除未追踪的文件

| 选项 | 说明 |
|------|------|
| `-d` | 除了删除文件外，同时删除未追踪的目录。 |
| `-f, --force` | 强制执行（Git 配置通常要求此项，防止误删）。 |
| `-i, --interactive` | 交互式确认每一个删除操作。 |
| `-n, --dry-run` | 显示哪些文件将被删除，但不实际执行。 |
| `-q, --quiet` | 安静模式。 |
| `-e <pattern>, --exclude=<pattern>` | 排除匹配模式的文件。 |
| `-x` | 同时删除被 .gitignore 忽略的文件。 |
| `-X` | 仅删除被忽略的文件，不删除未追踪但未忽略的文件。 |

### 7. `git clone`
```bash
git clone <repository> [directory]
```
> **用途**：将存储库克隆到新目录

| 选项 | 说明 |
|------|------|
| `-l, --local` | 克隆本地路径时，尽可能使用硬链接。 |
| `--no-hardlinks` | 克隆本地路径时强制复制，不使用硬链接。 |
| `-s, --shared` | 克隆本地路径时，不复制对象，而是设置共享（危险：删除原库会破坏此库）。 |
| `--reference [-if-able] <repository>` | 使用本地已有仓库作为参考以加速克隆。 |
| `--dissociate` | 配合 --reference 使用，下载完后切断参考关系。 |
| `-q, --quiet` | 不显示进度报告。 |
| `-v, --verbose` | 详细模式。 |
| `--progress` | 显示进度报告。 |
| `--server-option=<option>` | 向远程服务器发送特定协议选项。 |
| `-n, --no-checkout` | 克隆后不执行检出操作，只下载对象数据库。 |
| `--bare` | 创建一个裸仓库（不带工作目录）。 |
| `--mirror` | 创建镜像仓库（包含所有引用，且设置为远程镜像）。 |
| `-o <name>, --origin <name>` | 指定远程仓库的名称，默认为 origin。 |
| `-b <name>, --branch <name>` | 克隆后自动切换到指定分支。 |
| `-u <upload-pack>, --upload-pack <upload-pack>` | 指定远程使用的 git-upload-pack 路径。 |
| `--template=<directory>` | 指定模板目录。 |
| `-c <key>=<value>, --config <key>=<value>` | 在克隆出的新库中设置配置。 |
| `--depth <depth>` | 浅克隆。只下载最近的指定次数提交。 |
| `--shallow-since=<date>` | 下载指定日期后的提交。 |
| `--shallow-exclude=<revision>` | 排除特定版本后的所有历史。 |
| `--[no-]single-branch` | 只克隆一个分支（默认克隆所有分支）。 |
| `--no-tags` | 不下载远程标签。 |
| `--recurse-submodules[=<pathspec>]` | 递归初始化并克隆所有子模块。 |
| `--[no-]shallow-submodules` | 对子模块也执行浅克隆。 |
| `--[no-]remote-submodules` | 子模块使用远程追踪分支。 |
| `-j <n>, --jobs <n>` | 并行克隆子模块的数量。 |
| `--sparse` | 初始化稀疏检出。 |
| `--filter=<filter-spec>` | 使用部分克隆（Partial Clone）过滤对象。 |
| `--bundle-uri=<uri>` | 从指定的 URI 获取 bundle 加速初始化。 |

### 8. `git commit`
```bash
git commit -m "message"
git commit --amend
```
> **用途**：记录对存储库的更改

| 选项 | 说明 |
|------|------|
| `-a, --all` | 自动暂存所有修改和删除的文件（不包括新文件）。 |
| `-p, --patch` | 交互式选择部分代码块进行提交。 |
| `-C <commit>, --reuse-message=<commit>` | 重用指定提交的信息。 |
| `-c <commit>, --reedit-message=<commit>` | 重用并编辑指定提交的信息。 |
| `--fixup=[(amend|reword):]<commit>` | 创建用于 autosquash 的修复提交。 |
| `--squash=<commit>` | 创建用于 autosquash 的合并提交。 |
| `--reset-author` | 将作者更新为当前用户。 |
| `--short / --branch / --porcelain / --long` | 不同的输出状态格式。 |
| `-z, --null` | 状态输出使用 NUL 分隔符。 |
| `-F <file>, --file=<file>` | 从文件中读取提交信息。 |
| `--author=<author>` | 手动指定作者（"Name <email>" 格式）。 |
| `--date=<date>` | 手动指定提交日期。 |
| `-m <msg>, --message=<msg>` | 直接输入提交信息。 |
| `-t <file>, --template=<file>` | 使用指定文件作为提交信息模板。 |
| `-s, --signoff` | 在末尾添加 Signed-off-by。 |
| `-S[<keyid>], --gpg-sign[=<keyid>]` | 进行 GPG 签名。 |
| `-n, --no-verify` | 跳过 pre-commit 和 commit-msg 钩子。 |
| `--allow-empty` | 允许没有文件变动的提交。 |
| `--allow-empty-message` | 允许空信息提交。 |
| `--cleanup=<mode>` | 设置提交信息清理方式（strip, whitespace, verbatim, default）。 |
| `-e, --edit` | 打开编辑器编辑信息。 |
| `--no-edit` | 不打开编辑器，直接提交。 |
| `--amend` | 覆盖最后一次提交。 |
| `--no-post-rewrite` | 绕过 post-rewrite 钩子。 |
| `-i, --include` | 在提交前将指定文件加入暂存。 |
| `-o, --only` | 仅提交指定文件，忽略其他已暂存的内容。 |
| `--pathspec-from-file=<file>` | 从文件读取路径规范。 |
| `-u[<mode>], --untracked-files[=<mode>]` | 显示未追踪文件的模式（no, normal, all）。 |

### 9. `git diff`
```bash
git diff
git diff --staged
```
> **用途**：显示提交之间、提交与工作树之间等的差异由于参数极多，分为通用对比选项和特定路径选项。 完整参数列表：

| 选项 | 说明 |
|------|------|
| `通用对比选项 (Common Diff Options)` |  |
| `-p, -u, --patch` | 生成补丁（默认模式）。 |
| `-s, --no-patch` | 抑制文本差异输出。 |
| `-u<n>` | 指定差异上下文的行数（默认 3）。 |
| `--raw` | 以原始格式显示差异。 |
| `--indent-heuristic / --no-indent-heuristic` | 启用/禁用启发式算法以使差异更易读。 |
| `--minimal` | 花更多时间寻找最小差异。 |
| `--patience / --histogram` | 使用不同的差异算法。 |
| `--diff-algorithm={patience|minimal|histogram|myers}` | 手动选定算法。 |
| `--stat[=<width>[,<name-width>[,<count>]]]` | 生成文件名和修改行数的统计。 |
| `--numstat` | 类似 stat，但显示数字格式且易于机器解析。 |
| `--shortstat` | 只显示统计摘要（一行）。 |
| `--dirstat[=<param1,param2,...>]` | 显示目录级别的差异分布。 |
| `--summary` | 显示扩展摘要（创建、更名等信息）。 |
| `-z` | 输出使用 NUL 分隔符。 |
| `--name-only` | 只显示修改的文件名。 |
| `--name-status` | 显示文件名及状态（A, M, D 等）。 |
| `--submodule[=<format>]` | 指定子模块差异的显示格式（log, short, diff）。 |
| `--color[=<when>] / --no-color` | 控制终端颜色输出。 |
| `--word-diff[=<mode>]` | 进行单词级别的差异对比。 |
| `-B[<n>][/<m>]` | 断开完全重写的文件对比。 |
| `-M[<n>]` | 检测文件更名。 |
| `-C[<n>]` | 检测文件拷贝。 |
| `--find-copies-harder` | 更努力地寻找拷贝来源。 |
| `-D, --irreversible-delete` | 省略删除文件的原始内容。 |
| `-O<orderfile>` | 按指定文件中的顺序对文件差异进行排序。 |
| `--relative[=<path>]` | 相对于指定路径显示差异。 |
| `-a, --text` | 将所有文件视为文本处理。 |
| `--ignore-cr-at-eol / --ignore-space-at-eol / --ignore-space-change / --ignore-all-space` | 各种忽略空白的选项。 |
| `--ws-error-highlight=<kind>` | 高亮显示空白错误（context, old, new）。 |
| `--ext-diff / --no-ext-diff` | 是否使用外部差异工具。 |
| `特定对比范围` |  |
| `git diff [<options>] [--] [<path>...]` | 对比工作区与索引。 |
| `git diff [<options>] --cached [<commit>] [--] [<path>...]` | 对比暂存区与提交。 |
| `git diff [<options>] <commit> <commit> [--] [<path>...]` | 对比两个提交。 |

### 10. `git fetch`
```bash
git fetch origin
```
> **用途**：从另一个存储库下载对象和引用

| 选项 | 说明 |
|------|------|
| `--all` | 获取所有远程仓库。 |
| `-a, --append` | 将获取的引用追加到现有 FETCH_HEAD 而不是覆盖。 |
| `--atomic` | 使用原子操作更新引用。 |
| `--depth=<depth> / --deepen=<depth>` | 设置或增加浅克隆的深度。 |
| `--shallow-since=<date> / --shallow-exclude=<revision>` | 基于日期或版本限制历史下载。 |
| `--unshallow` | 将浅克隆转换为完整仓库。 |
| `--dry-run` | 显示将执行的操作但不实际更新。 |
| `-f, --force` | 强制更新本地分支引用。 |
| `-k, --keep` | 保留下载的 pack 文件。 |
| `-p, --prune` | 获取后删除远程已不存在的追踪分支。 |
| `-P, --prune-tags` | 同时也清理远程已不存在的标签。 |
| `-n, --no-tags` | 不获取标签。 |
| `-t, --tags` | 获取远程所有标签。 |
| `--recurse-submodules[=yes|on-demand|no]` | 控制子模块的递归获取。 |
| `-j, --jobs=<n>` | 并行下载的作业数。 |
| `--set-upstream` | 设置本地分支的上游。 |
| `--submodule-prefix=<path>` | 为子模块输出添加路径前缀。 |
| `-q, --quiet / -v, --verbose / --progress` | 控制输出详细度。 |
| `-o <option>, --server-option=<option>` | 向服务器传递协议选项。 |
| `--show-forced-updates / --no-show-forced-updates` | 显示强制更新的详细摘要。 |
| `-4, --ipv4 / -6, --ipv6` | 强制使用特定的 IP 协议。 |

### 11. `git gc`
```bash
git gc
```
> **用途**：清除不必要的文件并优化本地存储库

| 选项 | 说明 |
|------|------|
| `--aggressive` | 更深入地压缩，耗时更长。 |
| `--auto` | 检查是否有必要运行 gc，如果有则执行（通常在后台运行）。 |
| `--prune=<date>` | 删除早于指定日期的孤立对象（默认 2 周）。 |
| `--no-prune` | 不删除任何对象。 |
| `-q, --quiet` | 不显示进度。 |
| `--force` | 强制运行，即使有其他 gc 进程正在运行。 |
| `--keep-largest-pack` | 在重打包时保留最大的 pack 文件。 |

### 12. `git grep`
```bash
git grep "pattern"
```
> **用途**：查找匹配模式的行

| 选项 | 说明 |
|------|------|
| `--cached` | 搜索索引中的文件而非工作树。 |
| `--no-index` | 搜索当前目录下未被 Git 管理的文件。 |
| `--untracked` | 同时搜索未追踪的文件。 |
| `--recurse-submodules` | 递归搜索所有子模块。 |
| `-i, --ignore-case` | 忽略大小写。 |
| `-w, --word-regexp` | 匹配完整单词。 |
| `-v, --invert-match` | 显示不匹配的行。 |
| `-h / -H` | 是否在输出中显示文件名。 |
| `-E, --extended-regexp / -G, --basic-regexp / -P, --perl-regexp / -F, --fixed-strings` | 选择正则引擎。 |
| `-n, --line-number` | 显示行号。 |
| `--column` | 显示匹配项在行中的列数。 |
| `-l, --files-with-matches / -L, --files-without-match` | 只显示文件名。 |
| `-z, --null` | 文件名后接 NUL。 |
| `-c, --count` | 显示匹配行数。 |
| `-p, --show-function` | 显示匹配行所属的函数名。 |
| `-W, --function-context` | 显示整个函数的内容。 |
| `-e <pattern>` | 指定匹配模式（支持多个）。 |
| `--and / --or / --not / ( )` | 组合多个匹配模式。 |
| `--threads <num>` | 并行搜索的线程数。 |

### 13. `git init`
```bash
git init [directory]
```
> **用途**：创建或重新初始化 Git 仓库

| 选项 | 说明 |
|------|------|
| `--bare` | 创建裸仓库（无工作树）。 |
| `--template=<dir>` | 指定模板目录。 |
| `--separate-git-dir=<git-dir>` | 将 .git 目录存放在别处并建立链接。 |
| `--initial-branch=<name>, -b <name>` | 指定初始分支名。 |
| `--shared[=<permissions>]` | 设置仓库共享权限（group, all, 或者八进制数）。 |
| `-q, --quiet` | 安静模式。 |

### 14. `git log`
```bash
git log
git log --oneline --graph
```
> **用途**：显示提交日志继承了 git diff 的大部分对比参数，并增加了日志特有参数。 完整参数列表：

| 选项 | 说明 |
|------|------|
| `-n <number>` | 限制输出的提交数量。 |
| `--follow` | 继续列出重命名之前的文件历史（仅限单个路径）。 |
| `--decorate[=short|full|auto|no]` | 是否显示分支、标签等名称。 |
| `--source` | 显示每个提交是从哪个分支引用的。 |
| `--[no-]mailmap` | 是否使用 mailmap 文件映射作者名/邮箱。 |
| `--full-diff` | 即使限制了路径，也显示整个提交的 diff。 |
| `-L <start>,<end>:<file>` | 显示文件特定行范围的历史。 |
| `筛选参数` |  |
| `--since, --after=<date> / --until, --before=<date>` | 时间过滤。 |
| `--author=<pattern> / --committer=<pattern>` | 按作者/提交者过滤。 |
| `--grep=<pattern>` | 按提交信息关键词过滤。 |
| `--all-match` | 多个 grep/author 必须同时满足。 |
| `--invert-grep` | 显示不匹配 grep 的提交。 |
| `--merges / --no-merges` | 只显示/不显示合并提交。 |
| `--first-parent` | 只跟随第一个父提交。 |
| `范围与引用参数` |  |
| `--all` | 显示所有引用的历史。 |
| `--branches[=<pattern>] / --tags / --remotes` | 显示分支/标签/远程引用。 |
| `--reflog` | 显示 reflog 记录。 |
| `--bisect` | 显示二分查找期间的日志。 |
| `输出格式` |  |
| `--oneline` | 一行显示一个提交。 |
| `--graph` | 显示字符图形化的分支演变图。 |
| `--pretty=<format>, --format=<format>` | 自定义输出格式。 |
| `--abbrev-commit` | 使用缩写的哈希值。 |

### 15. `git merge`
```bash
git merge <branch>
```
> **用途**：合并两个或多个开发历史

| 选项 | 说明 |
|------|------|
| `--stat, -n, --no-stat` | 显示/不显示合并后的差异统计。 |
| `--summary, --no-summary` | (已过时) 等同于 --stat。 |
| `--log[=<n>], --no-log` | 在合并提交信息中包含来自被合并分支的短日志。 |
| `--squash, --no-squash` | 将所有合并的更改压缩为一个新的提交，不保留分支历史。 |
| `--ff, --no-ff, --ff-only` | 指定合并策略（快进、强制生成合并节点、仅允许快进）。 |
| `--verify-signatures, --no-verify-signatures` | 验证被合并提交的 GPG 签名。 |
| `-s <strategy>, --strategy=<strategy>` | 指定合并策略（recursive, resolve, octopus, ours, subtree）。 |
| `-X <option>, --strategy-option=<option>` | 向合并策略传递特定选项。 |
| `-m <message>` | 设置合并提交的信息。 |
| `-F <file>, --file=<file>` | 从文件读取提交信息。 |
| `--edit, -e, --no-edit` | 是否在提交前打开编辑器修改信息。 |
| `--cleanup=<mode>` | 提交信息清理模式。 |
| `--rerere-autoupdate, --no-rerere-autoupdate` | 自动将冲突解决结果记录到索引。 |
| `--abort` | 发生冲突时放弃合并，恢复到合并前状态。 |
| `--quit` | 退出合并过程，保留当前状态但不完成合并。 |
| `--continue` | 解决冲突后继续合并过程。 |
| `--allow-unrelated-histories` | 允许合并两个没有共同祖先的项目。 |
| `-S[<keyid>], --gpg-sign[=<keyid>]` | 使用 GPG 签名合并提交。 |
| `--overwrite-ignore, --no-overwrite-ignore` | 允许/禁止覆盖被忽略的文件。 |
| `-q, --quiet` | 安静模式。 |
| `-v, --verbose` | 详细模式。 |
| `--progress, --no-progress` | 强制显示/不显示进度。 |
| `--autostash, --no-autostash` | 合并前自动 stash 未保存的修改，完成后 pop。 |
| `--into-name <branch>` | 指定合并的目标名称（用于自定义脚本）。 |

### 16. `git mv`
```bash
git mv <source> <destination>
```
> **用途**：移动或重命名文件、目录或符号链接

| 选项 | 说明 |
|------|------|
| `-v, --verbose` | 详细模式，显示移动操作。 |
| `-n, --dry-run` | 仅显示将要执行的操作，不实际移动。 |
| `-f, --force` | 即使目标文件已存在也强制移动。 |
| `-k` | 跳过移动或重命名过程中产生的错误。 |

### 17. `git pull`
```bash
git pull origin <branch>
```
> **用途**：获取并集成远程或其他分支的更改

| 选项 | 说明 |
|------|------|
| `-q, --quiet, -v, --verbose` | 控制输出。 |
| `--recurse-submodules[=yes|on-demand|no]` | 递归获取子模块。 |
| `--commit, --no-commit` | 拉取后是否自动提交合并结果。 |
| `--edit, -e, --no-edit` | 是否编辑合并信息。 |
| `--cleanup=<mode>` | 信息清理模式。 |
| `--ff, --no-ff, --ff-only` | 合并选项。 |
| `--log[=<n>], --no-log` | 包含短日志。 |
| `--stat, -n, --no-stat` | 显示统计。 |
| `--squash, --no-squash` | 压缩合并。 |
| `-s <strategy>, --strategy=<strategy>` | 合并策略。 |
| `-X <option>, --strategy-option=<option>` | 策略选项。 |
| `--verify-signatures, --no-verify-signatures` | GPG 验证。 |
| `--summary, --no-summary` | 统计摘要。 |
| `--autostash, --no-autostash` | 自动暂存。 |
| `--allow-unrelated-histories` | 允许无关历史合并。 |
| `-r, --rebase[=false|true|merges|interactive]` | 核心参数，指定使用 rebase 而不是 merge。 |
| `--no-rebase` | 禁用 rebase。 |
| `--all` | 获取所有远程。 |
| `-p, --prune` | 清理失效分支。 |
| `-t, --tags` | 获取标签。 |
| `--dry-run` | 演习。 |
| `-f, --force` | 强制拉取。 |
| `-k, --keep` | 保留 pack 文件。 |
| `--depth=<depth>, --unshallow, --update-shallow` | 浅克隆相关选项。 |
| `--refmap=<refspec>` | 指定引用的映射关系。 |
| `-o <option>, --server-option=<option>` | 传递服务器协议选项。 |
| `--show-forced-updates, --no-show-forced-updates` | 显示强制更新。 |

### 18. `git push`
```bash
git push origin <branch>
```
> **用途**：更新远程引用及相关对象

| 选项 | 说明 |
|------|------|
| `--all, --branches` | 推送所有分支。 |
| `--prune` | 删除远程已不存在的本地分支。 |
| `--mirror` | 镜像推送（所有引用）。 |
| `-n, --dry-run` | 模拟推送。 |
| `--porcelain` | 机器可读输出。 |
| `-d, --delete` | 删除远程引用。 |
| `--tags` | 推送所有标签。 |
| `--follow-tags` | 推送带注解的标签且该标签指向被推送的提交。 |
| `--[no-]signed, --signed=(true|false|if-ask)` | 使用 GPG 签名推送操作。 |
| `--[no-]atomic` | 原子推送。 |
| `-o <option>, --server-option=<option>` | 服务器选项。 |
| `--receive-pack=<path>, --exec=<path>` | 指定远程接收程序的路径。 |
| `--[no-]force-with-lease[=<refname>[:<expect>]]` | 安全强推。 |
| `-f, --force` | 强制推送。 |
| `--force-if-includes` | 如果包含远程更新则允许强推。 |
| `--[no-]push-option=<option>` | 传递推送选项。 |
| `--[no-]recurse-submodules=(check|on-demand|only|no)` | 子模块推送行为。 |
| `--[no-]verify` | 跳过 pre-push 钩子。 |
| `-t, --thin` | 使用瘦包传输（减少带宽）。 |
| `-q, --quiet, -v, --verbose` | 输出控制。 |
| `--progress` | 显示进度。 |
| `-u, --set-upstream` | 建立追踪关系。 |

### 19. `git rebase`
```bash
git rebase <branch>
git rebase -i HEAD~3
```
> **用途**：在另一个基端之上重新应用提交

| 选项 | 说明 |
|------|------|
| `--onto <newbase>` | 指定新的基准点。 |
| `--keep-base` | 保持基准点（通常用于本地重排）。 |
| `--continue` | 解决冲突后继续 rebase。 |
| `--abort` | 取消 rebase 并恢复到初始状态。 |
| `--quit` | 退出 rebase 但保留当前状态。 |
| `--apply, --no-apply` | 使用 git apply 模式（旧模式）。 |
| `--merge, --no-merge` | 使用合并后端（默认模式）。 |
| `--empty=(drop|keep|ask)` | 处理空提交的行为。 |
| `-m, --merge` | 同上。 |
| `-X <option>, --strategy-option=<option>` | 合并策略选项。 |
| `-s <strategy>, --strategy=<strategy>` | 合并策略。 |
| `--[no-]rerere-autoupdate` | 自动冲突解决。 |
| `-q, --quiet, -v, --verbose` | 输出详细度。 |
| `--stat, -n` | 显示统计。 |
| `--no-stat` | 不显示统计。 |
| `--committer-date-is-author-date, --ignore-date` | 修改提交时间。 |
| `--reset-author-date` | 重置作者时间。 |
| `--signoff` | 添加签名行。 |
| `-r, --rebase-merges[=(rebase-cousins|no-rebase-cousins)]` | 保留合并结构进行 rebase。 |
| `-x <cmd>, --exec <cmd>` | 在每个提交应用后执行命令（常用于测试）。 |
| `--root` | 对根提交进行 rebase。 |
| `--autosquash, --no-autosquash` | 配合 fixup! 信息自动压缩。 |
| `--autostash, --no-autostash` | 自动暂存。 |
| `--[no-]reschedule-failed-exec` | 如果 exec 失败，重新安排 rebase。 |
| `--fork-point, --no-fork-point` | 自动寻找派生点。 |
| `-i, --interactive` | 交互式模式，允许 pick, squash, edit, drop 等。 |

### 20. `git reset`
```bash
git reset --soft HEAD~1
git reset --hard HEAD
```
> **用途**：重置当前 HEAD 到指定状态

| 选项 | 说明 |
|------|------|
| `-q, --quiet` | 安静模式，仅报告错误。 |
| `--pathspec-from-file=<file>` | 从文件中读取路径规范。 |
| `--pathspec-file-nul` | 路径规范以 NUL 分隔。 |
| `模式选项` |  |
| `--soft` | 重置 HEAD，保留索引和工作区。 |
| `--mixed` | (默认) 重置 HEAD 和索引，保留工作区。 |
| `--hard` | 重置 HEAD、索引和工作区（危险：丢弃所有未提交修改）。 |
| `--merge` | 重置 HEAD 和索引，尝试保留工作区中未受冲突影响的修改。 |
| `--keep` | 重置 HEAD 和索引，如果工作区有本地修改则中止重置。 |
| `--[no-]recurse-submodules` | 控制是否递归重置子模块。 |
| `--` | 分隔选项和路径，用于重置特定文件而不移动 HEAD。 |

### 21. `git restore`
```bash
git restore <file>
git restore --staged <file>
```
> **用途**：还原工作树文件

| 选项 | 说明 |
|------|------|
| `-s <tree>, --source=<tree>` | 指定恢复源（默认为索引或 HEAD）。 |
| `-p, --patch` | 交互式选择要还原的代码块。 |
| `-W, --worktree` | (默认) 还原工作树文件。 |
| `-S, --staged` | 还原暂存区（索引）文件。 |
| `-q, --quiet` | 安静模式。 |
| `--progress, --no-progress` | 强制显示进度。 |
| `--ignore-unmerged` | 还原时忽略未合并的条目。 |
| `--overlay, --no-overlay` | 指定是否允许删除不在源中的文件。 |
| `--recurse-submodules, --no-recurse-submodules` | 递归恢复子模块。 |
| `--conflict=<style>` | 指定冲突显示样式（merge, diff3）。 |
| `--ignore-skip-worktree-bits` | 在稀疏检出模式下忽略 skip-worktree 位。 |
| `--pathspec-from-file=<file>` | 从文件读取路径。 |

### 22. `git revert`
```bash
git revert <commit>
```
> **用途**：通过创建一个新的提交来撤销现有的提交

| 选项 | 说明 |
|------|------|
| `<commit>...` | 指定要撤销的提交。 |
| `-e, --edit` | 创建提交前打开编辑器。 |
| `-m <parent-number>, --mainline <parent-number>` | 撤销合并提交时指定父分支。 |
| `-n, --no-commit` | 只修改工作区和索引，不自动创建提交。 |
| `-s, --signoff` | 添加 Signed-off-by。 |
| `-S[<keyid>], --gpg-sign[=<keyid>]` | GPG 签名。 |
| `--strategy=<strategy>` | 指定合并策略。 |
| `-X, --strategy-option=<option>` | 策略选项。 |
| `--cleanup=<mode>` | 信息清理模式。 |
| `--reference` | (已废弃) 过去用于记录来源。 |
| `--abort, --quit, --continue, --skip` | 流程控制。 |

### 23. `git rm`
```bash
git rm <file>
```
> **用途**：从工作树和索引中删除文件

| 选项 | 说明 |
|------|------|
| `-f, --force` | 强制删除（即使文件有修改）。 |
| `-n, --dry-run` | 演习模式。 |
| `-r` | 递归删除目录。 |
| `--cached` | 只从索引中删除，保留工作树中的物理文件。 |
| `--ignore-unmatch` | 即使没有匹配的文件也以 0 退出（不报错）。 |
| `-q, --quiet` | 安静模式。 |
| `--pathspec-from-file=<file> / --pathspec-file-nul` | 批量路径处理。 |

### 24. `git show`
```bash
git show <commit>
```
> **用途**：显示各种类型的对象（提交、标签、树等）

| 选项 | 说明 |
|------|------|
| `--[no-]patch` | 显示/不显示补丁。 |
| `-s, --no-patch` | 抑制文本差异。 |
| `--stat / --numstat / --shortstat` | 统计信息。 |
| `--format=<format> / --pretty=<format>` | 输出格式。 |
| `--abbrev-commit` | 缩写哈希。 |
| `--[no-]notes[=<ref>]` | 显示备注。 |
| `--show-signature` | 验证 GPG 签名。 |
| `集成 git diff 所有参数` | 如 --color, --word-diff 等。 |

### 25. `git stash`
```bash
git stash
git stash pop
```
> **用途**：暂存脏工作目录中的更改

| 选项 | 说明 |
|------|------|
| `list` | 列出所有暂存记录。 |
| `show [<stash>]` | 查看某个暂存的具体改动。 |
| `drop [-q|--quiet] [<stash>]` | 删除某个暂存记录。 |
| `pop [--index] [-q|--quiet] [<stash>]` | 恢复暂存并删除记录。 |
| `apply [--index] [-q|--quiet] [<stash>]` | 恢复暂存但不删除记录。 |
| `branch <branchname> [<stash>]` | 从暂存记录创建新分支。 |
| `push` | 推入暂存区。 |
| `-p, --patch` | 交互式选择。 |
| `-k, --[no-]keep-index` | 暂存后保留索引中的内容。 |
| `-u, --include-untracked` | 包含未追踪文件。 |
| `-a, --all` | 包含所有文件（含忽略文件）。 |
| `-m <message>` | 添加备注。 |
| `--pathspec-from-file=<file>` | 路径过滤。 |
| `clear` | 清除所有暂存记录。 |
| `create / store` | (底层) 手动创建和存储 stash 对象。 |

### 26. `git status`
```bash
git status
```
> **用途**：显示工作树状态

| 选项 | 说明 |
|------|------|
| `-v, --verbose` | 显示具体改动的 diff。 |
| `-s, --short` | 短格式输出。 |
| `-b, --branch` | 显示当前分支和追踪信息。 |
| `--show-stash` | 显示 stash 的数量。 |
| `--porcelain[=<version>]` | 机器可读的输出格式。 |
| `--long` | 长格式输出（默认）。 |
| `-u[<mode>], --untracked-files[=<mode>]` | 未追踪文件显示模式（no, normal, all）。 |
| `--ignore-submodules[=<when>]` | 忽略子模块变动（none, untracked, dirty, all）。 |
| `--ignored[=<mode>]` | 显示被忽略的文件（no, traditional, matching）。 |
| `-z` | 使用 NUL 终止符。 |
| `--no-ahead-behind` | 不计算领先/落后数量。 |
| `--renormalize` | 显示重归一化后的状态。 |

### 27. `git submodule`
```bash
git submodule add <repository>
git submodule update --init
```
> **用途**：初始化、更新或检查子模块

| 选项 | 说明 |
|------|------|
| `add [-b <branch>] [--name <name>] <repository> [<path>]` | 添加子模块。 |
| `status [--cached] [--recursive]` | 显示子模块状态。 |
| `init [<path>...]` | 初始化子模块配置。 |
| `deinit [-f|--force] [<path>...]` | 注销子模块。 |
| `update [--init] [--remote] [-f] [--rebase|--merge] [--recursive]` | 更新子模块到指定提交。 |
| `set-branch (-b|--branch) <branch> [<path>]` | 设置子模块追踪的分支。 |
| `set-url [<path>] <newurl>` | 修改子模块仓库地址。 |
| `summary [--cached] [--for-status] [<commit>] [<path>...]` | 显示子模块变更摘要。 |
| `foreach [--recursive] <command>` | 在每个子模块执行 shell 指令。 |
| `sync [--recursive] [<path>...]` | 同步子模块的 URL 配置。 |
| `absorbgitdirs` | 将子模块的 .git 目录吸收到主仓库。 |

### 28. `git switch`
```bash
git switch <branch>
git switch -c <new-branch>
```
> **用途**：切换分支

| 选项 | 说明 |
|------|------|
| `-c <new_branch>, --create <new_branch>` | 创建并切换。 |
| `-C <new_branch>, --force-create <new_branch>` | 强制创建并切换。 |
| `-d, --detach` | 切换到游离 HEAD。 |
| `-t, --track / --no-track` | 设置上游关系。 |
| `--guess / --no-guess` | 自动推测远程分支名。 |
| `-f, --force` | 丢弃本地修改并切换。 |
| `-m, --merge` | 切换时合并修改。 |
| `-q, --quiet` | 安静模式。 |
| `--progress` | 显示进度。 |
| `--recurse-submodules / --no-recurse-submodules` | 递归处理子模块。 |

### 29. `git tag`
```bash
git tag <tag-name>
git tag -a <tag-name> -m "message"
```
> **用途**：创建、列出、删除或验证标签

| 选项 | 说明 |
|------|------|
| `-a, --annotate` | 创建带注解的标签（推荐）。 |
| `-m <msg>, -F <file>` | 指定标签信息。 |
| `-s, --sign` | 使用 GPG 签名标签。 |
| `-u <keyid>` | 指定签名使用的私钥。 |
| `-f, --force` | 强制重置已存在的标签。 |
| `-d, --delete` | 删除标签。 |
| `-v, --verify` | 验证 GPG 签名。 |
| `-l, --list` | 列出标签。 |
| `-n[<num>]` | 列出标签及对应的消息行数。 |
| `--contains [<commit>] / --no-contains` | 筛选包含/不包含某提交的标签。 |
| `--points-at <object>` | 指向特定对象的标签。 |
| `--merged [<commit>] / --no-merged` | 合并筛选。 |
| `--sort=<key>` | 排序。 |
| `--format=<format>` | 自定义输出。 |

### 30. `git config`
```bash
git config --global user.name "name"
git config --global user.email "email"
```
> **用途**：获取和设置仓库或全局选项

| 选项 | 说明 |
|------|------|
| `文件位置选项` |  |
| `--global` | 读写全局配置文件（~/.gitconfig）。 |
| `--system` | 读写系统级配置文件（/etc/gitconfig）。 |
| `--local` | (默认) 读写当前仓库配置文件（.git/config）。 |
| `--worktree` | 读写当前工作树的配置文件（用于多工作树）。 |
| `-f <file>, --file <file>` | 指定任意配置文件。 |
| `--blob <blob>` | 从指定的 Git blob 对象中读取配置。 |
| `操作动作` |  |
| `--get` | 获取给定键的值。 |
| `--get-all` | 获取键的所有值（用于多值键）。 |
| `--get-regexp` | 获取匹配正则的键及其值。 |
| `--get-urlmatch <name> <url>` | 获取最匹配指定 URL 的配置（如 http 代理）。 |
| `--replace-all` | 替换匹配模式的所有行。 |
| `--add` | 添加新行而不替换。 |
| `--unset` | 删除匹配的行。 |
| `--unset-all` | 删除匹配的所有行。 |
| `--rename-section` | 重构配置段。 |
| `--remove-section` | 删除整个配置段。 |
| `-l, --list` | 列出所有配置及其来源。 |
| `-e, --edit` | 打开编辑器修改。 |
| `--get-color <name> [<default>]` | 获取配置的颜色。 |
| `--get-colorbool <name> [<stdout-is-tty>]` | 获取是否应使用颜色。 |
| `值类型约束` |  |
| `--type <type>` | 强制转换类型（bool, int, bool-or-int, path, expiry-date）。 |
| `--bool, --int, --bool-or-int, --path, --expiry-date` | (过时，建议用 --type)。 |
| `输出控制` |  |
| `-z, --null` | 输出以 NUL 字符结束。 |
| `--name-only` | 仅输出键名。 |
| `--show-origin` | 显示配置的来源文件。 |
| `--show-scope` | 显示配置的作用域（local, global, system, command）。 |
| `--fixed-value` | 将值模式视为字面量字符串而非正则。 |
| `--default <value>` | 如果没有匹配项，输出默认值。 |
| `--includes / --no-includes` | 查找时是否遵循 include 指令。 |

### 31. `git reflog`
```bash
git reflog
```
> **用途**：管理引用日志（记录 HEAD 的每一次移动）

| 选项 | 说明 |
|------|------|
| `show [<ref>]` | 显示指定引用的日志。 |
| `expire` | 清理过期的日志条目。 |
| `--expire=<time>` | 设置过期时间（默认 90 天）。 |
| `--expire-unreachable=<time>` | 设置不可达条目的过期时间（默认 30 天）。 |
| `--all` | 对所有引用执行。 |
| `--rewrite` | 重写。 |
| `--updateref` | 更新引用。 |
| `--stale-fix` | 修复旧的引用记录。 |
| `delete <ref>@ {<specifier>}` | 删除特定条目。 |
| `exists <ref>` | 检查引用日志是否存在。 |

### 32. `git remote`
```bash
git remote add origin <url>
git remote -v
```
> **用途**：管理追踪的远程仓库

| 选项 | 说明 |
|------|------|
| `set-head <name> (-a | -d | <branch>)` | 设置远程默认分支。 |
| `set-branches [--add] <name> <branch>...` | 设置追踪的分支列表。 |
| `show [-n] <name>...` | 查看远程详情。 |
| `prune [-n | --dry-run] <name>...` | 清理陈旧分支。 |
| `update [-p | --prune] [<group> | <remote>]...` | 批量获取更新。 |

### 33. `git blame`
```bash
git blame
```
> **用途**：显示文件的每一行最后是谁修改的参数非常详尽，用于深度回溯。 完整参数列表：

| 选项 | 说明 |
|------|------|
| `-b` | 对边界提交显示空白的 SHA-1。 |
| `--root` | 不把根提交视为边界。 |
| `--show-stats` | 在输出结束时显示统计信息。 |
| `-L <start>,<end>` | 只追踪指定范围的行（支持行号、正则、偏移量）。 |
| `-l` | 显示长哈希值（默认缩写）。 |
| `-t` | 显示原始时间戳。 |
| `-S <revs-file>` | 使用来自文件的修订版本。 |
| `--reverse` | 反向追溯（查看某行在未来哪个提交被修改/删除）。 |
| `-p, --porcelain` | 输出专门为机器解析设计的格式。 |
| `--line-porcelain` | 在 porcelain 格式基础上增加每行内容。 |
| `--incremental` | 增量输出结果。 |
| `-c` | 使用 git annotate 风格。 |
| `--score-debug` | 显示文件内移动/复制的调试分数。 |
| `-f, --show-name` | 显示原始提交中的文件名。 |
| `-n, --show-number` | 显示原始提交中的行号。 |
| `-s` | 抑制作者姓名和时间戳的显示。 |
| `-e, --show-email` | 显示作者邮箱。 |
| `-w` | 忽略空白字符的变化。 |
| `--[no-]abbrev[=<n>]` | 指定哈希缩写长度。 |
| `--indent-heuristic` | 使用缩进启发式算法。 |
| `--color-lines` | 对行注释进行着色。 |
| `--color-by-age` | 按代码年龄着色。 |
| `--minimal` | 花更多时间寻找最小改动。 |
| `-M[<num>]` | 检测文件内的移动。 |
| `-C[<num>]` | 检测从其他文件移动或复制而来的行。 |
| `-h` | 显示简要帮助。 |

---

## 附录：Git 高级概念

### 用户接口定义 (User-facing Interfaces)
- **gitattributes**：定义了针对特定路径的属性（如换行符处理、合并策略、差异过滤）
- **gitignore**：匹配规则：/ 前缀表示根目录，* 通配符，! 取反
- **githooks**：关键钩子包括 pre-commit, commit-msg, post-merge, pre-push, update, post-receive
- **gitrevisions**：参数解析顺序、路径规范（Pathspec）语法、修订版本选择语法

### 开发者协议与格式 (Developer-facing)
- **format-bundle**：.bundle 文件格式定义
- **format-index**：Git 索引文件格式
- **format-pack**：打包文件（.pack/.idx）格式
- **protocol-v2**：Git 有线传输协议版本 2（高性能传输协议）

### 外部命令 (External Commands)
这些是你系统中安装的、以 `git-` 开头的非 Git 原生工具，Git 允许直接调用：
- **bloom-***：Open Robotics 提供的机器人软件发布工具（常用于 ROS 2 仓库管理）
- **clang-format**：代码格式化工具，你可以通过 `git clang-format` 对暂存区代码进行自动格式化

---

## 推荐的高阶组合

这份全集涵盖了从最基础的 add 到最底层的 write-tree，以及与 CVS/SVN 交互的所有工具。建议重点掌握以下"高阶组合"：

- **调试神器**：`git bisect run`（自动化找 Bug）
- **清理神器**：`git clean -fd`（移除构建生成的杂质）
- **协作神器**：`git rebase -i`（整理提交记录，让你的 GitHub 仓库看起来非常专业）
- **底层操作**：`git rev-parse --show-toplevel`（在脚本中自动定位工程根目录）
