# Speech Script: The first attempts, and the day Cast was removed and put back

**Part:** 2 of 13

[narrator:cozy]

<!-- part-title -->
Part 2. The first attempts, and the day Cast was removed and put back.

[pause:900ms]

[narrator:matter-of-fact]

<!-- p-1 -->
The old app, nomercy-app-android, is frozen now. Development moved to the Kotlin Multiplatform app. Its Cast work was never finished, and knowing that up front makes it easier to read honestly, because several of the things in this part are wrong turns that were correctly abandoned.

[pause:900ms]

[narrator:reflective]

<!-- h-1 -->
Attempt zero. The scaffolding that never ran.

[pause:400ms]

<!-- p-2 -->
The first Cast code in the repository was deleted before it did anything. At the start of November 2025, a single commit removed eight classes in one go: a controller facade, a message type, a no-op implementation, a receiver, a receiver facade, a role enum, a session type, and a signalling client. The commit message is unusually candid about why. They were placeholders and they were not implemented.

[pause:500ms]

<!-- p-3 -->
This is worth mentioning rather than skipping, because it is a recognisable pattern. Somebody sat down, designed a Cast abstraction from the shape of the documentation, wrote the interfaces, and then discovered on contact with the actual SDK that the abstraction did not describe anything real. The right move at that point is to delete it, which is what happened. The wrong move, which is more common, is to keep it and start bending reality to fit.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
Attempt one. The documented path.

[pause:400ms]

<!-- p-4 -->
Three weeks later the real work started. In late November the Play Services Cast dependency went in, and the day after, Cast was wired into the video player service with a Cast application ID. On New Year's Eve a commit titled "Native casting!" added the Media3 Cast extension and connected a MediaSession into the video player and its service.

[pause:500ms]

<!-- p-5 -->
That is the documented path, followed faithfully. Media3 has an official Cast extension. It gives you a CastPlayer that implements the same Player interface as ExoPlayer, so in principle you swap one for the other and casting works. On paper this is elegant.

[pause:500ms]

<!-- p-6 -->
In practice it means Cast is loading and owning your media, which is exactly the thing NoMercy would later forbid outright. The elegance is real and it is the elegance of somebody else's playback model. Every piece of NoMercy specific behaviour, the server side playlist, the subtitle handling, the Connect device registry, sits outside that interface and has to be mirrored across it.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-3 -->
Attempt two. The receiver side.

[pause:400ms]

<!-- p-7 -->
The first week of January 2026 is when the shape of the problem changes. A commit integrated Cast on the television side: a Cast launch receiver, a media load handler and its callback, a Cast media session service. In the same commit, a boot receiver called TvBootReceiver was deleted as no longer needed.

[pause:500ms]

<!-- p-8 -->
That deletion is the first architectural swap in the story and it is a good one. The old idea was to hook the device booting. The new idea was to let Cast launch the app. Part ten of this report is about why the old idea was there at all and why reaching for it is a warning sign, so it gets proper treatment there rather than a paragraph here.

[pause:500ms]

<!-- p-9 -->
The day before, another commit had made a service called LocalReceiverForegroundService launch MainActivity "reliably" using AlarmManager and overlays. The word reliably in a commit message, applied to starting your own activity, is a distress signal. Starting an activity is not supposed to need reliability engineering. That one also belongs to part ten.

[pause:900ms]

[narrator:tense]

<!-- h-4 -->
The removal, and the revert the same day.

[pause:400ms]

<!-- p-10 -->
The most instructive day in the old app is the twenty fourth of April 2026, and it opens with a commit titled "drop Google Cast receiver framework."

[pause:500ms]

<!-- p-11 -->
Here is what had gone wrong. Google Play Services, on its own initiative, was creating a system level media control card on the phone. It carries the identifier cast underscore rcn underscore media session. Every time the television played anything, the phone's notification shade grew a media card that Play Services owned, sitting next to and competing with the media card NoMercy's own playback service had put there. Two controls for the same playback, one of them not written by NoMercy, neither of them aware of the other.

[pause:500ms]

<!-- p-12 -->
That is not a bug in NoMercy's code. It is Cast doing what Cast is designed to do. If you register as a Cast receiver, the framework assumes it is the authority on what is playing, and it surfaces that authority in the system UI.

[pause:500ms]

<!-- p-13 -->
So the framework came out. The commit is explicit that this was a tradeoff knowingly accepted: with Cast gone, external senders like Chrome's cast button or the YouTube app could no longer target the NoMercy television app as a receiver at all. That capability was traded away to stop the duplicate card.

[pause:500ms]

<!-- p-14 -->
Later the same day, it was reverted. Cast came back.

[pause:600ms]

<!-- p-15 -->
The reason it came back is the reason part one already gave. The Cast route selection path is the only route a third party app has to HDMI-CEC One Touch Play. Without Cast, you cannot wake a television that is off. The duplicate media card was ugly. A cast button that cannot turn the television on is not a feature at all. So the ugly thing was reinstated and the fight moved to managing its side effects rather than avoiding them.

[pause:500ms]

<!-- p-16 -->
Everything in the next three parts is that fight.

[pause:900ms]

[narrator:reflective]

<!-- h-5 -->
Running in parallel. The auth handoff.

[pause:400ms]

<!-- p-17 -->
While the Cast work was going on, a second thread was running: handing authentication from the phone to the television. Over two days in mid April, six commits built a WebSocket plus Keycloak device flow handoff, in a sequence that reads as one implementation followed by several rounds titled along the lines of polish and fixing the remaining gaps.

[pause:500ms]

<!-- p-18 -->
It is included here not because it is dramatic but because it is the honest texture of this work. Almost nothing in this report landed correct on the first commit. The features that look clean in the final codebase got there through four or five passes, and the passes are in the history.

[pause:900ms]
