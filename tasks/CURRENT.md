# CURRENT.md — Active Task

> This is the session-level spec. Update before every coding session.
> The LLM reads this to know exactly what to build — and what to leave alone.
> When done, move to BACKLOG.md and write the next task here.

---

## Task: Initial Setup — Awaiting Product Specification

**Status:** Not started
**Branch:** `main`
**Estimated effort:** Small

---

## What

ChatUI scaffold is set up from sw-dev-blueprint. Awaiting product specification to define the first feature.

---

## Acceptance Criteria

> Write each criterion in EARS form so it maps one-to-one to a test (sharpens INV-1).
> <!-- EARS forms:
>      THE SYSTEM SHALL <behavior>                      (always)
>      WHEN <trigger>, THE SYSTEM SHALL <response>       (event)
>      WHILE <state>, THE SYSTEM SHALL <behavior>        (during a state)
>      IF <condition>, THEN THE SYSTEM SHALL <response>  (error/edge)
>      WHERE <feature>, THE SYSTEM SHALL <behavior>      (optional feature)
>      One clause = one test. Attach a concrete I/O example where useful. -->

- [ ] _Acceptance criteria TBD — pending product specification_
- [ ] Tests pass for the above; no existing tests broken

---

## Out of Scope

> Explicit. Prevents the LLM from building things you don't want yet.

- _Nothing yet — pending product specification_

---

## Files Likely Involved

> Give the LLM a map so it edits the right files.

```
_TBD — pending product specification_
```

---

## Notes / Context

_Project scaffolded from sw-dev-blueprint. Awaiting product specification._

---

---

## Flagged Assumptions

> Where the casual instruction was ambiguous, the PM picked a reading. List each pick here.
> This is the human's review surface — they scan only this + Acceptance Criteria.

- _No ambiguities yet — no spec defined_

---

## Approval

**Status:** Draft
**Approved by:** _pending_

> Build does NOT start until Status: Approved. Once Approved, Acceptance Criteria are FROZEN —
> no agent may edit them. Changes require a new Draft cycle and re-approval.

---

## Definition of Done

- [ ] Acceptance criteria all checked
- [ ] Tests written and passing
- [ ] `docs/ARCHITECTURE.md` updated if structure changed
- [ ] `docs/DECISIONS.md` updated if non-obvious choice was made
- [ ] No linter errors (`ruff check src/`)
- [ ] Branch merged to main
