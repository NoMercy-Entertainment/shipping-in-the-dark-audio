# Speech Script: Guidance, never walls

**Part:** 5 of 7

[narrator:cozy]

Part 5. Guidance, never walls.

[pause:900ms]

[narrator:reflective]

<!-- p-1 -->
There is a decision in this project that a lot of library authors would consider a mistake, and it is the decision the whole trio is built on.

[pause:600ms]

<!-- p-2 -->
Nothing is sealed. No class is final. No method is truly private. Nothing throws an exception to stop you overriding it. If you want to reach into a part of the player we consider internal, you can, and the library will not stop you.

[pause:900ms]

[narrator:reflective]

<!-- h-1 -->
Why.

[pause:400ms]

<!-- p-3 -->
The reasoning is short. Stoney wrote it in July, and it is quoted back in part zero, but the operative half is worth repeating on its own.

[pause:500ms]

<!-- p-4 -->
But never to prevent the user from doing it anyway, because they want to.

[pause:600ms]

<!-- p-5 -->
The argument behind it goes like this. A sealed class is a bet that the author imagined every legitimate use. That bet is always wrong eventually. When it turns out wrong, the developer who needed the unimagined thing does not shrug and go home. They fork the library, or they vendor it, or they patch it at install time, or they abandon it. Every one of those outcomes is worse for everybody than if the door had simply been unlocked, because now their change is invisible to us and unmaintained by anyone.

[pause:600ms]

<!-- p-6 -->
The phrasing we use internally is that if a construct prevents, it is wrong. Guidance steers. Walls just relocate the problem somewhere we cannot see it.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
So where do the conventions live.

[pause:400ms]

<!-- p-7 -->
In a linter, which is exactly where an opinion belongs.

[pause:500ms]

<!-- p-8 -->
eslint-plugin-player is a separate package with its own version line, currently ten rules, all shipped at error level in the recommended preset. It carries only the parts of the standard a machine can judge without guessing. Naming intent, whether a comment earns its place, architectural fit — those stay with human review, because a rule that has to guess produces noise, and a noisy rule gets switched off wholesale along with the good ones next to it.

[pause:600ms]

<!-- p-9 -->
The ten rules split into three groups.

[pause:500ms]

<!-- p-10 -->
Some are about clarity. No single-letter identifiers, with exceptions for maths and loop counters. No object-literal casts, because typing the object where it is constructed is better than asserting its type where it is used. No unknown-to-type double casts unless there is a justification written on the line above, which again is a sentence to a future reader, not a permission.

[pause:600ms]

<!-- p-11 -->
Some are about not carrying version one's vocabulary into version two. The old factory names, the old token types, the old class name, and compatibility markers in comments all fail lint, because a rename that only half happens is worse than either state.

[pause:600ms]

<!-- p-12 -->
And some are the plugin discipline from part three. No reaching for the player's raw event bus, no raw timers or observers, no raw throws, no global fetch, and every concrete plugin declares its own identifier.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-3 -->
Every one of them is silenceable.

[pause:400ms]

<!-- p-13 -->
That is the point of putting them in a linter rather than in the type system.

[pause:500ms]

<!-- p-14 -->
A rule that fires at write time, names the better path, and can be switched off with a comment is guidance. The developer sees the recommendation at exactly the moment it is useful, and retains the ability to disagree. When they disagree, the disable comment is a record of the disagreement, sitting in the file, readable in review.

[pause:600ms]

<!-- p-15 -->
A final keyword offers none of that. It does not explain, it cannot be reasoned with, and the developer who needed to override that method learns nothing except that this library is going to be a problem.

[pause:600ms]

<!-- p-16 -->
Our position is that the linter is our voice, and consumers are allowed to silence us. Being silenced by somebody who read the warning and decided otherwise is a completely acceptable outcome. It means the system worked.

[pause:900ms]

[narrator:weary]

<!-- h-4 -->
The honest caveat.

[pause:400ms]

<!-- p-17 -->
This approach has a real cost, and it would be dishonest to skip it.

[pause:500ms]

<!-- p-18 -->
Because nothing is sealed, we cannot promise that reaching into an internal will keep working. The public API is versioned and we treat breaking it seriously. An internal you reached past is not covered by that promise, and a minor release can move it.

[pause:600ms]

<!-- p-19 -->
That is the trade. You get the door unlocked, and in exchange you accept that rooms behind unmarked doors get rearranged. We think that is a much better deal than a locked door, because a locked door does not actually protect you from the rearrangement. It just guarantees you cannot get in at all.

[pause:900ms]
