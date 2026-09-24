#!/usr/bin/env node
/**
 * Has the channel changed since the site was last built?
 *
 *   node plugins/telegram-log/bin/check.mjs --state https://example.com/log/latest.json
 *
 * Reads the state file the site publishes (channel name + digest of the
 * posts it was built from), fetches the same channel from t.me, and compares.
 * Prints one line and, under GitHub Actions, writes `changed=true|false` to
 * $GITHUB_OUTPUT. It exits 0 whenever it could decide nothing needs doing, so
 * a Telegram outage produces a warning rather than a failed run every hour.
 */
import { appendFile } from "node:fs/promises";
import { fetchChannel, postsDigest } from "../core.mjs";

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function report(changed, message) {
  console.log(message);
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
  }
}

const stateUrl = arg("state");
if (!stateUrl) {
  console.error("usage: check.mjs --state <url of /log/latest.json>");
  process.exit(2);
}

let state;
try {
  const response = await fetch(stateUrl, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  state = await response.json();
} catch (error) {
  await report(
    false,
    `warning: could not read ${stateUrl} (${error.message}); not rebuilding`,
  );
  process.exit(0);
}

if (!state.channel) {
  await report(false, "the site has no channel configured; nothing to check");
  process.exit(0);
}

let live;
try {
  const limit =
    Number.isInteger(state.limit) && state.limit > 0 ? state.limit : 60;
  const { posts } = await fetchChannel({
    channel: state.channel,
    limit,
  });
  live = postsDigest(posts);
} catch (error) {
  await report(
    false,
    `warning: could not read t.me/s/${state.channel} (${error.message}); not rebuilding`,
  );
  process.exit(0);
}

if (live === state.digest) {
  await report(false, `up to date: @${state.channel} digest ${live}`);
} else {
  await report(
    true,
    `changed: @${state.channel} site ${state.digest} -> channel ${live}`,
  );
}
