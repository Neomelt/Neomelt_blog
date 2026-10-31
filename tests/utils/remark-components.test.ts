import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import remarkDirective from "remark-directive";
import { beforeAll, describe, expect, it } from "vitest";
import remarkComponents from "../../src/utils/remark-components";

let render: (md: string) => Promise<string>;

beforeAll(async () => {
  const processor = await createMarkdownProcessor({
    remarkPlugins: [remarkDirective, remarkComponents],
    syntaxHighlight: false,
  });
  render = async (md) => (await processor.render(md)).code;
});

describe("remark-components", () => {
  it("copies commands as written, not as smartypants typeset them", async () => {
    const html = await render(`:copy[npm run covers -- --review "x"]`);
    expect(html).toContain('<code>npm run covers -- --review "x"</code>');
    expect(html).toContain(
      'data-copy="npm run covers -- --review &#x22;x&#x22;"',
    );
  });

  it("renders folding as details/summary", async () => {
    const html = await render(
      ':::folding{title="点开看" open}\n内容 **粗体**\n:::',
    );
    expect(html).toContain('<details class="md-folding" open>');
    expect(html).toContain("<summary>点开看</summary>");
    expect(html).toContain(
      '<div class="md-folding-body"><p>内容 <strong>粗体</strong></p></div>',
    );
  });

  it("uses the label as the folding title", async () => {
    expect(await render(":::folding[标题 `code`]\n正文\n:::")).toContain(
      "<summary>标题 <code>code</code></summary>",
    );
  });

  it("renders a link card and falls back to the host as description", async () => {
    const html = await render(
      '::link-card{url="https://example.com/a" title="示例"}',
    );
    expect(html).toContain(
      '<a class="md-link-card" href="https://example.com/a" target="_blank" rel="noopener noreferrer">',
    );
    expect(html).toContain('<strong class="md-link-card-title">示例</strong>');
    expect(html).toContain(
      '<span class="md-link-card-desc">example.com</span>',
    );
  });

  it("refuses script URLs", async () => {
    const html = await render(
      '::link-card{url="javascript:alert(1)" title="x"}',
    );
    expect(html).not.toContain("<a");
    expect(html).toContain("::link-card");
  });

  it("splits key combinations", async () => {
    expect(await render("按 :kbd[Ctrl + C] 复制")).toContain(
      '<span class="md-keys"><kbd>Ctrl</kbd>+<kbd>C</kbd></span>',
    );
  });

  it("renders inline blur, tip and badge", async () => {
    const html = await render(
      ':blur[剧透] :tip[术语]{tip="解释"} :badge[新]{type="tip"}',
    );
    expect(html).toContain('<span class="md-blur" tabindex="0">剧透</span>');
    expect(html).toContain(
      '<span class="md-tip" tabindex="0" data-tip="解释">术语</span>',
    );
    expect(html).toContain('<span class="md-badge md-badge-tip">新</span>');
  });

  it("renders a chat with names, my side and system lines", async () => {
    const html = await render(
      ':::chat{me="我"}\n- 朋友：在吗\n- 我: 在\n- 下午 3:00\n:::',
    );
    const compact = html.replace(/\n/g, "");
    expect(compact).toContain(
      '<li class="md-chat-msg"><span class="md-chat-name">朋友</span><div class="md-chat-bubble">在吗</div></li>',
    );
    expect(compact).toContain(
      '<li class="md-chat-msg is-me"><span class="md-chat-name">我</span><div class="md-chat-bubble">在</div></li>',
    );
    expect(html).toContain('<li class="md-chat-system">下午 3:00</li>');
  });

  it("renders tabs with a visible label per panel", async () => {
    const html = await render(
      '::::tabs\n:::tab[npm]\n`npm i`\n:::\n:::tab{label="pnpm"}\n`pnpm add`\n:::\n::::',
    );
    expect(html).toContain('<div class="md-tabs">');
    expect(html.match(/<section class="md-tab">/g)).toHaveLength(2);
    expect(html).toContain('<p class="md-tab-label"><strong>pnpm</strong></p>');
  });

  it("keeps BibTeX exactly, backslashes included", async () => {
    const html = await render(
      ':::bibref{title="Paper" url="https://arxiv.org/abs/1"}\n```bibtex\n@article{a,\n  author={M{\\"u}ller}\n}\n```\n:::',
    );
    expect(html).toContain(
      '<span class="bibref"><a href="https://arxiv.org/abs/1"',
    );
    expect(html).toContain(
      'data-bib="@article{a,\n  author={M{\\&#x22;u}ller}\n}"',
    );
    expect(html).not.toContain("<pre");
  });

  it("turns mermaid fences into a pre the browser can draw", async () => {
    expect(await render("```mermaid\nflowchart LR\n  A --> B\n```")).toBe(
      '<pre class="md-mermaid">flowchart LR\n  A --> B</pre>',
    );
  });

  it("gives back unknown directives as written", async () => {
    expect(await render("比分 3:2，链接 a:b，还有 :unknown[文字]{x=1}")).toBe(
      "<p>比分 3:2，链接 a:b，还有 :unknown[文字]{x=1}</p>",
    );
    const html = await render(":::mystery{a=1}\n里面的内容\n:::");
    expect(html).toContain("<p>:::mystery{a=1}</p>");
    expect(html).toContain("<p>里面的内容</p>");
  });
});
