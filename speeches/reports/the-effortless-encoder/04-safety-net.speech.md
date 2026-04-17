# Speech Script: The safety net

**Part:** 4 of 11

[narrator:tense]

Part four. The safety net.

[pause:900ms]

[narrator:reflective]

<!-- p-1 -->
Here are the three ways a misconfigured encode actually goes wrong. None of them are "ffmpeg crashes forty minutes in." ffmpeg is faster than that, and its misbehavior is more subtle.

[pause:700ms]

<!-- p-2 -->
Way one. The profile is bad enough that ffmpeg refuses to start. You get a cryptic error on the first second. Usually a format flag that does not exist on this encoder, or a codec the container cannot hold. The user is not a video engineer. They read the error, do not understand it, and come away thinking the encoder is broken.

[pause:500ms]

<!-- p-3 -->
Way two. ffmpeg runs to completion. The file gets written. It even plays on the machine the user tested on. Then they try to watch it on their Apple TV and it refuses. The file declares H.264 Level 4.1 in its header, but the actual picture is 4K. Level 4.1 caps at 1080p. Apple TV reads the level flag, refuses to decode. The user's PC ignored the mismatch because software decoders are lenient. The Apple TV was not.

[pause:500ms]

<!-- p-4 -->
Way three. ffmpeg runs, the file plays everywhere, but it looks terrible. The user set CRF 40 because they saw a forum post recommending it for something unrelated. CRF 40 on H.264 is far past the usable range. The picture is blocky and smeared. Their friend, watching on a nice screen, asks why this movie looks like a potato.

[pause:500ms]

<!-- p-5 -->
All three of these can be caught before ffmpeg runs. That is the safety net.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-1 -->
The validator API.

[pause:400ms]

<!-- p-6 -->
Every profile goes through the validator at save time and every time a field changes.

[pause:1200ms]

<!-- p-7 -->
The response contains errors and warnings. Each with a stable ID, a field path, a human message, and a fix.

[pause:1600ms]

<!-- p-8 -->
Errors block the save. Warnings do not. Every rule has a stable ID so dashboards and documentation can link to specific explanations.

[pause:500ms]

<!-- p-9 -->
The dashboard calls this endpoint on every keystroke in the profile form. Errors render red on the relevant field. Warnings render yellow. You see the state of your profile before you click save.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
The categories of rule.

[pause:400ms]

<!-- p-10 -->
The validator catches many categories of mistake. Not from a fixed list. New rules get added as real users hit real problems. Each bug becomes a rule, and the rule protects everyone going forward. Here are the categories, ordered from basic to subtle.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-3 -->
Structural problems.

[pause:400ms]

<!-- p-11 -->
The basics. A profile with no name. A profile with no video or audio outputs. A video output with zero width. A video output that specifies neither a bitrate nor a CRF, leaving the encoder to guess.

[pause:1200ms]

<!-- p-12 -->
These are caught trivially. The validator looks at the profile as data, checks that required fields are present, rejects if they are not.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-4 -->
Codec and container compatibility.

[pause:400ms]

<!-- p-13 -->
HLS cannot hold VP9. DASH can. MP4 technically can hold VP9 but most players will not play it. MKV can hold anything. Each container has its own codec allowlist. The validator enforces the rules with clear messages.

[pause:1600ms]

<!-- p-14 -->
Similar rules for audio. HLS wants AAC, AC-3, EAC-3, or Opus. MP3 in HLS is technically possible but not widely supported, so the validator warns rather than blocks.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-5 -->
Level and dimensions.

[pause:400ms]

<!-- p-15 -->
Way two above. H.264 Level 4.1 is a popular default. It caps at 1080p. If your profile has Level 4.1 and a 4K resolution, the validator rejects it with a clear error.

[pause:1400ms]

<!-- p-16 -->
The same check runs for HEVC and VP9. Each codec has its own level table built into the validator.

[pause:1200ms]

[narrator:matter-of-fact]

<!-- h-6 -->
Quality and bitrate.

[pause:400ms]

<!-- p-17 -->
Way three above. CRF 40 on H.264 produces visibly blocky output. The validator warns. Not blocks, because maybe that is what you want for a tiny preview encode. But it tells you.

[pause:500ms]

<!-- p-18 -->
Same for bitrate. 4K H.264 at 2 megabits per second is unwatchable regardless of preset. The validator warns with a codec aware floor.

[pause:1400ms]

<!-- p-19 -->
HEVC, AV1, and VP9 get lower floors because they are more efficient.

[pause:500ms]

<!-- p-20 -->
AC-3 has a specific bitrate ladder. If you pick a value between rungs, ffmpeg silently rounds down. 100 becomes 96 and you never know. The validator catches off ladder values and tells you the two nearest valid rungs.

[pause:1400ms]

[narrator:matter-of-fact]

<!-- h-7 -->
Bit depth and codec compatibility.

[pause:400ms]

<!-- p-21 -->
Every H.264 hardware encoder is 8 bit only. If your profile specifies 10 bit H.264, the resolved output will be 8 bit with a silent downgrade. Unless your bit depth policy says otherwise.

[pause:1200ms]

<!-- p-22 -->
VP9 has the opposite issue. Its profile numbers encode the bit depth. Profile 0 and 1 are 8 bit only. Profile 2 and 3 are 10 or 12 bit. If your profile says 10 bit plus profile 0, the validator rejects with instructions to use profile 2 or 3.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-8 -->
Adaptive bitrate ladder sanity.

[pause:400ms]

<!-- p-23 -->
If you manually write a multi variant profile and accidentally make the 1080p variant lower bitrate than the 720p variant, your ladder is broken. The player sees no reason to switch up to 1080p. You wasted encode time on the 1080p variant.

[pause:1200ms]

[narrator:matter-of-fact]

<!-- h-9 -->
Duplicate variants.

[pause:400ms]

<!-- p-24 -->
Two video outputs with exactly the same settings. The encoder would run the same encode twice and produce two copies of the same file. The validator warns.

[pause:1200ms]

[narrator:matter-of-fact]

<!-- h-10 -->
Segment and keyframe alignment.

[pause:400ms]

<!-- p-25 -->
HLS and DASH chop your video into segments. Each segment should start on a keyframe. If your segment duration is not an integer multiple of your keyframe interval, the encoder has to either insert extra keyframes to land on boundaries, raising your bitrate, or let segments drift in length, making players rebuffer.

[pause:500ms]

<!-- p-26 -->
A common mistake is a 5 second segment with a 2 second keyframe interval. 5 divided by 2 is not a whole number. The validator warns with an example of compatible values.

[pause:1200ms]

[narrator:matter-of-fact]

<!-- h-11 -->
Reserved flag guards.

[pause:400ms]

<!-- p-27 -->
The profile has a custom arguments field where you can pass raw ffmpeg flags we do not cover in the schema. It is an escape hatch for power users.

[pause:500ms]

<!-- p-28 -->
But certain flags are managed by the encoder. If you pass them via custom arguments, you override the encoder's decisions in ways that break things subtly.

[pause:1200ms]

<!-- p-29 -->
The reserved flag list includes dash c colon v, dash c colon a, dash preset, dash init H-W device, dash hwaccel, dash f, dash map, dash vf, dash af, dash hls time, and dash hls segment filename. Safe flags like dash metadata pass through.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-12 -->
The preview endpoint.

[pause:400ms]

<!-- p-30 -->
The validator checks the profile in isolation. The preview endpoint adds the source file to the picture.

[pause:1000ms]

<!-- p-31 -->
The response tells you exactly what will happen per stream. Copy. Transcode. Skip. With what target parameters. Plus source level warnings for things the plain validator could not know.

[pause:2200ms]

<!-- p-32 -->
For each stream, you see exactly what will happen. Copy? Transcode? Skip? With what target parameters. Plus source level warnings for things the plain validator could not know. Variable frame rate. Dolby Vision stripping. Upscaling.

[pause:500ms]

<!-- p-33 -->
The result is that before you click encode, you know exactly what will happen to your source. You get to decide whether the plan matches what you want. And you never get the "works on my PC, refuses on my Apple TV" surprise, because the validator would have caught the level mismatch at save time.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-13 -->
What the next page covers.

[pause:400ms]

<!-- p-34 -->
You have a validated profile and a previewed action plan. Now the encoder has to actually do the work. That means understanding what your hardware can do. Part five covers hardware measurement and HDR handling.

[pause:1000ms]
