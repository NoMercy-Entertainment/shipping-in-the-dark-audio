# Speech Script: Describing what you want

**Part:** 3 of 11

[narrator:cozy]

Part three. Describing what you want.

[pause:900ms]

[narrator:reflective]

<!-- p-1 -->
If you have ever read an ffmpeg command line, it looks something like this.

[pause:2000ms]

<!-- p-2 -->
That is for one output. A working multi variant HLS command can have dozens of flags. For subtitles and audio track filtering, more. For hardware acceleration, another pile.

[pause:500ms]

<!-- p-3 -->
This is not a user interface. It is a ritual.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-1 -->
Profiles are statements of intent.

[pause:400ms]

<!-- p-4 -->
The encoder asks you to describe intent instead of flags.

[pause:500ms]

<!-- p-5 -->
You tell it. I want 1080p output. In H.264. At quality equivalent to CRF 23. Medium preset. Two second keyframes. Stereo AAC audio at 192 kbps. In an HLS container. That is the whole profile.

[pause:500ms]

<!-- p-6 -->
The encoder reads that intent, looks at your source file, looks at your hardware, figures out which encoder implementation to use, translates your quality number to that implementation's native scale, picks the right filter chain, and runs ffmpeg.

[pause:500ms]

<!-- p-7 -->
Profiles are stored as JSON in the database. The dashboard renders a form that maps to the fields. You edit the form, the form saves the JSON. But nothing stops you from editing the JSON directly. And the full schema is public.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
The full profile schema.

[pause:400ms]

<!-- code-2 -->
<!-- variant:brief -->
And here is the full JSON that drives it. Identity at the top, a handful of behaviour flags, then three arrays for video, audio, and subtitle profiles. Container specific blocks and an optional DRM entry sit at the bottom.
<!-- /variant -->
<!-- variant:elaborate -->
And here is the full JSON that drives it. The top section is identity. An id, a name, a description, a parent id for inheritance, and a flag marking whether this is a built in preset. Below that, behaviour flags. Container picks the output format. Encode mode toggles single pass or two pass. Auto ladder expands one output into a full adaptive bitrate ladder. Auto detect crop trims black bars. Hardware preference, bit depth policy, H-D-R policy, and a tonemap algorithm round out the decisions the plan stage needs. Then three arrays, video profiles, audio profiles, subtitle profiles, each an array so you can ship more than one at a time. Container specific blocks and an optional DRM entry sit at the bottom. Custom arguments is an escape hatch for anything the schema does not cover.
<!-- /variant -->

[pause:500ms]

<!-- p-8 -->
Four main pieces to focus on.

[pause:500ms]

<!-- p-9 -->
Container. HLS for streaming, MKV for archival, MP4 for single file output, and so on. This is the container the outputs will go into.

[pause:500ms]

<!-- p-10 -->
Video profiles. One or more. Each describes a target resolution, target codec, quality or bitrate, and encoder tuning like preset and profile and level.

[pause:500ms]

<!-- p-11 -->
Audio profiles. One or more. Each describes a target codec, channel count, sample rate, bitrate, and a language filter.

[pause:500ms]

<!-- p-12 -->
Subtitle profiles. If you want the encoder to produce subtitle tracks, you list them here with the target subtitle codec and extraction mode.

[pause:500ms]

<!-- p-13 -->
Plus some optional flags. Auto ladder expands a single video output into a full adaptive bitrate ladder. Auto detect crop detects and removes black bars. Encode mode picks single pass or two pass. DRM adds optional AES-128 encryption for HLS output.

[pause:500ms]

<!-- p-14 -->
You do not have to use all these fields. Most profiles only use a few.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-3 -->
Rate control modes.

[pause:400ms]

<!-- p-15 -->
The rate control block is the most asked about part of a profile, so let us be precise. Three modes are supported.

[pause:500ms]

<!-- code-3 -->
CRF mode takes just a quality number. ABR mode takes a bitrate plus a max bitrate and a buffer size. Capped CRF mode takes both — the quality number and the bitrate cap — for the hybrid case.

[pause:900ms]

<!-- p-16 -->
CRF targets a constant visual quality. File size varies with content. A-B-R targets a constant bitrate. Quality varies with content. Capped CRF is a hybrid. CRF most of the time, but cap the bitrate during high action scenes so your V-B-V buffer never overflows on a constrained player.

[pause:500ms]

<!-- p-17 -->
You cannot set both CRF and A-B-R. The validator rejects it with a clear error message asking you to pick exactly one mode.

[pause:1200ms]

[narrator:matter-of-fact]

<!-- h-4 -->
Built in presets.

[pause:400ms]

<!-- p-18 -->
You do not have to write a profile from scratch. The encoder ships with a starter set of built in presets, each tuned for a specific target. All are cloneable and editable.

[pause:500ms]

They span General 1080p Fast as the everyday default, a low-bandwidth Web 720p, Archival H.265 for smaller files, an Anime 1080p with the animation tune. For music, there is a Music AAC preset for modern players, Music MP3 at 320k for legacy compatibility, and Music FLAC for bit-perfect lossless archival. Then Chromecast 1080p for older devices, Apple TV 4K with HDR passthrough, Mobile 480p for data budgets, a no-compromise 4K Archival, and Anime HEVC 10-bit for the anime community.

[pause:900ms]

<!-- p-19 -->
General 1080p Fast is the default for video. The music presets cover modern lossy, legacy lossy, and lossless. New presets can be added through the dashboard or imported from the community.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-5 -->
Cloning and tweaking.

[pause:400ms]

<!-- p-20 -->
Built in presets are marked as is built in. You cannot edit them directly. If you want to tweak one, you clone it first via a clone endpoint.

[pause:1000ms]

<!-- p-21 -->
The clone gets a copy of the profile, a new ID, and a name with "copy" appended. Parent ID is set to the original's ID, and is built in is set to false. You edit the copy. The original built in stays pristine, so you always have a clean baseline to clone from again the next time.

[pause:500ms]

<!-- p-22 -->
This pattern shows up a lot in the encoder. Built in things are read only. User things are fully editable. The two never mix.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-6 -->
Inheritance.

[pause:400ms]

<!-- p-23 -->
Presets can have a parent via parent ID. If you have a Studio Master preset and you want a variant for a specific client, you can make a child preset that points at Studio Master as its parent and override just a few fields.

[pause:500ms]

<!-- p-24 -->
Example. The client wants the same master, but with burned in subtitles instead of sidecar ones.

[pause:1600ms]

<!-- p-25 -->
The child's fields win. The parent's fields fill in anything the child did not specify. So this child inherits the video and audio settings from Studio Master, but replaces the subtitle handling.

[pause:500ms]

<!-- p-26 -->
This is useful when you maintain a family of related presets. Update the parent, the children inherit the update.

[pause:500ms]

<!-- p-27 -->
The encoder walks the parent chain safely. If someone accidentally creates a cycle, where A points to B and B points to A, the encoder catches that and raises a clear error instead of going into an infinite loop.

[pause:1000ms]

[narrator:matter-of-fact]

<!-- h-7 -->
The auto ladder.

[pause:400ms]

<!-- p-28 -->
Adaptive bitrate streaming is the thing modern streaming services do. They do not ship one video file. They ship a ladder of variants. 360p, 480p, 720p, 1080p, 1440p, maybe 2160p. And the player picks which one to stream based on the user's connection.

[pause:500ms]

<!-- p-29 -->
Writing a profile for five variants means five video output sections with slightly different settings. That is tedious. The encoder has a shortcut.

[pause:500ms]

<!-- p-30 -->
If you set auto ladder to true, you only have to write one video output. The reference. The encoder reads your reference, looks at the source resolution, and generates the full ladder automatically.

[pause:500ms]

<!-- p-31 -->
The default ladder rungs cover common resolutions with target bitrates tuned per codec. H.264 needs more bits than HEVC which needs more than AV1 for equivalent quality.

[pause:500ms]

<!-- p-32 -->
Rungs above the source resolution get skipped. A 720p source will not produce a 1080p variant because upscaling is pointless. Bitrates per tier are tuned based on source complexity at plan time. A low complexity animated source gets thinner tiers, a film grain heavy live action source gets denser tiers.

[pause:500ms]

<!-- p-33 -->
You can override the ladder globally in your profile.

[pause:1400ms]

[narrator:matter-of-fact]

<!-- h-8 -->
Import, export, and signing.

[pause:400ms]

<!-- p-34 -->
Presets travel. You can export one as a JSON file and share it via a simple G-E-T endpoint.

[pause:1000ms]

<!-- p-35 -->
Two paths for import. Paste the JSON into the dashboard. Or point at an HTTPS URL and let the encoder fetch it.

[pause:1000ms]

<!-- p-36 -->
Plain HTTP is rejected. Preset contents influence the filter chain and flag set the encoder runs, so a man in the middle could inject hostile flags. HTTPS is non negotiable for remote import.

[pause:500ms]

<!-- p-37 -->
Optionally, presets can be signed. A community publisher can sign their presets with their own key, and users can trust specific publishers.

[pause:1200ms]

<!-- p-38 -->
The encoder verifies the signature on import. Unsigned presets still work. They just require the user to acknowledge the source.

[pause:500ms]

<!-- p-39 -->
This is how a community preset library eventually works. Someone figures out a great preset for their weird specific projector. They publish the JSON, sign it. Others import it, try it, tweak it, share their own variants. The plumbing is in place. The library is not published yet.

[pause:900ms]
