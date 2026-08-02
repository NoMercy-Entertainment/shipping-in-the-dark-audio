# Speech Script: Overruling the player

**Part:** 4 of 7

[narrator:matter-of-fact]

<!-- p-1 -->
This is the part that matters.

[pause:600ms]

<!-- p-2 -->
Everything so far has been about a player that stays out of your way. This part is about a player that lets you take the wheel, mid corner. Not by subclassing it. Not by monkey patching it. And not by racing it with a wrapper that keeps a second copy of the truth.

[pause:600ms]

<!-- p-3 -->
The mechanism is one idea, applied consistently. Before the player does anything meaningful, it asks.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-1 -->
The before-event contract.

[pause:400ms]

<!-- p-4 -->
Every action worth intercepting has a paired event whose name starts with before. Play has beforePlay. Pause has beforePause. Seeking has beforeSeek. There are many of them, and every one hands your listener the same shape of object.

[pause:600ms]

<!-- variant:brief -->
<!-- code-1 -->
The shape is simple. A before event carries the payload for the action, a way to cancel that action outright, a way to stop later listeners from seeing it, and a way to make the player wait on a promise before it decides anything. Four capabilities, and every one of the before hooks in this player hands your listener that exact same shape.

[pause:900ms]
<!-- /variant -->

<!-- variant:elaborate -->
<!-- code-1 -->
Let me walk it. There is a data field, carrying whatever payload the action needs — for a seek that is the target time, for a volume change that is the new level. There is preventDefault, a method that cancels the action outright when called, and its companion isDefaultPrevented, which reports back whether some earlier listener already canceled it. There is stopImmediatePropagation, which stops any later listener in the chain from running at all, and its companion isPropagationStopped, reporting whether that happened. And there is delay, which takes a promise and tells the player to wait on it before the action proceeds, with isDelayed reporting whether a delay is currently in flight. The whole contract is generic over a type called TData, so a seek event and a volume event share this exact shape, with different data riding inside.

[pause:1200ms]
<!-- /variant -->

<!-- p-5 -->
If that shape looks familiar, it should. It is deliberately the same vocabulary as a browser DOM event, because that is a contract every web developer already has in their hands, and there was no reason to invent a second one.

[pause:600ms]

<!-- p-6 -->
Four capabilities, and they compose.

[pause:500ms]

<!-- p-7 -->
The data field is mutable. Your listener can change the payload before the action runs. A seek to a position your application considers out of bounds can be clamped rather than refused.

[pause:500ms]

<!-- p-8 -->
Calling preventDefault cancels the action outright. The player does not play. Not "plays and then pauses," which is the usual approximation and the reason wrappers flicker. The state mutation simply does not happen.

[pause:500ms]

<!-- p-9 -->
Calling stopImmediatePropagation stops later listeners from running. Notably, it does not cancel the action on its own. If you want both, you call both. Keeping those separate is a small thing that saves a specific confusion, because "I do not want other plugins to see this" and "I do not want this to happen" are genuinely different intentions.

[pause:600ms]

<!-- p-10 -->
Calling delay with a promise blocks the player on that promise. This one is the sharpest tool in the set. Your listener can go and ask a server something, and the player waits. Multiple listeners can each delay, and the delays compose together. If any of those promises rejects, the action is prevented, which means "ask the backend for permission, and do not play if it says no" is a handful of lines rather than a state machine.

[pause:600ms]

<!-- p-11 -->
Delays are bounded. A setup option caps how long the player will wait, and it defaults to ten seconds. A plugin that hangs cannot hang the player forever.

[pause:900ms]

[narrator:reflective]

<!-- h-2 -->
What this makes possible.

[pause:400ms]

<!-- p-12 -->
Take the casting example from part one, because it is the reason most of this exists.

[pause:500ms]

<!-- p-13 -->
A device that is currently playing somewhere else needs to behave, locally, like a remote control. Pressing play should not start audio in this browser tab. It should tell the television to play, and then reflect what the television reports back.

[pause:600ms]

<!-- p-14 -->
With before events, that plugin is close to trivial to describe. Listen for beforePlay. Call preventDefault. Send the command to the hub. Done. The local player never produces a sound, never enters a playing state it will have to be dragged out of, and never needs a second copy of the truth kept in sync with the first.

[pause:600ms]

<!-- p-15 -->
The same shape covers the whole surface. Volume, mute, repeat, shuffle, playback rate, subtitle selection, audio track selection, language. Each has its own before event, each can be intercepted, each can be routed somewhere else entirely.

[pause:500ms]

<!-- p-16 -->
There is also beforeTransfer, for the handoff itself, and beforeDispose, which lets a plugin finish its business before the player goes away.

[pause:900ms]

[narrator:tense]

<!-- h-3 -->
The trap, and how it got fixed.

[pause:400ms]

<!-- p-17 -->
Now the part that is genuinely instructive, because the first version of this did not work, and the reason is a good lesson.

[pause:500ms]

<!-- p-18 -->
Alongside the named before events, core has a generic guard called beforeMutation, which fires for state mutations broadly. It is useful, and it has a cost. Some state changes happen very often. Position updates fire continuously during playback. Bandwidth samples arrive constantly. Firing a cancellable event for every one of those is real overhead for something almost nobody wants to guard.

[pause:600ms]

<!-- p-19 -->
So there is a list of hot mutations that skip the generic guard, unless you opt in.

[pause:600ms]

<!-- variant:brief -->
<!-- code-2 -->
It is a short list, just three method names, of state changes frequent enough that firing a cancellable event for each one would be real overhead, so by default they skip the generic guard unless a developer opts in.

[pause:900ms]
<!-- /variant -->

<!-- variant:elaborate -->
<!-- code-2 -->
Three entries. time, because playback position updates continuously while a video plays. bandwidth, because network samples arrive constantly during streaming. And recordMetric, because telemetry writes happen just as often. Each one is hot in the sense that it fires far more often than a listener actually wants to be asked about, so guarding all three by default would burn cycles for a guard almost nobody uses.

[pause:1200ms]
<!-- /variant -->

<!-- p-20 -->
The opt-in is a setup option called mutationGuards. Pass false, and the guard never fires. Pass "all," and it always does. Pass an array of method names, and normal mutations fire while the hot ones you named join them. Leave it unset, the default, and normal mutations fire while the hot ones stay quiet.

[pause:600ms]

<!-- p-21 -->
Here is the problem. volume and playbackRate used to be on that hot list.

[pause:500ms]

<!-- p-22 -->
Which meant a casting plugin trying to intercept a volume change got nothing at all, by default, silently. It would work perfectly in a test where somebody had configured mutationGuards, and do nothing in an application that had not. The plugin was correct. The player was correct. The default made them incompatible, and the failure mode was silence rather than an error.

[pause:600ms]

<!-- p-23 -->
The fix was not to make the plugin configure the player. Asking every consumer to pass a specific configuration object before an official feature works is how you get bug reports for years.

[pause:600ms]

<!-- p-24 -->
volume and playbackRate came off the hot list and got their own dedicated hooks, beforeVolume and beforePlaybackRate, which fire always and are not governed by mutationGuards at all. A plugin can now intercept them without the application knowing anything about guard configuration. time was already handled this way, through beforeSeek.

[pause:600ms]

<!-- p-25 -->
The principle underneath is worth more than the fix. If a feature you ship depends on a hook, that hook cannot be behind a performance flag that defaults to off. Either it is always available, or the feature is conditional on configuration nobody will remember to write.

[pause:900ms]

[narrator:triumphant]

<!-- h-4 -->
Proving a cancellation actually cancels.

[pause:400ms]

<!-- p-26 -->
There is a test file in core that locks this contract down, and what it asserts is more interesting than that it exists.

[pause:500ms]

<!-- p-27 -->
It covers ten hooks. beforeVolume, beforeMute, beforeRepeat, beforeShuffle, beforePlaybackRate, beforeLanguage, beforeSubtitle, beforeAudioTrack, beforeDispose, and beforeTransfer. For each one, it proves three separate things.

[pause:600ms]

<!-- p-28 -->
First, that an action with no listener attached still works. That sounds trivial, and it is the check most people skip. Adding a hook to an action is an opportunity to break the action, and a suite that only tests the hook will not notice.

[pause:600ms]

<!-- p-29 -->
Second, that calling preventDefault stops the state mutation dead, and this is asserted by reading the state back afterward, not by observing that a prevented event was emitted. Those are different claims. A player can emit "I was prevented" and change the state anyway. Only one of those two checks can tell.

[pause:600ms]

<!-- p-30 -->
Third, that a paired event fires afterward, carrying the reason "listener prevented," so an application can tell the difference between a plugin declining an action and the action never having been requested.

[pause:600ms]

<!-- p-31 -->
The two hooks carved out of the hot list get a fourth check. That they fire with no mutationGuards configuration set at all. The bug had a test written against it, in the shape of the bug, so it cannot come back quietly.

[pause:900ms]
