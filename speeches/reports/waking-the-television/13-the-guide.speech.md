# Speech Script: The guide: how not to spend nine months on this

**Part:** 13 of 13

[narrator:cozy]

<!-- part-title -->
Part 13. The guide. How not to spend nine months on this.

[pause:900ms]

[narrator:reflective]

<!-- p-1 -->
Everything here is grounded in an incident from an earlier part of this report. There is no generic Android advice in it. If a rule sounds obvious, it is because you are reading it after the story rather than before it.

[pause:500ms]

<!-- p-2 -->
The audience is specifically a developer building Google Cast support in an Android app that also ships a television or leanback interface inside the same bundle. That structure causes several of these problems and makes several of the others much harder to notice.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-1 -->
Architecture.

[pause:400ms]

[narrator:serious]

<!-- p-3 -->
Cast is wake-only if you have your own playback protocol.

[pause:600ms]

[narrator:matter-of-fact]

<!-- p-4 -->
If your app already knows how to play your content, do not let Cast load media. No RemoteMediaClient, no MediaLoadRequest, no loadMedia. Use Cast for exactly two things: getting the television powered on through CEC, and getting your own app to the front. Then hand over to your own protocol and treat the Cast session as finished business.

[pause:500ms]

<!-- p-5 -->
The moment Cast loads media, you have two playback systems on one device, each with its own state, and every feature you build afterwards has to be mirrored across both. The old app spent months in that condition. The rule that got written down in the end is four words: Chromecast is wake-only, never media.

[pause:500ms]

<!-- p-6 -->
If your app does not have its own playback protocol, ignore this rule entirely. The documented path is fine and it is what it is for.

[pause:600ms]

[narrator:serious]

<!-- p-7 -->
Keep Cast separate from your own multi-device system.

[pause:600ms]

[narrator:matter-of-fact]

<!-- p-8 -->
If you have your own device handoff feature, Cast is not part of it. They look like the same feature to users and they share nothing except one touch point, which is using Cast to wake hardware that your own protocol cannot reach because it is switched off. Everything that tried to blur that line in this project produced a race condition.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
Lifecycle.

[pause:400ms]

[narrator:serious]

<!-- p-9 -->
Start and stop the receiver on onStart and onStop. Never onPause.

[pause:700ms]

[narrator:matter-of-fact]

<!-- p-10 -->
This is the single highest value rule in this document. It was hit twice: once as a two month mystery that was never solved on the old app and was fought with a foreground reclaim chain that ended in an ANR, and once as a clean root cause and fix on the new app.

[pause:500ms]

<!-- p-11 -->
onPause fires when anything takes focus. A dialog. The screensaver. A system overlay. A picture-in-picture transition. onStart only fires again if the activity was fully stopped first, which a dialog does not do. Start on onStart and stop on onPause and your receiver goes off at the first dialog and never comes back for the life of the process.

[pause:500ms]

<!-- p-12 -->
The symptom does not look like a lifecycle bug. It looks like Google's Cast web page randomly hijacking the television, because that is what happens when a launch cannot find a live native receiver.

[pause:500ms]

<!-- p-13 -->
Two things make this rule stick in practice. Extract the receiver lifecycle into its own class rather than leaving it inline in the activity. And name its methods for visibility, onVisible and onHidden, not for activity callbacks. If the method is called onHidden, nobody wires it to onPause, because onPause does not mean hidden.

[pause:500ms]

<!-- p-14 -->
Make it idempotent, retry safe on a failed start, and fail open on a failed stop. A receiver left running is a far smaller problem than a receiver stuck off.

[pause:600ms]

[narrator:serious]

<!-- p-15 -->
Teardown must not run on a scope owned by the thing being torn down.

[pause:600ms]

[narrator:matter-of-fact]

<!-- p-16 -->
Stop casting closed the cast screen first, which cancelled the coroutine scope the teardown network call was on, so the stop never left the device and the television carried on playing. Put teardown on a manager-owned scope that outlives the UI.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-3 -->
Launching and waking.

[pause:400ms]

[narrator:serious]

<!-- p-17 -->
The Cast session is your one system-exempt launch path.

[pause:600ms]

[narrator:matter-of-fact]

<!-- p-18 -->
Android's background activity launch restrictions apply to your process. They do not apply to a launch performed by a system component. A Cast session started from the foreground launches your Android TV receiver through the system, which is why it works when everything else you try does not.

[pause:600ms]

[narrator:serious]

<!-- p-19 -->
If your wake needs a special permission, you have misdiagnosed the problem.

[pause:600ms]

[narrator:matter-of-fact]

<!-- p-20 -->
SYSTEM_ALERT_WINDOW, a BOOT_COMPLETED receiver, an exact alarm, any special access grant. If your launch or wake path depends on one of those to be reliable, stop and find the sanctioned mechanism, because there is one and it is the Cast session.

[pause:500ms]

<!-- p-21 -->
This project used all three of those workarounds at different points and deleted all three. The overlay permission one is the sharpest: it was load bearing in the design for months and was never granted on the target hardware, so the path it enabled had never once worked. YouTube Music does not hold that permission and wakes televisions perfectly, using nothing but a foreground-launched Cast session.

[pause:500ms]

<!-- p-22 -->
Three checks before you write the workaround. Does a first-party app do this without the permission? Would you be comfortable explaining the permission prompt to a user with a D-pad? And is the permission even granted on your actual target device right now?

[pause:600ms]

[narrator:serious]

<!-- p-23 -->
Do not fight another process for the foreground.

[pause:600ms]

[narrator:matter-of-fact]

<!-- p-24 -->
If the system put someone else on screen, ask why the system made that decision. Overriding it with startActivity from the background gives you START_DELIVERED_TO_TOP, which is a success-shaped no-op. Escalating to moveToFront on a timer gives you, in this project's case, a feedback loop through onPause that backlogged the main thread and got the process killed.

[pause:600ms]

[narrator:serious]

<!-- p-25 -->
Give the wake the time the hardware actually takes.

[pause:600ms]

[narrator:matter-of-fact]

<!-- p-26 -->
Measured cold wakes of a real streaming box came in at 8.2 seconds, 18.1 seconds, and one over twenty. A twenty second timeout, which felt generous, cut off a wake that was going to succeed. Measure your slowest target device and set the timeout from the measurement, not from feel.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-4 -->
Traps specific to this platform.

[pause:400ms]

<!-- p-27 -->
Do not trust PowerManager dot isInteractive on television boxes. It lies. The box, the panel and the HDMI sink have independent power states and the API collapses them into one boolean that is confidently wrong often enough to break your feature. Do not gate your wake on it. Just attempt the wake. Waking an awake device costs nothing.

[pause:500ms]

<!-- p-28 -->
MediaRouter's route list is empty on cold start. It is a cache, not a query. Start a scan and wait rather than reading it synchronously and concluding there are no devices.

[pause:500ms]

<!-- p-29 -->
A lingering previous Cast session blocks CEC on a new one. End sessions properly.

[pause:500ms]

<!-- p-30 -->
Do not end the Cast session early to save resources. With androidReceiverCompatible set, tearing down the session shortly after CEC fires aborts the app launch intent. The Cast shell logs closed_by_peer and your activity never starts. The television turns on and shows nothing.

[pause:500ms]

<!-- p-31 -->
Install development builds with dash i com dot android dot vending. Cast refuses to launch an app it does not believe came from the Play Store, with APP_NOT_INSTALLED_BY_WHITELISTED_INSTALLER, silently. Your integration will appear completely broken on every device you own and fine for everyone who installed from the store. Put the flag in your deploy script permanently.

[pause:500ms]

<!-- p-32 -->
Take a WifiManager dot MulticastLock if you use mDNS. Some Wi-Fi stacks, Samsung's among them, silently drop multicast. NsdManager reports success throughout.

[pause:500ms]

<!-- p-33 -->
Do not strip your logs in release builds. R8 removing Log dot i made the entire wake and auth flow undebuggable in exactly the build where the bugs lived.

[pause:500ms]

<!-- p-34 -->
The Cast SDK is main thread only, including on your failure paths. A timeout handler running cleanup off the main looper crashed the app. The failure path is the path you test least and the one that touches the SDK from the wrongest thread.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-5 -->
Sender side, if you also have a web app.

[pause:400ms]

<!-- p-35 -->
Set androidReceiverCompatible true in your session options. Without it, the SDK will not consider your native Android TV receiver at all and will launch the generic web receiver every time. A perfectly behaved native receiver cannot save you, because the sender never asked for it.

[pause:500ms]

<!-- p-36 -->
Use PAGE_SCOPED auto-join, and end sessions you find already resumed. With ORIGIN_SCOPED and no endCurrentSession anywhere, a leftover session silently rejoins on any later page load and relaunches the web receiver with no user action at all. This one presented as "the cast launches when playback starts," which is a completely misleading description, because the page people load before playing something is the watch page.

[pause:500ms]

<!-- p-37 -->
Check your production Content Security Policy allows the Cast SDK fetch. It works on every developer machine and is absent for every user otherwise.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-6 -->
Contracts, if you have your own server.

[pause:400ms]

[narrator:serious]

<!-- p-38 -->
Reject what you do not understand. Do not swallow it.

[pause:600ms]

[narrator:matter-of-fact]

<!-- p-39 -->
Every server side bug in this project was silent. A client had been sending an empty device identifier to release its claim, and the server ignored empty identifiers, so a graceful release had never worked for an unknown length of time with zero evidence anywhere. A case-sensitive lookup in a hub where everything else was case-insensitive produced silent misses. A reverse proxy allowed POST and not PATCH, so all the transport controls worked and all the track selection controls did nothing at all. A field name in the wrong casing convention simply arrived as absent.

[pause:600ms]

<!-- p-40 -->
A loud rejection is a bug report that writes itself, delivered to the person who caused it, at the moment they cause it. Graceful handling of input you do not recognise is how a broken assumption ships on both sides and lives for months.

[pause:600ms]

<!-- p-41 -->
Watch for the same value meaning different things. A volume sent as a display hint on a connect query string was being used to overwrite the device's persisted level on every reconnect.

[pause:600ms]

<!-- p-42 -->
A device's last-seen address is a fact about a path, not about a device. A television that reached you through a tunnel gives you a public address that is useless for the phone sitting three metres away from it on the same Wi-Fi. Both the proxy and the cast launch path dialled it, and timed out for seconds, from inside the same house.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-7 -->
Volume ownership.

[pause:400ms]

[narrator:serious, emphasis]

<!-- p-43 -->
A passive device never owns the volume channel.

[pause:800ms]

[narrator:matter-of-fact]

<!-- p-44 -->
If your device is participating in a session that is playing somewhere else, a volume input arriving at it almost certainly means the device that is making sound, not this one. Turning up your own silent stream is a correct-looking no-op.

[pause:500ms]

<!-- p-45 -->
This rule has to be reapplied at every physical input separately, because they arrive through unrelated APIs. In this project it was learned for hardware buttons, then again for Bluetooth, then again for a phone with no in-app slider, then again for a television remote over CEC. Nothing connects them. Each one is a new place to get it wrong.

[pause:600ms]

<!-- p-46 -->
Restore the receiving device's own remembered level on handover. Do not transplant the sender's. Eighty percent on a phone and eighty percent on a television amplifier are not comparable quantities.

[pause:600ms]

<!-- p-47 -->
Guard against feedback loops when two systems can both set and observe volume. This project needed an input-origin lock with a three second ownership window so CEC echoes could not clobber a value the user just set, plus a self-write echo suppressor so the app's own write did not return through a ContentObserver and get treated as a user action.

[pause:900ms]

[narrator:reflective]

<!-- h-8 -->
How to verify anything in this document.

[pause:400ms]

<!-- p-48 -->
Real device, real logcat. Almost nothing in this report was provable in a unit test. The lifecycle fix has seven good unit tests and they were written after the root cause was found on hardware, not before. The tests protect the fix. They did not find it.

[pause:500ms]

<!-- p-49 -->
Prove the test red first. The fix for a television that vanishes mid-session was verified by forcing its detection condition to always be false and watching the test fail, then by force stopping the app on a real television and timing how long the phone kept showing a remote. Nine seconds. A green test you have never seen fail proves nothing.

[pause:500ms]

<!-- p-50 -->
Test the environment your users are actually in. The Play Store installer whitelist breaks development and works in production. The Content Security Policy does the opposite. Both are invisible from the other side.

[pause:900ms]

[narrator:reflective]

<!-- h-9 -->
When it looks impossible.

[pause:400ms]

<!-- p-51 -->
Sometimes it is. The way to establish that, rather than assume it, has three steps, all used in the HDMI-ARC investigation in part twelve.

[pause:500ms]

<!-- p-52 -->
Cite the platform source, specifically. Not "Android intercepts volume keys." A named method in a named AOSP file, with its ordering relative to the other relevant method spelled out, so that somebody can check you and disagree.

[pause:600ms]

<!-- p-53 -->
Test across the dimension you think might matter. Four hardware configurations covering every ARC negotiation state that could plausibly change the behaviour. Identical results across all four turned a suspicion into a finding. Varying results would have turned it into a lead.

[pause:600ms]

<!-- p-54 -->
Check whether the gate can legitimately be opened. Many Android restrictions have a declaration form attached. Look for it. HDMI_CEC is signature-privileged, tied to a specific manufacturer's platform signing key, with no third-party application process of any kind. That is the difference between a wall and a locked door, and you only find out by going and looking.

[pause:700ms]

<!-- p-55 -->
Then write it down. A proven wall costs a week once. An assumed one costs a week every time somebody optimistic comes along.

[pause:900ms]
