# Speech Script: Overview — Why we built our own player

**Part:** Overview (0 of 7)
**Source:** `reports/the-player-you-can-overrule/00-overview.md`
**Narrator:** Aria (en-US-AriaNeural) by default, overridden to Guy for male voice generation
**Script author:** Echo

---

[narrator:matter-of-fact]

<!-- title -->
NoMercy. The Player You Can Overrule.

[pause:700ms]

[narrator:reflective]

<!-- standfirst -->
A deep report on the web player trio. What it is, why it exists, what it lets you build, and how far every decision in it can be overruled without forking anything.

[pause:1200ms]

[narrator:cozy]

<!-- part-title -->
Overview. Why we built our own player.

[pause:900ms]

[narrator:reflective]

<!-- p-1 -->
Every media application eventually has the same argument with its video player.

[pause:500ms]

<!-- p-2 -->
You want the player to do something slightly unusual. Fade the volume down over two seconds instead of dropping it. Ask the server before you allow a seek. Send the play button to a television in the next room instead of the speakers in front of you. Show your own progress bar, in your own colours, with your own hover preview.

[pause:500ms]

<!-- p-3 -->
And the player says no.

[pause:400ms]

<!-- p-4 -->
Not with an error. Players almost never say no with an error. They say no by having no opinion you can reach. The method you need is private. The event you need fires after the thing already happened. The button you want to move is drawn by a stylesheet you cannot override without a selector war. The behaviour you want to replace is welded to the behaviour you want to keep.

[pause:600ms]

<!-- p-5 -->
So you do what everyone does. You wrap it. You write a layer that watches the player from outside and tries to keep a second copy of the truth in sync with the first. That layer grows. It becomes the largest file in your codebase, and every bug in it is a timing bug, and every timing bug takes a day.

[pause:600ms]

[narrator:matter-of-fact]

<!-- p-6 -->
We have written that wrapper. More than once. The NoMercy player trio exists so we never have to write it again, and so nobody using our libraries has to write it either.

[pause:900ms]

[narrator:cozy]

<!-- h-1 -->
What this report covers.

[pause:400ms]

<!-- p-7 -->
This is a tour of three npm packages and the ideas underneath them. It answers four questions, in order.

[pause:400ms]

<!-- p-8 -->
First: what the trio is.

[pause:400ms]

<!-- p-9 -->
Second: why it exists at all, when good players already exist.

[pause:400ms]

<!-- p-10 -->
Third: what it lets you build that you could not build before.

[pause:400ms]

<!-- p-11 -->
Fourth: how far you can bend it before it breaks.

[pause:600ms]

<!-- p-12 -->
The last question gets the most room, because it is the point. Anyone can ship a player. The interesting question is what happens when a developer wants something the authors never imagined, which is most of the time, and which is the moment almost every library fails.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
The short answer.

[pause:400ms]

<!-- p-13 -->
There are three packages.

[pause:400ms]

<!-- p-14 -->
nomercy-player-core is the shared foundation. It knows about playlists, events, plugins, state, and lifecycles. It does not know what a video is.

[pause:400ms]

<!-- p-15 -->
nomercy-video-player adds the things only video needs. Subtitles, quality levels, fullscreen, a picture on a screen.

[pause:400ms]

<!-- p-16 -->
nomercy-music-player adds the things only audio needs. Crossfading, gapless playback, queues that behave the way listeners expect rather than the way playlists are stored.

[pause:600ms]

<!-- p-17 -->
The version two line has been stable since the eighteenth of July this year. It went out at 2.0.1 rather than 2.0.0, for a reason that is a story in its own right, and not this one.

[pause:900ms]

<!-- p-18 -->
They are headless. That word does a lot of work here, and it is the second thing this report explains, so hold it lightly for now. The short version is that the trio ships behaviour and leaves appearance to you, which sounds like less, and is considerably more.

[pause:900ms]

[narrator:reflective]

<!-- h-3 -->
The rule that shaped everything.

[pause:400ms]

<!-- p-19 -->
There is one design rule in this project that explains most of the decisions in this report. It comes from Stoney, who owns NoMercy, and he wrote it down in July, while we were arguing about how strictly the libraries should enforce their own conventions.

[pause:600ms]

<!-- p-20 -->
My goal is to have all player enforce the rules, by providing guidance and steering, by telling them that this is not the right way, or better, do that. But never to prevent the user from doing it anyway, because they want to.

[pause:700ms]

<!-- p-21 -->
Read that twice, because the second half is unusual. Most libraries treat a developer doing something unexpected as a failure to be blocked. This one treats it as information. If somebody reaches past the recommended path, the library's job is to say so clearly, and then get out of the way.

[pause:600ms]

<!-- p-22 -->
That single sentence is why there is not one final class, one sealed method, or one thrown exception guarding an override anywhere in the trio. It is why the conventions live in a linter rather than in the type system. And it is why a plugin can cancel, delay, or completely replace almost anything the player was about to do.

[pause:600ms]

<!-- p-23 -->
The rest of this report is mostly the consequences of that sentence.

[pause:900ms]
