# Speech Script: From shelf to library

**Part:** 9 of 11

[narrator:cozy]

[narrator:reflective]

<!-- p-1 -->
You have a shelf of Blu Rays. Real physical discs. You bought them over the years, and they have survived every round of home theatre rearrangement. Most are still in their cases. Some are loose in a drawer.

[pause:500ms]

<!-- p-2 -->
You want them in your media library.

[pause:400ms]

<!-- p-3 -->
That means, for each disc, ripping it to a file on your server. Then optionally re encoding that file into formats your players can use. Then enriching it with metadata like cover art and cast info.

[pause:500ms]

<!-- p-4 -->
All of that has to happen with as little manual work as possible. Ideally you put the disc in the drive, walk away, come back later, and the movie is in your library the way it should be.

[pause:500ms]

<!-- p-5 -->
This page covers the first half of that. Disc ripping. The rest, the re encoding, is what the other pages have been describing.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-1 -->
Watching for discs.

[pause:400ms]

<!-- p-6 -->
The first piece of the system is the drive monitor. It polls the operating system's list of optical drives every few seconds, and emits events.

[pause:2000ms]

<!-- p-7 -->
The four event types.

[pause:400ms]

<!-- p-8 -->
Drive added. A new optical drive appears. A USB Blu Ray drive was just plugged in.

[pause:400ms]

<!-- p-9 -->
Drive removed. A drive goes away.

[pause:400ms]

<!-- p-10 -->
Disc inserted. A drive that was empty now has media.

[pause:400ms]

<!-- p-11 -->
Disc ejected. A drive that had media is now empty.

[pause:500ms]

<!-- p-12 -->
The monitor is cross platform. It uses dot NET's DriveInfo, filtered to CD-ROM drive type. That works on Windows, Linux, and macOS without platform specific code.

[pause:500ms]

<!-- p-13 -->
A single SignalR push goes to connected dashboards with the hub name, event type, drive letter, volume label, and timestamp.

[pause:1600ms]

[narrator:matter-of-fact]

<!-- h-2 -->
Reading what is on the disc.

[pause:400ms]

<!-- p-14 -->
When a disc is inserted, the disc scanner reads the title structure via ffprobe. Specifically, it uses ffprobe's bluray colon and dvdread colon pseudo URLs.

[pause:1400ms]

<!-- p-15 -->
For a Blu Ray, that returns a program per title. A typical scan result includes the mount point, the disc type, a volume label, and an array of titles. Each title has an index, a duration, a chapter count, plus arrays of video streams, audio streams, and subtitle streams.

[pause:3200ms]

<!-- p-16 -->
Discs typically have a main feature. The longest title, usually one to three hours. Plus short titles for menus, trailers, and extras. The scanner lists everything. The user picks what to rip.

[pause:1000ms]

[narrator:matter-of-fact]

<!-- h-3 -->
The ripper.

[pause:400ms]

<!-- p-17 -->
The disc ripper wraps ffmpeg with disc specific arguments. For a Blu Ray, the command points at the bluray pseudo URL, selects a playlist number, maps the desired streams, and stream copies to an output MKV.

[pause:2400ms]

<!-- p-18 -->
Key details.

[pause:400ms]

<!-- p-19 -->
Dash playlist N selects the Blu Ray playlist. The title index. Different titles use different playlists.

[pause:500ms]

<!-- p-20 -->
Dash c copy means stream copy, no re encoding. The intermediate MKV contains the exact source bitstream, bit for bit. Ripping is a lossless operation.

[pause:500ms]

<!-- p-21 -->
The dash map selections let the user opt in or out of specific audio and subtitle streams. The default is all streams. The user can narrow via the dashboard before starting the rip. You do not usually need seventeen different language dubs in your library.

[pause:500ms]

<!-- p-22 -->
Dash copy t-s preserves timestamps. That matters for chapters and subtitles staying in sync.

[pause:500ms]

<!-- p-23 -->
The output filename pattern is simple. One MKV per selected title, named by title index. The regular file encoder picks these up automatically if the output directory is a watched folder with an assigned encoder profile.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-4 -->
Rip then encode.

[pause:400ms]

<!-- p-24 -->
The full flow has five steps.

[pause:400ms]

<!-- p-25 -->
First. Insert disc. The drive monitor fires a disc inserted event. The dashboard shows a notification.

[pause:500ms]

<!-- p-26 -->
Second. Scan. The dashboard shows the disc titles. The user picks the main feature plus optional extras, and chooses which audio and subtitle tracks to keep.

[pause:500ms]

<!-- p-27 -->
Third. Rip. The disc ripper stream copies to intermediate MKVs. Duration is roughly the playback length of the disc. Blu Ray read speed is the bottleneck, not CPU.

[pause:500ms]

<!-- p-28 -->
Fourth. Auto encode. The auto encode subscriber watches the rip output directory. When a new MKV lands, it dispatches an encoding job with the profile assigned to that folder.

[pause:500ms]

<!-- p-29 -->
Fifth. Content analysis. Post encode subscribers run crop detection, intro and outro fingerprinting, OCR on bitmap subs, and so on.

[pause:500ms]

<!-- p-30 -->
Total time on a typical feature film depends almost entirely on the drive. The rip takes roughly thirty to sixty minutes, driven by Blu Ray read speed. The encode with hardware acceleration typically takes less time per variant than the rip itself. Analysis is minutes.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-5 -->
Metadata, still unfinished.

[pause:400ms]

<!-- p-31 -->
The ripper does not yet resolve metadata. Movie title, director, year, cover art, cast. That is a separate resolver interface, currently scaffolded but not implemented.

[pause:2000ms]

<!-- p-32 -->
The ripped MKVs land in a folder keyed by disc type plus scan timestamp. For now, the user moves and renames post rip based on what the file actually is.

[pause:500ms]

<!-- p-33 -->
Future work on the roadmap. Auto query TMDB using the main title's duration plus any disc embedded metadata. The system would suggest a folder structure. The user would confirm before moving.

[pause:500ms]

<!-- p-34 -->
This is a known rough edge. It is on the list.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-6 -->
Supported media.

[pause:400ms]

<!-- p-35 -->
Blu Ray is supported via libbluray. Region free discs work out of the box. Region locked Blu Rays need an appropriate drive firmware. That is not a software concern.

[pause:500ms]

<!-- p-36 -->
DVD is supported via libdvdread. Both CSS encrypted and unencrypted discs work, provided the drive can decrypt them.

[pause:500ms]

<!-- p-37 -->
HD DVD is technically supported via generic ffmpeg input. Not explicitly tested. The format is dead enough that we do not guarantee it.

[pause:500ms]

<!-- p-38 -->
AVCHD camcorder discs work via the Blu Ray scanner, because AVCHD uses the same file structure.

[pause:500ms]

<!-- p-39 -->
Data discs with loose video files are not handled by the ripper. They are treated as a regular filesystem mount. Drop the files in a library folder, and the regular scanner picks them up.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-7 -->
The hard honest limits.

[pause:400ms]

<!-- p-40 -->
AACS and BD+ protected discs require a compatible drive plus key management, which is outside the scope of this encoder. The ripper reads the decrypted stream once the drive has decrypted it. It does not do key retrieval itself. If your drive will not play a disc, the ripper will not rip it.

[pause:500ms]

<!-- p-41 -->
No transcoding at rip time. This is deliberate. Stream copy is lossless and reversible. The re encode happens later, against the ripped MKV, with whatever profile the user picked. Want to change your encoding strategy later? You still have the lossless source.

[pause:500ms]

<!-- p-42 -->
One rip at a time per drive. Optical drives cannot read two titles in parallel. Multiple drives on the same host can rip concurrently.

[pause:500ms]

<!-- p-43 -->
No drive specific tuning. Read speed is whatever the drive defaults to. Some drives rip faster than others. Not much the encoder can do about that.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-8 -->
Security.

[pause:400ms]

<!-- p-44 -->
The ripper runs with mounted filesystem access. On Linux it does not need elevated privileges, as long as the user is in the CD-ROM group. Output paths are checked against the path allowlist. The ripper cannot write outside configured output directories, even if someone manages to feed it a malicious filename. Disc content is not trusted input the way random network media is. But the scanner still runs in a restricted ffprobe invocation, with no filter chain evaluation, because disc structures have historically contained a surprising amount of creative malformation.

[pause:900ms]
