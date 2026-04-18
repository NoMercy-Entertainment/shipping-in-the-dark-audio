# Speech Script: Subtitles and keeping streams yours

**Part:** 7 of 11

[narrator:cozy]

[narrator:reflective]

<!-- p-1 -->
Two topics sit together on this page because they share a trait. Both look trivial from the outside, and both turn out to have dragons hiding in the detail.

[pause:500ms]

<!-- p-2 -->
Subtitles, because every format is a different kind of file and every output container has different rules about what it will carry. A subtitle track that plays fine in MKV can disappear entirely in HLS.

[pause:500ms]

<!-- p-3 -->
And the optional protection layer on encoded streams, because keeping a paid stream paid sounds simple until you realize every browser, every phone, and every TV needs a different story.

[pause:500ms]

<!-- p-4 -->
Let us walk through both.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-1 -->
The subtitle problem, told as a story.

[pause:400ms]

<!-- p-5 -->
You have a Blu Ray of a foreign language film. You rip it to MKV. The MKV contains PGS subtitles, which is the format Blu Rays use.

[pause:500ms]

<!-- p-6 -->
You play the MKV in VLC on your laptop. Subtitles show up. You play it in Plex on your Apple TV. Subtitles show up. You are winning.

[pause:500ms]

<!-- p-7 -->
Then you try to watch the same content through the NoMercy web player, which uses HLS. No subtitles. They are gone.

[pause:500ms]

<!-- p-8 -->
Why? Because PGS subtitles are not text. Each subtitle cue is a tiny image. A screenshot of what the subtitle looks like, drawn by the studio's subtitle artist with their preferred font and positioning. PGS is great for Blu Ray because the studio gets pixel perfect control.

[pause:500ms]

<!-- p-9 -->
But HLS playlists cannot carry image subtitles. HLS only wants text subtitles, in a format called WebVTT. Your PGS subtitles, having no text content to begin with, need to be converted. And the only way to convert an image of text to text is to run OCR on every cue. That is covered earlier, in the content analysis part.

[pause:500ms]

<!-- p-10 -->
The rest of this part covers the wiring. How subtitle streams get routed from source to output based on what the container can actually hold.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
The routing decision.

[pause:400ms]

<!-- p-11 -->
There are two kinds of source subtitles. Text based, which includes ASS, SRT, WebVTT, and mov text. And bitmap based, which includes PGS, DVD VobSub, and DVB.

[pause:500ms]

<!-- p-12 -->
And four kinds of output container. MKV, which accepts anything. HLS, which wants WebVTT only. MP4, which accepts mov text or WebVTT sidecars. DASH, which uses WebVTT sidecars.

[pause:500ms]

<!-- p-13 -->
The encoder walks a small decision table based on source type and output container.

[pause:2200ms]

[narrator:matter-of-fact]

<!-- h-3 -->
The three modes you can pick.

[pause:400ms]

<!-- p-14 -->
You can override the routing with an explicit mode on the subtitle profile.

[pause:1400ms]

<!-- p-15 -->
Extract mode writes WebVTT, SRT, or ASS next to the video, and references it from the playlist. Good for soft subtitles the player can toggle.

[pause:500ms]

<!-- p-16 -->
Burn in mode renders subtitles directly into the video frames. Permanent. There is no toggle at playback time. Good when the player cannot render soft subtitles at all, or when you know the viewer always wants subtitles on. Foreign dialogue only in a mostly English film, for example.

[pause:500ms]

<!-- p-17 -->
Passthrough mode copies the subtitle stream verbatim into the container. Only makes sense for MKV and DASH, because those are the only containers that accept anything.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-4 -->
Burn in specifics.

[pause:400ms]

<!-- p-18 -->
Burn in triggers a video filter chain. ASS burn in needs libass, statically linked into NoMercy's ffmpeg build. PGS burn in uses the overlay filter on rendered subtitle frames.

[pause:500ms]

<!-- p-19 -->
The filter chain for ASS is a single dash v-f with an ass filter pointing at the input subtitle file.

[pause:1000ms]

<!-- p-20 -->
For PGS, it is a two input filter graph that overlays the subtitle stream on top of the video stream.

[pause:1000ms]

<!-- p-21 -->
When burn in is picked, a warning surfaces so users know the output variant has no toggleable subtitles.

[pause:1200ms]

<!-- p-22 -->
Per variant in an HLS ladder, burn in applies to every variant tagged for the same language. Multi language burn in would need separate variant ladders per language, which is expensive.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-5 -->
The HLS WebVTT pipeline.

[pause:400ms]

<!-- p-23 -->
When extracting for HLS, five things happen.

[pause:400ms]

<!-- p-24 -->
First. Read the source subtitle stream.

[pause:400ms]

<!-- p-25 -->
Second. Convert text codecs to WebVTT with a subtitle filter.

[pause:1000ms]

<!-- p-26 -->
Third. Convert bitmap codecs to WebVTT via OCR, covered in the content analysis part.

[pause:1000ms]

<!-- p-27 -->
Fourth. Slice WebVTT into segments aligned with the video segments. The slicer produces a per segment dot v-t-t file plus a sidecar playlist.

[pause:1200ms]

<!-- p-28 -->
Fifth. Reference the sidecar playlist from the master with an EXT-X-MEDIA tag of type SUBTITLES, plus stream inf lines that point at the subtitles group.

[pause:700ms]

The subtitle tracks live in a named group on the master playlist, and every video variant declares that group via its SUBTITLES attribute. That one attribute is what lets a player offer soft subtitles in its UI.

[pause:900ms]

<!-- p-29 -->
The SUBTITLES attribute on each stream inf line tells the player to pick up the group by ID.

[pause:500ms]

<!-- p-30 -->
Players that respect Apple's HLS spec. Safari, iOS, tvOS. Read the sidecar and offer subtitle tracks in the UI. Players that do not. Some older web HLS players. Need a JavaScript layer to fetch the WebVTT manually.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-6 -->
Preserving ASS styling across containers.

[pause:400ms]

<!-- p-31 -->
ASS carries rich typesetting. Positions, colours, fade effects, font choices, hand tuned karaoke. WebVTT has a much smaller subset. A naive HLS pipeline would convert ASS to WebVTT and drop most of that styling on the floor.

[pause:500ms]

<!-- p-32 -->
NoMercy does not do that. ASS tracks ship as sidecar files in every output format. MKV, MP4, HLS, DASH. Right next to the video.

[pause:500ms]

<!-- p-33 -->
The NoMercy web player renders ASS client side with JavaScript Subtitles Octopus, a libass WebAssembly port. Native platforms, Android and TV, render ASS through their bundled libass equivalent. Karaoke, positions, fades, all of it comes through faithfully. For third party clients that cannot render ASS, the validator suggests shipping a WebVTT fallback in parallel.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-7 -->
Attached fonts.

[pause:400ms]

<!-- p-34 -->
MKV sources often ship with attached font files. TrueType and OpenType. That the original subtitle author used for typesetting. Renderers need those specific fonts to match the intended look.

[pause:500ms]

<!-- p-35 -->
The font extractor pulls them out via ffmpeg's dump attachment flag on every encode that carries an ASS track, regardless of output container.

[pause:1000ms]

<!-- p-36 -->
The extracted fonts land in the output directory alongside the subtitle files. The NoMercy web player loads them into Subtitles Octopus at play time so libass WebAssembly renders the ASS with the same fonts the author picked. Native clients do the same with their platform libass. Without this step, even a libass capable client would fall back to system fonts and the typesetting would drift.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-8 -->
Chapter writing.

[pause:400ms]

<!-- p-37 -->
Sources with chapter metadata get their chapters preserved in the output. Chapters come from Blu Ray rips, anime with opening and ending markers, documentaries with section breaks, and similar.

[pause:500ms]

<!-- p-38 -->
For MKV, chapters carry over via stream copy.

[pause:400ms]

<!-- p-39 -->
For MP4, chapters are written as a chapter reference atom.

[pause:400ms]

<!-- p-40 -->
For HLS, chapters are emitted as EXT-X-DATERANGE tags in the media playlist.

[pause:1400ms]

<!-- p-41 -->
For DASH, chapters become event stream entries in the manifest.

[pause:500ms]

<!-- p-42 -->
Chapters are separate from intro and outro markers produced by audio fingerprinting. Chapters are source metadata, authored by the content creator. Intro markers are derived by the fingerprinter at analysis time.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-9 -->
Keeping a paid stream paid.

[pause:400ms]

<!-- p-43 -->
Now for the second half of the page.

[pause:400ms]

<!-- p-44 -->
If you are running a free home server for your own library, you do not need this part. Your streams are yours because they are on your own hardware, behind your own auth. Nothing on disk leaves.

[pause:500ms]

<!-- p-45 -->
But some users want more. A subscription tier for paid content. A watch party with invited guests only. A small commercial offering for a creator's own work. In any of these cases, you want to make it hard for someone to grab the stream URL and share it.

[pause:500ms]

<!-- p-46 -->
HLS has a built in tool for this. AES-128 segment level encryption. Each segment in the playlist is encrypted with a symmetric key. The playlist tells players where to fetch the key. If the player does not have permission to fetch the key, the segments are noise.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-10 -->
How AES-128 HLS works.

[pause:400ms]

<!-- p-47 -->
The DRM configuration on a profile takes four fields. Scheme, currently only AES-128 HLS. Key URI, what ends up in the playlist. Key file path, local path to the 16 byte key file. And an optional IV hex string.

[pause:1800ms]

<!-- p-52 -->
Six steps run as part of the encode.

[pause:400ms]

<!-- p-53 -->
First. Key generation. Before the encode starts, the DRM processor generates a random 128 bit key plus IV, or reuses an existing one.

[pause:1000ms]

<!-- p-54 -->
Second. Write a key info file. ffmpeg's dash HLS key info file flag takes a small text file with the key URL that players will fetch, the local path to the binary key file, and the IV as a hex string.

[pause:1200ms]

<!-- p-55 -->
Third. Pass the key info file to ffmpeg.

[pause:1200ms]

<!-- p-56 -->
Fourth. ffmpeg writes each segment encrypted with AES-128 CBC.

[pause:400ms]

<!-- p-57 -->
Fifth. The playlist gains an EXT-X-KEY tag with method AES-128, a URI pointing at the key location, and an IV value.

[pause:600ms]

The only new line compared to an unencrypted playlist is a single EXT-X-KEY tag near the top — method AES-128, the URI where players fetch the key, and the initialization vector. Every segment below that tag is encrypted with the same key.

[pause:900ms]

<!-- p-58 -->
Sixth. Players fetch the key over HTTPS, ideally with auth, and decrypt segments on the fly. The server is responsible for enforcing access on the key URI endpoint. Usually a bearer token check tied to the user's subscription or invite.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-11 -->
What this actually protects against.

[pause:400ms]

<!-- p-59 -->
AES-128 HLS is not full DRM in the Widevine or PlayReady sense. Let us be precise about what it does.

[pause:500ms]

<!-- p-60 -->
It protects against direct URL to stream scraping. A user who opens the m3u8 URL without passing through the paywall gets encrypted segments they cannot decode. They cannot pop the URL into a download tool and get the movie.

[pause:500ms]

<!-- p-61 -->
Key delivery is the weak link. If the key URI is public, so is the content. The server must gate key delivery behind auth proportional to the content's sensitivity.

[pause:500ms]

<!-- p-62 -->
Segments exist unencrypted on disk during encoding. The encryption happens as ffmpeg writes. If your source side storage is compromised, the unencrypted source still exists. AES-128 HLS is a streaming protection, not a storage protection.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-12 -->
What this does well.

[pause:400ms]

<!-- p-63 -->
It works everywhere. Safari, Chrome, iOS, Android, most smart TVs, Apple TV. The entire device ecosystem speaks AES-128 HLS. There is no license server to operate. There is no integration with Widevine, PlayReady, or FairPlay. You do not need a commercial DRM partner. You run your own encoder, you gate your own key delivery, you are done.

[pause:500ms]

<!-- p-64 -->
For home, prosumer, and small paywall use cases, this is enough.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-13 -->
CENC and DASH, planned but not shipped.

[pause:400ms]

<!-- p-65 -->
DASH supports a different scheme called Common Encryption, or CENC. One encrypted stream, separate license servers for Widevine, PlayReady, and FairPlay. This covers the studio grade multi DRM story.

[pause:500ms]

<!-- p-66 -->
Shipping CENC means three things.

[pause:400ms]

<!-- p-67 -->
First. A packager. Either mp4box from G-PAC, or shaka packager, for segment level encryption.

[pause:1200ms]

<!-- p-69 -->
Second. License server integration. Usually a paid service. ExpressPlay, Axinom, BuyDRM, and similar. The encoder emits the content key and PSSH boxes. The license server issues decryption licenses at playback time.

[pause:500ms]

<!-- p-71 -->
Third. Certificate handling per DRM system. Widevine requires Google signed certs. PlayReady requires Microsoft signed certs. FairPlay requires Apple signed certs. Each has its own provisioning flow.

[pause:500ms]

<!-- p-73 -->
CENC is marked on the roadmap as paid tier work. AES-128 HLS covers the home and prosumer and casual paywall case. CENC covers commercial streaming at scale, which is a smaller user base and a larger build.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-14 -->
Subtitle and DRM interaction.

[pause:400ms]

<!-- p-74 -->
The validator enforces a few combinations. MP4 extract mode allows WebVTT, SRT, or mov text. HLS extract mode allows WebVTT only. ASS triggers a lossy conversion warning. MKV and DASH allow all subtitle codecs.

[pause:1200ms]

<!-- p-75 -->
When DRM is enabled on an HLS encode, subtitle sidecars are not encrypted. Subtitle files are tiny and carry no content worth stealing. The video segments are where the protection matters.

[pause:900ms]
