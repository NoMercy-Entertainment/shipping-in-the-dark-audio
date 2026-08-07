# Speech Script: Active and passive, or why a silent player is still a player

**Part:** 6 of 13

[narrator:cozy]

<!-- part-title -->
Part 6. Active and passive, or why a silent player is still a player.

[pause:900ms]

[narrator:matter-of-fact]

<!-- p-1 -->
The same day as the ANR, a different subsystem got rewritten from its foundation. This part is about multi device music rather than Cast, and it belongs in this report for two reasons. It shares the hardware wake path with Cast, so its bugs and Cast's bugs kept arriving together. And it is where the volume ownership rule was learned, which is the rule the final chapter of this report runs into a wall over.

[pause:900ms]

[narrator:reflective]

<!-- h-1 -->
The design that was wrong.

[pause:400ms]

<!-- p-2 -->
NoMercy Connect lets several devices participate in one music session. One of them is producing sound. The others are participating: showing what is playing, offering transport controls, ready to take over.

[pause:500ms]

<!-- p-3 -->
The original implementation made every participating device run a full ExoPlayer instance. The ones that were not producing sound ran theirs muted, mirroring the playback locally so that their UI had something real to read from.

[pause:500ms]

<!-- p-4 -->
Read that again, because the flaw is right there. Every passive device is running an independent playback engine, advancing independently, making its own decisions about when a track ends and what comes next. Meanwhile the server has its own auto-advance logic for the session as a whole.

[pause:500ms]

<!-- p-5 -->
The rewrite commit names the symptoms: ten second skip cycles after device switches, and multi session media echoes. Those come from two or three engines all reaching the end of a track at slightly different moments and all announcing a track change.

[pause:500ms]

<!-- p-6 -->
The rewrite, in the commit's own framing, is Spotify's model. Passive devices have no running audio engine at all. Only the active device runs an engine. Everything else is a view onto state it receives.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
The five bugs that fell out of the rewrite.

[pause:400ms]

<!-- p-7 -->
Removing the passive engine removed things nobody had noticed were depending on it.

[pause:500ms]

<!-- p-8 -->
The progress bar stopped scrolling and started jumping. The engine's time updates had been driving the UI ticker on passive devices. With no engine, the only position information is whatever the server sends, which arrives every few seconds. Fixed with a wall clock interpolator that advances the displayed position locally between updates.

[pause:500ms]

<!-- p-9 -->
Tapping play on a passive phone called the local play before the server's mute broadcast arrived. For a window of a few hundred milliseconds, the phone in your hand audibly took over playback from the television, then went quiet again.

[pause:500ms]

<!-- p-10 -->
ExoPlayer starts at its last remembered volume, which might be loud, before the desired volume and mute state get applied. The commit calls it a brief loud burst on every play, which is an accurate and unpleasant description.

[pause:500ms]

<!-- p-11 -->
Then two things in one commit. Activation started playback from position zero and then seeked, so you heard a fraction of a second of the start of the track before it jumped to where the session actually was. Fixed by setting the start offset before prepare rather than seeking after.

[pause:500ms]

<!-- p-12 -->
The second half of that commit is a platform fact worth writing on a wall. The device picker was gating its Cast wake on screen_on and PowerManager dot isInteractive. That check, in the commit's words, lies on Android TV boxes.

[pause:600ms]

<!-- p-13 -->
isInteractive is documented as reporting whether the device is in an interactive state, and on a phone it does that. On a television box, the device class has no consistent notion of what interactive means. The box may be fully powered with the panel off. The panel may be on with the box in a low power state. The HDMI sink may be off while the source is awake. Reading isInteractive on that hardware gives you an answer that is confidently wrong often enough to break the feature and rarely enough that you will not reproduce it on your desk.

[pause:500ms]

<!-- p-14 -->
The fix is not to read a better API. There is not one. The fix is to stop asking and just attempt the wake, because attempting a wake on an already awake device is harmless and skipping a wake on a sleeping one is the whole bug.

[pause:500ms]

<!-- p-15 -->
And a same day regression from the rewrite: stop events were clearing current_device_id, which lost the session's notion of who was active.

[pause:900ms]

[narrator:serious]

<!-- h-3 -->
The volume rule.

[pause:400ms]

<!-- p-16 -->
There is a separate thread from three weeks earlier, the twenty fifth of April, that introduced VolumeProviderCompat in remote mode so that a MediaSession could carry remote volume commands. It shipped with two protections that only exist because feedback loops were actually observed.

[pause:500ms]

<!-- p-17 -->
An input origin lock, distinguishing local from remote with a three second ownership window, so that a CEC echo cannot clobber a volume the user just set with their finger. And a ContentObserver self write echo suppressor with a 1.5 second window, so that the app's own write to the system volume does not come back through the observer and get treated as a user action.

[pause:500ms]

<!-- p-18 -->
Both of those are the same underlying situation. When two systems can both set volume, and both observe volume, and neither distinguishes its own writes from the other's, you get a loop. The volume walks up or down on its own, or snaps back immediately after you set it.

[pause:600ms]

<!-- p-19 -->
The rule that all of this adds up to is short.

[pause:600ms]

[narrator:serious, emphasis]

<!-- p-20 -->
A passive device must never assume it owns the volume channel.

[pause:800ms]

[narrator:reflective]

<!-- p-21 -->
Whether the input arrives from a hardware button, a Bluetooth headset, or, as part twelve will show, a television remote over HDMI-ARC, the question "who should this volume change apply to" has an answer that is not always "me."

[pause:500ms]

<!-- p-22 -->
That rule was learned here in April and May, applied again in the new app in July, and applied a third time in August against a completely new physical input. Each time it had to be rediscovered for the new input, because the input arrives through a different Android API and nothing connects them.

[pause:900ms]

[narrator:reflective]

<!-- h-4 -->
What was left open.

[pause:400ms]

<!-- p-23 -->
The rewrite commit names a phase two: collapsing the codepath that applies server state to a local engine, for passive listeners that no longer have one. It never landed. Fourth and last of the things unfinished when the old app was frozen.

[pause:500ms]

<!-- p-24 -->
Shortly after this, development moved to nomercy-app-kmp.

[pause:900ms]
