# Speech Script: Headless, and why that is the whole point

**Part:** 2 of 7

[narrator:cozy]

<!-- part-title -->
Part 2. Headless, and why that is the whole point.

[pause:900ms]

[narrator:matter-of-fact]

<!-- p-1 -->
A headless player ships behaviour and no appearance.

[pause:500ms]

<!-- p-2 -->
It will load your media, decode it, manage a queue, track position, handle subtitles, expose every piece of state, and fire an event for everything that happens. It will not draw you a play button. It will not inject a stylesheet. It will not decide that the progress bar goes at the bottom.

[pause:600ms]

<!-- p-3 -->
If that sounds like extra work, it is, and it is worth being honest about the cost before explaining the benefit.

[pause:900ms]

[narrator:reflective]

<!-- h-1 -->
The cost, stated plainly.

[pause:400ms]

<!-- p-4 -->
When we migrated our own web application from version one to version two, a stream of things broke. Not subtly. Buttons vanished, keyboard shortcuts stopped working, styling that had always been there was simply gone.

[pause:600ms]

<!-- p-5 -->
Every single one of those reports had the same cause. Version one baked those behaviours in and injected its own CSS at runtime. Version two, being headless by design, leaves all of it to the consumer. Nothing was broken. Everything that disappeared was something version one had been doing for us silently, and version two expected us to ask for.

[pause:600ms]

<!-- p-6 -->
That is the real cost of headless, and there is no way around it. A headless player hands you a longer first day.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
What you get for that day.

[pause:400ms]

<!-- p-7 -->
You get a player that never fights you.

[pause:400ms]

<!-- p-8 -->
Consider what "the player draws its own controls" actually commits you to. The library now owns a piece of your screen. It has opinions about layout, about colour, about focus order, about what happens on a narrow window. Every one of those opinions is a thing you will eventually want to change, and every change is a negotiation with a stylesheet written by somebody who could not see your design.

[pause:600ms]

<!-- p-9 -->
The usual escape hatch is a theming API. Themes work until the day you want something the theme author did not anticipate, and then you are back to fighting selectors, except now you are also fighting a theme.

[pause:600ms]

<!-- p-10 -->
A headless player has no opinions to fight. The progress bar goes where you put it, because you drew it. The controls look the way your design system says, because they are your components. You are not overriding anything, so there is nothing to override you back.

[pause:900ms]

[narrator:cozy]

<!-- h-3 -->
The part that surprises people.

[pause:400ms]

<!-- p-11 -->
Headless does not mean you start from nothing.

[pause:400ms]

<!-- p-12 -->
The trio ships plugins in the box. Chrome, keyboard handling, subtitle rendering, media session integration, gesture handling, cast sending. They exist, they are maintained, and they are good. They are simply off unless you ask for them.

[pause:600ms]

<!-- p-13 -->
Stoney described the model he wanted back in May, and it is the line that settled the argument.

[pause:500ms]

<!-- p-14 -->
You know I love plugins we ship by default and let the user opt into them.

[pause:700ms]

<!-- p-15 -->
So the first day is longer than a batteries-included player, but it is much shorter than a from-scratch one. You register the plugins you want, you skip the ones you do not, and the ones you skip cost you nothing at runtime because they were never constructed.

[pause:600ms]

<!-- p-16 -->
And crucially, a shipped plugin is not privileged. It is written against exactly the same interfaces your own plugin gets. There is no private channel, no internal API that the built-ins use and you cannot. If our chrome plugin can do it, yours can too, which means "replace the built-in with my own" is a supported path rather than a fork.

[pause:600ms]

<!-- p-17 -->
That is what the next section is about.

[pause:900ms]
