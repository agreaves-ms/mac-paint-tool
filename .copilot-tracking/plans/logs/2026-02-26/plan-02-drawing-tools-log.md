<!-- markdownlint-disable-file -->
# Planning Log: Plan 02 — P0 Core Drawing Tools

**Related Plan**: [plan-02-drawing-tools.instructions.md](../../2026-02-26/plan-02-drawing-tools.instructions.md)

## Discrepancy Log

### Unaddressed Research Items

* DR-06 (inherited): Euclidean RGB distance used instead of perceptual weighting — standard and sufficient per research
  * Source: mac-paint-app-features-research.md (Lines 377-380)
  * Reason: Euclidean RGB distance is standard and sufficient; perceptual weighting noted as optional enhancement
  * Impact: low

## Implementation Paths Considered

* Selected: Scanline queue-based flood fill — per research benchmarking (mac-paint-app-features-research.md Lines 343-366)
  * Reason: O(n) time, no stack overflow risk, ~15ms on 1024×768
* IP-01: Recursive flood fill — rejected
  * Reason: Stack overflow risk on large uniform regions; JavaScript call stack limit ~10K–25K frames

## Suggested Follow-On Work

* WI-01: Perceptual color distance — optional upgrade to use CIE ΔE*ab instead of Euclidean RGB for color-tolerance selection and flood fill tolerance
  * Rationale: Euclidean RGB treats all channels equally; perceptual weighting better matches human color perception
  * Priority: Low — current approach is standard and functional

## User Decisions

(No user decisions recorded yet.)
