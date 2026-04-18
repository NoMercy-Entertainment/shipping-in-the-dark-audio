# Speech Script: Overview — Why we built our own encoder

**Part:** Overview (0 of 11)
**Source:** `reports/the-effortless-encoder/00-overview.md`
**Narrator:** Aria (en-US-AriaNeural) by default, overridden to Guy for male voice generation
**Script author:** Echo

---

[narrator:matter-of-fact]

NoMercy MediaServer. The Effortless Encoder.

[pause:700ms]

[narrator:reflective]

A deep report on the orchestration behind NoMercy MediaServer's video and audio encoding. Architecture, codecs, safety net, hardware, content analysis, subtitles, D-R-M, live transcode, disc ripping, distributed encoding, and roadmap.

[pause:1200ms]

[narrator:cozy]

Overview. Why we built our own encoder.

[pause:900ms]

[narrator:reflective]

<!-- p-1 -->
Picture this. You own a movie. Not a streaming license, an actual file on your own hard drive. You bought it, you ripped it, it is yours.

[pause:500ms]

<!-- p-2 -->
You want to watch it on your phone. Your phone is an iPhone. Your movie is a 4K Blu Ray rip with Dolby Vision, seven point one audio, and subtitles. Your home network is great, your wifi is fine, and you are sitting on your couch.

[pause:500ms]

<!-- p-3 -->
And yet, the movie does not play.

[pause:400ms]

<!-- p-4 -->
Maybe the codec is wrong for your phone. Maybe the resolution is too big. Maybe the subtitles are in a format your player cannot read. Maybe the whole file format is a container your phone refuses to open.

[pause:600ms]

<!-- p-5 -->
Every person who has tried to run their own media server has hit some version of this wall. The usual answer is to download a tool called ffmpeg, learn about codecs for three weeks, write a shell script with many flags, and hope it works. When it does not work, you read a forum post from a decade ago, try a flag, see the error change, try another flag, and eventually give up.

[pause:700ms]

[narrator:matter-of-fact]

<!-- p-6 -->
We did not want to give up. So we built an encoder.

[pause:900ms]

[narrator:cozy]

<!-- h-1 -->
What the encoder does, in plain words.

[pause:400ms]

<!-- p-7 -->
It takes a movie file, or a TV episode, or a disc you just put in your drive. And it produces a version of that content that plays on whatever device you hand it to. Your phone. Your laptop. Your Apple TV. Your big TV in the living room.

[pause:500ms]

<!-- p-8 -->
That is the promise on the tin. The rest of this report is about how that promise gets kept. The details matter, because video encoding is genuinely complicated under the surface. The encoder's job is to hide that complexity from you, and only show it when you ask.

[pause:600ms]

<!-- p-9 -->
If you already know ffmpeg, this report will show you the exact flags, the exact manifest tags, the exact rate-control curves and hardware quirks the encoder handles. If you do not know ffmpeg, the report still works. Start at page one, keep reading, and by the end you will know more about video encoding than most people in the industry.

[pause:900ms]

[narrator:reflective]

<!-- h-2 -->
The thing we replaced.

[pause:400ms]

<!-- p-10 -->
We had an earlier version of this encoder. It worked. It shipped. It also had a tight grip on every assumption we had about encoding at the time it was built, and loosening that grip was not possible without a full rewrite.

[pause:500ms]

<!-- p-11 -->
The earlier version assumed a single machine. It assumed one encoder per job. It assumed software video encoding would be the common case. It baked hardware encoder selection into the same code paths as software. It treated profiles as loose bags of flags. It did not separate validation from execution. It did not have a plan stage that could be inspected before the encode ran.

[pause:600ms]

<!-- p-12 -->
The current encoder is the second system. Same problem, new architecture. If you are a user who has been with the project from the beginning, the surface looks similar. You still pick a profile, you still point it at a file, you still get playable output. The machinery underneath is different. The rest of this report shows you what that machinery looks like, and why each piece is where it is.

[pause:900ms]

[narrator:friendly]

<!-- h-3 -->
The people who need this.

[pause:400ms]

<!-- p-13 -->
Three kinds of people show up to something like this.

[pause:400ms]

<!-- p-14 -->
The first is a home server owner. They have a collection of movies, some TV shows, maybe a music library, and they want to watch them on their own terms. They do not want to pay a monthly fee for access to content they already own. They do not want to worry about a streaming service removing a title tomorrow. They just want to watch their stuff, on their devices, reliably.

[pause:600ms]

<!-- p-15 -->
The second is a small studio editor. They work with video professionally. They make their living producing content. And they need the output they ship to clients to just work. Every time. No calls at midnight from a client saying the video will not play on their phone. No weird color shifts on the client's review screen. Just reliable output across every device their client might use.

[pause:600ms]

<!-- p-16 -->
The third is someone with more than one computer and some ambition. Maybe a home lab. Maybe a shop with a few machines. They have encoding work to do, and they do not want just one machine to carry the whole load while the others sit idle. They want to spread the work across the fleet. And they would like the fleet to self-heal if one node drops out.

[pause:500ms]

<!-- p-17 -->
This encoder is for all three.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-4 -->
A glimpse at the shape of things.

[pause:400ms]

<!-- p-18 -->
Before we dive into the pipeline, the codecs, the hardware, and the rest, it helps to see a single concrete artifact. On screen is a real encoding profile, as it lives in the database.

[pause:700ms]

Walk with me through what it says. At the top, an ID and a name, plus a container of HLS. One video profile: H.264 at 1920 by 1080, CRF 23, medium preset, high profile at level 4.2, 8 bit pixel format, two second keyframes. One audio profile: AAC stereo at 192 kbps, 48 kilohertz, with a language filter that keeps English, Japanese, and French. One subtitle profile in extract mode, WebVTT, English only. And two flags at the top level: auto ladder is on, auto detect crop is on.

[pause:900ms]

<!-- p-19 -->
That is the whole input. The encoder takes this, combines it with whatever source file you point at, and produces a complete HLS package. Master playlist, per-variant playlists, segment files, and sidecar subtitle playlists, that plays on every HLS client in existence.

[pause:500ms]

<!-- p-20 -->
No flags. No filter chain. No preset lookup. You wrote your intent. The encoder translated it.

[pause:500ms]

<!-- p-21 -->
How that translation works. The stages, the decisions, the hardware-aware rate control, the HLS manifest assembly, the subtitle conversion, the encryption. That is what this report covers.

[pause:900ms]

[narrator:reflective]

<!-- h-5 -->
The developer side, briefly.

[pause:400ms]

<!-- p-22 -->
The person who built this is one human. He worked on it for years. He does not have a team of video engineers behind him. He is not at a big tech company with infinite compute. He is one person with strong opinions about how media ownership should work, and a willingness to keep going long after most people would have stopped.

[pause:500ms]

<!-- p-23 -->
That shapes the design in ways that matter.

[pause:400ms]

<!-- p-24 -->
Every feature has to earn its place. If something is in the encoder, it is because a real user hit a real problem, and there was no reasonable alternative. Nothing is here to be impressive. Every line of code has to justify the cost of maintaining it.

[pause:500ms]

<!-- p-25 -->
The safety net is non-negotiable. When one person is on call for support, every class of user mistake you can prevent at build time is a support call you do not have to take at three in the morning.

[pause:500ms]

<!-- p-26 -->
Complexity has to hide. Opening the settings page and seeing a thousand options is not a feature. It is a defeat. Pick sensible defaults. Let the user override them when they know what they are doing.

[pause:500ms]

<!-- p-27 -->
And the thing has to keep working after it ships. The code you write today, you will still have to maintain years from now, when the original context has faded, and you are doing this between a full-time job and a family dinner. Future you has to understand present you.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-6 -->
What this report covers.

[pause:400ms]

<!-- p-28 -->
The page you are reading is the overview. Eleven numbered parts follow, each focused on one aspect of the encoder.

[pause:500ms]

<!-- p-29 -->
Part one. How it thinks. The pipeline the encoder runs. The stages it moves through. Why each one exists, and what it emits for the next stage to consume.

[pause:400ms]

<!-- p-30 -->
Part two. The codec maze. Why there are so many video encoders, how the encoder picks between them on your behalf, and the concrete quirks it translates away for you.

[pause:400ms]

<!-- p-31 -->
Part three. Describing what you want. The profile schema. The auto ladder. Preset inheritance. How profiles are shared, signed, and imported.

[pause:400ms]

<!-- p-32 -->
Part four. The safety net. The validator and the preview endpoint. The categories of mistake the encoder catches, what the error messages look like, and how the dashboard renders them live.

[pause:400ms]

<!-- p-33 -->
Part five. Measuring the machine. Per-GPU hardware benchmarking. The speed index. How HDR passthrough, Dolby Vision, and HDR to SDR tonemapping are routed.

[pause:400ms]

<!-- p-34 -->
Part six. Watching the content. Crop detection. Audio fingerprinting for intro and outro detection. Subtitle OCR with Tesseract. Speech transcription with Whisper.

[pause:400ms]

<!-- p-35 -->
Part seven. Subtitles and keeping streams yours. Subtitle format routing. ASS, PGS, Web VTT, and the HLS Web VTT pipeline. AES-128 HLS encryption, how the key is delivered, and where CENC DASH sits on the roadmap.

[pause:400ms]

<!-- p-36 -->
Part eight. Playing what your device cannot decode. Live transcode. Session lifecycle. Buffer management. Seek handling.

[pause:400ms]

<!-- p-37 -->
Part nine. From shelf to library. Disc ripping. The drive monitor, the ffprobe bluray pseudo URL, stream copy to intermediate MKV, and the auto encode handoff.

[pause:400ms]

<!-- p-38 -->
Part ten. When one machine is not enough. Distributed encoding. The coordinator and worker architecture. HMAC signed transport. Self registration, health tracking, retry chain, file transfer, and progress reporting.

[pause:400ms]

<!-- p-39 -->
Part eleven. What is not shipped, and why. The roadmap. The honest trade offs behind what is deferred. Where community contribution is most valuable.

[pause:700ms]

<!-- p-40 -->
Let us start with how it thinks.

[pause:1200ms]
