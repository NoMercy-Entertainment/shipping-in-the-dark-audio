# Speech Script: Watching the content

**Part:** 6 of 11

[narrator:cozy]

Part 6. Watching the content.

[pause:900ms]

[narrator:reflective]

<!-- p-1 -->
Most encoders treat your video as an opaque blob of pixels. They encode the pixels. They are done.

[pause:500ms]

<!-- p-2 -->
This one can watch the content. It can detect what the video actually contains, and use what it finds to make better decisions. Smaller files, cleaner crops, skip intro buttons, text subtitles from bitmap sources, captions for a silent source.

[pause:500ms]

<!-- p-3 -->
Four analysis tools ship. Crop detection, intro and outro fingerprinting, subtitle optical character recognition, and speech transcription via Whisper.

[pause:500ms]

<!-- p-4 -->
Each one runs as a standalone building block. You can invoke them from the dashboard for spot checking. You can let subscribers run them automatically when a file lands in a library folder.

[pause:500ms]

<!-- p-5 -->
Let us walk through each.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-1 -->
Crop detection.

[pause:400ms]

<!-- p-6 -->
Problem. Many sources have black bars. A 2 point 40 to 1 movie in a 16 by 9 frame has thick black bars on top and bottom. A 4 by 3 archive in a 16 by 9 frame has black bars on the sides.

[pause:500ms]

<!-- p-7 -->
ffmpeg does not know the black bars are not part of the picture. It encodes them like any other pixels. The black bars waste encoding budget. The output looks awkward on non standard displays because the aspect ratio is wrong.

[pause:500ms]

<!-- p-8 -->
Solution. Run ffmpeg's crop detect filter against a sample of frames. It returns a rectangle describing the real picture area. The encoder uses the rectangle to crop the video before encoding.

[pause:500ms]

<!-- p-9 -->
The detection command pipes crop detect output into a frequency count to find the most common rectangle.

[pause:1800ms]

<!-- p-10 -->
crop detect outputs a per frame crop suggestion of width, height, X, and Y. The analysis takes the most frequent value across a sample window. Three minutes starting one minute in, by default. That sample is typically enough to get a stable answer while skipping opening logos.

[pause:500ms]

<!-- p-11 -->
The result record carries the detected rectangle plus a confidence score.

[pause:1600ms]

<!-- p-12 -->
You see this in the dashboard. If the detected rectangle matches the full frame, the should crop flag is false.

[pause:500ms]

<!-- p-13 -->
You can run crop detection manually via a POST endpoint.

[pause:1000ms]

<!-- p-14 -->
No encode runs, just the detection. Crop detection is ffmpeg bound, so it takes time proportional to the source. A 90 minute film takes roughly 30 to 60 seconds to crop detect on a decent box. The manual endpoint is gated to the server owner to prevent denial of service.

[pause:500ms]

<!-- p-15 -->
If you want crop detection to run automatically for every encode in a given profile, set auto detect crop to true in the profile. When the plan stage runs for that profile, it runs crop detection before building the filter chain, and the resulting crop rectangle becomes the first filter in the chain.

[pause:1200ms]

[narrator:matter-of-fact]

<!-- h-2 -->
Intro and outro fingerprinting.

[pause:400ms]

<!-- p-16 -->
Problem. TV shows have recurring intros. The first minute of every episode is the same opening theme, the same title card sequence. Viewers who binge a show end up skipping through the intro every episode. Or they watch it every time, which wastes their time.

[pause:500ms]

<!-- p-17 -->
Modern players can offer a skip intro button, but only if they know where the intro starts and ends. Usually that data is hand curated by a service like Netflix. A self hosted server needs to derive it automatically.

[pause:500ms]

<!-- p-18 -->
Solution. Audio fingerprinting with chromaprint, combined with shared prefix detection across episodes.

[pause:500ms]

<!-- p-19 -->
Chromaprint is the fingerprint format used by AcoustID for music identification. It generates a compact hash of the perceptual audio features, stable under re encoding, minor volume shifts, and other common distortions. A fingerprint is an array of 32 bit integers, roughly one per 0.124 seconds of audio.

[pause:500ms]

<!-- p-20 -->
The pipeline, per show.

[pause:400ms]

<!-- p-21 -->
First. For each episode, extract the first three minutes of audio at 16 kilohertz mono.

[pause:1200ms]

<!-- p-23 -->
Second. Fingerprint that audio with fpcalc.

[pause:1400ms]

<!-- p-26 -->
Third. For each pair of episodes, slide one fingerprint against the other and compute a Hamming distance similarity score at each offset.

[pause:500ms]

<!-- p-28 -->
Fourth. Cluster the pairs. The cluster with the most matching members is the intro. The start and end offsets within each episode come from the slide position of its best match.

[pause:500ms]

<!-- p-30 -->
The detector uses a sliding window Hamming distance match with a small tolerance window, about 10 seconds on either side, to handle cases where intros start at slightly different times. Episode A starts its intro at 15 seconds, episode B at 22 seconds. Same audio, different offsets. The detector clusters them together.

[pause:500ms]

<!-- p-31 -->
The output is an intro marker per episode. Start timestamp, end timestamp, confidence score 0 to 1, and a source flag so manual overrides are protected.

[pause:1400ms]

<!-- p-32 -->
The marker goes into the content segments table in the database. The player reads it and shows a skip intro button.

[pause:500ms]

<!-- p-33 -->
Outro detection is the mirror. Fingerprint the last three minutes of each episode. Look for the shared tail.

[pause:500ms]

<!-- p-34 -->
You can edit detected segments through the dashboard. If auto detection got the end of the intro slightly wrong, you nudge it. When you manually edit a segment, the source flips to manual, which tells the auto detector to leave it alone on the next run.

[pause:500ms]

<!-- p-35 -->
Like crop detection, fingerprinting is minutes of ffmpeg work per episode. Running it automatically on every episode in a large library takes hours. The intro detection subscriber runs it in the background, triggered by encoded episodes landing in a library folder. You do not wait for it.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-3 -->
Subtitle optical character recognition.

[pause:400ms]

<!-- p-36 -->
Problem. Blu Ray sources ship with PGS subtitles, which are bitmap subtitles. Each subtitle cue is a tiny image. Apple TV can render them. Most smart TVs can render them. Web players cannot. DASH and HLS playlists cannot carry bitmap subs.

[pause:500ms]

<!-- p-37 -->
To put PGS subtitles in an HLS playlist, you need to convert them to text. That means optical character recognition. Run an OCR engine against each subtitle frame and extract the text.

[pause:500ms]

<!-- p-38 -->
Solution. Tesseract, via a custom OCR subtitle encoder that ships as part of NoMercy's ffmpeg build. The journal entry "The Wrong Filename", entry 8, covers how this encoder was built.

[pause:500ms]

<!-- p-39 -->
The spot check endpoint accepts a video file ID, a stream index, and a language.

[pause:1400ms]

<!-- p-40 -->
Internally, this runs ffmpeg with the OCR subtitle encoder, a language flag, and an upscale factor.

[pause:1200ms]

<!-- p-41 -->
Tesseract needs trained data per language. English works out of the box. Adding a new language means downloading its trained data file. Managed through the dashboard.

[pause:1000ms]

<!-- p-42 -->
Available language codes include English, Japanese, simplified and traditional Chinese, Korean, French, German, Spanish, Italian, Portuguese, Russian, Dutch, Arabic, and Hindi. The trained data ends up under the configured Tesseract models directory.

[pause:500ms]

<!-- p-43 -->
One interesting implementation detail covered in entry 8. The OCR encoder uses a luminance weighted alpha composite before OCR instead of a naive grayscale. Subtitles are bright text on a transparent background. Naive grayscale produces low contrast images. Luminance weighted alpha composite produces high contrast black on white that Tesseract reads accurately. That single change took the OCR from "barely usable" to "production quality".

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-4 -->
Speech transcription with Whisper.

[pause:400ms]

<!-- p-44 -->
Problem. Some sources ship without subtitles at all. A foreign language documentary with no English subs. A home video you filmed on a phone. Manual transcription is hours of work per hour of content. Cloud transcription APIs require uploading your library to someone else, which defeats the point of self hosting.

[pause:500ms]

<!-- p-45 -->
Solution. Run Whisper locally. Whisper is OpenAI's speech recognition model, released as open weights. A C plus plus port called whisper dot c-p-p runs on consumer hardware without requiring a cloud service.

[pause:500ms]

<!-- p-46 -->
The endpoint.

[pause:300ms]

<!-- code-12 -->
It accepts a video file ID, an audio stream index, a language, an optional translate to English flag, and a model size.

[pause:1200ms]

<!-- p-47 -->
Internally, whisper is invoked against the first audio stream, after extracting the audio to 16 kilohertz mono.

[pause:1200ms]

<!-- p-48 -->
Whisper has five model sizes. Pick by the speed and accuracy trade off. Tiny is 75 megabytes and fast but only recognizes words in rough shape. Base is 150 megabytes and okay for clear speech. Small is 500 megabytes and good for most content. Medium is 1 point 5 gigabytes and near human on clean audio. Large V-3 is 3 gigabytes and the best available.

[pause:1400ms]

<!-- p-49 -->
Large V-3 is the recommended default. The smaller models miss specialized vocabulary. Show specific names, technical terms, proper nouns. All of that gets muddled. Only Large V-3 gets them reliably.

[pause:500ms]

<!-- p-50 -->
Whisper has an interesting bonus feature. Translate to English mode. You give it a Japanese audio track, ask for English subtitles with translate to English set to true, and it transcribes the Japanese and translates to English in one pass. Useful for anime and foreign content.

[pause:500ms]

<!-- p-51 -->
Whisper is slow. A 90 minute movie takes roughly 15 to 30 minutes to transcribe on a decent GPU. Longer on CPU. The encoder reports progress as a percentage so the dashboard can show it. The output WebVTT lands next to the source file.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-5 -->
How analysis feeds the pipeline.

[pause:400ms]

<!-- p-52 -->
These tools are standalone, but they really shine when combined with the rest of the pipeline.

[pause:500ms]

<!-- p-53 -->
Crop detection feeds the profile's filter chain. Intro and outro markers flow to players via the content segments table. OCR subtitles become sidecars in HLS and DASH outputs. Whisper transcriptions become sidecars too, for sources that had no subtitles.

[pause:500ms]

<!-- p-57 -->
Subscribers watch for events on the server's event bus. When an episode is scanned, the intro subscriber fires and runs fingerprinting. When a new file lands in a watched folder, the auto encode subscriber fires and starts an encode. When an encode completes, the OCR subscriber inspects the output's subtitle streams and runs OCR if needed.

[pause:500ms]

<!-- p-58 -->
The subscribers run in the background. They do not block anything. They just quietly improve the library over time.

[pause:900ms]
