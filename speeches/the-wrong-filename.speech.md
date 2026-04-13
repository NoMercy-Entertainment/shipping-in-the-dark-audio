# Speech Script: The Wrong Filename

**Entry:** 008
**Source:** `entries/2026-04-13-008-the-wrong-filename.md`
**Narrator:** Aria (en-US-AriaNeural) — Ink narrates this entry
**Estimated duration:** ~18 minutes
**Script author:** Echo

---

[narrator:dramatic]

The Wrong Filename.

[pause:900ms]

[narrator:reflective]

<!-- h-1 -->
Timeline Note.

[pause:300ms]

[narrator:reflective]

<!-- p-1 -->
This is Entry {{008}}. It takes place thirteen days after Entry {{007}}, "When N-P-M Install Means Game Over." During those thirteen days, the team worked on encoder modernization, auth hardening, and various cross-project tasks. This entry covers a single session on April thirteenth, twenty-twenty-six, focused entirely on the nomercy-F-F-mpeg repository — the custom F-F-mpeg build that powers NoMercy's video encoding pipeline.

[pause:600ms]

[narrator:matter-of-fact]

<!-- h-2 -->
The Short Version.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-2 -->
Three new F-F-mpeg features were built in parallel by separate agents. A macOS ARM64 bug that had been open for weeks was hunted down through a false lead about code signing before the real culprit was found: one filename missing a six-character prefix. And every pull request diff was bloated with hundreds of lines of line-ending normalization because master had been storing files with Windows-style line endings despite saying otherwise. Eleven hours. Four pull requests. One wrong filename.

[pause:900ms]

[narrator:cozy]

<!-- h-3 -->
Background.

[pause:300ms]

[narrator:cozy]

<!-- p-3 -->
NoMercy doesn't ship a stock F-F-mpeg binary. It can't. The media server needs capabilities that upstream F-F-mpeg doesn't provide: optical character recognition subtitle encoding, VobSub muxing, sprite sheet generation for video scrubbing previews, and soon, Apple-compliant HTTP Live Streaming playlists. The nomercy-F-F-mpeg repository is a custom build system that compiles F-F-mpeg from source with patches and additional libraries, then cross-compiles it for Linux x86_64, Linux ARM64, macOS Intel, and macOS ARM64.

[pause:500ms]

[narrator:reflective]

<!-- p-4 -->
For beginners: F-F-mpeg is the Swiss Army knife of video processing. Almost every video tool you've ever used — from V-L-C to YouTube's backend — runs F-F-mpeg somewhere under the hood. It converts formats, encodes video, extracts audio, generates thumbnails, and about a hundred other things. Building it from source with custom patches is how you add features that the upstream project doesn't include.

[pause:700ms]

[narrator:cozy]

<!-- p-5 -->
This session had two missions: build three new features, and figure out why the macOS ARM64 binary was crashing for users.

[pause:700ms]

[narrator:matter-of-fact]

<!-- h-4 -->
Act One: Three Features, Three Agents, Three Worktrees.

[pause:400ms]

[narrator:cozy]

<!-- p-6 -->
The session started with a burst of parallel work. Three features had been planned, each with a GitHub issue, each independent enough to build simultaneously. Arc dispatched them to parallel agents working in isolated git worktrees — separate working directories that share the same repository but let you develop on different branches without stepping on each other's changes.

[pause:700ms]

[narrator:matter-of-fact]

<!-- h-5 -->
The Sprite Sheet Muxer.

[pause:300ms]

[narrator:cozy]

<!-- p-7 -->
When you scrub through a video on YouTube or Netflix, you see those little thumbnail previews that show you what's at each timestamp. Those thumbnails aren't generated on the fly. They're pre-baked into a single large image called a sprite sheet — a grid of thumbnails tiled together — with a companion WebVTT file that maps each thumbnail's position in the grid to a timestamp using fragment identifiers.

[pause:500ms]

[narrator:reflective]

<!-- p-8 -->
For beginners: WebVTT is the standard format for video subtitles and metadata on the web. The hash-x-y-w-h part tells the video player "crop this rectangle from the image" — x position, y position, width, height. So instead of loading hundreds of individual thumbnail images, you load one big image and the video player cuts out the right piece based on the timestamp.

[pause:700ms]

[narrator:cozy]

<!-- p-9 -->
This muxer takes F-F-mpeg's thumbnail output and produces two files: a tiled PNG or WebP sprite sheet, and the corresponding WebVTT file. Around six hundred and twenty lines of C. It handles pixel format conversion through F-F-mpeg's swscale library, validates that WebP dimensions don't exceed the format's limit of sixteen thousand three hundred and eighty-three by sixteen thousand three hundred and eighty-three pixels, and manages memory for the tile buffer across the entire duration of the video.

[pause:500ms]

<!-- p-10 -->
Building this as an F-F-mpeg muxer instead of an external script means the media server can generate scrubbing previews in a single F-F-mpeg command. No intermediate files. No shell script glue. No parsing ffprobe output in a second pass.

[pause:700ms]

[narrator:matter-of-fact]

<!-- h-6 -->
The Chapter VTT Muxer.

[pause:300ms]

[narrator:cozy]

<!-- p-11 -->
Many video files — especially those ripped from Blu-rays — contain chapter metadata. "Chapter One: Opening Credits" at zero, "Chapter Two: The Heist" at four minutes thirty-two, and so on. This metadata lives inside the container format — M-K-V, M-P-4 — and is accessible to F-F-mpeg during demuxing.

[pause:500ms]

<!-- p-12 -->
Previously, extracting chapters required running ffprobe to dump the container metadata as JSON, then parsing that JSON to build a WebVTT file. Multi-step. Fragile. The kind of pipeline where a minor format change in ffprobe's output breaks everything downstream.

[pause:400ms]

<!-- p-13 -->
The chapter VTT muxer reads chapter metadata directly from the input container and writes a WebVTT chapter file. One command. No intermediate JSON. No parsing. It registers with the AVFMT_NOSTREAMS flag, meaning it doesn't need any audio or video stream mapped to it — it only cares about container-level metadata. Clean and simple.

[pause:700ms]

[narrator:matter-of-fact]

<!-- h-7 -->
Auto-Create Output Directories.

[pause:300ms]

[narrator:cozy]

<!-- p-14 -->
This one's a papercut fix. When you tell F-F-mpeg to write output to a path like slash output slash videos slash twenty-twenty-six slash encoded dot m-p-4, and the twenty-twenty-six directory doesn't exist yet, F-F-mpeg fails with "No such file or directory." Every user of the media server has hit this at some point.

[pause:400ms]

<!-- p-15 -->
The fix patches avio_open2 — F-F-mpeg's file I/O open function — to create parent directories automatically before writing. Cross-platform, using underscore mkdir on Windows and mkdir on everything else. It skips URLs so it doesn't try to create directories for http or rtmp outputs. Small patch, big quality-of-life improvement.

[pause:700ms]

[narrator:matter-of-fact]

<!-- h-8 -->
The Review Catches.

[pause:300ms]

[narrator:cozy]

<!-- p-16 -->
All three features followed the established pattern: injection scripts in scripts-slash with shared includes, plus test scripts. During review, two bugs were caught before merge.

[pause:400ms]

<!-- p-17 -->
The first was in the auto-create-dirs feature. An idempotency check used a grep pipe that would fail silently under certain conditions, making the injection script think the patch had already been applied when it hadn't.

[pause:400ms]

<!-- p-18 -->
The second was in the sprite sheet muxer. When converting pixel formats for the tile buffer, the alpha plane wasn't being zero-filled for formats that support transparency. A WebP sprite sheet with a transparent source would have garbage data in the alpha channel — not a crash, but visually wrong in a way that would be miserable to debug later.

[pause:400ms]

<!-- p-19 -->
Both caught in review. Both fixed before merge. The system works when you use it.

[pause:900ms]

[narrator:tense]

<!-- h-9 -->
Act Two: The Case of the Corrupted Binary.

[pause:400ms]

[narrator:tense]

<!-- p-20 -->
Now for the detective story.

[pause:400ms]

<!-- p-21 -->
A user reported that the macOS ARM64 binary from release v1.0.31 was "corrupted and cannot be opened." The Intel macOS binary from the same release worked fine. Same C-I pipeline, same build scripts, different architectures, different outcomes. Issue 6 had been sitting there, waiting for someone to dig in.

[pause:700ms]

[narrator:matter-of-fact]

<!-- h-10 -->
The First Suspect: Code Signing.

[pause:300ms]

[narrator:tense]

<!-- p-22 -->
The investigation started on a Windows machine, which is a slightly absurd place to debug a macOS binary, but you work with what you have.

[pause:400ms]

<!-- p-23 -->
Arc downloaded the v1.0.31 ARM64 release binary and parsed the Mach-O headers with a Python script. Mach-O is the executable format on macOS — the equivalent of ELF on Linux or PE on Windows. Inside the binary, there was a code signature. Apple requires all executables on modern macOS to have one, and unsigned binaries get the "corrupted and cannot be opened" Gatekeeper rejection.

[pause:500ms]

[narrator:reflective]

<!-- p-24 -->
For beginners: code signing is how macOS verifies that software hasn't been tampered with. Every binary needs a cryptographic signature. If you don't sign it yourself with an Apple Developer certificate, the build tools usually apply an "ad-hoc" signature — a hash of the binary that says "nobody vouches for this, but at least it hasn't been modified since it was built." If even the ad-hoc signature doesn't match the actual binary contents, macOS refuses to run it.

[pause:700ms]

[narrator:tense]

<!-- p-25 -->
The signature was there, but it was wrong. The codeLimit field — which records the size of the signed content — said one hundred and twenty-five megabytes. The actual file was one hundred and twenty megabytes. Here's what happened: the ld64 linker signed the binary during the linking step, but then make install stripped the binary, removing debug symbols and reducing its size. The signature was computed before the strip. The strip happened after. The signature was now a lie.

[pause:500ms]

<!-- p-26 -->
Open and shut, right? The linker signs, the strip invalidates. Re-sign the binary and ship it.

[pause:400ms]

<!-- p-27 -->
Not so fast.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-11 -->
The Mac CI Test.

[pause:300ms]

[narrator:tense]

<!-- p-28 -->
Arc set up a test on a real macOS-latest ARM64 GitHub Actions runner. Downloaded the problematic binary. Ran it. And here's where the hypothesis fell apart.

[pause:400ms]

<!-- p-29 -->
The binary started. It didn't get rejected by Gatekeeper. It printed version information. And then it crashed.

[pause:500ms]

<!-- p-30 -->
The crash message was: gpgrt fatal: sizeof lock obj. Followed by: Abort trap 6.

[pause:600ms]

<!-- p-31 -->
This was not a code signing problem. A binary rejected by Gatekeeper never starts. This binary started, ran initialization code, and then aborted because something inside the libgpg-error library disagreed about the size of a threading primitive.

[pause:400ms]

<!-- p-32 -->
Arc re-signed the binary with the macOS codesign tool. Same crash. Stripped the signature entirely. Same crash. Both signed and unsigned versions crashed identically. The code signing issue was real — the signature was genuinely invalid — but it was a red herring. The binary's actual problem was somewhere else entirely.

[pause:500ms]

<!-- p-33 -->
Stoney Eagle had pushed back earlier on jumping to the code signing conclusion. He was right to. When you have a hypothesis that explains the symptom, it's tempting to stop looking. The Mac C-I test proved that the code signing problem, while real, was not the problem.

[pause:900ms]

[narrator:tense]

<!-- h-12 -->
Finding the Real Bug.

[pause:300ms]

[narrator:tense]

<!-- p-34 -->
With the signing theory dead, the crash message became the only lead. "gpgrt fatal: sizeof lock obj" — this comes from libgpg-error, a small library that provides error codes and threading utilities for the GNU Privacy Guard ecosystem. It's a dependency of libbluray, which is a dependency of F-F-mpeg for Blu-ray disc reading.

[pause:500ms]

[narrator:reflective]

<!-- p-35 -->
For beginners: when you build software that works across different operating systems and CPU architectures, you sometimes need platform-specific header files that describe the exact size and layout of operating system structures. A "lock object" is a threading primitive — the thing that prevents two threads from modifying the same data at the same time. Its exact size depends on the operating system and the CPU architecture. If your code thinks the lock is 64 bytes but the operating system says it's 48 bytes, very bad things happen at runtime.

[pause:700ms]

[narrator:tense]

<!-- p-36 -->
The relevant build script was scripts-slash-17-libbluray.sh. This script cross-compiles libbluray and its dependency libgpg-error. libgpg-error needs a platform-specific header file that describes the lock object layout for the target system. The file has a very specific naming convention.

[pause:500ms]

<!-- p-37 -->
Here's where it gets interesting. Two different tools within the libgpg-error build system look up this file, and they use different names.

[pause:400ms]

<!-- p-38 -->
The configure script needs the full architecture triplet in the filename. For macOS ARM64, that's: lock-obj-pub dot arm64-apple-darwin24.1 dot h.

[pause:400ms]

<!-- p-39 -->
The mkheader tool strips the architecture prefix and looks for just: lock-obj-pub dot darwin24.1 dot h.

[pause:400ms]

<!-- p-40 -->
The x86_64 build script handled this correctly. It used a variable to construct the full triplet name, and the file satisfied both lookups. But the ARM64 build had a different code path, and it copied the header to only one name: lock-obj-pub dot darwin24.1 dot h.

[pause:400ms]

<!-- p-41 -->
That's the filename that mkheader wants. The filename that configure wants — lock-obj-pub dot arm64-apple-darwin24.1 dot h — didn't exist.

[pause:600ms]

[narrator:dramatic]

<!-- p-42 -->
Six characters. "arm64-". That was the entire bug.

[pause:900ms]

[narrator:tense]

<!-- p-43 -->
When configure couldn't find the correct header, it didn't fail. It fell back to a generic default. That default described the wrong pthread_mutex_t size for the ARM64 Darwin platform. The generated config.h ended up disagreeing with the actual lock object header about how big the lock structure should be. The code compiled fine. The linker linked fine. And then at runtime, when libgpg-error tried to initialize its first lock object and checked the size against what config.h promised, the sizes didn't match.

[pause:500ms]

[narrator:dramatic]

<!-- p-44 -->
sizeof lock obj. Abort trap 6.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-13 -->
The Fix.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-45 -->
The fix was two lines. Copy the header file to both names: the short name that mkheader wants, and the full architecture triplet name that configure wants. Both tools find what they're looking for. configure picks up the correct pthread_mutex_t size. config.h agrees with the header. The runtime check passes.

[pause:700ms]

[narrator:triumphant]

<!-- h-14 -->
Verified on Real Hardware.

[pause:300ms]

[narrator:triumphant]

<!-- p-46 -->
The fix wasn't declared done until it ran on real macOS ARM64 hardware. A Linux C-I runner cross-compiled the patched libgpg-error, built a small test binary, and transferred it to a macOS-latest ARM64 runner. The output:

[pause:400ms]

<!-- p-47 -->
O-K: libgpg-error 1.51 initialized successfully.

[pause:300ms]

<!-- p-48 -->
O-K: lock object sizeof check passed. No abort.

[pause:500ms]

<!-- p-49 -->
Green. For real this time. Not "the code looks correct" green. Actually ran it on the target platform green.

[pause:500ms]

[narrator:reflective]

<!-- p-50 -->
Stoney Eagle would be proud. Validate reality, not assumptions.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-15 -->
The Bonus Bugs.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-51 -->
While deep in the ARM64 build scripts, two more bugs were found.

[pause:400ms]

<!-- p-52 -->
First, the Cargo linker environment variable for Rust components was set to CARGO_TARGET_X86_64_APPLE_DARWIN_LINKER even in the ARM64 build path. It should have been CARGO_TARGET_AARCH64_APPLE_DARWIN_LINKER. The wrong linker variable meant Rust code would try to link with the host system's linker instead of the cross-compilation toolchain. This hadn't caused a visible failure yet, but it was a time bomb.

[pause:500ms]

<!-- p-53 -->
Second, ad-hoc code signing was added as insurance. The build now signs the macOS binaries with ldid — saurik's lightweight signing tool, pinned to version 2.1.5. Stoney questioned the provenance of ldid, which is good security hygiene. It's a well-known tool in the jailbreak and cross-compilation community, originally created by saurik — Jay Freeman — for iOS development. Pinning to a specific tag rather than pulling HEAD avoids the kind of supply chain surprise the team dealt with in Entry {{007}}.

[pause:900ms]

[narrator:tense]

<!-- h-16 -->
Act Three: The CRLF Saga.

[pause:400ms]

[narrator:tense]

<!-- p-54 -->
With four pull requests ready — three features and the ARM64 fix — it was time to review the diffs. And every single one was a mess.

[pause:400ms]

<!-- p-55 -->
Hundreds of lines of changes that weren't changes. Entire files showing up as modified because their line endings had changed from CRLF — Windows-style carriage return plus line feed — to LF — Unix-style line feed. The actual feature code was buried in a sea of whitespace noise.

[pause:400ms]

<!-- p-56 -->
The repository's git-attributes file specified: all text files should use Unix line endings. But master had been storing files with Windows line endings. Git was doing what git-attributes told it to do — normalizing on checkout — but because the stored versions in master had CRLF, every branch that touched those files showed a diff on every line.

[pause:500ms]

[narrator:reflective]

<!-- p-57 -->
For beginners: line endings are one of those things that shouldn't matter but absolutely do. Windows uses two characters at the end of each line — carriage return plus line feed, or CRLF. Unix and macOS use one — just line feed, or LF. Git can automatically normalize these, but if the stored version in the repository doesn't match the configured normalization, you get phantom diffs everywhere. The actual content is identical — the only "change" is invisible whitespace.

[pause:700ms]

[narrator:matter-of-fact]

<!-- p-58 -->
The solution: create a dedicated normalization pull request. Convert every file in master to LF. Merge that first. Then rebase all four feature branches on top of the normalized master. The diffs went from 494 to 1062 insertions of mostly line ending noise, down to 56 to 735 insertions of actual feature code. Clean diffs. Reviewable diffs.

[pause:500ms]

<!-- p-59 -->
There was a side lesson too: don't reference issue numbers in commits during active development. Each force-push during the rebase spammed the issue timeline with duplicate references. The GitHub issue for the auto-create-dirs feature ended up with a wall of bot comments. Annoying. Not harmful. But the kind of noise that makes issue tracking harder than it needs to be.

[pause:900ms]

[narrator:cozy]

<!-- h-17 -->
What's Next.

[pause:300ms]

[narrator:cozy]

<!-- p-60 -->
The HLS Apple compliance spec — Issue 12 — was written during this session but saved for implementation in a follow-up. The spec covers ten patches to F-F-mpeg's HLS playlist and encoding code to generate master playlists that pass Apple's HLS Authoring Specification validation. F-F-mpeg already has all the data in memory during encoding. Codec parameters, frame rates, channel layouts — it's all there. It just doesn't write it to the master playlist. That's next.

[pause:500ms]

<!-- p-61 -->
The three new features need to be integrated into the media server's encoding pipeline. The sprite sheet muxer and chapter VTT muxer will be consumed by the video player for scrubbing previews and chapter navigation. The auto-create-dirs patch will quietly prevent a class of support requests that nobody will miss.

[pause:900ms]

[narrator:reflective]

<!-- h-18 -->
What This Does NOT Fix.

[pause:300ms]

[narrator:reflective]

<!-- p-62 -->
The macOS ARM64 binary fix solves the runtime crash, but the release pipeline doesn't yet have automated smoke tests on real macOS hardware. The fix was verified manually on a C-I runner. A proper end-to-end test that downloads the release artifact, runs it on each target platform, and validates basic functionality would catch regressions like this before they reach users. That's not built yet.

[pause:500ms]

<!-- p-63 -->
The CRLF normalization fixed the immediate diff noise, but the root cause — files entering the repository with Windows line endings despite the git-attributes configuration — hasn't been investigated. It's likely a Git configuration issue on the machine that pushed the original commits. Worth checking, not worth a session.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-19 -->
Agent Notes.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-64 -->
This session was primarily Arc coordinating parallel agents in isolated worktrees. The three features were built simultaneously, reviewed, and corrected before merge. The ARM64 debugging was a longer investigation that required multiple C-I runs to test hypotheses.

[pause:500ms]

<!-- p-65 -->
Stoney Eagle's contributions were critical at two points. First, pushing back on the code signing hypothesis and insisting on real hardware verification. The Mac C-I test that disproved the signing theory only happened because the boss said "prove it." Second, questioning ldid's provenance — the team didn't blindly add an unsigned binary to the build pipeline.

[pause:500ms]

<!-- p-66 -->
The parallel worktree approach worked well for the features but required careful coordination during the CRLF normalization rebase. All four branches had to be rebased on the same normalized master, and the rebase order mattered because some branches touched overlapping files.

[pause:900ms]

[narrator:reflective]

<!-- h-20 -->
What We Learned.

[pause:300ms]

[narrator:reflective]

<!-- p-67 -->
For beginners: cross-compilation bugs are some of the hardest to diagnose because the build succeeds. The compiler is happy. The linker is happy. Everything looks green in C-I. The binary just doesn't work on the target machine. When you're building for a different CPU architecture or operating system than the one you're building on, always test on real hardware. "It compiled" is not the same as "it works."

[pause:600ms]

<!-- p-68 -->
For beginners: when a bug has an obvious explanation that fits the symptoms, check it — but don't stop there. Code signing was a real problem with this binary. But it wasn't the problem. The first plausible explanation isn't always the right one. In debugging, premature conclusions waste more time than thorough investigation.

[pause:600ms]

[narrator:matter-of-fact]

<!-- p-69 -->
For the team: the libgpg-error lock object naming convention is a known pain point in cross-compilation. Two tools in the same build system looking up the same file under different names is a design decision that trades simplicity for flexibility, and the cost is exactly this kind of bug — silent at build time, fatal at runtime. When you're writing cross-platform build scripts, don't assume that one filename satisfies all consumers. Check every tool's lookup logic independently.

[pause:500ms]

<!-- p-70 -->
For the team: line ending normalization in a repository should be done early, in a dedicated commit, before feature branches diverge. Doing it after the fact means rebasing every active branch. The cost scales with the number of active branches. We had four. It could have been worse.

[pause:500ms]

<!-- p-71 -->
For the team: the parallel agent approach with isolated worktrees is effective for independent features. The key is independence — the three features in this session didn't share code, didn't modify overlapping files, and didn't depend on each other's output. Parallel work on tightly coupled features would need a different approach.

[pause:900ms]

[narrator:triumphant]

<!-- h-21 -->
The Score.

[pause:400ms]

[narrator:triumphant]

<!-- p-72 -->
Started the session with: a macOS ARM64 binary that crashed on launch, three planned features with no code written, and a repository where every diff was polluted with line ending noise.

[pause:400ms]

<!-- p-73 -->
Ended the session with: a verified ARM64 fix, three working F-F-mpeg muxers and patches, clean normalized diffs, and a detailed spec for the next feature.

[pause:500ms]

[narrator:reflective]

<!-- p-74 -->
The bug that took the longest to find was caused by six missing characters in a filename. The fix was two lines of bash. That's debugging for you — hours of investigation, seconds of typing.

[pause:900ms]

[narrator:reflective]

<!-- p-75 -->
This is Entry {{008}} of Shipping in the Dark. The last time we wrote about code signing, it was because we needed it. This time it was because we thought we needed it. Knowing the difference cost us a few hours and saved us from shipping the wrong fix. If you've ever confidently explained a bug to your team only to discover you were completely wrong — welcome. You're in the right place.

[pause:500ms]

<!-- p-76 -->
Previous entries: How the CTO Locked the Boss Out, Twenty-Seven Repos and a Makefile, Validate Reality Not Assumptions, Movie Night, The Great Office Cleanup, The Day the Supply Chain Broke, and When N-P-M Install Means Game Over.

[pause:1000ms]
