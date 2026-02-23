import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getDefaultUiText } from "../../i18n/ui";

export const GET: APIRoute = async () => {
    try {
        const uncategorizedLabel = getDefaultUiText("legacy.uncategorized");
        const blogTypeLabel = getDefaultUiText("search.typeBlog");
        const essayTypeLabel = getDefaultUiText("search.typeEssay");

        // 获取所有内容并生成搜索索引
        const [blogPosts, zuegEntries] = await Promise.all([
            getCollection("blog"),
            getCollection("zueg")
        ]);

        // 构建搜索索引
        const searchIndex = [
            // 博客文章
            ...blogPosts.map(post => ({
                id: post.id,
                title: post.data.title,
                description: post.data.description,
                content: post.body || "",
                url: `/posts/${post.id}`,
                type: blogTypeLabel,
                date: post.data.pubDate.toISOString().split('T')[0],
                tags: post.data.tags || [],
                category: post.data.category || uncategorizedLabel
            })),
            // 随笔
            ...zuegEntries.map(entry => ({
                id: entry.id,
                title: entry.data.title,
                description: entry.data.description,
                content: entry.body || "",
                url: `/posts/zueg/${entry.id}`,
                type: essayTypeLabel,
                date: entry.data.pubDate.toISOString().split('T')[0],
                tags: entry.data.tags || [],
                category: entry.data.category || ""
            }))
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
