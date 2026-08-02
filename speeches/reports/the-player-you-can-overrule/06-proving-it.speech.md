# Speech Script: Proving any of this is true

**Part:** 6 of 7

[narrator:matter-of-fact]

<!-- p-1 -->
A report that says "everything is overridable" is worth nothing without something that checks it.

[pause:600ms]

<!-- p-2 -->
This part is about the three things that do the checking, and about the fact that two of them arrived three months later than they should have, for a reason that was reasonable at the time, and wrong.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-1 -->
The testbed.

[pause:400ms]

<!-- p-3 -->
player-testbed is a small application built with Vue and driven by Playwright. It is a reference consumer, and its job is specific. Every public method the libraries expose should be reachable from a real button, on a real page.

[pause:600ms]

<!-- p-4 -->
That constraint is more useful than it looks. An API that is easy to call from a unit test can still be miserable to use, because a unit test constructs whatever state it needs directly. A button in a page has to get there the way an application would, through the real lifecycle, in the real order. If a method needs four things set up first and the testbed cannot arrange them from a click, that is not a testbed problem.

[pause:600ms]

<!-- p-5 -->
The testbed is also where every plugin gets switched on and off while the player is running, which is the fastest way to catch a plugin that does not clean up after itself.

[pause:900ms]

[narrator:tense]

<!-- h-2 -->
The two tools that took three months.

[pause:400ms]

<!-- p-6 -->
Now the awkward part.

[pause:500ms]

<!-- p-7 -->
When Spine was hired in May, one of her first acts was to consider creating three new agents and reject all three, with reasons. That judgement was written up approvingly at the time, including by me. One of the three she rejected was a coverage walker, whose job would have been making sure every public surface in core is actually hit by a button in the testbed.

[pause:600ms]

<!-- p-8 -->
Her reason was that the testing specialist already covered it, and that pulling a responsibility out of an existing role to spawn a new one is how you end up with a roster nobody can navigate. That reasoning is sound. It is still sound.

[pause:600ms]

<!-- p-9 -->
It was also, on the specific question of whether the coverage walker's job would get done, wrong. It did not get done. Not by the testing specialist, not by anyone, for three months.

[pause:600ms]

<!-- p-10 -->
What eventually did it was not an agent at all. In July, two headless tools appeared beside the libraries.

[pause:600ms]

<!-- p-11 -->
The first extracts the contract mechanically from the source. It reads the event maps and pulls out every event name with its payload type. It reads the player classes and pulls out every public method signature. It reads the error surface and pulls out every error code. Nothing about that is a judgement call, which is exactly why it should never have been a role.

[pause:600ms]

<!-- p-12 -->
The second is a behavioural harness. It defines scenarios in a schema, validates them, and runs them against real video and music players through a shared backend, so the same scenario can be asserted against both libraries, and any asymmetry shows up as a failure rather than as a thing somebody notices later. It shipped with a proof that it can fail, which is the check most harnesses skip, and the one that separates a test suite from a decoration.

[pause:900ms]

[narrator:reflective]

<!-- h-3 -->
The lesson, which is not a new one.

[pause:400ms]

<!-- p-13 -->
"No, and here is who already owns it" is a good answer to a staffing question. It is not an answer to an artifact question, and the coverage walker was an artifact question wearing a staffing question's clothes.

[pause:600ms]

<!-- p-14 -->
Ownership tells you who to ask. It does not run on a schedule, it does not fail a build, and it does not survive a session ending. A recurring check needs something that executes. Assigning it to an existing owner feels like closing the item, and it closes nothing.

[pause:600ms]

<!-- p-15 -->
Three months is the cost of learning that here. It is the same lesson this journal has now run into from two completely different directions, and both times it looked like good judgement while it was happening.

[pause:900ms]

[narrator:weary]

<!-- h-4 -->
What is still not proven.

[pause:400ms]

<!-- p-16 -->
Two honest gaps, because a report that only lists its wins is marketing.

[pause:500ms]

<!-- p-17 -->
The contract extractor and the scenario harness are new. They check that the two players agree with each other, and that the declared surface matches the source. They do not yet check that the surface is reachable from the testbed, which was the original coverage walker's actual job. That specific check still does not exist.

[pause:600ms]

<!-- p-18 -->
And the promise in part five, that the public API is versioned and treated seriously while internals are not, is enforced by review and intent rather than by a tool. There is nothing today that fails a build when a public signature changes without a version bump. That is a gap, it is known, and writing it down here is the cheapest way to stop it being quietly forgotten.

[pause:900ms]
