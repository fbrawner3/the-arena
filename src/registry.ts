// The workflow-type registry is what makes Arena a general DBOS front end
// instead of a Triple-Threat/Gauntlet-only page (see Trilium "The Arena"
// project note). The Workflow picker and Home page counters both read this
// list -- adding a third DBOS workflow type later means adding an entry
// here plus its status/counter wiring in routes.ts, not touching the page.
export interface ArenaWorkflowType {
  id: string;
  label: string;
  // CSS color, matches the locked Arena palette (blue/purple/orange).
  color: string;
  // Triple Threat pauses for human approve/deny at defined gates; Gauntlet
  // never pauses -- it runs start-to-finish autonomously. This flag decides
  // whether the round status page shows an Approve/Deny modal at all.
  hasApprovalGates: boolean;
  // Triple Threat can produce a blocker/warning that needs investigation
  // evidence before a gate unblocks. Gauntlet has no such concept -- it
  // produces findings (see hasFindingsTable), not blockers. This flag
  // decides whether the blocker/warning modal (Screen 4) applies.
  hasBlockerSystem: boolean;
  // Triple Threat exposes a granular per-line event stream
  // (GET /tt-workflows/:workflowId/events). Gauntlet only exposes coarse
  // status (requested/independent_reviews/cross_agent_challenge/succeeded/
  // failed) -- no line-by-line log to show.
  hasEventStream: boolean;
  // Gauntlet has no gates/blockers to show progress against -- instead it
  // produces a severity-ranked findings table once reviews complete
  // (GET /gauntlet/runs/:workflowId/findings). Triple Threat has no
  // equivalent.
  hasFindingsTable: boolean;
  // Label under the Home page lifetime counter. Worded per workflow type --
  // TT's counter counts completed rounds ("created"), Gauntlet's counts
  // verdict-passed proposals ("hardened") -- not the same claim, so not the
  // same word.
  counterLabel: string;
  // Served by GET /arena/assets/:file (routes.ts's ASSET_FILES allowlist).
  iconPath: string;
  logoPath: string;
}

export const ARENA_WORKFLOW_TYPES: ArenaWorkflowType[] = [
  {
    id: "triple_threat",
    label: "Triple Threat",
    color: "#2f6fed",
    hasApprovalGates: true,
    hasBlockerSystem: true,
    hasEventStream: true,
    hasFindingsTable: false,
    counterLabel: "lifetime created",
    iconPath: "/arena/assets/tt-icon.jpg",
    logoPath: "/arena/assets/tt-logo.jpg"
  },
  {
    id: "gauntlet",
    label: "Gauntlet",
    color: "#8b5cf6",
    hasApprovalGates: false,
    hasBlockerSystem: false,
    hasEventStream: false,
    hasFindingsTable: true,
    counterLabel: "lifetime hardened",
    iconPath: "/arena/assets/gauntlet-icon.png",
    logoPath: "/arena/assets/gauntlet-logo.jpg"
  }
];
