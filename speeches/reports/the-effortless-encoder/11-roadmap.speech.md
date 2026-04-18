# Speech Script: What is not shipped, and why

**Part:** 11 of 11

[narrator:reflective]

Part eleven. What is not shipped, and why.

[pause:900ms]

<!-- p-1 -->
Every piece of software has the same two halves. The part that is done, and the part that is not. The honest thing to do at the end of a report like this one is name the second half, so the reader knows where the edges are.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-1 -->
What is shipped.

[pause:400ms]

<!-- p-2 -->
The earlier parts described what works today. As a reminder.

[pause:400ms]

<!-- p-3 -->
The four video codec families. H.264, HEVC, AV1, and VP9. Resolved to the right encoder handle for your hardware.

[pause:300ms]

<!-- p-4 -->
The full audio codec lineup. AAC, Opus, FLAC, AC-3, EAC-3, MP3, Vorbis, TrueHD, DTS.

[pause:300ms]

<!-- p-5 -->
Text subtitle routing plus optical character recognition for bitmap subtitles. PGS, DVD VobSub, DVB.

[pause:300ms]

<!-- p-6 -->
Every output container listed on the codec page, each with its own encoding strategy.

[pause:300ms]

<!-- p-7 -->
Built in presets covering the common hardware targets.

[pause:300ms]

<!-- p-8 -->
A per GPU hardware benchmark across CPU and hardware encoders.

[pause:300ms]

<!-- p-9 -->
A validator with a growing catalogue of rules at profile save time, plus a preview endpoint that adds the source file to the picture.

[pause:300ms]

<!-- p-10 -->
HDR passthrough, Dolby Vision preservation, and tonemap methods for HDR to SDR conversion.

[pause:300ms]

<!-- p-11 -->
Content analysis. Crop detection, intro and outro fingerprinting, subtitle OCR, Whisper speech transcription.

[pause:300ms]

<!-- p-12 -->
AES-128 HLS encryption for paid tier content.

[pause:300ms]

<!-- p-13 -->
Live transcode for on the fly playback to devices that cannot decode the stored file.

[pause:300ms]

<!-- p-14 -->
Blu Ray and DVD disc ripping.

[pause:300ms]

<!-- p-15 -->
The full distributed encoding stack, with signed HTTP transport, self registration, health tracking, retry chain, file transfer, and progress reporting.

[pause:1000ms]

<!-- p-16 -->
That is what the encoder does today. Now the honest part.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
What is planned but not yet shipped.

[pause:400ms]

<!-- p-17 -->
Each of the following is designed but not yet coded. Each has a reason for being deferred.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-3 -->
CENC DASH multi DRM.

[pause:400ms]

<!-- p-18 -->
This would let the encoder produce DASH streams encrypted with Common Encryption, consumable by Widevine, PlayReady, and FairPlay clients. It enables commercial streaming to paid subscribers on every major client family.

[pause:500ms]

<!-- p-19 -->
Deferred because it needs three things that are not in the current build.

[pause:400ms]

<!-- p-20 -->
A packager like mp4box or shaka packager for segment level encryption.

[pause:300ms]

<!-- p-21 -->
License server integration, usually a paid service.

[pause:300ms]

<!-- p-22 -->
And certificate handling per DRM system.

[pause:500ms]

<!-- p-23 -->
AES-128 HLS covers the home, prosumer, and casual paywall use case without this complexity.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-4 -->
Exponential backoff on distributed retries.

[pause:400ms]

<!-- p-24 -->
The current retry chain tries the next worker immediately on failure. A smarter implementation would wait a short time between retries, increasing on each attempt.

[pause:2000ms]

<!-- p-25 -->
Deferred because the current behaviour is safe. Failed tasks fall back to local dispatch. The user's encode still completes. Nice to have, not release critical.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-5 -->
Resumable source fetch.

[pause:400ms]

<!-- p-26 -->
The current HTTP source fetcher streams downloads straight to disk. A worker crash mid download discards the partial file. The next task attempt re downloads from scratch.

[pause:500ms]

<!-- p-27 -->
HTTP range requests are already enabled on the coordinator side. A fancier client could resume using an HTTP range header, but the current one does not keep checkpoint state.

[pause:500ms]

<!-- p-28 -->
Deferred because multi gigabyte downloads across the open internet are an edge case for now. Most distributed setups use a shared NAS where source files are visible locally and no fetch happens.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-6 -->
Mutual TLS between coordinator and worker.

[pause:400ms]

<!-- p-29 -->
The current security model uses HMAC signed payloads as the full authentication story. Works on trusted LAN plus HTTPS to the coordinator. For untrusted networks, the operator currently adds a VPN or TLS client certificate layer externally.

[pause:500ms]

<!-- p-30 -->
Deferred because getting mutual TLS right is significant work. Certificate issuance, rotation, revocation, and the operator experience of keeping the certificate chain healthy. An external layer covers the network use case today.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-7 -->
Progress streaming into the main job progress observer.

[pause:400ms]

<!-- p-31 -->
Remote task progress flows into the coordinator's in memory progress store. Dashboards read from it. But the main encoding orchestrator's progress observer, which drives the web client's progress bar, does not yet subscribe to the store.

[pause:500ms]

<!-- p-32 -->
Deferred because it needs a small wiring change, but the integration requires matching the progress schema between the orchestrator and the store. Straightforward work, not yet prioritized.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-8 -->
Strategy auto distribution.

[pause:400ms]

<!-- p-33 -->
This is the biggest remaining integration. The distribution infrastructure is shipped end to end. Coordinator dispatches. Worker receives. Health tracking. Progress reporting. All wired. All tested.

[pause:500ms]

<!-- p-34 -->
But existing single machine strategies, such as the HLS single pass strategy, still run whole jobs locally. They do not yet decompose the job into task arrays and dispatch them.

[pause:500ms]

<!-- p-35 -->
The work needed is per strategy. Each multi variant strategy needs to do four things.

[pause:500ms]

<!-- p-36 -->
Accept a worker dispatcher in its constructor. Build task arrays from the plan stage output. Dispatch them in parallel. Collect the results. Run finalize locally.

[pause:1800ms]

<!-- p-37 -->
Deferred because it is a careful refactor. Each strategy has its own stitching logic at the finalize stage. Some strategies share state across variants, like two pass stats files. Getting this right without breaking single machine users is the priority.

[pause:500ms]

<!-- p-38 -->
For now, the dispatcher is exercisable via direct calls, which is what the end to end tests do. And plugin strategies can wire themselves up today.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-9 -->
Disc metadata resolution.

[pause:400ms]

<!-- p-39 -->
The disc ripper currently produces MKV files named by title index. It does not yet auto resolve metadata like movie title, director, year, and cover art.

[pause:500ms]

<!-- p-40 -->
The resolver interface is scaffolded.

[pause:1000ms]

<!-- p-41 -->
The implementation would query TMDB with the main title's duration plus any disc embedded metadata, suggest a folder structure, and let the user confirm before moving.

[pause:500ms]

<!-- p-42 -->
Deferred because accurate matching from duration plus disc metadata is tricky for edge cases. Criterion special editions, re releases with different run times, and similar. Manual rename is reliable for now.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-10 -->
Open design questions.

[pause:400ms]

<!-- p-43 -->
A few areas where we have not settled on an answer. These may shift before they ship.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-11 -->
Plugin marketplace.

[pause:400ms]

<!-- p-44 -->
Plugins can already register strategies, codec resolvers, and dispatchers via dependency injection. There is no curated marketplace yet. Users who want to use a community preset, a community strategy, or a community health registry have to install it manually.

[pause:500ms]

<!-- p-45 -->
The question is whether to build a first party marketplace, or to point users at a community registry like a Git repository or a gist index. A marketplace is a meaningful ongoing operational commitment.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-12 -->
CRF scaling as a community tweakable.

[pause:400ms]

<!-- p-46 -->
Currently, the scale from software encoder CRF to hardware quality parameter is linear proportional.

[pause:1400ms]

<!-- p-47 -->
The question is whether to expose this as a pluggable quality scaler, per encoder override in encoder options, or per profile override. Opening it up lets the community publish perceptual measurements. VMAF, SSIM, PSNR. For specific hardware and codec pairings.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-13 -->
Progress streaming transport.

[pause:400ms]

<!-- p-48 -->
The current progress pipeline uses HTTP POST from worker to coordinator, plus polling from the dashboard. Server sent events or SignalR would be lower latency, at the cost of persistent connection state.

[pause:500ms]

<!-- p-49 -->
The question is whether the latency improvement is worth the extra complexity. Polling works today.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-14 -->
Hardware benchmark recalibration cadence.

[pause:400ms]

<!-- p-50 -->
The default recalibration runs after a month. Driver updates can change throughput before that window elapses. The question is whether to add driver version detection that forces a recalibration when the driver changes. That requires platform specific driver queries for each vendor family.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-15 -->
Known limitations, honest list.

[pause:400ms]

<!-- p-51 -->
Every piece of software has limitations. Here is the list for this encoder.

[pause:500ms]

<!-- p-52 -->
No support for encoder families beyond the four shipped. Uncompressed formats like ProRes Raw, RED Raw, and BRAW are treated as opaque inputs and stream copied when the container allows.

[pause:500ms]

<!-- p-53 -->
No support for 3D stereoscopic video. The encoder treats 3D sources as 2D with an unusual aspect ratio.

[pause:500ms]

<!-- p-54 -->
High frame rate content above 120 frames per second passes through, but the validator does not yet check the codec level's frame rate caps.

[pause:500ms]

<!-- p-55 -->
VR 180 and 360 degree video beyond stream copy is not supported. The encoder does not inject the metadata VR players need.

[pause:500ms]

<!-- p-56 -->
Chapter styling beyond basic title text is not supported. Chapter thumbnail extraction is scaffolded but not integrated with the web player.

[pause:500ms]

<!-- p-57 -->
No official support for Windows versions before Windows 10. The encoder may work there, but we do not test there.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-16 -->
Contributing.

[pause:400ms]

<!-- p-58 -->
The encoder is part of the open source NoMercy media server. Pull requests are welcome. Areas where contributions are especially valuable.

[pause:500ms]

<!-- p-59 -->
New preset definitions for specific hardware targets. Someone has a Samsung Frame TV with a weird codec quirk? Document it as a preset.

[pause:500ms]

<!-- p-60 -->
Perceptual CRF scaling curves per encoder. Someone ran rigorous VMAF measurements comparing libsvtav1 CRF 35 against av1 NVENC CQ values? Share the data. The quality scaler interface is designed for it.

[pause:500ms]

<!-- p-61 -->
New language models for subtitle OCR. Tesseract supports many languages. Adding new ones is small work per language.

[pause:500ms]

<!-- p-62 -->
New content analysis detectors. Silence detection. Scene cut detection. Song detection in background music. Any deterministic signal the planner can use for better encodes.

[pause:500ms]

<!-- p-63 -->
The source lives on GitHub under the NoMercy Entertainment organization, in the nomercy media server repository. Issues and pull requests go there.

[pause:900ms]

[narrator:reflective]

<!-- h-17 -->
Final notes.

[pause:400ms]

<!-- p-64 -->
The goal of this report was to show that the encoder is not a raw ffmpeg wrapper. It is a pipeline with opinions. Those opinions catch user mistakes before they become broken encodes. Those opinions pick the fastest encoder that can deliver the requested quality. Those opinions accept anything ffmpeg can parse on input, and restrict output to formats that actually play on target devices.

[pause:700ms]

<!-- p-65 -->
If any page raised questions this roadmap did not answer, the project's issue tracker on GitHub is the right place to dig further.

[pause:700ms]

<!-- p-66 -->
Thank you for reading.

[pause:1200ms]

This is the end of the report.

[pause:1400ms]
