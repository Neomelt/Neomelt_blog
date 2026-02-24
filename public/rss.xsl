<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
	version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:content="http://purl.org/rss/1.0/modules/content/"
	xmlns:media="http://search.yahoo.com/mrss/"
	xmlns:atom="http://www.w3.org/2005/Atom"
>
	<xsl:output method="html" encoding="UTF-8" indent="yes" />
	<xsl:template match="/">
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>
					<xsl:value-of select="rss/channel/title" /> RSS
				</title>
				<style>
					:root {
						color-scheme: light;
						--bg: #f4f6fb;
						--panel: #ffffff;
						--text: #1f2937;
						--muted: #64748b;
						--line: #d9e2f2;
						--accent: #1d4ed8;
					}

					* {
						box-sizing: border-box;
					}

					body {
						margin: 0;
						font-family: "Atkinson Hyperlegible", "Segoe UI", sans-serif;
						background: radial-gradient(circle at top, #eef4ff 0%, var(--bg) 55%);
						color: var(--text);
						line-height: 1.6;
					}

					main {
						max-width: 960px;
						margin: 0 auto;
						padding: 24px 16px 56px;
					}

					.header {
						background: var(--panel);
						border: 1px solid var(--line);
						border-radius: 14px;
						padding: 18px;
						margin-bottom: 14px;
					}

					h1 {
						margin: 0;
						font-size: clamp(1.35rem, 2.3vw, 1.8rem);
					}

					.meta {
						color: var(--muted);
						font-size: 0.95rem;
						margin-top: 6px;
					}

					.desc {
						color: var(--muted);
						margin-top: 10px;
					}

					.notice {
						background: #eff6ff;
						border: 1px solid #bfdbfe;
						border-radius: 12px;
						padding: 10px 12px;
						color: #1e3a8a;
						margin: 0 0 14px;
					}

					.notice code {
						background: rgba(30, 58, 138, 0.08);
						padding: 2px 6px;
						border-radius: 6px;
					}

					ul {
						list-style: none;
						padding: 0;
						margin: 0;
					}

					li {
						background: var(--panel);
						border: 1px solid var(--line);
						border-radius: 12px;
						padding: 14px;
						margin: 10px 0;
					}

					a {
						color: var(--accent);
						text-decoration: none;
						font-weight: 650;
					}

					a:hover {
						text-decoration: underline;
					}

					.item-date {
						color: var(--muted);
						font-size: 0.88rem;
						margin: 4px 0 8px;
					}

					.item-desc {
						color: #334155;
						margin: 0;
					}

					.tags {
						margin-top: 10px;
						display: flex;
						flex-wrap: wrap;
						gap: 6px;
					}

					.tags span {
						padding: 2px 8px;
						background: #eff6ff;
						border: 1px solid #bfdbfe;
						border-radius: 999px;
						color: #1e3a8a;
						font-size: 0.78rem;
					}

					.feed-link {
						display: inline-block;
						margin-top: 10px;
						font-size: 0.9rem;
						color: var(--muted);
					}
				</style>
			</head>
			<body>
				<main>
					<section class="header">
						<h1>
							<xsl:value-of select="rss/channel/title" />
						</h1>
						<p class="meta">
							Last build:
							<xsl:value-of select="rss/channel/lastBuildDate" />
						</p>
						<p class="desc">
							<xsl:value-of select="rss/channel/description" />
						</p>
						<a class="feed-link" href="{rss/channel/atom:link/@href}">
							RSS URL
						</a>
					</section>
					<p class="notice">
						This is an RSS feed. Subscribe using your reader and use
						<code>/rss.xml</code>
						as the feed URL.
					</p>
					<ul>
						<xsl:for-each select="rss/channel/item">
							<li>
								<a href="{link}">
									<xsl:value-of select="title" />
								</a>
								<p class="item-date">
									<xsl:value-of select="pubDate" />
								</p>
								<p class="item-desc">
									<xsl:value-of select="description" />
								</p>
								<xsl:if test="count(category) &gt; 0">
									<div class="tags">
										<xsl:for-each select="category">
											<span>
												<xsl:value-of select="." />
											</span>
										</xsl:for-each>
									</div>
								</xsl:if>
							</li>
						</xsl:for-each>
					</ul>
				</main>
			</body>
		</html>
	</xsl:template>
</xsl:stylesheet>
