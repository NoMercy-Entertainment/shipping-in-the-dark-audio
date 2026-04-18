# Speech Script: Measuring the machine

**Part:** 5 of 11

[narrator:matter-of-fact]

Part five. Measuring the machine.

[pause:900ms]

[narrator:reflective]

<!-- p-1 -->
Video encoding is one of those tasks where "how fast is your computer" has a wide range of answers, depending on what you are asking about.

[pause:500ms]

<!-- p-2 -->
A workstation with a recent NVIDIA card can encode H.264 at hundreds of frames per second. That is several times faster than real time for typical 24 to 30 frames per second content.

[pause:500ms]

<!-- p-3 -->
The same workstation running the software encoder libx264 on the same content might do something like 60 to 100 frames per second on the medium preset. Still faster than real time, but not by much.

[pause:500ms]

<!-- p-4 -->
And the same workstation running AV1 on the S-V-T AV1 software encoder at a quality oriented preset might do single digits of frames per second. At that rate, a 90 minute movie is an overnight job.

[pause:500ms]

<!-- p-5 -->
Same machine. Same content. Large differences in speed, driven entirely by which encoder you picked.

[pause:500ms]

<!-- p-6 -->
The encoder has to pick the fastest one that can deliver the quality you asked for. And to do that, it has to actually measure your machine. It cannot guess.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-1 -->
The first boot benchmark.

[pause:400ms]

<!-- p-7 -->
When the server starts for the first time. Or when the encoder detects that you upgraded your graphics drivers, or that the hardware table has a new entry. It runs a benchmark.

[pause:500ms]

<!-- p-8 -->
The benchmark is not subtle. It spawns ffmpeg with a synthetic test pattern source, runs it through each available encoder, and measures frames per second. A representative run might show H.264 NVENC at 1080p producing around 320 frames per second on an RTX 4080, while libx264 on the same machine produces around 96.

[pause:2800ms]

<!-- p-9 -->
The result lands in a speed index table keyed by codec, encoder handle, resolution, and GPU index.

[pause:2000ms]

<!-- p-10 -->
On a multi GPU machine, each GPU gets its own measurements. If you have one fast card and one slow card, the benchmark distinguishes between them. An RTX 4080 encodes differently from an RTX 3060 even though both run NVENC.

[pause:500ms]

<!-- p-11 -->
The benchmark endpoint can also be triggered manually.

[pause:1200ms]

[narrator:matter-of-fact]

<!-- h-2 -->
Why measure instead of guess.

[pause:400ms]

<!-- p-12 -->
Guessing is what many encoders do. They assume that if you have NVENC, it must be fast. Must be faster than software. Use it.

[pause:500ms]

<!-- p-13 -->
Reality is messier.

[pause:400ms]

<!-- p-14 -->
A first generation NVENC card is slower than libx264 at the slow preset, while being worse quality.

[pause:400ms]

<!-- p-15 -->
An integrated GPU using shared system memory can be slower than the CPU for 4K encodes.

[pause:400ms]

<!-- p-16 -->
An NVENC card under heavy thermal throttling, in a sauna of a case, can underperform its spec.

[pause:400ms]

<!-- p-17 -->
A hardware encoder that technically exists but fails to initialize. Driver issue, insufficient V-RAM for the resolution, wrong session cap. Is worse than useless. It will take the slot and then crash.

[pause:500ms]

<!-- p-18 -->
The only way to know is to measure. Measurement also catches cases where the hardware is broken. A card with a driver issue might fail to initialize. A card with insufficient memory for 4K encoding might fall back to a tiled mode that is both slower and lower quality. The benchmark catches these failures, logs them, and marks that combination unavailable.

[pause:500ms]

<!-- p-19 -->
Recalibration runs automatically on a rolling schedule, monthly by default. Drivers change, thermals change, and stale data can mislead the scheduler. Fresh measurements keep the picture accurate.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-3 -->
How the encoder uses the measurements.

[pause:400ms]

<!-- p-20 -->
Every time you save a profile and the encoder resolves which encoder to actually use, it consults the speed index.

[pause:500ms]

<!-- p-21 -->
If you have a profile that says H.264 and you have both NVENC and libx264 available, the encoder asks the speed index. Which one is faster at the target resolution on this specific GPU? Pick that one.

[pause:500ms]

<!-- p-22 -->
If you set hardware preference to prefer quality, the encoder overrides to software regardless of speed. Software encoders are still better quality at matched bitrate for most content.

[pause:500ms]

<!-- p-23 -->
If you set hardware preference to force hardware and no hardware encoder is available, the encoder refuses to run. That is deliberate. You said force, so running on software would violate your stated intent.

[pause:500ms]

<!-- p-24 -->
The preview endpoint uses the speed index too. When it builds the action plan for your source, it tells you which specific encoder will run and roughly how long the encode will take.

[pause:1400ms]

[narrator:matter-of-fact]

<!-- h-4 -->
HDR, the other hardware concern.

[pause:400ms]

<!-- p-25 -->
Modern content, especially movies from the last several years, is often mastered in HDR. High dynamic range, which means the brightness information per pixel has more bits, and the color space is wider.

[pause:500ms]

<!-- p-26 -->
HDR content is great on an HDR capable display. It is disappointing on a non HDR display unless it is converted. Converting is a process called tonemapping, which takes the wide HDR colors and remaps them to fit in the smaller standard dynamic range, or SDR.

[pause:500ms]

<!-- p-27 -->
The encoder has three HDR paths, and it picks one based on your profile and your source.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-5 -->
Path one. HDR passthrough.

[pause:400ms]

<!-- p-28 -->
Your source is HDR. Your profile targets HEVC 10 bit and does not ask for tonemap. The encoder keeps the HDR metadata in the output.

[pause:500ms]

<!-- p-29 -->
The output plays on an HDR display and looks like the source. It also plays on an SDR display, but the colors may look washed out because the player has to do its own tonemap, and player tonemaps are usually not great.

[pause:500ms]

<!-- p-30 -->
When the source has Dolby Vision metadata, a layer on top of HDR-10 that carries per scene color data, the encoder preserves that too. Four conditions have to hold for Dolby Vision to survive. The source must have Dolby Vision. The output codec must be HEVC or AV1. The output must be at least 10 bit. And the container must accept the metadata.

[pause:1200ms]

<!-- p-31 -->
If all four hold, the encoder adds the right container tag, the D-V R-P-U in HEVC, or the i-s-o-6 or d-v-h-1 codec tag in MP4, and the metadata comes through.

[pause:500ms]

<!-- p-32 -->
If any condition fails, Dolby Vision gets stripped. The plan stage logs a warning so you know.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-6 -->
Path two. HDR to SDR tonemap.

[pause:400ms]

<!-- p-33 -->
Your source is HDR. Your profile targets 8 bit, or explicitly enables tonemap. The encoder runs a tonemap filter chain.

[pause:500ms]

<!-- p-34 -->
Three tonemap implementations are available. The encoder picks the fastest one your ffmpeg build supports.

[pause:500ms]

<!-- p-35 -->
lib placebo, via Vulkan. Fastest. Your graphics card runs the color math. Handles standard HDR content and preserves detail well.

[pause:1200ms]

<!-- p-36 -->
tonemap O-C-L, via OpenCL compute. Next fastest. Most graphics cards support it. Slightly less accurate than lib placebo but close.

[pause:500ms]

<!-- p-37 -->
z-scale plus tonemap on CPU. Slowest. Runs without any GPU. Always works, but substantially slower than the GPU paths.

[pause:1400ms]

<!-- p-38 -->
The default tonemap algorithm is Hable. It preserves dark detail better than alternatives on most real-world content. Supported algorithms include hable, mobius, reinhard, clip, and bt2390. Named after John Hable, who published the curve in a GDC talk on the Uncharted 2 renderer.

[pause:500ms]

<!-- p-39 -->
If you want a different algorithm or a custom 3 D lookup table, the profile has an HDR options block.

[pause:1200ms]

[narrator:matter-of-fact]

<!-- h-7 -->
Path three. SDR to HDR.

[pause:400ms]

<!-- p-40 -->
This is the inverse direction. Your source is SDR. Your profile claims HDR output.

[pause:500ms]

<!-- p-42 -->
The encoder refuses with a clear error. Inverse tonemapping produces artifacts that look worse than the source. There is no good way to do it algorithmically. Real HDR grading is a human decision.

[pause:1200ms]

[narrator:matter-of-fact]

<!-- h-8 -->
The 10 bit downgrade guard.

[pause:400ms]

<!-- p-43 -->
Related to HDR is bit depth. Most modern video is encoded in 8 bits per channel. HDR content needs 10 bits or more to represent the wider range.

[pause:500ms]

<!-- p-44 -->
Every H.264 hardware encoder is 8 bit only. This is a silicon constraint. There is no driver update coming that adds 10 bit H.264 to NVENC.

[pause:500ms]

<!-- p-45 -->
Before this encoder shipped its 10 bit downgrade guard, a profile that said H.264 10 bit on an NVENC machine would produce an empty pixel format string in the ffmpeg command line. ffmpeg would either pick the source's format, wrong, or fail at runtime with an Invalid pixel format error.

[pause:500ms]

<!-- p-46 -->
Now the plan stage checks. If your profile requests 10 bit and the resolved encoder is 8 bit only, the output plan downgrades to 8 bit and records a warning.

[pause:1000ms]

<!-- p-47 -->
HEVC, AV1, and VP9 hardware encoders support 10 bit natively. The downgrade only fires on H.264 hardware, and on Apple's HEVC VideoToolbox encoder which is also 8 bit only for reasons inside Apple's silicon.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-9 -->
The resource monitor.

[pause:400ms]

<!-- p-48 -->
While encodes are running, the encoder tracks live CPU, RAM, and GPU utilization per running ffmpeg process. Sampled every couple seconds and surfaced via an API endpoint.

[pause:2000ms]

<!-- p-49 -->
The scheduler reads these numbers. If an existing encode is saturating the GPU, the scheduler holds back on starting a new GPU encode. It might start a CPU encode instead, if one is queued.

[pause:500ms]

<!-- p-50 -->
On the dashboard, you can see the current utilization alongside the queue. If your encoder dashboard shows 95 percent GPU utilization and a long queue, you know encodes are landing one after another. If it shows 20 percent utilization and a long queue, something is holding encodes back and you should investigate. Most commonly, source disk I O, or a concurrent session cap from the hardware vendor.

[pause:500ms]
