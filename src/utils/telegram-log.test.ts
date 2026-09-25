import { describe, expect, it } from "vitest";
import { resolveTelegramLogChannel } from "./telegram-log";

describe("resolveTelegramLogChannel", () => {
  it("uses the configured channel when the environment value is blank", () => {
    expect(resolveTelegramLogChannel("   ")).toBe("yohakunite");
  });

  it("normalizes a non-empty environment override", () => {
    expect(resolveTelegramLogChannel(" @another_channel ")).toBe(
      "another_channel",
    );
  });
});
