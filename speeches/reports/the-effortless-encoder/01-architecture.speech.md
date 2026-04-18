# Speech Script: How it thinks

**Part:** 1 of 11

[narrator:matter-of-fact]

Part one. How it thinks.

[pause:900ms]

[narrator:reflective]

<!-- p-1 -->
Before we talk about codecs, pixels, or anything else technical, we need to talk about how the encoder thinks.

[pause:500ms]

<!-- p-2 -->
Because the thinking is the product. The actual ffmpeg process that does the work at the end is a tool we invoke. The encoder's value is in the decisions it makes before ffmpeg runs, the safety it provides during, and the cleanup afterward.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-1 -->
One job, six stages.

[pause:400ms]

<!-- p-3 -->
An encode is not a single operation. It is a sequence of stages, each with a specific responsibility, and each handing its results to the next.

[pause:1200ms]

<!-- p-4 -->
Each stage is a separate piece of code. Each one can be tested in isolation. Each one logs what it decided and why. When something goes wrong, you do not have to read a thousand-line ffmpeg command to figure out which part is at fault. You look at the stage that owned the decision.

[pause:500ms]

<!-- p-5 -->
The stages are called Validate, Analyze, Plan, Build, Execute, and Finalize, each with its own interface in the code. Every encode passes through this sequence. Specialized strategies for HLS, DASH, MP4, and MKV can override any stage's behavior by injecting their own implementation.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
Validate.

[pause:400ms]

<!-- p-6 -->
Validate looks at the profile the user wrote and checks whether the profile can possibly succeed.

[pause:400ms]

<!-- p-7 -->
Not whether the encode will look good. Not whether the settings are ideal. Whether it can succeed at all.

[pause:500ms]

<!-- p-8 -->
Validate rejects impossible combinations before the rest of the pipeline runs. A profile that says 4K H.264 at Level 4.1 cannot succeed, because the level flag caps the declared picture size, and Apple TV and set top boxes read it. An AC-3 audio profile at 100 kbps cannot produce exactly 100, because AC-3 only allows specific rungs. An encryption config with no key set cannot actually encrypt anything.

[pause:600ms]

<!-- p-9 -->
The validator returns a structured response with errors and warnings.

[pause:500ms]

On screen you see an example. A JSON object with a valid flag set to false, an errors array holding one entry with severity error, a field path pointing at video profiles index zero dot level, a human message explaining that H.264 Level 4.1 caps at 1080p but the output is 3840 by 2160, and a fix that tells the user to raise the level to 5.1 or drop the resolution. The warnings array is empty.

[pause:900ms]

<!-- p-10 -->
Errors block the save. Warnings are things that will encode but may not be what you intended.

[pause:500ms]

<!-- p-11 -->
Validate's full set of rules is covered on the safety net page. Here the thing to note is that every rule has an id, a field, a human message, and a fix. The dashboard renders these live as you type, so you see the problem before you save.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-3 -->
Analyze.

[pause:400ms]

<!-- p-12 -->
Analyze looks at the actual source file. It does not reject anything. It just inspects.

[pause:400ms]

<!-- p-13 -->
The tool doing the inspection is ffprobe.

[pause:1000ms]

<!-- p-14 -->
The output is parsed into a source analysis record with the information every downstream stage needs.

[pause:600ms]

The record on screen captures a 4K HDR source. Duration a little over two hours. Constant frame rate at 23.976. One video stream: HEVC 10 bit, 3840 by 2160, pixel format yuv420p10le, color transfer SMPTE 2084, HDR true, Dolby Vision profile 7. Three audio streams: TrueHD 8 channel English, AC-3 6 channel English, AAC 2 channel Japanese. Two subtitle streams: PGS English, ASS English. 27 chapters and four attached fonts.

[pause:900ms]

<!-- p-15 -->
Whatever ffprobe can parse, the encoder will accept. Even if the content is unusual, exotic, or technically malformed in small ways, the encoder will try to work with it. The philosophy is to be strict about what you produce, and generous about what you accept.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-4 -->
Plan.

[pause:400ms]

<!-- p-16 -->
Plan takes two inputs. The analysis from the previous stage, and the user's profile.

[pause:500ms]

<!-- p-17 -->
It produces a plan result. Not a command line, but a structured plan that says, for each output variant, exactly what will happen.

[pause:600ms]

The example on screen picks apart a single variant. Strategy HLS single pass. One variant called v0 dash 1080p. The video section names the codec as H.264, the encoder handle as H.264 NVENC, GPU index zero, output 1920 by 1080, rate control mode CRF with value 23, preset p4, profile high, level 4.2, pixel format yuv420p, and a filter chain that crops 1920 by 800 from offset zero 140 then scales back to 1920 by 1080. The audio section keeps stream index one as AAC stereo 192 kbps. Segment duration six seconds. Keyframe interval two seconds. Hardware bindings name the primary GPU as NVIDIA RTX 4080 and the decoder handle as HEVC CUVID. And a decisions log holds four human sentences explaining what happened and why. That's the plan.

[pause:900ms]

<!-- p-18 -->
This is the stage where the encoder's opinions show up the most.

[pause:500ms]

<!-- p-19 -->
If your hardware has a good GPU, the plan chooses the GPU path. If your source has Dolby Vision and your profile preserves 10 bit, the plan adds the tags that keep Dolby Vision alive. If your source is letterboxed and you asked for auto crop, the plan runs the crop detector and bakes the result into the filter chain. If your profile has auto ladder turned on, the plan generates the variant tiers automatically.

[pause:600ms]

<!-- p-20 -->
Every decision has a decisions log entry explaining why. So when you look at an encode afterward and wonder why it chose HEVC over AV1, the log tells you.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-5 -->
Build.

[pause:400ms]

<!-- p-21 -->
Build turns the plan into an actual ffmpeg command line.

[pause:500ms]

<!-- p-22 -->
Building a command line for ffmpeg is not trivial. ffmpeg is not a Swiss Army knife that you hand a profile and it does the right thing. It is a giant toolkit of flags and filter chains that all have to be composed in exactly the right order, with exactly the right syntax, with encoder-specific flags for whichever encoder you are actually using.

[pause:500ms]

<!-- p-23 -->
The output of Build for the plan above would look roughly like this.

[pause:600ms]

Look at the shape of it. ffmpeg, a CUDA hardware device init, hardware accelerated HEVC decode on the input. A dash vf filter chain that reads: download from GPU, crop, zscale to linear, tonemap with Hable, zscale back to BT.709, scale to 1080p, upload back to GPU. Then the encoder flags: dash c colon v H.264 NVENC, preset p4, rate control VBR with a CQ of 23, profile high, level 4.2. Audio mapped to AAC 192 kbps stereo at 48 kilohertz. And finally the output format, HLS, with six second segments, VOD playlist type, MPEG-TS segments, independent segment flag, and filename patterns for segments and playlist.

[pause:900ms]

<!-- p-24 -->
That command was produced from seven lines of profile JSON plus the source analysis. The translation is what Build does.

[pause:500ms]

<!-- p-25 -->
If the plan picked the software encoder, the translation is a different set of flags. libx264 with preset medium and CRF 23. If it picked NVENC, it uses preset p 4 with R-C of VBR and CQ of 23, the NVENC-specific rate control names. If it picked Apple's VideoToolbox, it uses a third set. You did not have to know any of that when you wrote the profile.

[pause:500ms]

<!-- p-26 -->
Build also writes the master HLS playlist after all variants are planned, emits the HLS encryption key info file if DRM is configured, and prepares the subtitle playlist references. These are covered in later pages.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-6 -->
Execute.

[pause:400ms]

<!-- p-27 -->
Execute spawns ffmpeg as a child process and watches it run.

[pause:500ms]

<!-- p-28 -->
ffmpeg emits progress on standard error. The default format is a mix of human text and structured key value pairs from the progress pipe flag.

[pause:1600ms]

<!-- p-29 -->
The encoder parses this continuously and computes percent complete, current frames per second, encoding speed multiplier, estimated time remaining, and the current stage name.

[pause:500ms]

<!-- p-30 -->
All of that flows to the dashboard via SignalR. If you have the dashboard open you see progress in real time.

[pause:500ms]

<!-- p-31 -->
If ffmpeg crashes, the encoder captures its error output, logs the last known state, and writes a checkpoint file that lets a future attempt resume from where it stopped.

[pause:500ms]

<!-- p-32 -->
If the user cancels the job, a cancellation token flows down and the encoder kills the ffmpeg process cleanly, deleting any partial output.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-7 -->
Finalize.

[pause:400ms]

<!-- p-33 -->
The encode is done. Now the encoder does the tidying.

[pause:500ms]

<!-- p-34 -->
Master playlists get written. For HLS, that means a top-level master dot m 3 u 8 referencing each variant's playlist with the right E-X-T stream information attributes. Bandwidth, resolution, codec triplet, frame rate, video range. For DASH, it means writing the manifest with period, adaptation set, and representation elements.

[pause:500ms]

<!-- p-35 -->
Chapter markers get inserted. As E-X-T date range tags for HLS, as event stream entries for DASH, as chapter atoms for MP4.

[pause:500ms]

<!-- p-36 -->
Attached subtitles and fonts get linked from the playlists. The HLS master's subtitle references become E-X-T media tags with matching group ID, name, language, URI, and default attributes.

[pause:500ms]

<!-- p-37 -->
Checkpoint files get cleaned up. Temp directories get purged.

[pause:500ms]

<!-- p-38 -->
What the user sees at the end is not a mess of intermediate files. It is a clean output directory, with everything the playback side needs, organized the way playback expects.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-8 -->
The idea of strategies.

[pause:400ms]

<!-- p-39 -->
Every output format is handled by a specialized strategy. A strategy is a class that implements the six stages for one container family.

[pause:500ms]

<!-- p-40 -->
The shipped strategies cover HLS single pass and two pass, DASH single and two pass, MP4 single and two pass, MKV single pass, and three audio only strategies for MP3, F-L-A-C, and O-G-G.

[pause:500ms]

<!-- p-41 -->
Each strategy composes the same underlying building blocks. Each one knows the quirks of its destination container.

[pause:500ms]

<!-- p-42 -->
Two pass is a technique where the encoder reads the source twice. The first pass learns the content. The second encodes it, using what it learned to allocate bits more efficiently. Two pass produces smaller files at the same quality, at the cost of running twice. It is worth it for library encodes. It is not worth it for quick re encodes.

[pause:500ms]

<!-- p-43 -->
MKV has only a one pass strategy. MKV is for keeping things. Two pass for MKV is rarely useful because you are optimizing for quality, not file size. And MKV's audio typically stays as a lossless stream copy anyway.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-9 -->
Plugins.

[pause:400ms]

<!-- p-44 -->
Everything above. Stages, strategies, codec resolvers, dispatchers, source fetchers, progress sinks. All registered through dependency injection. Plugins can register their own implementations alongside the built-ins.

[pause:500ms]

<!-- p-45 -->
A plugin that wants to add a new output strategy registers an encoding strategy in the service collection.

[pause:1000ms]

<!-- p-46 -->
A plugin that wants to override codec resolution, say, to force a specific hardware encoder for a specific GPU model, registers an encoder resolver with a higher priority than the default.

[pause:500ms]

<!-- p-47 -->
The encoder's own strategies are built on the same hooks. Nothing in the built in set has access to anything a plugin could not reach. If you want to write a strategy for a container we did not ship, the API is there.

[pause:900ms]

[narrator:reflective]

<!-- h-10 -->
Maintenance, honestly.

[pause:400ms]

<!-- p-48 -->
An architecture diagram on a whiteboard looks clean. The reality of maintaining this is messier.

[pause:500ms]

<!-- p-49 -->
Every stage has bugs. Some of them are subtle. Analyze might misread an unusual fourth stream in an obscure container. Plan might pick the wrong encoder on a GPU we have not tested. Execute might fail to capture a specific ffmpeg error pattern. Build might generate a filter chain that works on libx264 but has a subtle syntax issue on NVENC.

[pause:500ms]

<!-- p-50 -->
The way we stay honest about this is tests. The encoder has a large and growing test suite, covering each stage, each codec, each failure path. When a user reports a bug, the first thing we do is write a test that reproduces it. If the test passes, the bug was not where we thought it was. If the test fails, we have a concrete target. Fix the test, ship the fix, and the next person who hits the same issue does not.

[pause:500ms]

<!-- p-51 -->
This does not prevent all bugs. It prevents the same bug from shipping twice.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-11 -->
What the next page covers.

[pause:400ms]

<!-- p-52 -->
Now that you know how the encoder thinks, we can talk about what it actually knows. The codec landscape. Why there are so many, which ones the encoder supports for output, and how it picks between them on your behalf.

[pause:1000ms]
