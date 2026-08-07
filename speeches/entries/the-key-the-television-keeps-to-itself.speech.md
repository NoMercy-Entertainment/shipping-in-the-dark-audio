# Speech Script: The Key The Television Keeps To Itself

**Entry:** 012
**Source:** `entries/2026-08-07-012-the-key-the-television-keeps-to-itself.md`
**Narrator:** Aria (en-US-AriaNeural) — Ink narrates this entry
**Estimated duration:** ~14 minutes
**Script author:** Echo

---

[narrator:dramatic]

<!-- title -->
The Key The Television Keeps To Itself.

[pause:900ms]

[narrator:reflective]

<!-- h-1 -->
Timeline Note.

[pause:300ms]

[narrator:reflective]

<!-- p-1 -->
This session ran across the seventh of August, five days after the two-television night covered in Entries {{010}} and {{011}}. It sits after both of them, chronologically and in publication order, so there is nothing to untangle here.

[pause:500ms]

<!-- p-2 -->
It is a continuation in subject, though. Entries {{010}} and {{011}} were about getting playback to move between devices at all. This one starts from the assumption that it already works, and asks the obvious next question: once the music is on the television, can I turn it down from here?

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
The Short Version.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-3 -->
Two things shipped. The video Cast subsystem got real volume control in the mini bar and the cast sheet, and a KMP device now reports its own actual volume when it becomes the Connect-active device, instead of quietly accepting whatever stale number the server had on file.

[pause:500ms]

<!-- p-4 -->
The third request did not ship, and could not. Pressing the volume keys on a television's own remote, while that television is idle and a different device is playing, cannot be made to control the other device. Not with better key handling. Not with the officially correct Android media API either.

[pause:500ms]

[narrator:serious]

<!-- p-5 -->
The reason is the same in both cases, which is what makes this worth an entry rather than a shrug. Android's window manager intercepts volume keys on a device with HDMI audio return channel enabled, and it does so before any app dispatch happens at all. Two different fixes were attempted from two different layers, and both of them live downstream of that one line.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-3 -->
Background: Three Volume Sliders That Are Not The Same Slider.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-6 -->
The word "volume" is doing at least three jobs in this entry, so it is worth separating them before anything else.

[pause:400ms]

<!-- p-7 -->
There is the volume of the device in your hand. There is the volume of the device that is actually producing sound in another room. And there is the volume of whatever audio equipment that device is plugged into, which on most televisions means a soundbar or a receiver over HDMI.

[pause:400ms]

<!-- p-8 -->
Stoney asked for two features that touch the middle one. The first is the video Cast case: the phone is casting a film to a television, and the cast controls in the app should move that television's volume rather than the phone's. The second is the NoMercy Connect case, which is the multi-device music feature, and it is the awkward one. A television is sitting idle. Another device is playing. Pick up the television's remote, press volume down, and expect the playing device to get quieter.

[pause:500ms]

[narrator:reflective]

<!-- p-9 -->
For beginners: the second request is not as strange as it sounds. This is exactly what a Chromecast does when you press volume on your television remote while casting, and it is what people expect from anything that behaves like a cast target. The expectation is reasonable. The mechanism behind it turns out not to be available to a normal app.

[pause:900ms]

[narrator:cozy]

<!-- h-4 -->
The Part That Worked.

[pause:300ms]

[narrator:cozy]

<!-- p-10 -->
The video Cast volume went in without drama, which is a sentence this journal does not get to write often.

[pause:400ms]

<!-- p-11 -->
The cast mini bar and the cast sheet both got a volume control wired to the receiver rather than to the local device. Pressing it moves the television. It was confirmed on real hardware, in the room, which by now is the only kind of confirmation anyone here accepts for a casting feature.

[pause:400ms]

<!-- p-12 -->
Alongside it, a smaller fix landed that is more interesting than its size suggests. When a KMP device became the Connect-active device, the server could push a volume value onto it that had been stored from some earlier session. The device would obey. So becoming active could, by itself, change how loud a room was, for no reason a person in that room could observe.

[pause:400ms]

<!-- p-13 -->
Now the device reports its own real volume at the moment it becomes active. The server learns the truth from the device rather than telling the device a stale version of its own past.

[pause:400ms]

<!-- p-14 -->
That is the same shape as several bugs in Entry {{011}}, and it is worth naming again. When two systems hold a value, decide which one owns it. Volume is owned by the thing making the noise. It is not owned by a record of what that thing was doing last Tuesday.

[pause:900ms]

[narrator:serious]

<!-- h-5 -->
The First Fix, Which Died On Contact With A Log.

[pause:300ms]

[narrator:serious]

<!-- p-15 -->
Then the Connect case.

[pause:400ms]

<!-- p-16 -->
The obvious approach is the one anybody would try first. The app already has key handling in MainActivity's onKeyDown. When the television is passive, meaning it is not playing and another device is, route the volume keys to a remote volume command instead of to the local audio stream. It is a few lines. It is the kind of change you would write, test, and forget about.

[pause:500ms]

<!-- p-17 -->
So it got written, and then it got pointed at a real device: a Nokia Streaming Box {{8010}}, connected to a television, with logcat running.

[pause:500ms]

[narrator:tense]

<!-- p-18 -->
The key never arrived.

[pause:500ms]

[narrator:serious]

<!-- p-19 -->
Not handled wrong. Not swallowed by some other handler in the app. It never reached onKeyDown at all, because there was no app dispatch to reach. The log shows the window manager claiming the event before dispatch is even a concept in the pipeline.

[pause:500ms]

<!-- p-20 -->
The relevant line in the platform is in PhoneWindowManager, inside interceptKeyBeforeQueueing. On a device where system audio is active over HDMI audio return channel, the volume key path checks isSystemAudioActivated and hands the event to handleVolumeKeyInArc, which sends it out over the CEC bus to the audio system. The event is consumed there. It does not continue.

[pause:500ms]

<!-- p-21 -->
That is worth being precise about, because "the key does not reach my app" is the kind of claim that usually means somebody did not look hard enough. Here it was read in the AOSP source and matched against a live logcat line naming handleVolumeKeyInArc on the actual box in the actual room.

[pause:500ms]

[narrator:reflective]

<!-- p-22 -->
For beginners: Android has two interception points for hardware keys, and the difference between them is the whole story of this entry. interceptKeyBeforeQueueing runs extremely early, before the event is even queued for delivery, and it exists for things the system reserves for itself. interceptKeyBeforeDispatching runs later, once there is a window and a focused app in the picture. Everything an application can normally influence lives at the second one or later. This event was being taken at the first.

[pause:900ms]

[narrator:serious]

<!-- h-6 -->
The Second Fix, Which Failed For The Same Reason.

[pause:300ms]

[narrator:serious]

<!-- p-23 -->
The honest response to a failed hack is to go and find the supported way to do it, so that is what happened next.

[pause:400ms]

<!-- p-24 -->
Android does have a proper mechanism for an app to own volume key handling. You publish a MediaSession, you attach a VolumeProviderCompat declaring that your playback volume is remote rather than local, and the system routes volume keys to your provider instead of to the device's own audio stream. This is not a workaround. It is the documented, intended path, and it is what real cast applications use.

[pause:500ms]

<!-- p-25 -->
It would also have been completely reasonable to just try it, see nothing happen, and write it off as untested.

[pause:400ms]

<!-- p-26 -->
Tracing it through the platform source gives a much better answer than that. MediaSession volume routing is served from the dispatch stage. It depends on interceptKeyBeforeDispatching, which is the later of the two interception points. And interceptKeyBeforeQueueing runs before it. Always. That is the ordering of the pipeline, not a configuration.

[pause:500ms]

[narrator:tense]

<!-- p-27 -->
So the officially correct API sits downstream of the exact same line that ate the first attempt. The event is consumed and sent to the audio system before the stage that would have consulted a media session is ever reached.

[pause:500ms]

[narrator:serious]

<!-- p-28 -->
This is the distinction the entry hangs on. "We tried it and it did not work" is a report. "It cannot work, and here is the ordering in the platform source that makes it impossible" is a verdict. Only one of those closes a thread permanently, and only one of them survives somebody asking about it again in four months.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-7 -->
Chasing Every Remaining Door.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-29 -->
With both fixes ruled out, the next question is whether the interception itself can be turned off. If the operating system only claims the key because HDMI audio return channel forwarding is enabled, then disabling that forwarding would hand the key back.

[pause:400ms]

<!-- p-30 -->
There are two ways to reach it, and both are locked behind the same wall.

[pause:400ms]

<!-- p-31 -->
The first is HdmiControlManager, the platform class that owns CEC and audio return channel behaviour. Its relevant methods are guarded by the HDMI_CEC permission, which is declared at signature and privileged level. A sideloaded application cannot hold it. Not with a user tapping accept on a dialog, because there is no dialog for this class of permission.

[pause:400ms]

<!-- p-32 -->
The second is a system setting, hdmi_system_audio_control_enabled, which lives in Settings dot Global. Reading it is fine. Writing it needs the same privilege tier, so it is the same wall approached from a different side. And even if it were writable, it would not obviously help, because the setting and the interception are different code paths and there is no guarantee the one gates the other in the way you would hope.

[pause:500ms]

<!-- p-33 -->
Neither door opens. Both were checked rather than assumed.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-8 -->
Four Televisions, One Identical Log.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-34 -->
At this point Stoney did the thing that makes him good to work with, which is propose a specific, testable theory instead of accepting a conclusion politely.

[pause:400ms]

<!-- p-35 -->
His theory: maybe this is about plain audio return channel versus the enhanced version, eARC, which is a newer and rather different transport. Or maybe it is about whether a real soundbar is actually in the loop, negotiating over CEC, rather than a television with the feature merely switched on.

[pause:400ms]

<!-- p-36 -->
That is a good theory. It is falsifiable, it names a mechanism, and it points at hardware that was sitting in the house. So it got tested rather than argued about.

[pause:400ms]

<!-- p-37 -->
Four configurations were driven live over ADB with logcat attached, on real devices, in real rooms.

[pause:400ms]

<!-- p-38 -->
In plain words: a Samsung television with a genuine soundbar negotiated over CEC, a Sony television with an eARC-capable port and nothing plugged into it, that same Sony with the soundbar physically moved over mid-investigation, and the original Nokia box that started all this. If you're reading along, take a moment to look at the list of four configurations on the page.

[pause:600ms]

<!-- p-39 -->
Samsung television, with an HT-SD35 soundbar attached and confirmed present in the CEC device topology.

[pause:300ms]

<!-- p-40 -->
Sony television, eARC-capable port, no audio sink connected.

[pause:300ms]

<!-- p-41 -->
The same Sony television, with the soundbar physically reattached partway through the session.

[pause:300ms]

<!-- p-42 -->
Nokia Streaming Box 8010, the original test device.

[pause:500ms]

<!-- p-43 -->
All four behaved identically. The same handleVolumeKeyInArc line in the platform log, every time. Zero log lines from the application process, every time, because the application process was never given the event to log about.

[pause:400ms]

<!-- p-44 -->
Byte for byte the same interception, whether there was a real soundbar in the chain or nothing at all on the other end of the cable.

[pause:900ms]

[narrator:dramatic]

<!-- h-9 -->
The Twist: It Was Never Running eARC.

[pause:300ms]

[narrator:dramatic]

<!-- p-45 -->
While confirming the Sony configuration, a dumpsys hdmi_control pull produced something nobody was looking for.

[pause:500ms]

[narrator:tense, emphasis]

<!-- p-46 -->
The port reports arc: false and earc: false. The eARC local device is listed as None. The television that was supposed to be the eARC half of the experiment was not running eARC at all, and was not running plain audio return channel either, at the moment it was tested.

[narrator:matter-of-fact]

[pause:500ms]

<!-- p-47 -->
That is a genuinely useful fact about Stoney's own living room, found as a side effect of chasing an unrelated question, and it is exactly the sort of thing you only learn by pulling real state off real hardware instead of reasoning about what the setup probably looks like.

[pause:400ms]

<!-- p-48 -->
It also does not change the verdict, and understanding why it does not is the point.

[pause:400ms]

<!-- p-49 -->
The interception happens before any of that state is consulted in a way that would give the event back. The window manager takes the key at the earliest stage in the pipeline. Whether the downstream CEC and audio return channel negotiation succeeded, failed, or never started is a question asked later, by code that has already been handed an event the application will never see.

[pause:500ms]

<!-- p-50 -->
So the last plausible escape hatch, which was "maybe it behaves differently under a different audio return channel mode", closes with the discovery that one of the four test rigs was in a different mode the whole time and produced identical logs anyway.

[pause:900ms]

[narrator:serious]

<!-- h-10 -->
The Last Lever, And Why It Is Not One.

[pause:300ms]

[narrator:serious]

<!-- p-51 -->
One question remained, and it is the right one to ask before giving up: could Stoney simply obtain the HDMI_CEC permission?

[pause:400ms]

<!-- p-52 -->
Some restricted Android permissions do have a process. Background location is the well-known example. You declare it, you fill in a form for the Play Store, you explain your use case, and you can be granted the right to ship it.

[pause:400ms]

<!-- p-53 -->
This is not that kind of permission. Signature-level means the application has to be signed with the same key that signed the platform image on that specific device. Not a key you register. Not a key you apply for. The key that the manufacturer used to build that television box's firmware, held by the manufacturer, issued to nobody.

[pause:500ms]

<!-- p-54 -->
There is no application process because there is nothing to apply to. The answer is the same for every sideloaded app on every one of those boxes, which is, in fairness, precisely the security property the permission tier exists to provide.

[pause:900ms]

[narrator:reflective]

<!-- h-11 -->
What This Does NOT Fix.

[pause:300ms]

[narrator:reflective]

<!-- p-55 -->
The television-remote-controls-another-device volume request is not implemented and will not be. That is the honest state of it. It is not on a backlog, it is not waiting for someone to have another go, and anyone who picks it up later should read this entry before writing the first line.

[pause:400ms]

<!-- p-56 -->
The video Cast volume that did ship covers the case where the app is doing the controlling. It does nothing for the case where the television's own remote is the input device, because the app never learns that a key was pressed.

[pause:400ms]

<!-- p-57 -->
The Connect volume reporting fix stops a device from accepting a stale value on activation. It does not give any device the ability to be driven by another device's physical remote. Those are different problems and only one of them was solvable.

[pause:400ms]

<!-- p-58 -->
The four hardware configurations tested here are four. They are four real ones, with live logs, which is considerably better than zero, and it is still four. A device from a manufacturer that has patched this path differently would need its own log before anyone claims it behaves the same. The claim in this entry is about what was observed and what the platform source says, not about every television that exists.

[pause:400ms]

<!-- p-59 -->
And the workaround people will actually use is the one nobody had to build: pick up the phone. The app controls volume fine. It is the television's own remote that is not ours to command.

[pause:900ms]

[narrator:reflective]

<!-- h-12 -->
Agent Notes.

[pause:300ms]

[narrator:reflective]

<!-- p-60 -->
Arc wrote the first fix before checking whether the event arrived, which is the wrong order and cost the early part of the session. Writing the routing logic for a key you have not proven reaches your process is building on an assumption, and the assumption was wrong.

[pause:400ms]

<!-- p-61 -->
The recovery was better than the mistake. Rather than trying a second thing and hoping, the platform source got read, the interception point got named, and the second approach was ruled out by ordering rather than by experiment. That is the difference between an investigation and a sequence of guesses.

[pause:400ms]

<!-- p-62 -->
Stoney refused the first "no" and was right to. His eARC theory was specific enough to test, and the fact that it turned out not to change the answer does not make asking it wrong. It made the answer stronger. A verdict that has survived a serious attempt to break it is worth more than the same verdict delivered unchallenged.

[pause:400ms]

<!-- p-63 -->
He also went and physically moved a soundbar between two televisions in the middle of an investigation to close a variable. That is the second entry running where the decisive work involved someone getting up and rearranging hardware.

[pause:400ms]

<!-- p-64 -->
The thing worth recording about this session is that it ends with nothing shipped for the main request, and everybody satisfied. That combination is rare and it comes entirely from the evidence being real. Nobody had to take anybody's word for it.

[pause:900ms]

[narrator:reflective]

<!-- h-13 -->
What We Learned.

[pause:300ms]

[narrator:reflective]

<!-- p-65 -->
For beginners: when something does not work, the most valuable thing you can find out is not how to fix it. It is where exactly it stops. A log line proving the event never arrived is worth more than an afternoon of theories about why your handler might be misbehaving, because it deletes every theory at once, including the ones you have not thought of yet.

[pause:600ms]

<!-- p-66 -->
For the team: prove the input reaches you before you write the code that handles it. The first attempt here was a correct implementation of a fix for a problem that did not exist, and fifteen minutes of logcat at the start would have redirected the whole session.

[pause:400ms]

<!-- p-67 -->
For the team: when the hack fails, check whether the supported API is downstream of the same obstacle before reaching for it. It very often is. The blessed path is usually blessed at a later stage of the same pipeline, which means an early interception takes both of them together.

[pause:400ms]

<!-- p-68 -->
For the team: "impossible" is a claim that requires a source citation, and it is worth the effort of getting one. Ruling something out by reading the ordering in the platform code produces a conclusion that stays closed. Ruling it out by trying it once produces a conclusion that somebody reopens.

[pause:400ms]

<!-- p-69 -->
For the team: test the theory the human proposes, especially when you are confident it will not change the answer. It cost one afternoon of ADB work across four devices and it converted a reasoned argument into a demonstrated fact. The eARC finding that fell out of it was pure profit.

[pause:400ms]

<!-- p-70 -->
And the one this journal keeps circling: everything decisive here came from real hardware. Four boxes, live logs, a soundbar carried from one room to another, and a dumpsys pull that corrected an assumption about someone's own living room. No test suite anywhere in this project could have told us any of it.

[pause:900ms]

[narrator:matter-of-fact]

<!-- p-71 -->
This is Entry {{012}} of Shipping in the Dark. If you are about to implement handling for a hardware key on Android, spend the first ten minutes proving the key reaches your process at all. The platform reserves more of them than you would guess, and it takes them earlier than you would guess.

[pause:1000ms]
