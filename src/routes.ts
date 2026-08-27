// Arena's own routes -- rides the existing Fastify instance and the same
// X-MCP-Token gate as everything else under src/dbos (see server.js's
// onRequest hook, which exempts GET /arena the same way it already exempts
// GET /tt-approvals: a browser navigating here directly never sends the
// header, and the page itself has no sensitive content -- MCP_TOKEN is baked
// into the rendered page and sent by its own fetch() calls against the
// still-gated /arena/api/* routes below).
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { FastifyInstance } from "fastify";
import { renderArenaPage } from "./page.js";
import { ARENA_WORKFLOW_TYPES } from "./registry.js";
import { loadDbosConfig } from "../config.js";
import { countTripleThreatSynchronized, createDbosPool } from "../store.js";
import { countGauntletHardened, createGauntletPool } from "../gauntlet/store.js";
import { browseTriliumNote } from "./trilium-browser.js";
import { TriliumProjectionDisabledError } from "../trilium-projector.js";

const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), "assets");

// Explicit allowlist, not a raw ":file" passthrough -- this route is
// deliberately exempted from the X-MCP-Token gate (a plain <img>/<link> tag
// never sends custom headers), so it must never resolve an arbitrary
// caller-supplied filename against the filesystem.
const ASSET_FILES: Record<string, string> = {
  "arena-icon.jpg": "arena-icon.jpg",
  "arena-logo.jpg": "arena-logo.jpg",
  "tt-icon.jpg": "tt-icon.jpg",
  "tt-logo.jpg": "tt-logo.jpg",
  // Real alpha transparency (verified via PNG IHDR color type, 2026-08-27) --
  // the other five brand images are PNG-encoded but flat truecolor, no
  // alpha, so they stay JPGs above until real transparent versions exist.
  "gauntlet-icon.png": "gauntlet-icon.png",
  "gauntlet-logo.jpg": "gauntlet-logo.jpg"
};

export function registerArenaRoutes(app: FastifyInstance): void {
  const config = loadDbosConfig();
  const dbosPool = createDbosPool(config.dbosDatabaseUrl);
  const gauntletPool = createGauntletPool(config.dbosDatabaseUrl);

  app.get("/arena", async (_request, reply) => {
    reply.type("text/html").send(renderArenaPage(process.env.MCP_TOKEN || ""));
  });

  app.get("/arena/assets/:file", async (request, reply) => {
    const { file } = request.params as { file: string };
    const filename = ASSET_FILES[file];
    if (!filename) return reply.code(404).send();
    const buffer = await readFile(join(ASSETS_DIR, filename));
    const contentType = filename.endsWith(".png") ? "image/png" : "image/jpeg";
    reply.type(contentType).header("cache-control", "public, max-age=86400").send(buffer);
  });

  app.get("/arena/api/registry", async (_request, reply) => {
    reply.send({ workflowTypes: ARENA_WORKFLOW_TYPES });
  });

  app.get("/arena/api/counters", async (_request, reply) => {
    const [tripleThreat, gauntlet] = await Promise.all([
      countTripleThreatSynchronized(dbosPool),
      countGauntletHardened(gauntletPool)
    ]);
    reply.send({ counters: { triple_threat: tripleThreat, gauntlet } });
  });

  app.get("/arena/api/trilium/children", async (request, reply) => {
    const { noteId } = request.query as { noteId?: string };
    const targetNoteId = noteId || config.trilium.arenaRootNoteId;
    if (!targetNoteId) {
      return reply.code(503).send({ error: "trilium_arena_root_not_configured" });
    }
    try {
      const result = await browseTriliumNote(config.trilium, targetNoteId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof TriliumProjectionDisabledError) {
        return reply.code(503).send({ error: "trilium_browsing_disabled" });
      }
      request.log.error({ err: error, noteId: targetNoteId }, "arena trilium browse failed");
      return reply.code(502).send({ error: "trilium_browse_failed" });
    }
  });
}
