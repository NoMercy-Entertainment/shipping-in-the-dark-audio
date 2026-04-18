# Speech Script: Playing what your device cannot decode

**Part:** 8 of 11

[narrator:matter-of-fact]

Part eight. Playing what your device cannot decode.

[pause:900ms]

[narrator:reflective]

<!-- p-1 -->
You have a 4K Blu Ray rip of a movie. The file on disk is HEVC with 10 bit colour, 7.1 Atmos audio, and Dolby Vision metadata. Your main TV at home loves it. It was practically engineered for it.

[pause:500ms]

<!-- p-2 -->
Now you are on a bus, on your phone, on mobile data. The phone's decoder can handle H.264 at 1080p. Your 4K HEVC file with Dolby Vision might as well be a rock as far as this phone is concerned.

[pause:500ms]

<!-- p-3 -->
What do you do?

[pause:400ms]

<!-- p-4 -->
Option one. Re encode the whole movie once on the server into a smaller format. Store that output too. Now you have two files per title. Times every movie in your library. Your disk usage just doubled.

[pause:500ms]

<!-- p-5 -->
Option two. Make the server re encode the movie on the fly, exactly for this phone, exactly right now. When you stop watching, the server discards the work. Next time you come back, it does it again, possibly a bit further into the file, possibly at a different quality because you are on wifi now instead of mobile.

[pause:500ms]

<!-- p-6 -->
Option two is live transcode. It is what the encoder does when the stored file and the client device do not match. And it is what this page is about.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-1 -->
When does it kick in.

[pause:400ms]

<!-- p-7 -->
The web player detects client capabilities at session start. When the source does not match what the client can play, it asks the server for a live transcode.

[pause:2400ms]

<!-- p-8 -->
The Live Streaming Service creates a live session. The response carries a session ID, a playlist URL, the selected variant, and an expiry.

[pause:1800ms]

<!-- p-9 -->
Three things happen server side.

[pause:400ms]

<!-- p-10 -->
First. The live quality selector picks a quality profile matching the client's constraints.

[pause:500ms]

<!-- p-11 -->
Second. The live ffmpeg runner spawns ffmpeg writing HLS segments into a session scoped temp directory.

[pause:500ms]

<!-- p-12 -->
Third. The session ID and playlist URL are returned to the client.

[pause:500ms]

<!-- p-13 -->
The client hits the playlist URL. The HLS player pulls segments as they become available. The session ends when the client disconnects.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
Architecture.

[pause:400ms]

<!-- p-14 -->
At the top sits the Live Streaming Service. It creates sessions, tracks active ones, and cleans up on timeout.

[pause:500ms]

<!-- p-15 -->
Below that sits the live session, which holds session state, a cancellation token source, and playback position.

[pause:500ms]

<!-- p-16 -->
Below that, two components work in parallel. The runner spawns and monitors the ffmpeg process. The playlist builder reads the index m3u8 file and emits segment events.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-3 -->
What the ffmpeg command looks like.

[pause:400ms]

<!-- p-17 -->
A typical live transcode command combines CUDA hardware acceleration with H.264 NVENC output, 4 second HLS segments in event playlist mode, and a progress pipe for live status.

[pause:700ms]

What the command is actually doing: decode the stored file on the GPU, re-encode with H.264 NVENC at a target bitrate, mux into four second HLS segments in event playlist mode. That combination is what lets the client start watching within a segment or two of hitting play.

[pause:900ms]

<!-- p-18 -->
Notable details.

[pause:400ms]

<!-- p-19 -->
HLS playlist type event means the playlist grows as segments are written, with no rewrites. You get live style playback semantics even though the source is a finite file.

[pause:500ms]

<!-- p-20 -->
HLS time of 4 sets 4 second segments for low latency. Standard VOD HLS uses 6 seconds. Live transcode trades segment count for startup time, because the user is waiting for the first segment to be ready.

[pause:500ms]

<!-- p-21 -->
Dash g with 96 is the keyframe interval. At 24 frames per second, that is exactly 4 seconds. Aligned with the segment boundary so every segment starts on a keyframe.

[pause:500ms]

<!-- p-22 -->
Dash progress pipe gives structured progress output, which the runner parses to compute percent complete, current frames per second, and current encode speed.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-4 -->
Session lifecycle.

[pause:400ms]

<!-- p-23 -->
Five steps run in sequence.

[pause:400ms]

<!-- p-24 -->
Create. Client POSTs to sessions. The server creates the session, spawns ffmpeg, and returns the session ID.

[pause:500ms]

<!-- p-25 -->
Active. Client sends GET requests for the playlist and for each segment. Each segment becomes available as ffmpeg writes it. The playlist is served fresh on each request. The client polls at a rate the player decides.

[pause:500ms]

<!-- p-26 -->
Position updates, optional. Client POSTs to the position endpoint periodically. These report playback position for pause and resume support.

[pause:1000ms]

<!-- p-27 -->
Teardown. Client DELETEs the session when done.

[pause:800ms]

<!-- p-28 -->
The server cancels the ffmpeg process and cleans up the temp directory.

[pause:500ms]

<!-- p-29 -->
Ended. The session transitions to ended. Its row stays in the sessions table for a short time for dashboard display, then is purged.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-5 -->
Cancellation.

[pause:400ms]

<!-- p-30 -->
Client disconnects. Browser tab closes. Player quits. Client calls DELETE. The live session's dispose method runs. The runner's cancellation token fires. The ffmpeg process is killed. The temp directory is deleted.

[pause:500ms]

<!-- p-31 -->
Ghost sessions, where the client crashed without calling DELETE, get cleaned up by the session manager after an idle timeout. Default five minutes of no playlist or segment requests.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-6 -->
Buffer management.

[pause:400ms]

<!-- p-32 -->
The buffer manager watches the client's playback position versus the segments already generated. It emits buffer action events to ffmpeg. Thresholds. If the buffer is more than 30 seconds ahead, suspend the encode. If it drops below 15 seconds after a suspend, resume. If it is less than 5 seconds ahead, drop quality. If less than 3 seconds, emergency drop to the lowest variant.

[pause:1400ms]

<!-- p-33 -->
Suspend fires when the user has been pausing to read subtitles or left the tab in the background. Resume fires when the buffer drops. Drop quality fires when the buffer is thin. The runner switches the variant so segments produce faster.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-7 -->
Seek handling.

[pause:400ms]

<!-- p-34 -->
HLS segments are sequential. When a client seeks, the current live session cannot jump ahead. It is either already encoded past that point, or not yet reached it.

[pause:500ms]

<!-- p-35 -->
Current behaviour. A seek closes the session and creates a new one from the seek timestamp. Session creation is fast. ffmpeg spawn is about a second on a decent box, plus one segment's worth of encode time before the client can start playing. So the user experience is a brief pause and then a new stream continues.

[pause:500ms]

<!-- p-36 -->
Future work on the roadmap. Transparent seek within an existing session by repositioning the ffmpeg input. Not shipped yet.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-8 -->
Concurrent sessions.

[pause:400ms]

<!-- p-37 -->
Each session is an ffmpeg process. GPU encoders have concurrent session limits per card, imposed by the hardware vendor. The encoder detects the cap at runtime from the GPU driver and refuses new sessions above it. A clear error tells the user the GPU is saturated and suggests waiting or falling back to software.

[pause:2000ms]

<!-- p-38 -->
CPU sessions do not have hard limits. The dispatcher just gets slower as the CPU saturates. If a session starts to lag, the buffer manager drops quality to keep up.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-9 -->
Where the live cache lives.

[pause:400ms]

<!-- p-39 -->
Live session output goes into a configurable cache path. The default lives in the OS temp directory. Each session gets its own folder, named with the session ID.

[pause:1600ms]

<!-- p-40 -->
On session end, the folder is deleted. On server restart, any leftover folders get swept. Sessions do not persist across restarts, so the folders are orphaned.

[pause:500ms]

<!-- p-41 -->
The cache path is configurable. Put it on a fast SSD. Segments are written and read aggressively during playback.

[pause:1000ms]

[narrator:matter-of-fact]

<!-- h-10 -->
How this differs from file encoding.

[pause:400ms]

<!-- p-42 -->
Live transcode and file encoding share the encoding strategy and the ffmpeg execution layer. But live differs in three ways.

[pause:500ms]

<!-- p-43 -->
Live has no finalize stage. There is no stitching, no master playlist cleanup. Event playlists are the final form.

[pause:500ms]

<!-- p-44 -->
Live has no checkpoints. Resume is not meaningful for a session tied to a live client.

[pause:500ms]

<!-- p-45 -->
Live skips the full analyze stage. The client already declared what it wants. The planner takes a shortcut and uses the capabilities block directly instead of doing a full source analysis.

[pause:500ms]

<!-- p-46 -->
The live specific code lives in its own namespace inside the encoder. It runs in the same server process as file encoding. Sessions compete for the same GPU and CPU budget. The session manager arbitrates.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-11 -->
What the next page covers.

[pause:400ms]

<!-- p-47 -->
Live transcode closes the gap between what you stored and what you are watching on. But what about the input side of the library? How does a movie get into your library in the first place? Part nine covers disc ripping.

[pause:1000ms]
