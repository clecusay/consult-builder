---
name: CSA feedback items still pending
description: Remaining feedback from Dallas/Ingrid (Apr 2026) that needs product decisions before implementing
type: project
---

The following feedback items from the April 2026 CSA review require product decisions before implementing:

**Dallas H - Form flow:**
- H-C: Attaching a link to book a consult (discussed previously but not implemented)
- H-E: High-funnel leads who just want info — should we offer procedure info / before-and-afters instead of pushing straight to consult?

**Ingrid - UX:**
- Notes/free-text field for patients to write to the doctor (can be added via admin form config, but should it be a default field?)
- Communication preferences simplification (currently multiple checkboxes, Ingrid wants one simple checkbox + newsletter)
- "Go back/exit" button to return to the original website
- Flanks should appear on back body view too (current schema only supports one diagram_view per region — needs schema change)
- Success page should explain next steps more thoroughly

**Why:** These all involve product/UX decisions that impact the overall flow and can't be resolved purely by code changes.
**How to apply:** Discuss with Scott/team before implementing. May require separate PRs.
