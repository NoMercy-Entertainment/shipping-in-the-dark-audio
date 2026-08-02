# Speech Script: What a plugin gets for free

**Part:** 3 of 7

[narrator:cozy]

<!-- part-title -->
Part 3. What a plugin gets for free.

[pause:900ms]

[narrator:matter-of-fact]

<!-- p-1 -->
A plugin is a class. It extends the base Plugin class, it declares a static identifier, and it is registered with a player.

[pause:500ms]

<!-- p-2 -->
That is the whole ceremony. What makes it worth using, rather than writing your own event listeners, is everything the base class hands you, and specifically what it hands you around teardown.

[pause:900ms]

[narrator:reflective]

<!-- h-1 -->
The disposal problem.

[pause:400ms]

<!-- p-3 -->
Here is the bug that every player integration eventually ships.

[pause:400ms]

<!-- p-4 -->
You attach a listener. You start an interval. You open a resize observer. Then the user navigates away, the player is disposed, and your listener is still attached, your interval is still ticking, and your observer is still watching an element that no longer exists. Nothing crashes. Memory climbs, and a second player mounted later receives events meant for the first one, and you spend a day on it three months later.

[pause:600ms]

<!-- p-5 -->
The trio's answer is that a plugin never reaches for a global directly. It uses its own scoped equivalents, and the base class tears down exactly what that plugin created, at the moment it is disposed.

[pause:600ms]

<!-- p-6 -->
Instead of the player's event bus, a plugin uses its own bound versions: on, once, off, and emit. Same bus, same events, but the subscription is bound to the plugin's lifetime.

[pause:600ms]

<!-- p-7 -->
Instead of the browser's raw timers and observers, a plugin uses its own scoped versions: timeout, interval, animation frame, and listen. Observers go through the plugin's own lifecycle, so a resize observer is disconnected the moment the plugin goes away.

[pause:600ms]

<!-- p-8 -->
Instead of the global fetch, a plugin uses its own scoped fetch. That one is worth calling out, because it does two things at once. It runs the request through the player's authentication pipeline, so a plugin does not need to know how tokens are obtained, and it aborts the request when the plugin is torn down, so a response cannot arrive for a plugin that no longer exists.

[pause:600ms]

<!-- p-9 -->
And instead of throwing, a plugin uses its own throw or report methods, which route into a structured error surface with codes, rather than a string that some consumer will end up parsing.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
The rule that is genuinely just a warning.

[pause:400ms]

<!-- p-10 -->
Every one of those has a lint rule behind it, and every rule can be switched off.

[pause:500ms]

<!-- p-11 -->
That is not an oversight. There are real situations where a plugin needs the raw thing. A public URL that must not carry authentication headers is the obvious one, and the rule for that case is satisfied by an eslint disable comment with a reason written next to it. Not a permission. A sentence explaining yourself, to the next person, in the file.

[pause:600ms]

<!-- p-12 -->
There is one more rule worth explaining, because it catches a subtle failure. Every concrete plugin must declare its own static identifier. If it does not, it inherits the base default, which is the word "plugin", and two plugins that both answer to that same default collide in storage keys and mount namespacing. The symptom is that one plugin's saved settings overwrite another's, which reads as settings randomly resetting, and takes a long time to trace back to a missing line. Abstract intermediate classes are exempt, because they are never registered.

[pause:900ms]

[narrator:cozy]

<!-- h-3 -->
What this makes possible.

[pause:400ms]

<!-- p-13 -->
The practical effect is that plugins compose without coordinating.

[pause:400ms]

<!-- p-14 -->
You can register five plugins that all listen to the same events, built by five different people, and none of them needs to know about the others. Each one cleans up after itself precisely. You can add one at runtime and remove it again, and the player after the removal is in the same state as the player before the addition.

[pause:600ms]

<!-- p-15 -->
That is the foundation. It is not yet the interesting part.

[pause:500ms]

<!-- p-16 -->
The interesting part is that a plugin can not only observe what the player does, but stop it, delay it, and replace it with something else entirely. That is the next section, and it is the reason this report exists.

[pause:900ms]
