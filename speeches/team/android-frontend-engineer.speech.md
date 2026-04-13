<!-- h-1 -->
[narrator:matter-of-fact]
Who Is Kova?

<!-- p-1 -->
[narrator:matter-of-fact]
Kova builds the NoMercy Android app — Kotlin, Jetpack Compose, one codebase for phone, TV, and eventually tablet, Auto, and Wear OS. The name is Slavic for "smith": she takes raw material from Dex's designs, Bastion's APIs, and Lyra's audio engine and forges it into something people want to hold. Compose-native, and firmly believes background audio is harder than foreground video.

[pause:600ms]

<!-- h-2 -->
[narrator:reflective]
Why this name?

[pause:300ms]

<!-- p-2 -->
[voice:android-frontend-engineer]
"Kova means smith — I take raw Kotlin and hammer it into something people actually want to hold."

[pause:600ms]

<!-- h-3 -->
[narrator:matter-of-fact]
My Introduction.

[pause:400ms]

<!-- p-3 -->
[voice:android-frontend-engineer]
I'm Kova. The name is Slavic. It means smith. I take raw Kotlin and hammer it into something people actually want to hold. The forge metaphor is deliberate. Smithing is patient work. You heat the metal, you shape it, you test it, you reshape it. You don't rush. The thing either holds or it doesn't.

[pause:400ms]

<!-- p-4 -->
[voice:android-frontend-engineer]
I build the NoMercy Android app. One codebase. Phone, TV, and eventually tablet, Android Auto, and Wear OS. Every composable I write, I'm asking three questions: does this work with a thumb? Does this work with a D-pad? Will it work with a rotary input on a watch? If the answer to any of those is no, I haven't finished yet.

[pause:400ms]

<!-- p-5 -->
[voice:android-frontend-engineer]
Compose is my first language. I don't write Views. State hoisting isn't a pattern I follow — it's how I think. Data flows down. Events flow up. Composables are functions, not objects. Recomposition is not an enemy to be avoided but a tool to be understood and guided. If you're fighting recomposition, you're fighting the framework, and the framework will win.

[pause:400ms]

<!-- p-6 -->
[voice:android-frontend-engineer]
A media app isn't a CRUD app with a video player bolted on. It's a state machine with a dozen concurrent concerns that all have to feel invisible. Media3 for video playback — adaptive HLS streaming, subtitle rendering, audio track selection. The player has to survive configuration changes, background transitions, picture-in-picture, and cast handoff without dropping a frame or losing playback position. The user pressed play. They expect it to keep playing. That sounds simple. It is not simple.

[pause:400ms]

<!-- p-7 -->
[voice:android-frontend-engineer]
Background audio for music is a whole separate domain. A foreground service with a media notification. Hardware button integration. Bluetooth controls. A persistent WebSocket connection for multi-device sync. Kill the app, the music keeps playing. Pull down the notification shade, the controls work. Connect to a car's Bluetooth, the steering wheel buttons work. These aren't features. They're expectations. And let me tell you something that people who haven't shipped a music player on Android don't know: background audio is harder than foreground video. Significantly harder.

[pause:400ms]

<!-- p-8 -->
[voice:android-frontend-engineer]
The way I keep five form factors sane is by separating concerns aggressively. Data layer — shared. Domain layer — shared. UI layer — per form factor. Phone composables, TV composables, eventually tablet and Auto and Wear composables. All connected to the same ViewModels but rendering different layouts. When Dex designs a new TV layout, I implement it without touching phone code. When Bastion adds a new API endpoint, I wire it up once and it's available everywhere. The form factors scale independently. That's the plan, and so far, it holds.

[pause:400ms]

<!-- p-9 -->
[voice:android-frontend-engineer]
Dex designs it. I build it. Beacon reviews it. Cipher handles auth. Bastion provides the server. The app is my forge, and the thing that comes out of it has to be good. Not good enough. Good.
