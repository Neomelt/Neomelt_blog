#!/usr/bin/env node
/**
 * Health check for the friend links in src/data/friends.ts:
 *
 *   npm run friends:check
 *
 * For each site: HTTP status (after redirects), days left on its TLS
 * certificate, whether its feed loads, and when the feed last published.
 * Manual only; nothing in the build depends on it. Exits 1 if any site is
 * unreachable or its certificate expires within two weeks.
 */
import { connect } from "node:tls";
import { FRIEND_LINKS } from "../src/data/friends.ts";

const TIMEOUT = 15_000;
const CONCURRENCY = 6;
const CERT_WARN_DAYS = 14;
const STALE_DAYS = 365;
const UA = "Mozilla/5.0 (compatible; NeomeltBlogFriendCheck/1.0)";

async function get(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": UA },
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT),
  });
  return {
    status: response.status,
    body: await response.text(),
    url: response.url,
  };
}

function certDaysLeft(hostname) {
  return new Promise((resolve) => {
    const socket = connect({
      host: hostname,
      port: 443,
      servername: hostname,
      timeout: TIMEOUT,
    });
    const done = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.once("secureConnect", () => {
      const validTo = socket.getPeerCertificate()?.valid_to;
      done(
        validTo
          ? Math.floor((Date.parse(validTo) - Date.now()) / 86_400_000)
          : null,
      );
    });
    socket.once("timeout", () => done(null));
    socket.once("error", () => done(null));
  });
}

/** Newest date among the feed's entries (RSS pubDate, Atom updated/published). */
function latestEntry(xml) {
  const dates = [
    ...xml.matchAll(/<(pubDate|updated|published|dc:date)>([^<]+)<\/\1>/g),
  ]
    .map((m) => Date.parse(m[2].trim()))
    .filter((t) => !Number.isNaN(t) && t <= Date.now() + 86_400_000);
  return dates.length ? new Date(Math.max(...dates)) : null;
}

const short = (error) =>
  error?.name === "TimeoutError"
    ? "timeout"
    : (error?.cause?.code ?? error?.message ?? String(error));

async function check(friend) {
  const row = {
    name: friend.name,
    site: "",
    cert: "",
    feed: "",
    latest: "",
    problems: [],
  };
  try {
    const { status, url } = await get(friend.url);
    row.site = String(status);
    if (status >= 400) row.problems.push(`site ${status}`);
    if (new URL(url).host !== new URL(friend.url).host)
      row.site += ` → ${new URL(url).host}`;
  } catch (error) {
    row.site = short(error);
    row.problems.push(`site ${row.site}`);
  }

  const { protocol, hostname } = new URL(friend.url);
  if (protocol === "https:") {
    const days = await certDaysLeft(hostname);
    row.cert = days === null ? "?" : `${days}d`;
    if (days !== null && days < CERT_WARN_DAYS)
      row.problems.push(`cert ${days}d`);
  } else {
    row.cert = "http";
  }

  if (friend.rss) {
    try {
      const { status, body } = await get(friend.rss);
      const latest = status < 400 ? latestEntry(body) : null;
      row.feed = status >= 400 ? String(status) : latest ? "ok" : "no dates";
      if (status >= 400) row.problems.push(`feed ${status}`);
      if (latest) {
        row.latest = latest.toISOString().slice(0, 10);
        const age = (Date.now() - latest.valueOf()) / 86_400_000;
        if (age > STALE_DAYS) row.feed = `stale ${Math.floor(age)}d`;
      }
    } catch (error) {
      row.feed = short(error);
      row.problems.push(`feed ${row.feed}`);
    }
  } else {
    row.feed = "-";
  }
  return row;
}

const queue = FRIEND_LINKS.map((friend, i) => ({ friend, i }));
const rows = [];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      rows[next.i] = await check(next.friend);
      process.stderr.write(".");
    }
  }),
);
process.stderr.write("\n\n");

const columns = ["name", "site", "cert", "feed", "latest"];
const width = (value) =>
  [...String(value)].reduce(
    (n, ch) => n + (ch.codePointAt(0) > 0x2e80 ? 2 : 1),
    0,
  );
const widths = columns.map((c) =>
  Math.max(width(c), ...rows.map((r) => width(r[c]))),
);
const line = (cells) =>
  cells
    .map((cell, i) => String(cell) + " ".repeat(widths[i] - width(cell)))
    .join("  ");
console.log(line(columns));
console.log(widths.map((w) => "-".repeat(w)).join("  "));
for (const row of rows) console.log(line(columns.map((c) => row[c])));

const failing = rows.filter((r) => r.problems.length);
console.log(`\n${rows.length} sites, ${failing.length} with problems.`);
for (const row of failing)
  console.log(`  ${row.name}: ${row.problems.join(", ")}`);
process.exitCode = failing.some((r) =>
  r.problems.some((p) => p.startsWith("site") || p.startsWith("cert")),
)
  ? 1
  : 0;
