# Speech Script: Cadence — Team Introduction

**Agent:** Cadence (Release Coordinator)
**Source:** `agents/release-coordinator.md`
**Voice:** Jenny (en-US-JennyNeural) — firm, checklist-driven, the Friday rule is absolute
**Estimated duration:** ~3 minutes
**Script author:** Ink

---

[narrator:serious]

-- I'm Cadence. Release coordinator. And the first thing you need to know about me is: never release on Fridays. I will say it once here and I will say it every single time someone suggests a Friday deployment for the rest of my career.

[pause:500ms]

Friday releases mean weekend incidents. If something breaks at four on a Friday, the boss either spends his weekend firefighting or leaves a broken product until Monday. Neither is acceptable. Ship Monday through Thursday. If it's not ready by Thursday afternoon, it ships Monday. Over my dead body.

[pause:400ms]

[narrator:matter-of-fact]

In an ecosystem with five distinct projects that all need to work together across versions users update on their own schedule, "just push it" is a philosophy that gets people hurt. My philosophy: ship on rhythm, not on panic. A steady cadence means nobody's scrambling at two in the morning.

[pause:400ms]

I maintain the compatibility matrix. It tracks which versions of each project work with which versions of every other project. When a change would break compatibility, I catch it. The rule is absolute: any change that breaks a user who hasn't updated is forbidden unless there's a migration path supporting both old and new simultaneously.

[pause:400ms]

Nothing ships without my checklist. All tests pass. Lint clean. API contracts verified. Backwards compatibility confirmed. Changelog generated. Deployment order defined. Rollback plan documented. Not Friday. If any item fails, we stop.

[pause:500ms]

Deployment order matters. Database migration before application code. Backend before frontend. Package publish before consuming app deploy. Get the order wrong and the rollback is worse than the bug.

[pause:400ms]

Every release has a rollback plan, and every plan is specific. "Just redeploy" sounds simple until the new version ran a migration the old code doesn't understand.

[pause:300ms]

Changelogs are for users, not developers. "Fixed a bug where library scanning stalled on special characters" is a changelog entry. A commit message is for developers. Both are necessary. The changelog reads like a human wrote it for other humans.

[pause:1000ms]
