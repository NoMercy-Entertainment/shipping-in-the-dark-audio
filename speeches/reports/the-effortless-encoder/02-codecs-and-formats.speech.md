# Speech Script: The codec maze

**Part:** 2 of 11

[narrator:cozy]

<!-- part-title -->
Part 2. The codec maze.

[pause:900ms]

[narrator:reflective]

<!-- p-1 -->
Here is a thing most people do not realize when they start playing with video. When someone says H.264, they do not mean one specific piece of software. They mean a family of software that all produce H.264 output, but through completely different implementations, with completely different options.

[pause:600ms]

<!-- p-2 -->
Think of it like saying "I want a coffee." Sure. Espresso? Drip? Cold brew? Pour over? French press? The drink at the end has roughly the same caffeine content, but the machine that made it, the time it took, the flavor profile, those are all different.

[pause:500ms]

<!-- p-3 -->
H.264 is like that. Multiple encoders can produce it, each with its own personality. The encoder has to pick one for you, because you should not have to know the difference.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-1 -->
Four families, many encoders.

[pause:400ms]

<!-- p-4 -->
At the output layer, the encoder supports four video codec families. H.264, HEVC, AV1, and VP9. Inside each family, multiple concrete encoders exist, one per hardware vendor plus software.

[pause:500ms]

<!-- p-5 -->
Here is the full table of what actually ships as a usable output encoder today.

[pause:2400ms]

<!-- p-6 -->
Twenty two encoder handles across four families. If you point ffmpeg at a source and say dash c colon v followed by h 2 6 4 n v enc, you get NVIDIA's hardware H.264. If you say libx264 you get the software one. Same format out, different machinery, wildly different speed and quality characteristics.

[pause:500ms]

<!-- p-7 -->
For H.264 there are six available encoders. For HEVC the same six. For AV1 there are seven. Three software encoders, S-V-T AV1, A-O-M AV1, and rav1e, plus four hardware ones. For VP9 there are three. One software encoder plus Intel's two hardware ones. NVIDIA and AMD never shipped VP9 hardware encoders, because the format did not reach mass adoption before AV1 arrived.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
How the plan stage picks.

[pause:400ms]

<!-- p-8 -->
When you save a profile that says "I want H.264", the encoder looks at what your machine can do. Resolution order.

[pause:400ms]

<!-- p-9 -->
First. If the profile pins a specific encoder handle, that wins.

[pause:400ms]

<!-- p-10 -->
Second. Otherwise, consult the speed index for this machine. The speed index is a table keyed by codec, encoder handle, resolution, and GPU index, populated during the first boot benchmark.

[pause:500ms]

<!-- p-11 -->
Third. Apply user policy.

[pause:300ms]

<!-- p-12 -->
Prefer hardware picks the hardware encoder with the highest speed for this resolution.

[pause:300ms]

<!-- p-13 -->
Prefer quality picks software, regardless of speed.

[pause:300ms]

<!-- p-14 -->
Force hardware picks hardware or fails.

[pause:300ms]

<!-- p-15 -->
Force software picks software only.

[pause:500ms]

<!-- p-16 -->
Fourth. If the chosen encoder cannot support a required feature. 10 bit on NVIDIA H.264, HDR on most hardware H.264 encoders. Fall back to the next option and log the fallback.

[pause:600ms]

<!-- p-17 -->
The fallback decision is recorded in the plan's decisions log. You can inspect it after the encode.

[pause:1600ms]

<!-- p-18 -->
The point is, you wrote H.264 once. The encoder does the rest.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-3 -->
The quirks are real.

[pause:400ms]

<!-- p-19 -->
Here is where things get sticky. You cannot pretend all these encoders are the same. They differ in ways that matter.

[pause:400ms]

<!-- p-20 -->
Some examples.

[pause:400ms]

<!-- p-21 -->
NVIDIA's H.264 encoder cannot do 10 bit output. Not will not, cannot. The silicon does not support it. If your profile says 10 bit H.264, the encoder has to either run on software, or quietly drop to 8 bit. We chose to warn loudly and drop, based on the profile's bit depth policy.

[pause:1200ms]

<!-- p-22 -->
Other allowed values. Strict, which fails if the resolved encoder cannot do the requested bit depth. Prefer software, which switches to software. And silent downgrade, which does not warn.

[pause:500ms]

<!-- p-23 -->
Intel's Quick Sync encoder has a quality range of 1 to 51 instead of the usual 0 to 51. Off by one. If your profile says CRF 0, the encoder will not accept it. The validator catches that before the encode runs.

[pause:500ms]

<!-- p-24 -->
Apple's VideoToolbox uses a totally different scale, 0 to 100. Feeding it a CRF value in the 0 to 51 range produces wildly different output than what you meant. So the encoder translates. If you write CRF 23 and VideoToolbox is picked, the translation lands at roughly 45 on the 0 to 100 scale.

[pause:600ms]

<!-- p-25 -->
Which is roughly the equivalent quality level on VideoToolbox's scale.

[pause:500ms]

<!-- p-26 -->
AMD's AV1 encoder uses 0 to 255 for its quality range instead of 0 to 63 like every software AV1 encoder. Off by a factor of four. The encoder translates that too.

[pause:500ms]

<!-- p-27 -->
You did not have to know any of this. You wrote CRF 23. The encoder figured out where on each scale that landed.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-4 -->
Quality translation, in practice.

[pause:400ms]

<!-- p-28 -->
The full translation table maps software CRF values to each hardware encoder's native scale. QSV uses 1 to 51. NVENC uses CQ 0 to 51. VideoToolbox uses Q-P 0 to 100. AMD AV1 uses Q-P 0 to 255. Others use the expected 0 to 63.

[pause:500ms]

<!-- p-29 -->
The translation uses linear proportional math today. It is not perceptually perfect, because the perceived quality is not linear on any of these scales. But it is orders of magnitude closer than doing nothing, which is what most encoders do.

[pause:500ms]

<!-- p-30 -->
One of the open questions on our roadmap is whether to let the community publish better scaling curves. Someone who ran rigorous quality measurements, VMAF, S-S-I-M, P-S-N-R, comparing encoders, could contribute a scaling curve that fits their hardware and content better than our linear default. The interface is called I Quality Scaler.

[pause:1000ms]

<!-- p-31 -->
Plug in a better implementation via dependency injection and the plan stage picks it up. The default is a linear quality scaler.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-5 -->
Audio is a smaller menu.

[pause:400ms]

<!-- p-32 -->
Where video has many encoder handles, audio is simpler. AAC is the workhorse. Opus for best quality per bit at low bitrates. F-L-A-C for lossless archival. AC-3 and EAC-3 for Dolby surround. MP3 legacy. Vorbis open alternative. TrueHD Dolby lossless surround. DTS competing surround.

[pause:500ms]

<!-- p-33 -->
Audio encoders are just software. There is no Apple audio encoder that works differently from the A-M-D audio encoder. AAC is AAC. So the encoder just picks the best implementation of each codec and stays with it.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-6 -->
Why we limit output formats.

[pause:400ms]

<!-- p-34 -->
The encoder accepts anything on input. If ffmpeg can read it, the encoder will try to encode it.

[pause:500ms]

<!-- p-35 -->
But we limit what we produce. You cannot ask the encoder to output RealVideo from 2002. You cannot ask for Cinepak. You cannot ask for Theora, even though it is technically open source and technically decent.

[pause:500ms]

<!-- p-36 -->
The reason is a thing we keep coming back to. Every output format we support is another set of edge cases, another set of player compatibility stories, another set of bugs to chase. The benefit of supporting it has to exceed the cost of maintaining it.

[pause:500ms]

<!-- p-37 -->
The four codec families we ship cover the overwhelming majority of modern playback use cases. Adding the rest would serve the long tail. Given the trade offs, we said no to the long tail, for now. A plugin can add a fifth family if someone needs it badly enough to write and maintain that code.

[pause:900ms]

[narrator:reflective]

<!-- h-7 -->
"Ship" is doing some work in that sentence.

[pause:400ms]

<!-- p-38 -->
Everything above describes what the encoder is built to do. It assumes the ffmpeg binary underneath it actually has the libraries compiled in, and that assumption has been wrong.

[pause:500ms]

<!-- p-39 -->
We build our own ffmpeg, because the decryption and the codec mix we need are not in anybody's stock build. That build is Fillz's work. Every encoder handle in the table above is usable because somebody produced a binary that contains it, across six platform targets, and that somebody is him. It is the least visible layer in this entire report, and everything else described here is standing on it. That build is produced by merging separate 8, 10, and 12 bit passes into one binary. On one of those merges, the final link quietly dropped lib x265, and the resulting ffmpeg reported "x265 not found" at encode time. Nothing failed during the build. The pipeline was green, the artifact was published, and the missing codec only turned up when something tried to use it.

[pause:700ms]

<!-- p-40 -->
The first diagnosis was pkg-config, which is the obvious suspect and was entirely innocent. The multilib merge was relinking the library away after the configure step had already found it, so every check that ran before the merge agreed the codec was there.

[pause:600ms]

<!-- p-41 -->
That is worth stating plainly in a document whose title contains the word effortless. The encoder chooses codecs by probing what the binary in front of it can actually do, rather than trusting a compiled-in list, and the reason that indirection exists is that the binary has lied to us. A capability table is a description of intent. The only authority on what your build supports is your build.

[pause:600ms]

<!-- p-42 -->
None of which is a criticism of the build. A multilib merge that produces one binary carrying 8, 10, and 12 bit paths, with decryption linked in, for six platform targets, is a genuinely hard piece of engineering that most projects avoid by shipping whatever the distribution gives them. The failure mode is subtle precisely because the thing being attempted is not.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-8 -->
Containers.

[pause:400ms]

<!-- p-43 -->
A codec is the encoding. A container is the file format that holds the encoded bits.

[pause:500ms]

<!-- p-44 -->
You can have H.264 video in an MP4 container, an MKV container, or an HLS playlist. The audio and video are the same. The container is the wrapper.

[pause:500ms]

<!-- p-45 -->
The encoder produces seven container families.

[pause:500ms]

Seven container families. HLS and MP4 take H.264, HEVC, or AV1 video; DASH allows the same three plus VP9. HLS pairs that with AAC, AC-3, E-A-C-3, or Opus audio in TS segments; DASH and MP4 pair it with AAC, Opus, or E-A-C-3 — MP4 swaps Opus for FLAC. MKV takes anything, video or audio. And three audio-only families — MP3, FLAC, and OGG — carry exactly the codec their name promises, except OGG, which also allows Vorbis and Opus.

[pause:700ms]

<!-- p-46 -->
Each container has its own quirks about what codecs it will hold. A common pitfall. An MP4 container with VP9 video. Technically the ISO standard has a VP9 in MP4 box definition, but most players never implemented it. ffmpeg will happily mux it. Most players will fail to play it. The safety net catches this before the encode runs.

[pause:900ms]
