import { describe, expect, it } from "vitest";
import {
  detectBrowserLanguage,
  resolveInitialLanguage,
} from "../i18n/detectLanguage";

describe("language detection", () => {
  it("opens in Polish for Polish browser language", () => {
    expect(detectBrowserLanguage(["pl-PL", "pl", "en-US"])).toBe("pl");
  });

  it("opens in English for English browser language", () => {
    expect(detectBrowserLanguage(["en-US", "pl-PL"])).toBe("en");
  });

  it("falls back to English for unsupported browser languages", () => {
    expect(detectBrowserLanguage(["de-DE", "fr-FR"])).toBe("en");
  });

  it("uses saved user preference before browser language", () => {
    expect(
      resolveInitialLanguage({
        browserLanguages: ["pl-PL"],
        storedLanguage: "en",
      }),
    ).toBe("en");
  });

  it("ignores invalid saved preference and uses browser language", () => {
    expect(
      resolveInitialLanguage({
        browserLanguages: ["pl-PL"],
        storedLanguage: "de",
      }),
    ).toBe("pl");
  });
});
