# Speech Script: The new app, and the lifecycle nobody had named

**Part:** 7 of 13

[narrator:cozy]

<!-- part-title -->
Part 7. The new app, and the lifecycle nobody had named.

[pause:900ms]

[narrator:matter-of-fact]

<!-- p-1 -->
Development moved to nomercy-app-kmp, the Kotlin Multiplatform app. Nothing about Cast got easier because of the move. The platform is the same platform. What changed is that the same bugs got hit again with more understanding of what they were, and this time they got root-caused instead of guarded against.

[pause:900ms]

[narrator:reflective]

<!-- h-1 -->
The rule, written down.

[pause:400ms]

<!-- p-2 -->
The new player library's Cast plan states the position that the old app spent six months earning. Verbatim.

[pause:600ms]

[narrator:serious, emphasis]

<!-- p-3 -->
Chromecast is wake-only, never media.

[pause:800ms]

[narrator:matter-of-fact]

<!-- p-4 -->
The Cast SDK appears only in a component called CastWaker, only for route selection and the session started callback. RemoteMediaClient, MediaLoadRequest and loadMedia must never appear. Media reaches the television over NoMercy's own player protocol.

[pause:500ms]

<!-- p-5 -->
And separately.

[pause:500ms]

[narrator:serious]

<!-- p-6 -->
Cast is a separate subsystem from Connect. They share nothing but the core plugin base.

[pause:700ms]

[narrator:matter-of-fact]

<!-- p-7 -->
with an audit note attached saying, plainly, do not fold them together.

[pause:500ms]

<!-- p-8 -->
One honest caveat: that library plan is not yet what the shipped app runs. As of a plan revision in late July, the shipped app's real Cast code is a separate, older implementation, and unifying the clean library rewrite with the shipping app is still an open piece of work. Everything below is about the shipped app.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
The volume pivot, wired wrong and corrected the same day.

[pause:400ms]

<!-- p-9 -->
The fourth of July. A feature landed making hardware volume keys always control the device's own volume, active or passive, and never report a remote volume command. The VolumeProviderCompat remote playback mode came out of the music playback service.

[pause:500ms]

<!-- p-10 -->
Later the same day it was put back, in a commit that names its own predecessor as the thing it is correcting. The reasoning.

[pause:600ms]

[narrator:serious]

<!-- p-11 -->
KMP has no in-app volume slider on Android, so hardware and Bluetooth volume keys are the only passive volume control. They must drive the active device, not this one's own stream.

[pause:700ms]

[narrator:reflective]

<!-- p-12 -->
This is the rule from part six arriving at a new input and being got wrong on first contact. If your phone is a passive participant in a session playing on the television, and you press volume up on the phone, you almost certainly mean the television. The phone is not making any sound. Turning up the phone's own silent stream is a correct-looking no-op.

[pause:500ms]

<!-- p-13 -->
A follow up the same week root-caused a related pair of symptoms, hardware keys bypassing Connect entirely and a keep alive tone running during audible playback, to the fact that starting playback never claimed the device as active except through a fragile server round trip. Fixed with an unconditional optimistic local claim.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-3 -->
The initialisation bug, again.

[pause:400ms]

<!-- p-14 -->
The same week, a commit titled "make musicHub connect follow app lifecycle, not route." A television that cold-started on any route other than music never joined the music hub for its entire session, because the only trigger to create the connection was a one-shot boot call gated on a feature flag being true at that exact millisecond.

[pause:500ms]

<!-- p-15 -->
That is the identical bug from the end of part four, in a different codebase, rewritten in a different language.

[pause:600ms]

<!-- p-16 -->
The investigation around it contains something worth copying. A suspected "wrong hub" misrouting bug was proposed as the explanation, and then ruled out properly rather than assumed away. A dedicated test proved that a null music hub socket makes every command a silent no-op and never a reroute. So the observed symptom was a downstream consequence of the hub never existing, not a second independent bug. One theory eliminated with evidence is worth more than three theories held simultaneously.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-4 -->
Casting to a television that is switched off.

[pause:400ms]

<!-- p-17 -->
The eleventh of July, a commit titled "cast video to sleeping TVs via DeviceHub registry and Cast Connect."

[pause:500ms]

<!-- p-18 -->
The root cause: the video cast picker discovered devices only over NoMercy's own mDNS service. That protocol requires the app to be running to answer. A television with the app fully closed does not answer, so it did not appear in the picker at all, so it could not be cast to under any circumstances.

[pause:500ms]

<!-- p-19 -->
The music picker had already been fixed to source from the DeviceHub registry, which knows about devices that are not currently reachable. Video got the same treatment, with the wake performed through Cast Connect, CEC one touch play plus an APK launch.

[pause:500ms]

<!-- p-20 -->
This is where "wake a sleeping television" becomes a first class path in the new app rather than a bolt-on.

[pause:900ms]

[narrator:tense]

<!-- h-5 -->
The lifecycle fix.

[pause:400ms]

<!-- p-21 -->
The twenty seventh of July. A commit titled "losing focus must not stop the TV cast receiver." This is the resolution of the same class of bug that consumed the old app for two months, and the root cause is one sentence.

[pause:600ms]

[narrator:serious, emphasis]

<!-- p-22 -->
MainActivity started the Cast Connect receiver from onStart and stopped it from onPause.

[pause:800ms]

[narrator:matter-of-fact]

<!-- p-23 -->
Those are not a matching pair. onPause fires whenever anything merely takes focus: a dialog, the screensaver, a system overlay, a picture-in-picture transition. onStart only fires again if the activity was fully stopped first. So a dialog appears, the receiver stops, the dialog goes away, and onStart never runs because the activity was never stopped.

[pause:500ms]

<!-- p-24 -->
The effect, in the commit's words: one dialog or overlay left the television silently uncastable for the rest of the process's life.

[pause:600ms]

<!-- p-25 -->
And now go back and read part five again. What happens when you cast to a television whose native receiver has been switched off? The launch falls back to the Cast Web Receiver, which visibly takes over the screen and pushes the NoMercy app off it.

[pause:600ms]

[narrator:serious]

<!-- p-26 -->
That is the hijack. The thing that five escalating commits tried to fight with foreground reclaim, and that ended in an ANR, was in significant part a mismatched pair of lifecycle callbacks. The native receiver was not losing a fight for the screen. It was not in the fight, because it had been turned off by a dialog fifteen minutes earlier.

[pause:900ms]

[narrator:matter-of-fact]

<!-- p-27 -->
The fix is not a guard. It is a named object. A class called CastReceiverLifecycle, extracted out of the activity, with two methods called onVisible and onHidden, wired to onStart and onStop. The commit is explicit about why the names matter.

[pause:600ms]

[narrator:serious]

<!-- p-28 -->
The names here leave no hook a focus change can be wired to.

[pause:700ms]

[narrator:matter-of-fact]

<!-- p-29 -->
You cannot accidentally call onHidden from onPause, because onPause does not mean hidden and the name tells you so. It is idempotent behind a started flag, retry safe if a start fails, and fail open if a stop fails, on the reasoning that a receiver left running is a smaller problem than a receiver stuck off.

[pause:500ms]

<!-- p-30 -->
It shipped with seven unit tests, one of which is the focus flicker scenario explicitly.

[pause:500ms]

<!-- p-31 -->
And the whole thing is inside an isTvDevice check. This is a television-only bug. A phone build never executes the code. No amount of testing the mobile UI, which is most of the app and most of the users, would ever have surfaced it. That is the dual personality architecture from part zero producing a bug class that only exists in one half of one bundle.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-6 -->
The discovery loop that read nothing.

[pause:400ms]

<!-- p-32 -->
At the end of July, a smaller find worth including because of how it was measured. Samsung MSFD discovery was running on every resume. Its found and lost listeners only wrote log lines. No picker consumed them. And where the socket could not be created, the SDK's own thread spun on a null datagram socket several times a second for as long as the app was in the foreground.

[pause:500ms]

<!-- p-33 -->
Pure battery cost, zero benefit, for however long it had been there. The verification is the good part: thirty seconds foregrounded went from a continuous error stream to zero search lines. A measurement, before and after, of a thing that was never a feature.

[pause:900ms]
