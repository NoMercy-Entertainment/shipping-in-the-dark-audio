# Speech Script: Three packages and five layers

**Part:** 1 of 7

[narrator:cozy]

<!-- part-title -->
Part 1. Three packages and five layers.

[pause:900ms]

[narrator:reflective]

<!-- p-1 -->
The hardest question in this project is not technical. It is "where does this code go".

[pause:500ms]

<!-- p-2 -->
It comes up constantly. Somebody adds a feature and it could plausibly live in four places. Put it too low, and every consumer inherits an opinion they did not ask for. Put it too high, and three different applications write the same thing three times, slightly differently, and the bugs are all different too.

[pause:600ms]

<!-- p-3 -->
We lost this argument to ourselves for long enough that we eventually hired an agent whose entire job is answering it. Her name is Spine, she is the player architect, and the boundary she owns has five layers.

[pause:900ms]

[narrator:cozy]

<!-- h-1 -->
The five layers.

[pause:400ms]

<!-- p-4 -->
Here are the five layers, in plain words, from the bottom up. The bottom layer is the media server, which knows about your library and your account. Above it sits the shared core, nomercy-player-core, which knows nothing about NoMercy at all, only generic contracts. Above that sit the two players, nomercy-video-player and nomercy-music-player, each knowing only about its own medium. Above them sit built-in plugins, which ship with a player but stay off unless you opt in. And at the very top sit consumer plugins, written by the application itself, which are allowed to know anything they like.

[pause:900ms]

<!-- p-5 -->
The rule that makes this workable is the last layer. Anything NoMercy-specific lives in a consumer plugin. Not in core, not in the video player, not in a built-in. If it knows what a NoMercy account is, it lives in the application.

[pause:600ms]

<!-- p-6 -->
That rule has teeth, and the best proof is our own casting feature.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
Connect is a plugin, and that is deliberate.

[pause:400ms]

<!-- p-7 -->
NoMercy Connect is the feature that lets you start an album on your phone and move it to a television without missing a beat. It is one of the most NoMercy-shaped things we build. It talks to our server, over our hub, about our devices.

[pause:600ms]

<!-- p-8 -->
It would have been extremely easy to put it in the music player. It is, after all, a music feature, and the music player is where music features go.

[pause:600ms]

<!-- p-9 -->
We put it in the application instead. It is a consumer-layer plugin living in the web app beside the video player's equivalent, switched on by a feature flag, and the music player has no idea it exists.

[pause:600ms]

<!-- p-10 -->
The reason is a question we asked in July and could not answer well. What happens when somebody who is not us installs nomercy-music-player? They get a music player. If Connect lived in the library, they would also get a device-handoff system pointed at a server they do not run, wired to a protocol they cannot speak, that they cannot remove because it is welded to the volume control.

[pause:700ms]

<!-- p-11 -->
So Connect stayed outside. Which immediately raised a much better question, and one that turned out to be the most productive question in the whole version two cycle.

[pause:600ms]

<!-- p-12 -->
If casting lives outside the player, and casting has to intercept play, pause, seek, volume, mute, repeat, shuffle, playback rate, language, subtitle, and audio track, then what does a player have to expose for something outside it to intercept all of that?

[pause:600ms]

<!-- p-13 -->
The answer to that question is part four, and it is the heart of this report.

[pause:900ms]

[narrator:reflective]

<!-- h-3 -->
What the split bought.

[pause:400ms]

<!-- p-14 -->
Splitting core from the two players was not free. It cost a long sequence of release candidates, and a fair amount of arguing about which package a method belonged to.

[pause:600ms]

<!-- p-15 -->
What it bought is that the two players are genuinely the same player. The queue behaves identically. The event names are identical. A developer who learns the video player has already learned the music player, because the parts that differ are exactly the parts that should differ, and nothing else.

[pause:600ms]

<!-- p-16 -->
That symmetry is not an accident, and it is not maintained by discipline. It is checked. Two headless tools sit beside the libraries. One extracts every event name, payload, public method signature, and error code straight out of the source. The other runs behavioural scenarios against both real players through a shared harness. If music grows a method that video should have and does not, something says so.

[pause:600ms]

<!-- p-17 -->
Those two tools have their own story, and it is a slightly embarrassing one, so it gets its own section later.

[pause:900ms]
