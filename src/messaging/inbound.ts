import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { logger } from "../util/logger.js";
import type { MessageItem } from "../api/types.js";
import { MessageItemType } from "../api/types.js";

// ---------------------------------------------------------------------------
// Context token store (in-process cache + disk persistence)
// ---------------------------------------------------------------------------

let _stateDir = path.join(os.homedir(), ".weixin-bot");
let _persistAccountId: string | undefined;

/** Set the base state directory for context token persistence. */
export function setContextTokenStateDir(dir: string): void {
  _stateDir = dir;
}

/**
 * contextToken is issued per-message by the Weixin getupdates API and must
 * be echoed verbatim in every outbound send. The in-memory map is the primary
 * lookup; a disk-backed file per account ensures tokens survive restarts.
 */
const contextTokenStore = new Map<string, string>();

function resolveContextTokenFilePath(accountId: string): string {
  return path.join(_stateDir, "accounts", `${accountId}.context-tokens.json`);
}

function persistContextTokens(): void {
  if (!_persistAccountId) return;
  const filePath = resolveContextTokenFilePath(_persistAccountId);
  try {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const tokens: Record<string, string> = {};
    for (const [k, v] of contextTokenStore) {
      tokens[k] = v;
    }
    fs.writeFileSync(filePath, JSON.stringify(tokens, null, 0), "utf-8");
  } catch (err) {
    logger.warn(`persistContextTokens: failed to write ${filePath}: ${String(err)}`);
  }
}

/**
 * Restore persisted context tokens for an account into the in-memory map.
 * Called once during start() to survive restarts.
 */
export function restoreContextTokens(accountId: string): void {
  _persistAccountId = accountId;
  const filePath = resolveContextTokenFilePath(accountId);
  try {
    if (!fs.existsSync(filePath)) return;
    const raw = fs.readFileSync(filePath, "utf-8");
    const tokens = JSON.parse(raw) as Record<string, string>;
    let count = 0;
    for (const [chatId, token] of Object.entries(tokens)) {
      if (typeof token === "string" && token) {
        contextTokenStore.set(chatId, token);
        count++;
      }
    }
    logger.info(`restoreContextTokens: restored ${count} tokens for account=${accountId}`);
  } catch (err) {
    logger.warn(`restoreContextTokens: failed to read ${filePath}: ${String(err)}`);
  }
}

/** Remove all context tokens for a given account (memory + disk). */
export function clearContextTokensForAccount(accountId: string): void {
  contextTokenStore.clear();
  const filePath = resolveContextTokenFilePath(accountId);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    logger.warn(`clearContextTokensForAccount: failed to remove ${filePath}: ${String(err)}`);
  }
  logger.info(`clearContextTokensForAccount: cleared tokens for account=${accountId}`);
}

/** Store a context token for a given chat (user), persisting to disk. */
export function setContextToken(chatId: string, token: string): void {
  logger.debug(`setContextToken: key=${chatId}`);
  contextTokenStore.set(chatId, token);
  persistContextTokens();
}

/** Retrieve the cached context token for a given chat (user). */
export function getContextToken(chatId: string): string | undefined {
  const val = contextTokenStore.get(chatId);
  logger.debug(
    `getContextToken: key=${chatId} found=${val !== undefined} storeSize=${contextTokenStore.size}`,
  );
  return val;
}

// ---------------------------------------------------------------------------
// Message helpers
// ---------------------------------------------------------------------------

/** Returns true if the message item is a media type (image, video, file, or voice). */
export function isMediaItem(item: MessageItem): boolean {
  return (
    item.type === MessageItemType.IMAGE ||
    item.type === MessageItemType.VIDEO ||
    item.type === MessageItemType.FILE ||
    item.type === MessageItemType.VOICE
  );
}

/**
 * Extract the text body from a message's item_list.
 * Handles text items, quoted references, and voice-to-text fallback.
 */
export function bodyFromItemList(itemList?: MessageItem[]): string {
  if (!itemList?.length) return "";
  for (const item of itemList) {
    if (item.type === MessageItemType.TEXT && item.text_item?.text != null) {
      const text = String(item.text_item.text);
      const ref = item.ref_msg;
      if (!ref) return text;
      // Quoted media is passed as MediaPath; only include the current text as body.
      if (ref.message_item && isMediaItem(ref.message_item)) return text;
      // Build quoted context from both title and message_item content.
      const parts: string[] = [];
      if (ref.title) parts.push(ref.title);
      if (ref.message_item) {
        const refBody = bodyFromItemList([ref.message_item]);
        if (refBody) parts.push(refBody);
      }
      if (!parts.length) return text;
      return `[引用: ${parts.join(" | ")}]\n${text}`;
    }
    // 语音转文字：如果语音消息有 text 字段，直接使用文字内容
    if (item.type === MessageItemType.VOICE && item.voice_item?.text) {
      return item.voice_item.text;
    }
  }
  return "";
}
