/**
 * Tests for Settings page — Tavily key field presence.
 *
 * AC Coverage:
 *   AC-3.5 — Tavily API key input field is present in settings
 */

import { describe, it, expect } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

const settingsPath = path.resolve(
  __dirname,
  "../../src/app/components/settings.tsx",
);
const settingsSource = fs.readFileSync(settingsPath, "utf-8");

const enLocalePath = path.resolve(
  __dirname,
  "../../src/app/locales/en.ts",
);
const enLocale = fs.readFileSync(enLocalePath, "utf-8");

describe("Settings — Tavily key field (source-level)", () => {
  // AC-3.5: Tavily API key input field exists in settings
  it("settings.tsx contains a Tavily API key input field", () => {
    expect(settingsSource).toMatch(/[Tt]avily/);
  });

  // AC-3.5: The Tavily key is bound to the access store
  it("settings.tsx reads tavilyApiKey from the access store", () => {
    expect(settingsSource).toMatch(/tavilyApiKey/);
  });

  // AC-3.5: The Tavily key is writeable (setter or onChange)
  it("settings.tsx provides a way to update tavilyApiKey", () => {
    // Look for setState or update pattern with tavilyApiKey
    expect(settingsSource).toMatch(
      /tavilyApiKey.*(?:setState|update|set\b|onChange)/i,
    );
  });

  // Locale strings for Tavily settings
  it("en.ts defines a Tavily-related locale string", () => {
    expect(enLocale).toMatch(/[Tt]avily/);
  });
});
