import { describe, expect, it } from "vitest";

import { countMarkdownText, countTextUnits } from "./text-count";

describe("text count", () => {
  it("counts Han characters and English words only", () => {
    expect(
      countTextUnits("你好，Rust 2025! hello-world https://example.com"),
    ).toBe(4);
  });

  it("drops Markdown syntax, code, destinations, and media", () => {
    const markdown = `# 标题 Rust

正文中文，English words。

\`inlineCode\` [链接文字](https://example.com) ![图片](photo.png)

~~~js
const ignored = "代码";
~~~

@[video](https://example.com/video)`;
    expect(countMarkdownText(markdown)).toBe(13);
  });

  it("counts component labels but not component markup", () => {
    const markdown = `:::folding{title="Hidden title"}
正文
:::

按 :kbd[Ctrl] 键`;
    // 正文 + 按 + Ctrl + 键
    expect(countMarkdownText(markdown)).toBe(5);
  });
});
