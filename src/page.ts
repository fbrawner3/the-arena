// Same pattern as approvalsPage.ts: embedded (not a sibling .html file)
// because the build only compiles .ts -> dist/, and MCP_TOKEN is baked into
// the rendered page so the browser's own fetch() calls can hit the still-
// gated /arena/api/* routes without an operator typing anything in. See
// server.js's onRequest hook for the matching /arena exemption.
export function renderArenaPage(mcpToken: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>The Arena</title>
<link rel="icon" type="image/jpeg" href="/arena/assets/arena-icon.jpg">
<style>
  :root {
    color-scheme: dark;
    --bg: #0b0d12;
    --panel: #14171f;
    --border: #262a35;
    --text: #e6e8ee;
    --muted: #8b8fa3;
    --tt: #2f6fed;
    --gauntlet: #8b5cf6;
    --accent: #f2994a;
  }
  * { box-sizing: border-box; }
  body {
    font-family: system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem 1rem 4rem;
  }
  .header-logo {
    display: block;
    max-width: 420px;
    width: 100%;
    height: auto;
    margin: 0 auto 2rem;
    mix-blend-mode: screen;
    border: 2px solid var(--accent);
    border-radius: 12px;
  }
  .type-icon {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    margin-bottom: 0.5rem;
  }
  /* Only for icons with a flat (non-transparent) black background -- a
     real-alpha PNG (.blend-off) skips this, since screen-blending an
     opaque pixel still lightens its true color regardless of transparency
     elsewhere in the image. */
  .type-icon:not(.blend-off) {
    mix-blend-mode: screen;
  }
  .home-row {
    display: flex;
    gap: 1.5rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 2.5rem;
  }
  .type-card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem 2rem;
    min-width: 220px;
    text-align: center;
    cursor: pointer;
  }
  .type-card .label {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  .type-card .count {
    font-size: 2.25rem;
    font-weight: 700;
    line-height: 1;
  }
  .type-card .count-label {
    color: var(--muted);
    font-size: 0.75rem;
    margin-top: 0.35rem;
  }
  #status-panel {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    min-height: 4rem;
  }
  .muted { color: var(--muted); }
  .error { color: #e05252; }
  .tabs { display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 1.5rem; }
  .tabs button {
    background: var(--panel);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.5rem 1.25rem;
    cursor: pointer;
    font-size: 0.9rem;
  }
  .tabs button.active { border-color: var(--accent); color: var(--accent); }
  .view { display: none; }
  .view.active { display: block; }
  .breadcrumb { font-size: 0.85rem; color: var(--muted); margin-bottom: 1rem; }
  .breadcrumb span { cursor: pointer; }
  .breadcrumb span:hover { color: var(--text); }
  .tree-list { list-style: none; margin: 0; padding: 0; }
  .tree-list li {
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
  }
  .tree-list li:hover { border-color: var(--accent); }
  .tree-list li .pick-btn {
    background: transparent;
    color: var(--accent);
    border: 1px solid var(--accent);
    border-radius: 6px;
    padding: 0.25rem 0.6rem;
    font-size: 0.8rem;
    cursor: pointer;
  }
  .selected-source {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--accent);
    border-radius: 8px;
    font-size: 0.9rem;
  }
  .field { margin-bottom: 1rem; }
  .field label { display: block; margin-bottom: 0.35rem; font-size: 0.85rem; color: var(--muted); }
  .field input, .field textarea {
    width: 100%;
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0.5rem;
    font-family: inherit;
    box-sizing: border-box;
  }
  .field textarea { min-height: 6rem; font-family: monospace; font-size: 0.85em; }
  .btn {
    background: var(--accent);
    color: #1a1200;
    border: none;
    border-radius: 6px;
    padding: 0.6rem 1.25rem;
    font-weight: 600;
    cursor: pointer;
  }
  .btn:disabled { opacity: 0.5; cursor: default; }
  .btn-outline {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 6px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    margin-right: 0.5rem;
  }
  .stage-list { list-style: none; margin: 1rem 0 0; padding: 0; }
  .stage-list li {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    margin-bottom: 0.4rem;
    font-size: 0.9rem;
  }
  .stage-list .stage-status { color: var(--muted); font-size: 0.8rem; }
  .gate-box {
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid var(--accent);
    border-radius: 8px;
  }
  .findings-table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.85rem; }
  .findings-table th, .findings-table td {
    text-align: left;
    padding: 0.5rem;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
  }
  .sev-critical { color: #e05252; font-weight: 700; }
  .sev-high { color: #f2994a; font-weight: 700; }
  .sev-medium { color: #e0c452; }
  .sev-low { color: var(--muted); }
  .sev-observation { color: var(--muted); font-style: italic; }
  .blocker-card {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.85rem 1rem;
    margin-bottom: 0.75rem;
  }
  .blocker-card.status-proposed { border-left: 3px solid #e0c452; }
  .blocker-card.status-resolved { border-left: 3px solid #f2994a; }
  .blocker-card.status-verified { border-left: 3px solid #4caf50; }
  .blocker-card summary { cursor: pointer; font-size: 0.85rem; color: var(--muted); margin: 0.5rem 0; }
  .blocker-card .badge { font-size: 0.75rem; padding: 0.1rem 0.5rem; border-radius: 4px; margin-left: 0.5rem; }
  .badge-proposed { background: #3a331a; color: #e0c452; }
  .badge-resolved { background: #3a2a15; color: #f2994a; }
  .badge-verified { background: #16321c; color: #4caf50; }
</style>
</head>
<body>
<img class="header-logo" src="/arena/assets/arena-logo.jpg" alt="The Arena — Command, Approve, Launch">

<div class="tabs">
  <button id="tab-home" class="active">Home</button>
  <button id="tab-picker">Pick Source</button>
</div>

<div id="view-home" class="view active">
  <div id="home-row" class="home-row">
    <div class="muted">Loading workflow types...</div>
  </div>
  <div id="status-panel">
    <div class="muted">Pick a workflow type above to view its rounds.</div>
  </div>
</div>

<div id="view-picker" class="view">
  <div id="breadcrumb" class="breadcrumb"></div>
  <ul id="tree-list" class="tree-list">
    <li class="muted">Loading...</li>
  </ul>
  <div id="selected-source" class="selected-source" style="display:none;"></div>
</div>

<script>
const MCP_TOKEN = ${JSON.stringify(mcpToken)};

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { ...(options.headers || {}), "x-mcp-token": MCP_TOKEN }
  });
  if (!response.ok) {
    let detail = "";
    try { detail = (await response.json()).error || ""; } catch {}
    throw new Error("HTTP " + response.status + (detail ? " (" + detail + ")" : ""));
  }
  return response.json();
}

// Mirrors STAGE_DEFINITIONS in src/dbos/workflows/tripleThreatPrompts.ts --
// stable, spec'd mapping, not guessed. If that file's specialist
// assignments ever change, update this too.
const TT_STAGE_SPECIALISTS = {
  design: "claude",
  architecture: "claude",
  codex_review: "codex",
  antigravity_review: "antigravity",
  adjudication: "claude",
  decision_register: "claude",
  implementation: "codex",
  validation: "claude"
};
const TT_STAGE_ORDER = Object.keys(TT_STAGE_SPECIALISTS);
const TT_TERMINAL_STATUSES = ["synchronized", "cancelled", "failed"];
const GAUNTLET_TERMINAL_STATUSES = ["succeeded", "failed"];

function stopPolling() {
  if (window.arenaPollTimer) {
    clearInterval(window.arenaPollTimer);
    window.arenaPollTimer = null;
  }
}

function renderViewExistingRound(type) {
  const idPlaceholder = type.id === "triple_threat" ? "e.g. drift-detection-round-1" : "e.g. gauntlet-<idempotencyKey>";
  return (
    '<div class="field" style="margin-top:1rem;"><label>View an existing ' + type.label + ' run (workflow ID)</label>' +
    '<input id="view-existing-id" type="text" placeholder="' + idPlaceholder + '"></div>' +
    '<button class="btn-outline" id="view-existing-btn">View Status</button>' +
    '<div id="view-existing-error" class="error" style="margin-top:0.5rem;"></div>'
  );
}

function wireViewExistingRound(type) {
  document.getElementById("view-existing-btn").onclick = () => {
    const id = document.getElementById("view-existing-id").value.trim();
    const errEl = document.getElementById("view-existing-error");
    if (!id) { errEl.textContent = "Enter a workflow ID."; return; }
    errEl.textContent = "";
    if (type.id === "triple_threat") startTtPolling(id);
    else startGauntletPolling(id);
  };
}

function openWorkflowType(type) {
  stopPolling();
  const panel = document.getElementById("status-panel");
  const sourceNote = window.arenaSelectedSource;
  if (!sourceNote) {
    panel.innerHTML =
      '<div><strong>' + type.label + '</strong></div>' +
      renderViewExistingRound(type) +
      '<hr style="border-color:var(--border); margin:1.25rem 0;">' +
      '<div class="muted">Pick a source to launch a new run.</div>' +
      '<button class="btn-outline" id="goto-picker" style="margin-top:0.75rem;">Pick Source</button>';
    wireViewExistingRound(type);
    document.getElementById("goto-picker").onclick = () => {
      switchTab("picker");
      if (breadcrumbTrail.length === 0) loadChildren(undefined, false);
    };
    return;
  }
  if (type.id === "triple_threat") renderTtLaunchForm(panel, sourceNote);
  else if (type.id === "gauntlet") renderGauntletLaunchForm(panel, sourceNote);
  else panel.innerHTML = '<div class="error">Unknown workflow type.</div>';
}

function slugify(title) {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project";
}

function renderTtLaunchForm(panel, sourceNote) {
  const slug = slugify(sourceNote.title);
  panel.innerHTML =
    '<div><strong>Triple Threat</strong> &mdash; ' + sourceNote.title + '</div>' +
    renderViewExistingRound({ id: "triple_threat", label: "Triple Threat" }) +
    '<hr style="border-color:var(--border); margin:1.25rem 0;">' +
    '<div class="field"><label>Round</label><input id="tt-round" type="number" min="1" value="1"></div>' +
    '<div class="field"><label>Requested by</label><input id="tt-requested-by" type="text" value="arena"></div>' +
    '<button class="btn" id="tt-launch-btn">Launch New Round</button>' +
    '<div id="tt-launch-error" class="error" style="margin-top:0.5rem;"></div>';
  wireViewExistingRound({ id: "triple_threat", label: "Triple Threat" });
  document.getElementById("tt-launch-btn").onclick = async () => {
    const button = document.getElementById("tt-launch-btn");
    const errEl = document.getElementById("tt-launch-error");
    errEl.textContent = "";
    button.disabled = true;
    try {
      const round = Number(document.getElementById("tt-round").value) || 1;
      const requestedBy = document.getElementById("tt-requested-by").value.trim() || "arena";
      const body = {
        projectSlug: slug,
        projectName: sourceNote.title,
        projectDir: slug,
        round,
        requestedBy,
        triliumParentNoteId: sourceNote.noteId
      };
      const result = await api("/tt-workflows", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      startTtPolling(result.workflowId);
    } catch (err) {
      errEl.textContent = "Launch failed: " + err.message;
      button.disabled = false;
    }
  };
}

function renderGauntletLaunchForm(panel, sourceNote) {
  const defaultProposal = "Review the project under Trilium note '" + sourceNote.title + "' (noteId: " + sourceNote.noteId + "). Read that note and its child notes for the full proposal.";
  panel.innerHTML =
    '<div><strong>Gauntlet</strong> &mdash; ' + sourceNote.title + '</div>' +
    '<div class="field" style="margin-top:1rem;"><label>Proposal name</label><input id="g-name" type="text" value="' + sourceNote.title.replace(/"/g, "&quot;") + '"></div>' +
    '<div class="field"><label>Proposal</label><textarea id="g-proposal">' + defaultProposal + '</textarea></div>' +
    '<div class="field"><label>Requested by</label><input id="g-requested-by" type="text" value="arena"></div>' +
    '<button class="btn" id="g-launch-btn">Launch Gauntlet</button>' +
    '<div id="g-launch-error" class="error" style="margin-top:0.5rem;"></div>';
  document.getElementById("g-launch-btn").onclick = async () => {
    const button = document.getElementById("g-launch-btn");
    const errEl = document.getElementById("g-launch-error");
    errEl.textContent = "";
    button.disabled = true;
    try {
      const idempotencyKey = "arena-" + sourceNote.noteId + "-" + Date.now();
      const body = {
        proposalName: document.getElementById("g-name").value.trim() || sourceNote.title,
        proposal: document.getElementById("g-proposal").value,
        requestedBy: document.getElementById("g-requested-by").value.trim() || "arena",
        idempotencyKey,
        projectSlug: slugify(sourceNote.title),
        triliumSourceNoteId: sourceNote.noteId
      };
      const result = await api("/gauntlet/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      startGauntletPolling(result.workflowId);
    } catch (err) {
      errEl.textContent = "Launch failed: " + err.message;
      button.disabled = false;
    }
  };
}

function startTtPolling(workflowId) {
  stopPolling();
  const render = () => renderTtStatus(workflowId);
  render();
  window.arenaPollTimer = setInterval(render, 5000);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function buildBlockerPrompt(blocker) {
  // Matches the wording already established in approvalsPage.ts's
  // showInvestigationPrompt -- same prompt shape, ported here.
  const lines = [
    "I am working on Triple-Threat blocker " + blocker.blockerId + ".",
    "",
    "Title: " + blocker.title,
    "Question: " + (blocker.question || "(not recorded)"),
    "Why it blocks: " + (blocker.whyItBlocks || "(not recorded)"),
    "Recommendation so far: " + (blocker.recommendation || "(none)"),
    "",
    "Investigate only " + blocker.blockerId + ". Verify claims against the available project files and read-only live evidence.",
    "Do not invent hostnames, identities, architecture, implementation status, or evidence.",
    "",
    "Structure your final response as exactly two labeled sections, in this order, so it can be pasted",
    "directly into a decision-tracking tool with matching fields:",
    "",
    "DECISION:",
    "<the final decision text to record -- your recommendation, alternatives considered, and consequences>",
    "",
    "EVIDENCE:",
    "<the concrete live-read facts that support the decision above -- file paths, exact quoted lines, command output.",
    "If no live evidence was required or found, write 'none' here rather than leaving it blank.>",
    "",
    "If anything remains genuinely unresolved (a decision only Felton can authorize, an API that needs separate",
    "confirmation, etc.), say so plainly inside DECISION rather than adding a third section.",
    "Do not deploy, install, activate, commit, push, or make live changes."
  ];
  return lines.join(String.fromCharCode(10));
}

async function copyToClipboard(text, button) {
  const original = button.textContent;
  let ok = false;
  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch {
    try {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.focus();
      helper.select();
      ok = document.execCommand("copy");
      document.body.removeChild(helper);
    } catch {
      ok = false;
    }
  }
  button.textContent = ok ? "Copied!" : "Copy failed -- select manually below";
  if (!ok) {
    const box = document.createElement("textarea");
    box.value = text;
    box.readOnly = true;
    box.style.width = "100%";
    box.style.minHeight = "8rem";
    box.style.marginTop = "0.5rem";
    box.onclick = () => box.select();
    button.parentElement.appendChild(box);
  }
  setTimeout(() => { button.textContent = original; }, 2000);
}

function renderBlockerCard(workflowId, blocker) {
  const badge = '<span class="badge badge-' + blocker.status + (blocker.verified ? "-verified" : "") + '">' +
    (blocker.verified ? "verified" : blocker.status) + '</span>';
  let actionHtml = "";
  if (blocker.status === "proposed") {
    actionHtml =
      '<div class="field"><label>Decision</label><textarea id="decision-' + blocker.blockerId + '"></textarea></div>' +
      (blocker.evidenceRequired
        ? '<div class="field"><label>Evidence (required to verify)</label><textarea id="evidence-' + blocker.blockerId + '"></textarea></div>'
        : '<div class="field"><label>Evidence (optional)</label><textarea id="evidence-' + blocker.blockerId + '"></textarea></div>') +
      '<button class="btn" data-record="' + blocker.blockerId + '">Record Decision</button>' +
      '<div class="error" data-record-err="' + blocker.blockerId + '" style="margin-top:0.4rem;"></div>';
  } else if (blocker.status === "resolved" && !blocker.verified) {
    actionHtml =
      '<div><strong>Decision:</strong> ' + escapeHtml(blocker.decision) + '</div>' +
      (blocker.evidence ? '<div style="margin-top:0.35rem;"><strong>Evidence:</strong> ' + escapeHtml(blocker.evidence) + '</div>' : "") +
      '<button class="btn" style="margin-top:0.6rem;" data-verify="' + blocker.blockerId + '">Verify</button>' +
      '<div class="error" data-verify-err="' + blocker.blockerId + '" style="margin-top:0.4rem;"></div>';
  } else {
    actionHtml =
      '<div><strong>Decision:</strong> ' + escapeHtml(blocker.decision) + '</div>' +
      (blocker.evidence ? '<div style="margin-top:0.35rem;"><strong>Evidence:</strong> ' + escapeHtml(blocker.evidence) + '</div>' : "");
  }
  return (
    '<div class="blocker-card status-' + blocker.status + (blocker.verified ? " status-verified" : "") + '">' +
    '<div><strong>' + blocker.blockerId + '</strong> — ' + escapeHtml(blocker.title) + badge + '</div>' +
    '<details><summary>Question / why it blocks / recommendation</summary>' +
    (blocker.question ? '<div style="margin-top:0.4rem;"><strong>Question:</strong> ' + escapeHtml(blocker.question) + '</div>' : "") +
    (blocker.whyItBlocks ? '<div style="margin-top:0.4rem;"><strong>Why it blocks:</strong> ' + escapeHtml(blocker.whyItBlocks) + '</div>' : "") +
    (blocker.recommendation ? '<div style="margin-top:0.4rem;"><strong>Recommendation:</strong> ' + escapeHtml(blocker.recommendation) + '</div>' : "") +
    '</details>' +
    '<button class="btn-outline" data-copy-prompt="' + blocker.blockerId + '">Copy Prompt</button>' +
    '<div style="margin-top:0.5rem;">' + actionHtml + '</div>' +
    '</div>'
  );
}

function wireBlockerActions(workflowId, container, blockersById) {
  container.querySelectorAll("[data-copy-prompt]").forEach((button) => {
    button.onclick = () => {
      const blocker = blockersById[button.dataset.copyPrompt];
      if (blocker) copyToClipboard(buildBlockerPrompt(blocker), button);
    };
  });
  container.querySelectorAll("[data-record]").forEach((button) => {
    button.onclick = async () => {
      const blockerId = button.dataset.record;
      const errEl = container.querySelector('[data-record-err="' + blockerId + '"]');
      errEl.textContent = "";
      const decision = document.getElementById("decision-" + blockerId).value.trim();
      const evidence = document.getElementById("evidence-" + blockerId).value.trim();
      if (!decision) { errEl.textContent = "Decision text is required."; return; }
      button.disabled = true;
      try {
        await api("/tt-workflows/" + encodeURIComponent(workflowId) + "/blockers/" + encodeURIComponent(blockerId) + "/decision", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(evidence ? { decision, evidence } : { decision })
        });
        renderTtStatus(workflowId);
      } catch (err) {
        errEl.textContent = "Failed: " + err.message;
        button.disabled = false;
      }
    };
  });
  container.querySelectorAll("[data-verify]").forEach((button) => {
    button.onclick = async () => {
      const blockerId = button.dataset.verify;
      const errEl = container.querySelector('[data-verify-err="' + blockerId + '"]');
      errEl.textContent = "";
      button.disabled = true;
      try {
        await api("/tt-workflows/" + encodeURIComponent(workflowId) + "/blockers/" + encodeURIComponent(blockerId) + "/verify", {
          method: "POST"
        });
        renderTtStatus(workflowId);
      } catch (err) {
        errEl.textContent = "Failed: " + err.message;
        button.disabled = false;
      }
    };
  });
}

async function renderTtStatus(workflowId) {
  const panel = document.getElementById("status-panel");
  try {
    const [row, { artifacts }, { blockers }] = await Promise.all([
      api("/tt-workflows/" + encodeURIComponent(workflowId)),
      api("/tt-workflows/" + encodeURIComponent(workflowId) + "/artifacts"),
      api("/tt-workflows/" + encodeURIComponent(workflowId) + "/blockers")
    ]);
    const byStage = {};
    for (const a of artifacts) byStage[a.stage] = a.status;
    const stageRows = TT_STAGE_ORDER.map((stage) => {
      const status = byStage[stage] || "pending";
      const specialist = TT_STAGE_SPECIALISTS[stage];
      return '<li><span>' + stage + ' <span class="muted">(' + specialist + ')</span></span><span class="stage-status">' + status + '</span></li>';
    }).join("");
    let gateHtml = "";
    if (row.status === "awaiting_approval" && row.pendingGate) {
      gateHtml =
        '<div class="gate-box">' +
        '<div><strong>Gate pending:</strong> ' + row.pendingGate + '</div>' +
        '<div class="field" style="margin-top:0.75rem;"><label>Approved by</label><input id="approve-by" type="text" value="arena"></div>' +
        '<button class="btn" id="approve-btn">Approve</button>' +
        '<div id="approve-error" class="error" style="margin-top:0.5rem;"></div>' +
        '</div>';
    }
    const sortedBlockers = blockers.slice().sort((a, b) => {
      const numA = parseInt(a.blockerId.replace(/\\D/g, ""), 10) || 0;
      const numB = parseInt(b.blockerId.replace(/\\D/g, ""), 10) || 0;
      return numA - numB;
    });
    const blockersById = {};
    sortedBlockers.forEach((b) => { blockersById[b.blockerId] = b; });
    const blockersHtml = sortedBlockers.length
      ? '<h3 style="margin-top:1.5rem;">Blockers (' + sortedBlockers.filter((b) => b.verified).length + '/' + sortedBlockers.length + ' verified)</h3>' +
        sortedBlockers.map((b) => renderBlockerCard(workflowId, b)).join("")
      : "";
    panel.innerHTML =
      '<div><strong>Triple Threat</strong> &mdash; ' + workflowId + '</div>' +
      '<div class="muted" style="margin-top:0.25rem;">Status: ' + row.status + '</div>' +
      '<ul class="stage-list">' + stageRows + '</ul>' +
      gateHtml +
      blockersHtml;
    wireBlockerActions(workflowId, panel, blockersById);
    if (row.status === "awaiting_approval" && row.pendingGate) {
      document.getElementById("approve-btn").onclick = async () => {
        const button = document.getElementById("approve-btn");
        const errEl = document.getElementById("approve-error");
        errEl.textContent = "";
        button.disabled = true;
        try {
          const approvedBy = document.getElementById("approve-by").value.trim() || "arena";
          await api("/tt-workflows/" + encodeURIComponent(workflowId) + "/approve/" + encodeURIComponent(row.pendingGate), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ approvedBy })
          });
          renderTtStatus(workflowId);
        } catch (err) {
          errEl.textContent = "Approve failed: " + err.message;
          button.disabled = false;
        }
      };
    }
    if (TT_TERMINAL_STATUSES.includes(row.status)) stopPolling();
  } catch (err) {
    panel.innerHTML = '<div class="error">Failed to load status: ' + err.message + '</div>';
  }
}

function startGauntletPolling(workflowId) {
  stopPolling();
  const render = () => renderGauntletStatus(workflowId);
  render();
  window.arenaPollTimer = setInterval(render, 5000);
}

async function renderGauntletStatus(workflowId) {
  const panel = document.getElementById("status-panel");
  try {
    const row = await api("/gauntlet/runs/" + encodeURIComponent(workflowId));
    let findingsHtml = "";
    if (row.status === "succeeded" || row.status === "failed") {
      const { findings } = await api("/gauntlet/runs/" + encodeURIComponent(workflowId) + "/findings");
      if (findings.length) {
        findingsHtml =
          '<table class="findings-table"><thead><tr><th>Severity</th><th>Category</th><th>Scenario</th><th>Recommendation</th></tr></thead><tbody>' +
          findings.map((f) =>
            '<tr><td class="sev-' + f.severity + '">' + f.severity + '</td><td>' + f.category + '</td><td>' + f.scenario + '</td><td>' + f.recommendation + '</td></tr>'
          ).join("") +
          '</tbody></table>';
      } else {
        findingsHtml = '<div class="muted" style="margin-top:1rem;">No findings recorded.</div>';
      }
    }
    panel.innerHTML =
      '<div><strong>Gauntlet</strong> &mdash; ' + workflowId + '</div>' +
      '<div class="muted" style="margin-top:0.25rem;">Status: ' + row.status + (row.verdict ? " &mdash; Verdict: " + row.verdict : "") + '</div>' +
      findingsHtml;
    if (GAUNTLET_TERMINAL_STATUSES.includes(row.status)) stopPolling();
  } catch (err) {
    panel.innerHTML = '<div class="error">Failed to load status: ' + err.message + '</div>';
  }
}

async function loadHome() {
  const homeRow = document.getElementById("home-row");
  try {
    const [{ workflowTypes }, { counters }] = await Promise.all([
      api("/arena/api/registry"),
      api("/arena/api/counters")
    ]);
    homeRow.innerHTML = "";
    for (const type of workflowTypes) {
      const card = document.createElement("div");
      card.className = "type-card";
      card.style.borderColor = type.color;
      const count = counters[type.id];
      card.innerHTML =
        '<img class="type-icon' + (type.iconPath.endsWith(".png") ? " blend-off" : "") + '" src="' + type.iconPath + '" alt="' + type.label + '">' +
        '<div class="label" style="color:' + type.color + '">' + type.label + '</div>' +
        '<div class="count">' + (count === undefined ? "&mdash;" : count) + '</div>' +
        '<div class="count-label">' + type.counterLabel + '</div>';
      card.onclick = () => openWorkflowType(type);
      homeRow.appendChild(card);
    }
  } catch (err) {
    homeRow.innerHTML = '<div class="error">Failed to load: ' + err.message + '</div>';
  }
}

// --- Source picker ---
let breadcrumbTrail = []; // [{ noteId, title }]

function renderBreadcrumb() {
  const el = document.getElementById("breadcrumb");
  if (breadcrumbTrail.length === 0) { el.textContent = ""; return; }
  el.innerHTML = breadcrumbTrail
    .map((node, index) =>
      '<span data-index="' + index + '">' + node.title + '</span>' + (index < breadcrumbTrail.length - 1 ? " / " : "")
    )
    .join("");
  el.querySelectorAll("span").forEach((span) => {
    span.onclick = () => {
      const index = Number(span.dataset.index);
      const target = breadcrumbTrail[index];
      breadcrumbTrail = breadcrumbTrail.slice(0, index + 1);
      loadChildren(target.noteId, false);
    };
  });
}

function pickSource(node) {
  window.arenaSelectedSource = node;
  const el = document.getElementById("selected-source");
  el.style.display = "block";
  el.innerHTML = '<strong>Selected source:</strong> ' + node.title + ' <span class="muted">(' + node.noteId + ')</span>';
}

async function loadChildren(noteId, pushTrail) {
  const list = document.getElementById("tree-list");
  list.innerHTML = '<li class="muted">Loading...</li>';
  try {
    const result = await api("/arena/api/trilium/children" + (noteId ? "?noteId=" + encodeURIComponent(noteId) : ""));
    if (pushTrail || breadcrumbTrail.length === 0) {
      if (breadcrumbTrail.length === 0 || breadcrumbTrail[breadcrumbTrail.length - 1].noteId !== result.noteId) {
        breadcrumbTrail.push({ noteId: result.noteId, title: result.title });
      }
    }
    renderBreadcrumb();
    list.innerHTML = "";
    if (result.children.length === 0) {
      list.innerHTML = '<li class="muted" style="cursor:default;">No child notes here.</li>';
    }
    for (const child of result.children) {
      const item = document.createElement("li");
      item.innerHTML =
        '<span>' + child.title + '</span>' +
        '<span><button class="pick-btn" data-action="pick">Use as source</button></span>';
      item.querySelector("span").onclick = () => loadChildren(child.noteId, true);
      item.querySelector('[data-action="pick"]').onclick = (event) => {
        event.stopPropagation();
        pickSource(child);
      };
      list.appendChild(item);
    }
  } catch (err) {
    list.innerHTML = '<li class="error" style="cursor:default;">Failed to load: ' + err.message + '</li>';
  }
}

function switchTab(tab) {
  document.getElementById("tab-home").classList.toggle("active", tab === "home");
  document.getElementById("tab-picker").classList.toggle("active", tab === "picker");
  document.getElementById("view-home").classList.toggle("active", tab === "home");
  document.getElementById("view-picker").classList.toggle("active", tab === "picker");
}

document.getElementById("tab-home").onclick = () => switchTab("home");
document.getElementById("tab-picker").addEventListener("click", stopPolling);
document.getElementById("tab-picker").onclick = () => {
  switchTab("picker");
  if (breadcrumbTrail.length === 0) loadChildren(undefined, false);
};

loadHome();
</script>
</body>
</html>`;
}
