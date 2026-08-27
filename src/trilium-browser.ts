// Read-only Trilium tree browsing for Arena's source picker. This is wider
// than trilium-projector.ts's narrow "search once by exact title" carve-out
// (it can list the children of any note, not resolve one project by name) --
// flagged as a real widening of that locked policy, not a silent one.
// Gated the same two ways as everything else in trilium-projector.ts:
// config.trilium.enabled/etapiToken (off by default, Felton-reviewed
// activation), and the same X-MCP-Token trust boundary every other
// Arena/TT/Gauntlet route already sits behind -- the same boundary that
// already permits gate approvals and blocker creation, so read-only note
// listing is not a wider blast radius than what that token already grants.
import type { DbosConfig } from "../config.js";
import { TriliumProjectionDisabledError } from "../trilium-projector.js";

export interface TriliumChildNote {
  noteId: string;
  title: string;
}

export interface TriliumBrowseResult {
  noteId: string;
  title: string;
  children: TriliumChildNote[];
}

function authHeader(config: DbosConfig["trilium"]): string {
  return `Basic ${Buffer.from(`etapi:${config.etapiToken}`).toString("base64")}`;
}

async function etapiSearch(config: DbosConfig["trilium"], query: string): Promise<Array<{ noteId: string; title: string }>> {
  const response = await fetch(`${config.baseUrl}/etapi/notes?search=${encodeURIComponent(query)}`, {
    headers: { authorization: authHeader(config) },
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error(`Trilium search failed: HTTP ${response.status}`);
  const body = (await response.json()) as { results?: Array<{ noteId: string; title: string }> };
  return body.results ?? [];
}

async function etapiGetNote(config: DbosConfig["trilium"], noteId: string): Promise<{ noteId: string; title: string }> {
  const response = await fetch(`${config.baseUrl}/etapi/notes/${encodeURIComponent(noteId)}`, {
    headers: { authorization: authHeader(config) },
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error(`Trilium note lookup failed: HTTP ${response.status}`);
  return (await response.json()) as { noteId: string; title: string };
}

export async function browseTriliumNote(config: DbosConfig["trilium"], noteId: string): Promise<TriliumBrowseResult> {
  if (!config.enabled || !config.etapiToken) {
    throw new TriliumProjectionDisabledError();
  }
  const [note, children] = await Promise.all([
    etapiGetNote(config, noteId),
    etapiSearch(config, `note.parents.noteId = "${noteId}"`)
  ]);
  return {
    noteId: note.noteId,
    title: note.title,
    children: children
      .map((child) => ({ noteId: child.noteId, title: child.title }))
      .sort((a, b) => a.title.localeCompare(b.title))
  };
}
