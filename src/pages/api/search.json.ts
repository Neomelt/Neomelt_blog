import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getDefaultUiText } from "../../i18n/ui";

function normalizeText(value: string | undefined): string {
    return (value || "").replace(/\s+/g, " ").trim();
}

export const GET: APIRoute = async () => {
    try {
        const uncategorizedLabel = getDefaultUiText("legacy.uncategorized");
        const blogTypeLabel = getDefaultUiText("search.typeBlog");

        // 获取所有内容并生成搜索索引
        const blogPosts = await getCollection("blog");

        // 构建轻量搜索索引（避免下发完整正文）
        const searchIndex = [
            // 博客文章
            ...blogPosts.map(post => {
                const tags = post.data.tags || [];
                const description = normalizeText(post.data.description);
                const bodyText = normalizeText(post.body);
                const excerpt = (description || bodyText).slice(0, 220);
                const category = post.data.category || uncategorizedLabel;
                const searchText = [
                    post.data.title,
                    description,
                    bodyText.slice(0, 1800),
                    tags.join(" "),
                    category,
                    blogTypeLabel,
                ]
                    .join(" ")
                    .toLowerCase();

                return {
                    id: post.id,
                    title: post.data.title,
                    description,
                    excerpt,
                    url: `/posts/${post.id}`,
                    type: blogTypeLabel,
                    date: post.data.pubDate.toISOString().split('T')[0],
                    tags,
                    category,
                    searchText,
                };
            })
        ];

        return new Response(JSON.stringify(searchIndex), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        console.error("[Search API] Failed to build search index:", error);
        return new Response(JSON.stringify([]), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
};
