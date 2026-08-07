# Speech Script: One symptom, three causes, three codebases

**Part:** 8 of 13

[narrator:cozy]

<!-- part-title -->
Part 8. One symptom, three causes, three codebases.

[pause:900ms]

[narrator:reflective]

<!-- p-1 -->
Fixing the receiver lifecycle in part seven was necessary. It was not sufficient. The visible symptom, Google's generic Cast web page taking over the television and pushing the NoMercy app off the screen, had three independent causes living in three different codebases, and each one produced the identical picture on the same television.

[pause:600ms]

<!-- p-2 -->
This is the part of the report I would most want somebody to read before they start debugging their own Cast integration. One symptom is not one bug. It is a symptom.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-1 -->
Cause one, on the television. The receiver was switched off.

[pause:400ms]

<!-- p-3 -->
Covered in part seven. A lifecycle callback mismatch left the native Android TV receiver stopped, so launches fell through to the web receiver.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
Cause two, on the web sender. Nobody told Cast it was allowed.

[pause:400ms]

<!-- p-4 -->
Early July, in nomercy-app-web, the browser app.

[pause:500ms]

<!-- p-5 -->
The web sender's Cast session options never declared androidReceiverCompatible true.

[pause:600ms]

<!-- p-6 -->
That flag is how a sender tells the Cast SDK that this application has an Android TV receiver and that launching it is acceptable. Without it, the SDK does not consider the native app at all. It launches the generic web receiver, every time, on every Android TV, and the native app that was running gets pushed aside.

[pause:500ms]

<!-- p-7 -->
Note what that means alongside cause one. Even a perfectly behaved native receiver, started and stopped on exactly the right callbacks, running happily on the television, could not help, because the sender never asked for it. The two bugs are completely independent, in different languages, in different repositories, maintained as different concerns, and they produce pixel-identical failures.

[pause:600ms]

<!-- p-8 -->
If you had fixed either one alone and tested from the wrong device, you would have concluded your fix did not work.

[pause:900ms]

[narrator:tense]

<!-- h-3 -->
Cause three, on the web sender. A zombie session resuming itself.

[pause:400ms]

<!-- p-9 -->
Mid July, after the first web fix was in, a report kept coming back with a very specific and very misleading description. The Chrome web cast launches after the player starts playing again.

[pause:500ms]

<!-- p-10 -->
Read that as a bug report and you form an immediate theory. Something in the playback start path is triggering a cast. Look at the play handler. Look at what fires on playing. Look at whether the player is touching the Cast SDK on resume.

[pause:500ms]

<!-- p-11 -->
That theory is wrong, and the commit that fixed it says so directly.

[pause:600ms]

[narrator:serious]

<!-- p-12 -->
That is the "chrome web cast launches after the player starts playing again" report: it isn't triggered by playback at all, it's the zombie resuming as the watch page loads.

[pause:800ms]

[narrator:matter-of-fact]

<!-- p-13 -->
The web app was using the ORIGIN_SCOPED auto-join policy, and there was no endCurrentSession call anywhere in the codebase. A Cast session from earlier, never properly ended, remained resumable for the whole origin. On any later page load anywhere on the site, the SDK silently rejoined it, and rejoining it relaunched the web receiver on the television. No user action. No button. No playback involvement whatsoever.

[pause:600ms]

<!-- p-14 -->
The correlation with playback was real and entirely incidental: the watch page is the page people load when they are about to play something, so the zombie resumed at almost exactly the moment playback started.

[pause:500ms]

<!-- p-15 -->
The fix was to switch to PAGE_SCOPED auto-join and to force an end on any session the SDK reports as already resumed.

[pause:900ms]

[narrator:reflective]

<!-- h-4 -->
The wrong theory that was eliminated first.

[pause:400ms]

<!-- p-16 -->
There is a plausible-sounding explanation for a hijack like this that is worth knowing was checked and ruled out: a mismatched or stale Cast application ID, so that the sender is launching a different receiver application than the one you built.

[pause:500ms]

<!-- p-17 -->
It was not that. The web app's Cast application ID was set once when Cast was introduced and never changed since. That is a quick check on a version history, it eliminates an entire family of theories, and it is the reason attention went to session policy instead of spending a day on configuration.

[pause:500ms]

<!-- p-18 -->
Eliminating a wrong theory cheaply is worth as much as confirming a right one, and it is much easier.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-5 -->
And the smaller stuff.

[pause:400ms]

<!-- p-19 -->
A cluster of hardening followed on the web sender in August, none of it individually dramatic.

[pause:500ms]

<!-- p-20 -->
The wake now waits for the television to actually be there, rather than for the Cast session object to open, which happens much earlier.

[pause:500ms]

<!-- p-21 -->
The device chooser could hang when the device list came back empty.

[pause:500ms]

<!-- p-22 -->
A session request promise had no bound and could stay pending indefinitely.

[pause:500ms]

<!-- p-23 -->
The poll loop that watched for the television never gave up when the television was unreachable.

[pause:500ms]

<!-- p-24 -->
Content Security Policy in production blocked the fetch that loads the Cast SDK, so the whole feature was absent in the environment that matters and present everywhere else.

[pause:600ms]

<!-- p-25 -->
That last one deserves a moment. A production-only CSP failure means the feature works on every developer machine and is missing for every user. It is the same shape as the Play Store installer whitelist from part four, in the opposite direction, and both are arguments for testing the environment users actually hit rather than the one you have open.

[pause:900ms]
