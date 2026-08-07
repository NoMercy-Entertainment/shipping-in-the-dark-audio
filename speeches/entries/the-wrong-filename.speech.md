# Speech Script: The Wrong Filename

**Entry:** 008
**Source:** `entries/2026-04-13-008-the-wrong-filename.md`
**Narrator:** Aria (en-US-AriaNeural) — Ink narrates this entry
**Estimated duration:** ~30 minutes
**Script author:** Echo

---

[narrator:dramatic]

<!-- title -->
The Wrong Filename.

[pause:900ms]

[narrator:reflective]

<!-- h-1 -->
Timeline Note.

[pause:300ms]

[narrator:reflective]

<!-- p-1 -->
This is Entry {{008}}. It takes place thirteen days after Entry {{007}}, "When N-P-M Install Means Game Over." This entry covers an overnight session spanning April 12 through 13, 2026, focused entirely on the nomercy-F-F-mpeg repository — the custom F-F-mpeg build that powers NoMercy's video encoding pipeline. Seven issues. Five pull requests. One spec. Zero sleep.

[pause:600ms]

[narrator:matter-of-fact]

<!-- h-2 -->
The Short Version.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-2 -->
Seven issues. One overnight session. It started with a VobSub muxer that taught F-F-mpeg to write DVD subtitle pairs, then an O-C-R encoder that wired Tesseract into the subtitle pipeline with a grayscale trick that made bitmap-to-text conversion actually accurate. Then three more features in parallel — sprite sheet thumbnails, chapter extraction, auto-creating output directories. A macOS ARM64 bug that had been open for weeks was hunted down through a false lead about code signing before the real culprit was found: one filename missing a six-character prefix. And a full H-L-S compliance spec was written for Apple's notoriously strict master playlist requirements. Five pull requests. One wrong filename. Zero sleep.

[pause:900ms]

[narrator:cozy]

<!-- h-3 -->
Background.

[pause:300ms]

[narrator:cozy]

<!-- p-3 -->
NoMercy doesn't ship a stock F-F-mpeg binary. It can't. The media server needs capabilities that upstream F-F-mpeg doesn't provide: optical character recognition subtitle encoding, VobSub muxing, sprite sheet generation for video scrubbing previews, and soon, Apple-compliant H-L-S playlists. The nomercy-F-F-mpeg repository is a custom build system that compiles F-F-mpeg from source with patches and additional libraries, then cross-compiles it for Linux x86_64, Linux ARM64, macOS Intel, and macOS ARM64.

[pause:500ms]

[narrator:reflective]

<!-- p-4 -->
For beginners: F-F-mpeg is the Swiss Army knife of video processing. Almost every video tool you've ever used — from V-L-C to YouTube's backend — runs F-F-mpeg somewhere under the hood. It converts formats, encodes video, extracts audio, generates thumbnails, and about a hundred other things. Building it from source with custom patches is how you add features that the upstream project doesn't include.

[pause:700ms]

[narrator:cozy]

<!-- p-5 -->
This session had four missions: finish the VobSub muxer and O-C-R encoder that were already in progress, build three more features, figure out why the macOS ARM64 binary was crashing for users, and spec out the H-L-S compliance patch.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-4 -->
Act One: The Foundation — VobSub Muxer and O-C-R Encoder.

[pause:400ms]

[narrator:cozy]

<!-- p-6 -->
Before the parallel sprint kicked off, two features had to land first. These were the ones that established the patterns everything else would follow.

[pause:700ms]

[narrator:matter-of-fact]

<!-- h-5 -->
The VobSub Muxer.

[pause:300ms]

[narrator:cozy]

<!-- p-7 -->
F-F-mpeg could read VobSub subtitle files but couldn't write them. Extracting DVD subtitles with copy mode produced a raw stream with no timing index — useless for any player or downstream tool.

[pause:400ms]

<!-- p-8 -->
The muxer is two hundred and sixty-three lines of C. It manages two output files simultaneously: an MPEG-2 P-S packet stream — the dot-sub file containing the actual bitmap data — and a VobSub version 7 text index — the dot-idx file with timestamps, palette, and language metadata. When the user specifies either extension, the muxer figures out which file is primary and which is the companion, then writes both in sync.

[pause:500ms]

[narrator:reflective]

<!-- p-9 -->
For beginners: DVD subtitles aren't text. They're tiny bitmap images burned onto each frame — literally pictures of words. A VobSub file is the standard way to store these bitmaps outside of a DVD. The dot-sub file holds the raw image data wrapped in MPEG-2 packets, and the dot-idx file is a text index that maps timestamps to positions in the dot-sub file. Players need both halves.

[pause:700ms]

[narrator:cozy]

<!-- p-10 -->
The implementation handles palette extraction from codec extradata — sixteen R-G-B colors that define the subtitle's color scheme — normalizes P-T-S timestamps to start at zero, and writes proper five-byte MPEG-2 P-E-S timestamps. Auto-detection from the dot-idx extension means no format flag is needed — just one F-F-mpeg command and both files appear.

[pause:500ms]

<!-- p-11 -->
Tested with Darkwing Duck season one episode one: three hundred and twenty-one subtitle events extracted with correct palette, language tags, and round-trip verification through F-F-probe.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-6 -->
The O-C-R Subtitle Encoder.

[pause:300ms]

[narrator:cozy]

<!-- p-12 -->
This was the bigger of the two. F-F-mpeg had all the pieces for bitmap-to-text subtitle conversion but they weren't wired together. The media server bridged this gap with fragile C-sharp code: run F-F-mpeg's O-C-R filter to dump raw timestamps and text to a temp file, parse that file with regex, post-process common O-C-R errors, write WebVTT. The temp file format was undocumented F-F-mpeg metadata output that could change between versions.

[pause:500ms]

<!-- p-13 -->
The encoder is around three hundred lines of C. It registers as a proper subtitle encoder accepting bitmap frames and outputting text, so the existing WebVTT and SRT muxers handle the output format automatically.

[pause:400ms]

<!-- p-14 -->
The key insight was the grayscale conversion. DVD and Blu-ray subtitles have bright text — usually white or yellow — with a dark outline on a transparent background. A naive grayscale conversion produces low-contrast images that Tesseract struggles with. Instead, the encoder uses luminance-weighted alpha compositing: it composites against black using the alpha channel, then inverts. Bright opaque text becomes dark foreground. Dark opaque outlines become light background. Transparent areas become white. The result is high-contrast black-on-white that Tesseract reads accurately.

[pause:500ms]

[narrator:reflective]

<!-- p-15 -->
For beginners: O-C-R stands for Optical Character Recognition — it's the technology that reads text from images. Tesseract is the most widely used open-source O-C-R engine, originally developed by H-P and now maintained by Google. The challenge with subtitle O-C-R is that the source images are tiny, low-resolution bitmaps designed to be displayed on a TV screen, not to be read by software.

[pause:700ms]

[narrator:cozy]

<!-- p-16 -->
On top of the grayscale trick, the encoder upscales bitmaps three times before O-C-R — configurable. DVD subtitle bitmaps are small — upscaling dramatically improves character and line detection. And for the media server's specific use case, there's a music note fixup mode that corrects common Tesseract misreads where the music note symbol — common in subtitle tracks during songs — gets read as J, ampersand, semicolon, or apostrophe.

[pause:500ms]

<!-- p-17 -->
The build required patching one of F-F-mpeg's core initialization files because F-F-mpeg normally refuses bitmap-to-text subtitle transcoding. The injection script relaxes that check specifically for the O-C-R subtitle encoder, and adds automatic language detection from stream metadata so the user doesn't need to specify the language manually.

[pause:400ms]

<!-- p-18 -->
What this enables: the media server's entire subtitle conversion method and subtitle parser can be replaced with a single F-F-mpeg command. No temp files. No regex parsing. No C-sharp post-processing.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-7 -->
Act Two: Three More Features, Three Agents, Three Worktrees.

[pause:400ms]

[narrator:cozy]

<!-- p-19 -->
The session started with a burst of parallel work. Three features had been planned, each with a GitHub issue, each independent enough to build simultaneously. Arc dispatched them to parallel agents working in isolated git worktrees — separate working directories that share the same repository but let you develop on different branches without stepping on each other's changes.

[pause:700ms]

[narrator:matter-of-fact]

<!-- h-8 -->
The Sprite Sheet Muxer.

[pause:300ms]

[narrator:cozy]

<!-- p-20 -->
When you scrub through a video on YouTube or Netflix, you see those little thumbnail previews that show you what's at each timestamp. Those thumbnails aren't generated on the fly. They're pre-baked into a single large image called a sprite sheet — a grid of thumbnails tiled together — with a companion WebVTT file that maps each thumbnail's position in the grid to a timestamp using fragment identifiers.

[pause:500ms]

[narrator:reflective]

<!-- p-21 -->
For beginners: WebVTT is the standard format for video subtitles and metadata on the web. The hash-x-y-w-h part tells the video player "crop this rectangle from the image" — x position, y position, width, height. So instead of loading hundreds of individual thumbnail images, you load one big image and the video player cuts out the right piece based on the timestamp.

[pause:700ms]

[narrator:cozy]

<!-- p-22 -->
This muxer takes F-F-mpeg's thumbnail output and produces two files: a tiled PNG or WebP sprite sheet, and the corresponding WebVTT file. Around six hundred and twenty lines of C. It handles pixel format conversion through F-F-mpeg's S-W-Scale library, validates that WebP dimensions don't exceed the format's limit, and manages memory for the tile buffer across the entire duration of the video.

[pause:500ms]

<!-- p-23 -->
Building this as an F-F-mpeg muxer instead of an external script means the media server can generate scrubbing previews in a single F-F-mpeg command. No intermediate files. No shell script glue. No parsing F-F-probe output in a second pass.

[pause:700ms]

[narrator:matter-of-fact]

<!-- h-9 -->
The Chapter VTT Muxer.

[pause:300ms]

[narrator:cozy]

<!-- p-24 -->
Many video files — especially those ripped from Blu-rays — contain chapter metadata. Chapter names, timestamps, and so on. This metadata lives inside the container format — M-K-V, M-P-4 — and is accessible to F-F-mpeg during demuxing.

[pause:500ms]

<!-- p-25 -->
Previously, extracting chapters required running F-F-probe to dump the container metadata as JSON, then parsing that JSON to build a WebVTT file. Multi-step. Fragile. The kind of pipeline where a minor format change in F-F-probe's output breaks everything downstream.

[pause:400ms]

<!-- p-26 -->
The chapter VTT muxer reads chapter metadata directly from the input container and writes a WebVTT chapter file. One command. No intermediate JSON. No parsing. It registers with the A-V-F-M-T no-streams flag, meaning it doesn't need any audio or video stream mapped to it — it only cares about container-level metadata. Clean and simple.

[pause:700ms]

[narrator:matter-of-fact]

<!-- h-10 -->
Auto-Create Output Directories.

[pause:300ms]

[narrator:cozy]

<!-- p-27 -->
This one's a papercut fix. When you tell F-F-mpeg to write output to a path that doesn't exist yet, F-F-mpeg fails with "No such file or directory." Every user of the media server has hit this at some point.

[pause:400ms]

<!-- p-28 -->
The fix patches F-F-mpeg's file I/O open function to create parent directories automatically before writing. Cross-platform, using the appropriate mkdir call on Windows and on everything else. It skips URLs so it doesn't try to create directories for H-T-T-P or R-T-M-P outputs. Small patch, big quality-of-life improvement.

[pause:700ms]

[narrator:matter-of-fact]

<!-- h-11 -->
The Review Catches.

[pause:300ms]

[narrator:cozy]

<!-- p-29 -->
All three features followed the established pattern: injection scripts with shared includes, plus test scripts. During review, two bugs were caught before merge.

[pause:400ms]

<!-- p-30 -->
The first was in the auto-create-dirs feature. An idempotency check used a grep pipe that would fail silently under certain conditions, making the injection script think the patch had already been applied when it hadn't.

[pause:400ms]

<!-- p-31 -->
The second was in the sprite sheet muxer. When converting pixel formats for the tile buffer, the alpha plane wasn't being zero-filled for formats that support transparency. A WebP sprite sheet with a transparent source would have garbage data in the alpha channel — not a crash, but visually wrong in a way that would be miserable to debug later.

[pause:400ms]

<!-- p-32 -->
Both caught in review. Both fixed before merge. The system works when you use it.

[pause:900ms]

[narrator:tense]

<!-- h-12 -->
Act Three: The Case of the Corrupted Binary.

[pause:400ms]

[narrator:tense]

<!-- p-33 -->
Now for the detective story.

[pause:400ms]

<!-- p-34 -->
A user reported that the macOS ARM64 binary from release v1.0.31 was "corrupted and cannot be opened." The Intel macOS binary from the same release worked fine. Same C-I pipeline, same build scripts, different architectures, different outcomes. Issue 6 had been sitting there, waiting for someone to dig in.

[pause:700ms]

[narrator:matter-of-fact]

<!-- h-13 -->
The First Suspect: Code Signing.

[pause:300ms]

[narrator:tense]

<!-- p-35 -->
The investigation started on a Windows machine, which is a slightly absurd place to debug a macOS binary, but you work with what you have.

[pause:400ms]

<!-- p-36 -->
Arc downloaded the v1.0.31 ARM64 release binary and parsed the Mach-O headers with a Python script. Mach-O is the executable format on macOS — the equivalent of E-L-F on Linux or P-E on Windows. Inside the binary, there was a code signature. Apple requires all executables on modern macOS to have one, and unsigned binaries get the "corrupted and cannot be opened" Gatekeeper rejection.

[pause:500ms]

[narrator:reflective]

<!-- p-37 -->
For beginners: code signing is how macOS verifies that software hasn't been tampered with. Every binary needs a cryptographic signature. If you don't sign it yourself with an Apple Developer certificate, the build tools usually apply an "ad-hoc" signature — a hash of the binary that says "nobody vouches for this, but at least it hasn't been modified since it was built." If even the ad-hoc signature doesn't match the actual binary contents, macOS refuses to run it.

[pause:700ms]

[narrator:tense]

<!-- p-38 -->
The signature was there, but it was wrong. The code-limit field — which records the size of the signed content — said one hundred and twenty-five megabytes. The actual file was one hundred and twenty megabytes. Here's what happened: the ld64 linker signed the binary during the linking step, but then make install stripped the binary, removing debug symbols and reducing its size. The signature was computed before the strip. The strip happened after. The signature was now a lie.

[pause:500ms]

<!-- p-39 -->
Open and shut, right? The linker signs, the strip invalidates. Re-sign the binary and ship it.

[pause:400ms]

<!-- p-40 -->
Not so fast.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-14 -->
The Mac C-I Test.

[pause:300ms]

[narrator:tense]

<!-- p-41 -->
Arc set up a test on a real macOS-latest ARM64 GitHub Actions runner. Downloaded the problematic binary. Ran it. And here's where the hypothesis fell apart.

[pause:400ms]

<!-- p-42 -->
The binary started. It didn't get rejected by Gatekeeper. It printed version information. And then it crashed.

[pause:500ms]

<!-- p-43 -->
The crash message was: gpgrt fatal: sizeof lock obj. Followed by: Abort trap 6.

[pause:600ms]

<!-- p-44 -->
This was not a code signing problem. A binary rejected by Gatekeeper never starts. This binary started, ran initialization code, and then aborted because something inside the lib G-P-G error library disagreed about the size of a threading primitive.

[pause:400ms]

<!-- p-45 -->
Arc re-signed the binary with the macOS codesign tool. Same crash. Stripped the signature entirely. Same crash. Both signed and unsigned versions crashed identically. The code signing issue was real — the signature was genuinely invalid — but it was a red herring. The binary's actual problem was somewhere else entirely.

[pause:500ms]

<!-- p-46 -->
Stoney Eagle had pushed back earlier on jumping to the code signing conclusion. He was right to. When you have a hypothesis that explains the symptom, it's tempting to stop looking. The Mac C-I test proved that the code signing problem, while real, was not the problem.

[pause:900ms]

[narrator:tense]

<!-- h-15 -->
Finding the Real Bug.

[pause:300ms]

[narrator:tense]

<!-- p-47 -->
With the signing theory dead, the crash message became the only lead. "gpgrt fatal: sizeof lock obj" — this comes from lib G-P-G error, a small library that provides error codes and threading utilities for the GNU Privacy Guard ecosystem. It's a dependency of lib Blu-ray, which is a dependency of F-F-mpeg for Blu-ray disc reading.

[pause:500ms]

[narrator:reflective]

<!-- p-48 -->
For beginners: when you build software that works across different operating systems and CPU architectures, you sometimes need platform-specific header files that describe the exact size and layout of operating system structures. A "lock object" is a threading primitive — the thing that prevents two threads from modifying the same data at the same time. Its exact size depends on the operating system and the CPU architecture. If your code thinks the lock is 64 bytes but the operating system says it's 48 bytes, very bad things happen at runtime.

[pause:700ms]

[narrator:tense]

<!-- p-49 -->
The relevant build script was scripts-slash-17-libbluray.sh. This script cross-compiles lib Blu-ray and its dependency lib G-P-G error. lib G-P-G error needs a platform-specific header file that describes the lock object layout for the target system. The file has a very specific naming convention.

[pause:500ms]

<!-- p-50 -->
Here's where it gets interesting. Two different tools within the lib G-P-G error build system look up this file, and they use different names.

[pause:400ms]

<!-- p-51 -->
The configure script needs the full architecture triplet in the filename. For macOS ARM64, that's: lock-obj-pub dot arm64-apple-darwin24.1 dot h.

[pause:400ms]

<!-- p-52 -->
The make-header tool strips the architecture prefix and looks for just: lock-obj-pub dot darwin24.1 dot h.

[pause:400ms]

<!-- p-53 -->
The x86_64 build script handled this correctly. It used a variable to construct the full triplet name, and the file satisfied both lookups. But the ARM64 build had a different code path, and it copied the header to only one name: lock-obj-pub dot darwin24.1 dot h.

[pause:400ms]

<!-- p-54 -->
That's the filename that make-header wants. The filename that configure wants — lock-obj-pub dot arm64-apple-darwin24.1 dot h — didn't exist.

[pause:600ms]

[narrator:dramatic]

<!-- p-55 -->
Six characters. "arm64 dash". That was the entire bug.

[pause:900ms]

[narrator:tense]

<!-- p-56 -->
When configure couldn't find the correct header, it didn't fail. It fell back to a generic default. That default described the wrong p-thread mutex size for the ARM64 Darwin platform. The generated config.h ended up disagreeing with the actual lock object header about how big the lock structure should be. The code compiled fine. The linker linked fine. And then at runtime, when lib G-P-G error tried to initialize its first lock object and checked the size against what config.h promised, the sizes didn't match.

[pause:500ms]

[narrator:dramatic]

<!-- p-57 -->
sizeof lock obj. Abort trap 6.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-16 -->
The Fix.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-58 -->
The fix was two lines. Copy the header file to both names:

[pause:400ms]

<!-- p-59 -->
Here's the line that was missing in the ARM64 code path — creating the full-triplet filename alongside the short one.

[pause:600ms]

<!-- p-60 -->
Both tools find what they're looking for. configure picks up the correct p-thread mutex size. config.h agrees with the header. The runtime check passes.

[pause:700ms]

[narrator:triumphant]

<!-- h-17 -->
Verified on Real Hardware.

[pause:300ms]

[narrator:triumphant]

<!-- p-61 -->
The fix wasn't declared done until it ran on real macOS ARM64 hardware. A Linux C-I runner cross-compiled the patched lib G-P-G error, built a small test binary, and transferred it to a macOS-latest ARM64 runner. The output:

[pause:400ms]

O-K: libgpg-error 1.51 initialized successfully. O-K: lock object sizeof check passed. No abort.

[pause:500ms]

<!-- p-62 -->
Green. For real this time. Not "the code looks correct" green. Actually ran it on the target platform green.

[pause:500ms]

[narrator:reflective]

<!-- p-63 -->
Stoney Eagle would be proud. Validate reality, not assumptions.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-18 -->
The Bonus Bugs.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-64 -->
While deep in the ARM64 build scripts, two more bugs were found.

[pause:400ms]

<!-- p-65 -->
First, the Cargo linker environment variable for Rust components was set to the x86_64 Apple Darwin linker path even in the ARM64 build path. It should have been the AARCH64 Apple Darwin linker. The wrong linker variable meant Rust code would try to link with the host system's linker instead of the cross-compilation toolchain. This hadn't caused a visible failure yet, but it was a time bomb.

[pause:500ms]

<!-- p-66 -->
Second, ad-hoc code signing was added as insurance. The build now signs the macOS binaries with el-did — saurik's lightweight signing tool, pinned to a specific version. Stoney questioned the provenance of el-did, which is good security hygiene. It's a well-known tool in the jailbreak and cross-compilation community, originally created by saurik — Jay Freeman — for iOS development. Pinning to a specific tag rather than pulling HEAD avoids the kind of supply chain surprise the team dealt with in Entry {{007}}.

[pause:900ms]

[narrator:tense]

<!-- h-19 -->
Act Four: The CRLF Saga.

[pause:400ms]

[narrator:tense]

<!-- p-67 -->
With four pull requests ready — three features and the ARM64 fix — it was time to review the diffs. And every single one was a mess.

[pause:400ms]

<!-- p-68 -->
Hundreds of lines of changes that weren't changes. Entire files showing up as modified because their line endings had changed from CRLF — Windows-style carriage return plus line feed — to LF — Unix-style line feed. The actual feature code was buried in a sea of whitespace noise.

[pause:400ms]

<!-- p-69 -->
The repository's git-attributes file specified: all text files should use Unix line endings. But master had been storing files with Windows line endings. Git was doing what git-attributes told it to do — normalizing on checkout — but because the stored versions in master had CRLF, every branch that touched those files showed a diff on every line.

[pause:500ms]

[narrator:reflective]

<!-- p-70 -->
For beginners: line endings are one of those things that shouldn't matter but absolutely do. Windows uses two characters at the end of each line — carriage return plus line feed, or CRLF. Unix and macOS use one — just line feed, or LF. Git can automatically normalize these, but if the stored version in the repository doesn't match the configured normalization, you get phantom diffs everywhere. The actual content is identical — the only "change" is invisible whitespace.

[pause:700ms]

[narrator:matter-of-fact]

<!-- p-71 -->
The solution: create a dedicated normalization pull request. Convert every file in master to LF. Merge that first. Then rebase all four feature branches on top of the normalized master. The diffs went from four hundred and ninety-four to one thousand sixty-two insertions — mostly line ending noise — down to fifty-six to seven hundred and thirty-five insertions of actual feature code. Clean diffs. Reviewable diffs.

[pause:500ms]

<!-- p-72 -->
There was a side lesson too: don't reference issue numbers in commits during active development. Each force-push during the rebase spammed the issue timeline with duplicate references. The GitHub issue for the auto-create-dirs feature ended up with a wall of bot comments. Annoying. Not harmful. But the kind of noise that makes issue tracking harder than it needs to be.

[pause:900ms]

[narrator:cozy]

<!-- h-20 -->
Act Five: The H-L-S Compliance Spec.

[pause:400ms]

[narrator:cozy]

<!-- p-73 -->
The last piece of the session wasn't code. It was architecture.

[pause:400ms]

<!-- p-74 -->
Apple's H-L-S specification is the strictest in the industry. H-L-S dot js and Exo Player — the players used on web and Android — are forgiving. They'll play whatever you throw at them, missing attributes and all. Apple's A-V Player on iOS, tvOS, and Safari won't. And when your product is a media server that streams to every device, "works everywhere except Apple" isn't an option.

[pause:500ms]

[narrator:reflective]

<!-- p-75 -->
For beginners: H-L-S stands for HTTP Live Streaming — Apple's protocol for streaming video over the internet. When you watch a video that adapts quality based on your connection speed, it's probably using H-L-S. A "master playlist" is the index file that lists all available quality levels, audio tracks, and subtitles. The player reads this file to decide what to download.

[pause:700ms]

[narrator:cozy]

<!-- p-76 -->
F-F-mpeg's H-L-S muxer can generate multi-variant master playlists. It decodes the input, runs the filter graph, encodes every variant, muxes every segment. It holds codec parameters, frame rates, resolution, channel layouts, color transfer characteristics — everything Apple's spec demands — in memory during the entire encode. And then it writes a master playlist that's missing half the required attributes.

[pause:500ms]

<!-- p-77 -->
No FRAME-RATE — Apple MUST rule. No AVERAGE-BANDWIDTH by default. No VIDEO-RANGE for H-D-R content. No AUTOSELECT on audio renditions. No way to set human-readable audio track names. Audio channel count written as a bare integer instead of a quoted string. H-E-V-C codec strings silently dropped without an error if the user forgets the right tag. The data is right there. F-F-mpeg just doesn't write it.

[pause:600ms]

<!-- p-78 -->
The spec covers ten patches to F-F-mpeg's H-L-S playlist and encoder files. Three new stream map keys — for audio names, content protection levels, and variant preference ordering. Automatic VIDEO-RANGE derivation from color transfer characteristics. FRAME-RATE from the stream's actual frame rate. An independent-segments header. H-E-V-C codec tag warnings instead of silent failure. Bandwidth calculation cleanup.

[pause:500ms]

<!-- p-79 -->
No new flags needed. The attributes are always correct to include when the data exists. Opt-in keys for the attributes that require user intent. Backward compatible — existing commands produce the same output, plus the attributes that should have been there all along.

[pause:400ms]

<!-- p-80 -->
Two items were deferred to separate issues: I-frame playlists — which need fundamentally different architecture — and Dolby Vision supplemental codec strings — which need DV metadata layer parsing. Everything else fits in one injection script.

[pause:400ms]

<!-- p-81 -->
Implementation is next session.

[pause:900ms]

[narrator:reflective]

<!-- h-21 -->
What This Does NOT Fix.

[pause:300ms]

[narrator:reflective]

<!-- p-82 -->
The macOS ARM64 binary fix solves the runtime crash, but the release pipeline doesn't yet have automated smoke tests on real macOS hardware. The fix was verified manually on a C-I runner. A proper end-to-end test that downloads the release artifact, runs it on each target platform, and validates basic functionality would catch regressions like this before they reach users. That's not built yet.

[pause:500ms]

<!-- p-83 -->
The CRLF normalization fixed the immediate diff noise, but the root cause — files entering the repository with Windows line endings despite the git-attributes configuration — hasn't been investigated. It's likely a Git configuration issue on the machine that pushed the original commits. Worth checking, not worth a session.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-22 -->
Agent Notes.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-84 -->
This session was primarily Arc coordinating parallel agents in isolated worktrees. The three features were built simultaneously, reviewed, and corrected before merge. The ARM64 debugging was a longer investigation that required multiple C-I runs to test hypotheses.

[pause:500ms]

<!-- p-85 -->
Stoney Eagle's contributions were critical at two points. First, pushing back on the code signing hypothesis and insisting on real hardware verification. The Mac C-I test that disproved the signing theory only happened because the boss said "prove it." Second, questioning el-did's provenance — the team didn't blindly add an unsigned binary to the build pipeline.

[pause:500ms]

<!-- p-86 -->
The parallel worktree approach worked well for the features but required careful coordination during the CRLF normalization rebase. All four branches had to be rebased on the same normalized master, and the rebase order mattered because some branches touched overlapping files.

[pause:900ms]

[narrator:reflective]

<!-- h-23 -->
What We Learned.

[pause:300ms]

[narrator:reflective]

<!-- p-87 -->
For beginners: cross-compilation bugs are some of the hardest to diagnose because the build succeeds. The compiler is happy. The linker is happy. Everything looks green in C-I. The binary just doesn't work on the target machine. When you're building for a different CPU architecture or operating system than the one you're building on, always test on real hardware. "It compiled" is not the same as "it works."

[pause:600ms]

<!-- p-88 -->
For beginners: when a bug has an obvious explanation that fits the symptoms, check it — but don't stop there. Code signing was a real problem with this binary. But it wasn't the problem. The first plausible explanation isn't always the right one. In debugging, premature conclusions waste more time than thorough investigation.

[pause:600ms]

[narrator:matter-of-fact]

<!-- p-89 -->
For the team: the lib G-P-G error lock object naming convention is a known pain point in cross-compilation. Two tools in the same build system looking up the same file under different names is a design decision that trades simplicity for flexibility, and the cost is exactly this kind of bug — silent at build time, fatal at runtime. When you're writing cross-platform build scripts, don't assume that one filename satisfies all consumers. Check every tool's lookup logic independently.

[pause:500ms]

<!-- p-90 -->
For the team: line ending normalization in a repository should be done early, in a dedicated commit, before feature branches diverge. Doing it after the fact means rebasing every active branch. The cost scales with the number of active branches. We had four. It could have been worse.

[pause:500ms]

<!-- p-91 -->
For the team: the parallel agent approach with isolated worktrees is effective for independent features. The key is independence — the three features in this session didn't share code, didn't modify overlapping files, and didn't depend on each other's output. Parallel work on tightly coupled features would need a different approach.

[pause:900ms]

[narrator:triumphant]

<!-- h-24 -->
The Score.

[pause:400ms]

[narrator:triumphant]

<!-- p-92 -->
Seven issues touched. Five pull requests shipped. One detailed spec written.

[pause:400ms]

<!-- p-93 -->
The VobSub muxer and O-C-R encoder landed first — the foundation pieces that established the injection script pattern. Then three more features built in parallel by separate agents. A macOS ARM64 crash that survived three false hypotheses before yielding to forensic analysis on real hardware. A line-ending normalization that cleaned up every diff in the repository. And a comprehensive H-L-S compliance spec ready for implementation.

[pause:500ms]

<!-- p-94 -->
The bug that took the longest to find was caused by six missing characters in a filename. The fix was two lines of bash. The feature that took the most creativity was the O-C-R encoder's luminance-weighted grayscale conversion — a trick that turned barely-readable subtitle bitmaps into high-contrast images that Tesseract could actually parse.

[pause:600ms]

[narrator:reflective]

<!-- p-95 -->
That's one overnight session. That's what shipping looks like.

[pause:900ms]

[narrator:reflective]

<!-- p-96 -->
This is Entry {{008}} of Shipping in the Dark. The last time we wrote about code signing, it was because we needed it. This time it was because we thought we needed it. Knowing the difference cost us a few hours and saved us from shipping the wrong fix. If you've ever confidently explained a bug to your team only to discover you were completely wrong — welcome. You're in the right place.

[pause:1000ms]
