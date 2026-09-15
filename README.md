# product-builder

**A working full-stack application written end to end by a team of five agents** — and the
harness that made them agree with each other.

The product is a customer profile and KYC onboarding flow: a three-step React wizard, an
Express API with profile and KYC routes, a shared type module, and a contract test suite.
None of it was written by hand. It is the output artefact of a
[hooteams](https://github.com/kolisachint/hooteams) run, kept in version control so the
result can be inspected rather than described.

## The interesting part is the config, not the app

[`hooteams.config.json`](hooteams.config.json) defines the team:

| Agent | Owns |
| --- | --- |
| **SpecAgent** | Translates the goal into scoped, testable *Negotiation Candidates* and writes a canonical Scope Lock to the shared board |
| **ArchAgent** | Owns the System Blueprint — backend schema, frontend contracts, `shared_types` with exactly one source of truth |
| **BackendAgent** | Reads the blueprint, then implements the API and data layer against it |
| **FrontendAgent** | Reads the blueprint, then derives its client models from the same `shared_types` |
| **QAAgent** | Pre-emptive test architect — writes *failing* tests against the contract before the code exists |
| **BridgeAgent** *(validator)* | Judges whether backend and frontend contracts are actually compatible, and returns `GOAL_UNMET: <reason>` to the blueprint role if not |

That last row is the whole point. The classic failure of parallel agents is two halves that
each look correct and do not fit together. Here the blueprint is written **once**, before any
code, to a shared board; both implementers read it rather than each other; and a validator
with the authority to reject sits between them and "done". The loop terminates on a contract
check, not on the agents' own confidence.

## Running it

```sh
npm install
npm run dev        # Express on the backend
npm run test:run   # vitest — unit, API and cross-layer contract tests
cd frontend && npm install && npm run dev
```

```
backend/    routes (profiles, kyc), services, in-memory store, API tests
frontend/   React onboarding wizard, step components, component tests
shared/     shared_types.ts — the single source of truth both sides derive from
integration/e2e.contract.test.ts — the cross-layer check
```

Storage is in-memory by design; persistence was out of scope for the run.
