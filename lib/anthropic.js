import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODEL = "claude-sonnet-4-6";

let client;

export function getAnthropicClient() {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export function stripJsonFences(text) {
  if (!text) return text;
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  return cleaned.trim();
}

export function parseClaudeJson(text) {
  const cleaned = stripJsonFences(text);
  return JSON.parse(cleaned);
}
