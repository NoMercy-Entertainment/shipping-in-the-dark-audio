# Speech Script: The other end of the wire

**Part:** 11 of 13

[narrator:cozy]

<!-- part-title -->
Part 11. The other end of the wire.

[pause:900ms]

[narrator:matter-of-fact]

<!-- p-1 -->
Everything so far has been client side. Phones, televisions, browsers, and Google's SDKs. But NoMercy's cast and Connect features are not really Cast features. Cast wakes the hardware and then NoMercy's own protocol carries everything, and that protocol has a server on the other end of it.

[pause:500ms]

<!-- p-2 -->
The server had its own set of bugs, and they are a different species. They are contract bugs. Two pieces of software each holding a slightly different belief about what a message means, with no mechanism anywhere that would tell either of them they disagree.

[pause:900ms]

[narrator:serious]

<!-- h-1 -->
The release that was never implemented.

[pause:400ms]

<!-- p-3 -->
This is the one to remember.

[pause:600ms]

<!-- p-4 -->
The KMP client had been sending a device release command with an empty string as the device identifier. The intent is a graceful handover: I am giving up my claim as the active device, nobody owns it now.

[pause:500ms]

<!-- p-5 -->
The server's hub silently ignored any command with a null or empty device identifier.

[pause:600ms]

<!-- p-6 -->
So the graceful release had never worked. Not once, for however long the client had been sending it. There is no error in a log anywhere. No rejection came back. The client sent a message, the server received it, looked at it, decided it was malformed, and discarded it without comment. Both halves reported success.

[pause:600ms]

<!-- p-7 -->
We do not know how long it was broken, because there is no evidence of it being broken. That is the whole problem. A bug that produces no signal has no start date.

[pause:600ms]

<!-- p-8 -->
The generalisable form:

[pause:500ms]

[narrator:serious, emphasis]

<!-- p-9 -->
silently ignoring malformed input is worse than rejecting it loudly.

[pause:800ms]

[narrator:matter-of-fact]

<!-- p-10 -->
A rejection is a bug report that writes itself, delivered at the moment the mistake is made, to the person who made it. A silent no-op is a broken assumption that ships on both sides and waits for somebody to happen to test that exact edge case. Defensive input handling that swallows things feels safe and is actually a way of deferring your bugs into production.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
The server clobbering what the client remembered.

[pause:400ms]

<!-- p-11 -->
Late June. Every time a device reconnected, the server overwrote its persisted volume level using a value from a connect-time query parameter that was only ever intended as a display hint. The effect was that devices silently reset to the player's default of one hundred percent whenever they reconnected.

[pause:500ms]

<!-- p-12 -->
There is a general shape here that is easy to hit. A parameter gets added for one purpose, somebody downstream sees a field with the right name and the right type, and uses it as authoritative. Nothing about a query string tells you whether the value in it is a fact or a hint.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-3 -->
Volume, again, from a third direction.

[pause:400ms]

<!-- p-13 -->
The fourth of July. Handing playback from one device to another left the new device's volume untouched, so it inherited whatever the previous device happened to be set to. Move music from a phone at eighty percent to a television, and the television goes to eighty percent of its own scale, which is a different amount of noise entirely.

[pause:500ms]

<!-- p-14 -->
Every device has its own remembered level and its own idea of what a percentage means through its own amplifier. Handing over control should restore the receiving device's own level, not transplant the sender's.

[pause:500ms]

<!-- p-15 -->
That is the volume ownership rule from part six for the third time, at a third boundary. It keeps recurring because each boundary uses a different mechanism and there is nothing that connects them.

[pause:500ms]

<!-- p-16 -->
Found alongside it: a device identifier lookup that compared case sensitively, while every other comparison in the same hub was case insensitive. Any client that happened to send a differently cased identifier got a silent lookup miss. Same species as the empty string release. The comparison did not fail, it just did not match, and not matching produced nothing.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-4 -->
The verb that was not on the list.

[pause:400ms]

<!-- p-17 -->
Mid July. The server's cast control reverse proxy allowed only a subset of HTTP verbs.

[pause:500ms]

<!-- p-18 -->
The television's transport controls, play, pause, seek, are POST. Those worked. The television's selection endpoints, subtitle track, audio track, quality, playlist position, volume, are PATCH. Those were all silently rejected.

[pause:500ms]

<!-- p-19 -->
From a user's seat, this is a bizarre and specific experience. The web remote works. Play works, pause works, scrubbing works. You pick a subtitle track and nothing happens. Not an error. Just nothing. So you conclude the subtitle feature is broken, or your file has no subtitles, or you misunderstood the button, because everything around it is visibly fine.

[pause:500ms]

<!-- p-20 -->
A whole class of functionality was invisible because of a verb list.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-5 -->
Dialling the wrong address from inside the house.

[pause:400ms]

<!-- p-21 -->
The fourth of August. Two related routing bugs. Both the proxy and the cast launch path were dialling a television's public address, learned from the last time that television phoned home through the tunnel, instead of its actual address on the local network.

[pause:500ms]

<!-- p-22 -->
So a phone, sitting on the sofa, three metres from the television, on the same Wi-Fi, was sending its cast request out to the internet and back. Where it timed out, several seconds at a time, every attempt.

[pause:500ms]

<!-- p-23 -->
A device that reaches you through a tunnel gives you an address that is true for the tunnel and useless for the living room. If you record whatever address a device last connected from, you have recorded a fact about a path, not about a device.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-6 -->
A casing mismatch on the wire.

[pause:400ms]

<!-- p-24 -->
Also confirmed: some device related payloads emitted field names in a different casing convention from the rest of the A-P-I. The client looked for one spelling, the server sent another, and the field arrived as absent.

[pause:500ms]

<!-- p-25 -->
Not interesting on its own. Interesting as the fourth item in a list where every single entry is the same failure mode. A mismatch that produces absence rather than an error.

[pause:900ms]

[narrator:reflective]

<!-- h-7 -->
What ties these together.

[pause:400ms]

<!-- p-26 -->
Every server side bug in this part is silent. Empty identifier ignored. Case mismatch not matched. PATCH not allowed. Wrong field name, so nothing there. Wrong address, so a timeout instead of a refusal.

[pause:600ms]

<!-- p-27 -->
None of them threw. None of them logged. Every one of them shipped and lived, and each was found only when a human noticed a feature did not do what it looked like it should.

[pause:600ms]

<!-- p-28 -->
If you take one thing from this part into your own codebase, make the boundary loud. Reject what you do not understand, log what you discard, and treat "we handled that gracefully" as a claim that needs checking rather than a virtue.

[pause:900ms]
