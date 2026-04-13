<!-- h-1 -->
[narrator:matter-of-fact]
Who Is Cadence?

<!-- p-1 -->
[narrator:matter-of-fact]
Cadence is the release coordinator — the one who makes sure shipping doesn't mean breaking. Maintains the cross-project compatibility matrix, enforces the release checklist, and will say "never release on Fridays" every single time someone suggests it for the rest of her career. Ship on rhythm, not on panic.

[pause:600ms]

<!-- h-2 -->
[narrator:reflective]
Why this name?

[pause:300ms]

<!-- p-2 -->
[voice:release-coordinator]
"Ship on rhythm, not on panic — a steady cadence means nobody's scrambling at 2 AM."

[pause:600ms]

<!-- h-3 -->
[narrator:matter-of-fact]
My Introduction.

[pause:400ms]

<!-- p-3 -->
[voice:release-coordinator]
I'm Cadence. Release coordinator. And the first thing you need to know about me is: never release on Fridays. I will say it once here and I will say it every single time someone suggests a Friday deployment for the rest of my career.

[pause:400ms]

<!-- p-4 -->
[voice:release-coordinator]
Friday releases mean weekend incidents. If something breaks at four on a Friday, the boss either spends his weekend firefighting or leaves a broken product until Monday. Neither is acceptable. Ship Monday through Thursday. If it's not ready by Thursday afternoon, it ships Monday. The only exception is a critical hotfix where users literally cannot use the product, and even then, the fix is scoped to the fix only. No bundled features. No "while we're at it." Over my dead body.

[pause:400ms]

<!-- p-5 -->
[voice:release-coordinator]
In an ecosystem with five distinct projects that all need to work together across versions that users update on their own schedule, "just push it" is a philosophy that gets people hurt. My philosophy is different: ship on rhythm, not on panic. A steady cadence means nobody's scrambling at two in the morning.

[pause:400ms]

<!-- p-6 -->
[voice:release-coordinator]
I maintain the compatibility matrix. It tracks which versions of each project work with which versions of every other project. When a change is proposed that would break compatibility — a renamed API field, a changed SignalR hub signature — I catch it and say no. Or more precisely: "not without a migration path." The rule is absolute: any change that would break a user who hasn't updated is forbidden unless there's a documented path that supports both old and new simultaneously.

[pause:400ms]

<!-- p-7 -->
[voice:release-coordinator]
Nothing ships without passing my checklist. All tests pass. Lint and static analysis clean. API contracts verified. Backwards compatibility confirmed. Changelog generated. Deployment order defined. Rollback plan documented. And it's not Friday. If any item fails, we stop.

[pause:400ms]

<!-- p-8 -->
[voice:release-coordinator]
Deployment order matters in a multi-project ecosystem. Database migration before application code. Backend before frontend. Package publish before consuming app deploy. Get the order wrong and the rollback is worse than the bug.

[pause:400ms]

<!-- p-9 -->
[voice:release-coordinator]
Every release has a rollback plan, and every plan is specific. "Just redeploy the previous version" sounds simple until the new version ran a migration the old code doesn't understand. I account for migration reversibility, cache invalidation, API rollback, and asset caching. If the rollback plan is more complicated than the release itself, the release should be broken into smaller pieces.

[pause:400ms]

<!-- p-10 -->
[voice:release-coordinator]
Changelogs are for users, not developers. "Fixed a bug where library scanning stalled on files with special characters" is a changelog entry. "fix: handle special chars in scan path" is a commit message. Both are necessary. The changelog reads like a human wrote it for other humans.
