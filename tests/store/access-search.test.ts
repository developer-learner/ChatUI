/**
 * Tests for access store — Tavily fields.
 *
 * AC Coverage:
 *   AC-3.5 — Tavily API key is stored and configurable
 *
 * These tests verify the DEFAULT_ACCESS_STATE shape by reading the source
 * directly, avoiding complex Zustand store mocking.
 */

import { describe, it, expect } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

const accessStorePath = path.resolve(
  __dirname,
  "../../src/app/store/access.ts",
);
const accessSource = fs.readFileSync(accessStorePath, "utf-8");

describe("Access Store — Tavily field declarations (source-level)", () => {
  // AC-3.5: tavilyApiKey field exists in DEFAULT_ACCESS_STATE
  it("DEFAULT_ACCESS_STATE includes tavilyApiKey", () => {
    expect(accessSource).toMatch(/tavilyApiKey\s*:/);
  });

  // AC-3.5: tavilyApiKey defaults to empty string
  it("tavilyApiKey defaults to empty string", () => {
    expect(accessSource).toMatch(/tavilyApiKey\s*:\s*["']["']/);
  });

  // AC-3.2: webSearchEnabled field exists
  it("DEFAULT_ACCESS_STATE includes webSearchEnabled", () => {
    expect(accessSource).toMatch(/webSearchEnabled\s*:/);
  });

  // AC-3.2: webSearchEnabled defaults to false
  it("webSearchEnabled defaults to false", () => {
    expect(accessSource).toMatch(/webSearchEnabled\s*:\s*false/);
  });

  // Existing defaults still present
  it("still has openaiUrl defaulting to localhost:8000/v1", () => {
    expect(accessSource).toMatch(
      /openaiUrl\s*:\s*["']http:\/\/localhost:8000\/v1["']/,
    );
  });

  it("still has openaiApiKey defaulting to 'none'", () => {
    expect(accessSource).toMatch(/openaiApiKey\s*:\s*["']none["']/);
  });
});
