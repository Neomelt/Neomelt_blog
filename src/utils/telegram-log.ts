import { telegramLog } from "../site.config";

/**
 * The channel the 日常 page reads, after the environment override. Server
 * side only: it reads process.env, so keep it out of client scripts.
 */
export const TELEGRAM_LOG_CHANNEL = (
  process.env.TELEGRAM_LOG_CHANNEL ?? telegramLog.channel
)
  .trim()
  .replace(/^@/, "");

export const TELEGRAM_LOG_ENABLED = TELEGRAM_LOG_CHANNEL !== "";
