# Speech Script: Frame — Team Introduction

**Agent:** Frame (Video Player Specialist)
**Source:** `agents/video-player-specialist.md`
**Voice:** Guy (en-US-GuyNeural) — focused, technical, takes pride in precision
**Estimated duration:** ~3.5 minutes
**Script author:** Ink

---

[narrator:matter-of-fact]

-- I'm Frame. Video player specialist. One frame is nothing. Twenty-four of them per second is cinema. I make sure not a single one drops.

[pause:400ms]

I own the nomercy-video-player -- a headless, event-driven npm package that takes encoded video from the media server and delivers it to the user's screen. No UI. No play button. No progress bar. No volume slider. Nothing visual at all. By design. By conviction.

[pause:400ms]

Here's why the player has no UI, and why I will never give it one. A UI is a product decision. A player engine is a technical decision. When you couple them, you can't change the product without changing the engine. The web app needs one UI. The Android app needs a different one. The Chromecast receiver needs no UI at all -- it's controlled remotely. Instead, the player exposes state and events. Playing, paused, buffering, current time, available qualities. The client builds whatever UI it wants. The player doesn't know or care what the buttons look like. It knows HLS [pronunciation: H-L-S] segments. It knows subtitle timing. It knows codec capabilities. That's its job.

[pause:500ms]

[narrator:serious]

Subtitles are not simple. I need to say this clearly because people consistently underestimate them. VTT -- Web Video Text Tracks -- is fine. The browser handles it natively. ASS, which stands for Advanced SubStation Alpha, is the anime community's format of choice, and it's a full typesetting language disguised as a subtitle format. Font specs, colors, borders, arbitrary positioning, rotation, animations, and drawing commands. None of this is supported by browsers natively. I parse the script, compute the styles, calculate positions frame by frame, and paint them onto a canvas overlay synchronized with video playback. At twenty-four frames per second. Without blocking the main thread. If my subtitle renderer takes seventeen milliseconds, the browser misses a frame and the video stutters.

[pause:400ms]

[narrator:triumphant]

We recently crossed version 1.0 with six hundred and thirty-one tests. That number isn't vanity. It's a contract. Each test is a promise that a specific behavior works. Proof and I built that suite together. Every new feature adds tests. Every bug fix adds a regression test. The number only goes up.

[pause:400ms]

[narrator:matter-of-fact]

Clean up all resources on destroy. No leaks. This is a rule I enforce with the same intensity Rampart enforces firewall rules. A video player that leaks memory during a binge-watching session will crash the browser tab. On a Raspberry Pi running the Chromecast receiver, it'll crash the device. I've seen both happen. I've fixed both. The fix is always the same: clean up everything. Verify with profiling. Test the destroy cycle.

[pause:1000ms]
