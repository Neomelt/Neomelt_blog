---
title: "用llm自动推送arxiv论文"
description: "借助开源工具和llm模型，实现每天自动获取并推送arxiv论文到Zotero"
pubDate: "2025-08-24"
heroImage: '../../../assets/cover.svg'
mood: '😁 平静且茫然'
weather: '☀️ 晴朗'
location: '家里'
tags: ['学习', 'llm']
---

今天采用了开源工具和llm模型，实现每天自动获取并推送arxiv论文到Zotero的功能。通过这个自动化的流程，我可以更高效地管理和阅读最新的研究论文。
但是配置的过程出了点小问题，由于我采用的是deepseek官方的api,而不是像REDEME上的siliconflow的api,导致在test_workflow的时候一直报错。下面是总结：

### 1. 解决了与 LLM (DeepSeek) 的连接问题

- **问题表现：** 脚本在尝试调用大模型时崩溃，日志显示 `openai.APIConnectionError: Connection error` 和 `[Errno -2] Name or service not known`。
    
- **修改的地方：**
    
    1. **`OPENAI_API_BASE`**：需要将这个 secret 的值从一个无效的地址修改为了 DeepSeek 正确的官方 API 地址：`https://api.deepseek.com/v1`。
        
    2. **`MODEL_NAME`**：我刚开始写了像什么deepseek-ai/deepseek-v3/v3.1，正确的应该是将模型名称从 `deepseek-v3.1` 修正为了 API 支持的正确标识符，例如 `deepseek-chat`，`deepseek-reasoner`。
        

### 2. 解决了发送邮件 (SMTP) 的连接问题

- **问题表现：** 在论文处理和总结都成功完成后，脚本在最后发送邮件的步骤崩溃，日志显示了和第一个问题完全相同的错误：`socket.gaierror: [Errno -2] Name or service not known`。
    
- **修改的地方：**

    1. **`SMTP_SERVER`**：我将这个 secret 的值写为一个自己的qq值，应修改为邮箱服务商提供的正确服务器地址（例如 `smtp.qq.com` 或 `smtp.gmail.com` 等）。这里由于我采用的是QQ邮箱，所以应该写成**smtp.qq.com**。

**还有一个小问题**

在本地的zotero里至少要有一篇论文，否则就会报下面的错：

``` bash
Traceback (most recent call last):
  File "/home/runner/work/zotero-arxiv-daily/zotero-arxiv-daily/main.py", line 172, in <module>
    papers = rerank_paper(papers, corpus)
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/runner/work/zotero-arxiv-daily/zotero-arxiv-daily/recommender.py", line 14, in rerank_paper
    sim = encoder.similarity(candidate_feature,corpus_feature) # [n_candidate, n_corpus]
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/runner/work/zotero-arxiv-daily/zotero-arxiv-daily/.venv/lib/python3.11/site-packages/sentence_transformers/util.py", line 1***8, in cos_sim
    return torch.mm(a_norm, b_norm.transpose(***, 1))
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
RuntimeError: mat1 and mat2 shapes cannot be multiplied (5x384 and ***x1)
Error: Process completed with exit code 1.
```
