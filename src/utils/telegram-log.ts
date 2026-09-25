import { telegramLog } from "../site.config";

/**
 * The channel the 日常 page reads, after the optional environment override.
 * Server side only: it reads process.env, so keep it out of client scripts.
 */
export function resolveTelegramLogChannel(environmentValue?: string) {
  return (environmentValue?.trim() || telegramLog.channel)
    .trim()
    .replace(/^@/, "");
}

export const TELEGRAM_LOG_CHANNEL = resolveTelegramLogChannel(
  process.env.TELEGRAM_LOG_CHANNEL,
);

export const TELEGRAM_LOG_ENABLED = TELEGRAM_LOG_CHANNEL !== "";
