/**
 * Markdown components written as directives (remark-directive):
 *
 *   :::folding{title="点开看"}      container: block content inside
 *   ::link-card{url="…" title="…"}  leaf: one line, no body
 *   :kbd[Ctrl+C]                    text: inline
 *
 * Each becomes plain HTML at build time, so .md posts get them without MDX
 * and feed readers still see readable markup. A directive this file does
 * not know is put back exactly as it was written, so a stray `:name` in
 * prose never disappears.
 */
import type { RemarkPlugin } from "@astrojs/markdown-remark";
import type { Element, ElementContent, Properties } from "hast";
import type { ListItem, Paragraph, PhrasingContent, RootContent } from "mdast";
import type {
  ContainerDirective,
  LeafDirective,
  TextDirective,
} from "mdast-util-directive";
import type { VFile } from "vfile";

type Directive = ContainerDirective | LeafDirective | TextDirective;
type Node = RootContent;
type Renderer = (node: Directive, file: VFile) => Node | null;

const BADGE_TYPES = new Set(["info", "tip", "warning", "danger"]);

/** A node remark-rehype turns into <tag {...properties}>children</tag>. */
function part(
  tag: string,
  properties: Properties,
  children: Node[] = [],
  hChildren?: ElementContent[],
): Node {
  return {
    type: "mdPart",
    data: { hName: tag, hProperties: properties, hChildren },
    children,
  } as unknown as Node;
}

const text = (value: string): Node => ({ type: "text", value });

function attr(node: Directive, key: string): string | undefined {
  const value = node.attributes?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

const has = (node: Directive, key: string) =>
  node.attributes != null && key in node.attributes;

/** A container's [label] is parsed as its first paragraph; take it out. */
function takeLabel(node: ContainerDirective): PhrasingContent[] | undefined {
  const first = node.children[0];
  if (first?.type === "paragraph" && first.data?.directiveLabel) {
    node.children.shift();
    return first.children;
  }
  return undefined;
}

function plainText(nodes: readonly Node[]): string {
  return nodes
    .map((n) =>
      "value" in n && typeof n.value === "string"
        ? n.value
        : "children" in n
          ? plainText(n.children as Node[])
          : "",
    )
    .join("");
}

/** Links and images: no script URLs; relative and http(s) are fine. */
function safeUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const scheme = value.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  return !scheme || ["http", "https", "mailto"].includes(scheme)
    ? value
    : undefined;
}

const externalLink = (url: string): Properties =>
  /^https?:/i.test(url)
    ? { target: "_blank", rel: ["noopener", "noreferrer"] }
    : {};

const svg = (paths: string[]): Element => ({
  type: "element",
  tagName: "svg",
  properties: {
    viewBox: "0 0 24 24",
    width: 14,
    height: 14,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ariaHidden: "true",
  },
  children: paths.map((d) => ({
    type: "element",
    tagName: "path",
    properties: { d },
    children: [],
  })),
});

const COPY_ICON = svg([
  "M9 9h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z",
  "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
]);

const renderers: Record<string, Renderer> = {
  folding(node) {
    if (node.type !== "containerDirective") return null;
    const label = takeLabel(node);
    const summary = label ?? [text(attr(node, "title") ?? "展开")];
    const props: Properties = { className: ["md-folding"] };
    if (has(node, "open")) props.open = true;
    return part("details", props, [
      part("summary", {}, summary),
      part("div", { className: ["md-folding-body"] }, node.children),
    ]);
  },

  "link-card"(node) {
    if (node.type === "textDirective") return null;
    const url = safeUrl(attr(node, "url") ?? attr(node, "link"));
    const label =
      node.type === "containerDirective" ? takeLabel(node) : node.children;
    const title = label?.length ? label : undefined;
    const titleText = attr(node, "title");
    if (!url || (!title && !titleText)) return null;
    let host = "";
    try {
      host = new URL(url).hostname;
    } catch {
      // Relative link: no host to show.
    }
    const desc = attr(node, "desc") ?? attr(node, "description") ?? host;
    const icon = safeUrl(attr(node, "icon"));
    return part(
      "a",
      { className: ["md-link-card"], href: url, ...externalLink(url) },
      [
        ...(icon
          ? [
              part("img", {
                className: ["md-link-card-icon"],
                src: icon,
                alt: "",
                loading: "lazy",
                decoding: "async",
              }),
            ]
          : []),
        part("span", { className: ["md-link-card-text"] }, [
          part(
            "strong",
            { className: ["md-link-card-title"] },
            title ?? [text(titleText!)],
          ),
          ...(desc
            ? [part("span", { className: ["md-link-card-desc"] }, [text(desc)])]
            : []),
        ]),
      ],
    );
  },

  timeline: (node) =>
    node.type === "containerDirective"
      ? part("div", { className: ["md-timeline"] }, node.children)
      : null,

  "card-list": (node) =>
    node.type === "containerDirective"
      ? part("div", { className: ["md-card-list"] }, node.children)
      : null,

  blur: (node) =>
    part(
      node.type === "textDirective" ? "span" : "div",
      { className: ["md-blur"], tabIndex: 0 },
      node.children,
    ),

  kbd(node, file) {
    if (node.type !== "textDirective") return null;
    const keys = (labelSource(node, file) ?? plainText(node.children))
      .split("+")
      .map((key) => key.trim())
      .filter(Boolean);
    if (keys.length === 0) return null;
    return part(
      "span",
      { className: ["md-keys"] },
      keys.flatMap((key, i) => [
        ...(i > 0 ? [text("+")] : []),
        part("kbd", {}, [text(key)]),
      ]),
    );
  },

  tip(node) {
    if (node.type !== "textDirective") return null;
    const tip = attr(node, "tip");
    if (!tip) return null;
    return part(
      "span",
      { className: ["md-tip"], tabIndex: 0, dataTip: tip },
      node.children,
    );
  },

  badge(node) {
    if (node.type !== "textDirective" || node.children.length === 0)
      return null;
    const type = attr(node, "type") ?? "info";
    if (!BADGE_TYPES.has(type)) return null;
    return part(
      "span",
      { className: ["md-badge", `md-badge-${type}`] },
      node.children,
    );
  },

  quote(node) {
    if (node.type !== "containerDirective") return null;
    const cite = attr(node, "cite") ?? attr(node, "author");
    return part("figure", { className: ["md-quote"] }, [
      part("blockquote", {}, node.children),
      ...(cite ? [part("figcaption", {}, [text(cite)])] : []),
    ]);
  },

  poetry(node) {
    if (node.type !== "containerDirective") return null;
    const title = attr(node, "title");
    const author = attr(node, "author");
    const head =
      title || author
        ? [
            part("figcaption", { className: ["md-poetry-head"] }, [
              ...(title ? [part("strong", {}, [text(title)])] : []),
              ...(author
                ? [
                    part("span", { className: ["md-poetry-author"] }, [
                      text(author),
                    ]),
                  ]
                : []),
            ]),
          ]
        : [];
    return part("figure", { className: ["md-poetry"] }, [
      ...head,
      part("div", { className: ["md-poetry-body"] }, node.children),
    ]);
  },

  pic(node) {
    if (node.type !== "containerDirective") return null;
    const label = takeLabel(node);
    const caption =
      label ??
      (attr(node, "caption") ? [text(attr(node, "caption")!)] : undefined);
    return part("figure", { className: ["md-pic"] }, [
      ...node.children,
      ...(caption ? [part("figcaption", {}, caption)] : []),
    ]);
  },

  chat(node) {
    if (node.type !== "containerDirective") return null;
    const me = attr(node, "me");
    for (const child of node.children) {
      if (child.type !== "list") continue;
      for (const item of child.children) chatMessage(item, me);
    }
    return part("div", { className: ["md-chat"] }, node.children);
  },

  tabs(node) {
    if (node.type !== "containerDirective") return null;
    const tabs = node.children.filter(
      (child): child is ContainerDirective =>
        child.type === "containerDirective" && child.name === "tab",
    );
    if (tabs.length === 0) return null;
    return part(
      "div",
      { className: ["md-tabs"] },
      tabs.map((tab, i) => {
        const label = takeLabel(tab) ?? [
          text(attr(tab, "label") ?? attr(tab, "title") ?? `${i + 1}`),
        ];
        return part("section", { className: ["md-tab"] }, [
          part("p", { className: ["md-tab-label"] }, [
            part("strong", {}, label),
          ]),
          ...tab.children,
        ]);
      }),
    );
  },

  copy(node, file) {
    if (node.type !== "textDirective") return null;
    const value =
      attr(node, "code") ??
      (labelSource(node, file) ?? plainText(node.children)).trim();
    if (!value) return null;
    return part("span", { className: ["md-copy"] }, [
      part("code", {}, [text(value)]),
      part(
        "button",
        {
          type: "button",
          className: ["md-copy-btn"],
          dataCopy: value,
          ariaLabel: "复制代码",
          dataI18nAriaLabel: "code.copy",
        },
        [],
        [COPY_ICON],
      ),
    ]);
  },
};

/** `- 名字: 内容` becomes a bubble; an item without a name is a system line. */
function chatMessage(item: ListItem, me: string | undefined) {
  const first = item.children[0];
  const lead = first?.type === "paragraph" ? first.children[0] : undefined;
  const match =
    lead?.type === "text"
      ? lead.value.match(/^([^:：\n]{1,24}?)\s*[:：]\s*/)
      : null;
  if (!match || lead?.type !== "text") {
    item.data = { hProperties: { className: ["md-chat-system"] } };
    return;
  }
  const name = match[1].trim();
  lead.value = lead.value.slice(match[0].length);
  if (!lead.value) (first as Paragraph).children.shift();
  item.data = {
    hProperties: {
      className: ["md-chat-msg", ...(name === me ? ["is-me"] : [])],
    },
  };
  // A tight list renders its paragraphs bare, but only direct children of
  // the item; inside the bubble they would turn back into <p>.
  const body = item.spread
    ? item.children
    : item.children.flatMap<Node>((child) =>
        child.type === "paragraph" ? child.children : [child],
      );
  item.children = [
    part("span", { className: ["md-chat-name"] }, [text(name)]),
    part("div", { className: ["md-chat-bubble"] }, body as Node[]),
  ] as ListItem["children"];
}

/**
 * A label exactly as written. Commands and keys need this: smartypants runs
 * before this plugin and has already turned `--` into a dash and straight
 * quotes into curly ones in the parsed text.
 */
function labelSource(node: Directive, file: VFile): string | undefined {
  const start = node.children[0]?.position?.start.offset;
  const end = node.children[node.children.length - 1]?.position?.end.offset;
  return start === undefined || end === undefined
    ? undefined
    : String(file.value).slice(start, end);
}

function sourceOf(node: Node, file: VFile): string | undefined {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  return start === undefined || end === undefined
    ? undefined
    : String(file.value).slice(start, end);
}

const paragraph = (value: string): Node => ({
  type: "paragraph",
  children: [{ type: "text", value }],
});

/** Unknown or malformed directive: give back what the author wrote. */
function restore(node: Directive, file: VFile): Node[] {
  const source = sourceOf(node, file);
  const colons = {
    textDirective: ":",
    leafDirective: "::",
    containerDirective: ":::",
  }[node.type];
  if (node.type === "textDirective")
    return [text(source ?? `${colons}${node.name}`)];
  if (node.type === "leafDirective")
    return [paragraph(source ?? `${colons}${node.name}`)];
  const lines = source?.split("\n") ?? [];
  takeLabel(node);
  return [
    paragraph(lines[0] ?? `${colons}${node.name}`),
    ...node.children,
    paragraph(lines.length > 1 ? lines[lines.length - 1].trim() : colons),
  ];
}

const isDirective = (node: Node): node is Directive =>
  node.type === "containerDirective" ||
  node.type === "leafDirective" ||
  node.type === "textDirective";

function transform(
  parent: { children: Node[] },
  file: VFile,
  parentName?: string,
) {
  const next: Node[] = [];
  for (const node of parent.children) {
    // Bottom-up: nested components are finished before their container.
    if ("children" in node)
      transform(
        node as { children: Node[] },
        file,
        isDirective(node) ? node.name : undefined,
      );

    if (!isDirective(node) || (node.name === "tab" && parentName === "tabs")) {
      next.push(node);
      continue;
    }
    const rendered = renderers[node.name]?.(node, file);
    next.push(...(rendered ? [rendered] : restore(node, file)));
  }
  parent.children = next;
}

const remarkComponents: RemarkPlugin<[]> = () => (tree, file) => {
  transform(tree as { children: Node[] }, file);
};

export default remarkComponents;
