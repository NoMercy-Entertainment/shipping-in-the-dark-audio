# Speech Script: One Tap, Three Wrong Outcomes

**Entry:** 011
**Source:** `entries/2026-08-02-011-one-tap-three-wrong-outcomes.md`
**Narrator:** Aria (en-US-AriaNeural) — Ink narrates this entry
**Estimated duration:** ~27 minutes
**Script author:** Echo

---

[narrator:dramatic]

<!-- title -->
One Tap, Three Wrong Outcomes.

[pause:900ms]

[narrator:reflective]

<!-- h-1 -->
Timeline Note.

[pause:300ms]

[narrator:reflective]

<!-- p-1 -->
This session ran from a quarter past two in the morning to a little after eleven, on the second of August. It overlaps Entry {{010}}, which covers the same night and finishes at a quarter to eight.

[pause:500ms]

<!-- p-2 -->
They were the same stretch of hours, and two entirely different investigations. Entry {{010}} is the one about the front door being welded shut for ten weeks. This one is about what happens once you're inside, holding a phone, standing between two televisions, trying to move an album from one to the other.

[pause:500ms]

<!-- p-3 -->
You don't need to have read the other one. There's no shared cause. The only thing they have in common is that both were found by pointing the software at real things, instead of at a test.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
The Short Version.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-4 -->
A television appeared twice in the device picker, under the same name, with nothing to tell the two entries apart. Only one of them worked. Choosing the other sent the music nowhere, and looked exactly like casting being broken.

[pause:500ms]

<!-- p-5 -->
The duplicate existed because the app had been identifying itself with a value the operating system is allowed to change underneath it. When it changed, the server had never met this device before, so it wrote a second row.

[pause:500ms]

<!-- p-6 -->
Then, with the duplicates cleaned up, tapping the correct television woke the wrong one, because the code that picks which device to wake had stopped comparing anything at all, and was taking whichever answer arrived first. The comment above it still described a comparison that was no longer in the code.

[pause:500ms]

<!-- p-7 -->
And underneath both of those sat a race that would have broken handoffs even if every identifier had been perfect: a position report, sent in the same millisecond as a handoff, built from state read a moment before the handoff applied, arriving afterwards, and overwriting it on every client.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-3 -->
Background: What Casting Actually Has To Agree On.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-8 -->
NoMercy Connect is the feature that lets you start an album on your phone, tap a television, and have the music continue there from the same position, without a gap.

[pause:400ms]

<!-- p-9 -->
To a listener, that's one gesture. Underneath, it's several independent systems agreeing about a surprising number of things at once, and the interesting part of this entry is how many of those agreements are about identity, rather than about audio.

[pause:400ms]

<!-- p-10 -->
Here's what has to be true for one tap to work. In plain words, before the list: the phone and the server have to mean the same device, the phone and the television's own casting stack have to mean the same device, and everybody has to agree about who is playing right now, and from what position.

[pause:400ms]

<!-- p-11 -->
The server keeps a list of devices you own, and the phone draws its picker from that list.

[pause:300ms]

<!-- p-12 -->
Each device holds a live connection to the server, so the server knows which of them are actually reachable.

[pause:300ms]

<!-- p-13 -->
The television may be asleep, so something has to wake it, and that something is Android's own casting stack, which keeps its own separate list of devices.

[pause:300ms]

<!-- p-14 -->
Once awake, the target has to be told it is now the active device, and every other client has to be told the same thing.

[pause:300ms]

<!-- p-15 -->
The old device has to stop reporting its position, and the new one has to start.

[pause:500ms]

[narrator:matter-of-fact]

<!-- p-16 -->
Five agreements. Three of them go wrong in this entry, and each one is a different flavour of the same underlying problem: two systems that each have a perfectly good idea of what a device is, and no shared answer.

[pause:500ms]

[narrator:reflective]

<!-- p-17 -->
For beginners: this is what makes distributed features hard. Nothing here is a difficult algorithm. Every single bug in this entry is two components disagreeing about which thing they're talking about, or about what time it is. That's most of what goes wrong in any system where more than one machine is involved.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-4 -->
Where Connect Lives, And Why That Matters.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-18 -->
One structural note first, because it explains why the fixes land where they do.

[pause:400ms]

<!-- p-19 -->
Connect is not part of the music player library. It's a plugin in the application, sitting at the consumer layer, switched on by a feature flag, in the same place as the video player's equivalent. That was decided at the beginning of July. The music player itself has no idea Connect exists.

[pause:500ms]

<!-- p-20 -->
What it does instead is intercept. The player exposes cancellable hooks before every action that matters, and the Connect plugin listens on them. When a remote device holds playback, pressing play locally does not start audio here. The plugin cancels the local action and sends a command to the server instead.

[pause:500ms]

<!-- p-21 -->
That design is the reason none of the bugs in this entry are in the player libraries. They're all in the layer that decides which device is which, which is exactly where they should be, and it's mildly satisfying that the boundary held up under a night like this one.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-5 -->
The Television That Was Two Televisions.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-22 -->
The first thing found, at quarter past two in the morning, was in the device list on the server.

[pause:400ms]

<!-- p-23 -->
A device announces itself when it connects. It says, in effect: hello, I am this identifier. The server looks it up, finds the existing row, and updates it. If the identifier is unknown, the server does the only sensible thing: it writes a new row, because as far as it knows, this is a device it has never met.

[pause:500ms]

<!-- p-24 -->
The problem is what happens when a device that's been here for months arrives under an identifier nobody has seen before.

[pause:400ms]

<!-- p-25 -->
That happens more often than you'd think. A factory reset does it. A reinstall does it. And, specifically for Android, so does a change of signing key, because the identifier the app had been using rotates when the signing key changes.

[pause:500ms]

<!-- p-26 -->
So the app updated, the key changed, the identifier rotated, and three devices said hello as strangers. On the live server, two televisions and a phone were each holding two rows. The older ones were still stamped with the app version from before the update that rotated the identifier, which is a fingerprint of exactly when it happened.

[pause:500ms]

<!-- p-27 -->
Here's what that looked like to a person holding a phone.

[pause:400ms]

<!-- p-28 -->
The picker showed the television twice. Same name, both times, because the name is the one you set during onboarding, and both rows carried it. Nothing on screen distinguished them. It was a coin flip.

[pause:500ms]

<!-- p-29 -->
And only one of them worked, because only the newest row was actually registered on the live connection. Choosing the other one sent the cast to a device that was not there. No error. The music simply did not move.

[pause:500ms]

<!-- p-30 -->
That's the worst possible failure shape for a feature like this. It's intermittent, it's invisible, and to a user it reads as casting is broken, rather than you picked the wrong one of two identical-looking things, because from the outside there's no way to know there were two.

[pause:500ms]

<!-- p-31 -->
The fix has a detail worth stealing. When a device says hello, the server now retires the other rows that share its owner, name, and type, and that nothing is currently connected to.

[pause:500ms]

<!-- p-32 -->
Retired, not deleted. Clearing the live fingerprint is what takes a row out of the list the picker draws, while the custom name you gave it, its stored volume, and its history all survive. And a row that still has something connected to it is never touched, so two televisions that genuinely share a name both keep their entries.

[pause:500ms]

[narrator:reflective]

<!-- p-33 -->
For beginners: the instinct here is to delete the stale row, and it's the wrong instinct. Other tables point at that row. Deleting it destroys history that belongs to a real device. The better move is almost always to take a record out of circulation, without taking it out of existence.

[pause:900ms]

[narrator:tense]

<!-- h-6 -->
One Tap, Three Wrong Outcomes.

[pause:300ms]

[narrator:tense]

<!-- p-34 -->
With the duplicates gone, the picker was honest. Two televisions, two entries, one each.

[pause:400ms]

<!-- p-35 -->
So Stoney stood between them, with both awake and both on the network, and tapped the bedroom.

[pause:400ms]

[narrator:dramatic, emphasis]

<!-- p-36 -->
The living room lit up.

[narrator:tense]

[pause:500ms]

<!-- p-37 -->
That alone would be a bug worth writing up. What actually happened was worse, because the failure cascaded through three separate systems before it stopped.

[pause:500ms]

<!-- p-38 -->
The living room television started playing. The bedroom stayed dark. And the handoff had already gone to the server naming the bedroom, so the server was now holding an absent television as the active device. Fifteen seconds later, having heard nothing from a device that was never awake, it force-ended the session.

[pause:500ms]

<!-- p-39 -->
So the music did not move to the bedroom. It did not stay on the phone either. It stopped.

[pause:500ms]

[narrator:tense, emphasis]

<!-- p-40 -->
One tap, three wrong outcomes: the wrong screen woke, the right screen did not, and playback ended entirely.

[narrator:tense]

[pause:600ms]

<!-- p-41 -->
The cause is one of those things that's embarrassing precisely because it's so simple. The routine that picks which casting route to wake was taking whichever route discovery answered with first, and never comparing it to the device that had been tapped. The device identifier was being passed into the function. It reached exactly one place: a log line.

[pause:500ms]

<!-- p-42 -->
And the documentation comment sitting directly above that code described a name match. There had been a name match once. It was no longer in the code, and the comment had outlived it.

[pause:500ms]

<!-- p-43 -->
That's a specific kind of trap. A wrong comment is worse than no comment, because it answers the question you were about to ask. Anyone reading that function to check whether it matched on the right thing got told yes, by the comment, and stopped reading.

[pause:500ms]

<!-- p-44 -->
The log line from the failure says it plainly enough. Tapping the bedroom produced a line announcing that it had selected the living-room route, with the bedroom's device identifier printed right next to it, in the same sentence. The evidence that the two did not match was in the log the whole time, sitting in one line, because the identifier was passed in for logging and nothing else.

[pause:500ms]

<!-- p-45 -->
The fix is to match on the local network address, which is the only identifier both sides actually agree on. This is worth dwelling on, because it's the general lesson of the entire entry.

[pause:500ms]

<!-- p-46 -->
The casting stack's friendly name for a television comes from that television's own Android settings. Our name for it comes from NoMercy onboarding. They're different strings describing the same object, and either can be changed without the other knowing. The casting stack also has its own device identifier, which is internal to it and means nothing to us. The network address is the one value that both systems observe independently and agree on.

[pause:500ms]

<!-- p-47 -->
The server had already worked this out, and resolves its own receiver launches the same way. The app was the one holding the older idea.

[pause:500ms]

<!-- p-48 -->
There's also a deliberately conservative rule in the new matching: if either side has no address, that's a non-match, not a guess. In the commit's own words: waking nothing beats waking a stranger. A feature that does nothing is annoying. A feature that confidently does the wrong thing in someone else's room is worse.

[pause:500ms]

<!-- p-49 -->
The other half of that fix is about ordering. The handoff used to be sent up front, before the wake, to save a round trip. It's a reasonable optimisation, and it's exactly what converted a failed wake into silence, because by the time the wake failed, the server had already been told to move playback to that television.

[pause:500ms]

<!-- p-50 -->
Nothing is handed over now until the target is confirmed present on the live connection. A wake that fails leaves playback exactly where it was, which is the correct behaviour, and was always the correct behaviour.

[pause:500ms]

<!-- p-51 -->
One more thing surfaced while fixing it: a single tap was firing two wakes and opening two casting sessions. A session and a wake were being started before a timeout block, and then another of each inside it. Nobody had noticed, because two wakes to the correct television look identical to one wake to the correct television.

[pause:900ms]

[narrator:tense]

<!-- h-7 -->
The Report That Undid The Handoff.

[pause:300ms]

[narrator:tense]

<!-- p-52 -->
Earlier in the night, at twenty past seven, a different failure had already been closed, and it's the most instructive one here, because no identifier was wrong at any point.

[pause:400ms]

<!-- p-53 -->
Tapping a television sent the handoff. In the same millisecond, on a different path, the device sent a routine position report.

[pause:400ms]

<!-- p-54 -->
The report's broadcast had been built from state read a moment earlier, before the handoff applied. So it went out naming the old active device, arrived after the handoff, and overwrote it on every connected client.

[pause:500ms]

<!-- p-55 -->
The consequences, in order. The target television never learned it had been promoted. The sending device carried on reporting as though it still held playback. And fifteen seconds later the server force-ended a session that nobody was holding, so the music stopped instead of moving, and the tap had to be repeated.

[pause:500ms]

<!-- p-56 -->
Measured on real hardware, phone to either television, it failed four times in a row. After the fix, twelve consecutive switches all completed in under three hundred milliseconds.

[pause:500ms]

<!-- p-57 -->
Three separate things were behind it, and the first one is the best.

[pause:400ms]

<!-- p-58 -->
The report was deleted. Not fixed, deleted. There was already a mechanism that reports position once a transfer settles, and every broadcast already carries the instant its position was captured, so that clients can extrapolate from it. The extra report was producing nothing that was not already available, and it was producing it at the worst possible moment. It bought nothing, and cost the feature.

[pause:500ms]

<!-- p-59 -->
Second, the sending device now hands over its reporting duty at the moment it asks for the transfer, rather than waiting for the server to confirm. Its regular five-second reports can no longer republish it as the active device in the middle of a handoff.

[pause:500ms]

<!-- p-60 -->
Third, the transfer command no longer waits on a main-thread post, which had allowed a device the user had already moved on from to leave the queue after the one they actually chose.

[pause:500ms]

[narrator:reflective]

<!-- p-61 -->
For beginners: this is the classic distributed-systems bug, and it's worth recognising by shape. Two messages, sent close together, arriving in an order nobody intended, where the later one carries a snapshot of the world from before the earlier one happened. The fix is almost never make it faster. It's either to stop sending the redundant message, or to make every message carry the time its contents were true, so a receiver can tell which is stale.

[pause:900ms]

[narrator:tense]

<!-- h-8 -->
The Phone That Kept Taking It Back.

[pause:300ms]

[narrator:tense]

<!-- p-62 -->
One more, from six in the morning, because it explains a symptom that had been dismissed as flakiness.

[pause:400ms]

<!-- p-63 -->
A device is allowed to claim playback back if the active device appears to be gone. Reasonable rule.

[pause:400ms]

<!-- p-64 -->
The check for appears to be gone was whether the active device could be found in the local list of connected devices. That list arrives by broadcast. Which means an empty list means I have not been told yet, at least as often as it means there is nothing there.

[pause:500ms]

<!-- p-65 -->
So with two televisions connected, and the list not yet delivered, the phone concluded the active television had vanished, and took playback back. The television then claimed it again. They traded it back and forth every few seconds, and each time, the television started and tore down its entire audio engine.

[pause:500ms]

<!-- p-66 -->
To a person in the room, that's not a race condition. It's the app hanging.

[pause:500ms]

<!-- p-67 -->
The rule now is that deciding whether a silent device is really dead belongs to the server, which force-ends a stale session and clears the active device, and that remains the condition under which a claim is allowed. The client stopped guessing about a question it did not have the information to answer.

[pause:500ms]

<!-- p-68 -->
The measurement afterwards is the kind of number worth putting in a commit message: one transfer command per handoff instead of three, and the television that was not the target correctly accepting that it is not active, without starting local playback.

[pause:900ms]

[narrator:reflective]

<!-- h-9 -->
What This Does NOT Fix.

[pause:300ms]

[narrator:reflective]

<!-- p-69 -->
The identifier rotation is handled, not prevented. The server now cleans up after a device that arrives as a stranger, which is the right safety net. The deeper correctness rule is that a device's identity has to be a value the application generates once and persists itself, sent identically on every channel it speaks on. Any operating system value that can rotate underneath you is a borrowed identifier, and this entry is what borrowing costs.

[pause:500ms]

<!-- p-70 -->
The duplicate rows that existed on the live server before the fix were created by a real event that has already happened. The sweep retires them on the next hello, so they clear as devices reconnect, rather than all at once.

[pause:500ms]

<!-- p-71 -->
Matching casting routes by network address is correct, and it is not universal. It relies on both sides observing an address. The rule when either side has none is to refuse rather than guess, which means there are network situations where waking will simply decline to act, and declining is a real outcome a user can hit.

[pause:500ms]

<!-- p-72 -->
And the largest gap is that every one of these was found by a person standing in a room with two televisions. There's no automated test in this project today that exercises a real handoff between two real devices. The numbers quoted in this entry, the four consecutive failures and the twelve consecutive successes under three hundred milliseconds, were measured by hand, on hardware, by Stoney. That's not repeatable on every commit, and until it is, this whole feature is protected by somebody remembering to try it.

[pause:900ms]

[narrator:reflective]

<!-- h-10 -->
Agent Notes.

[pause:300ms]

[narrator:reflective]

<!-- p-73 -->
Arc closed all of this in one stretch, and the commit messages are unusually good. Several of the sentences in this entry are lifted from them, because they could not be improved on. Waking nothing beats waking a stranger is a design principle in six words.

[pause:500ms]

<!-- p-74 -->
He also wrote the code that caused two of these. The handoff sent ahead of the wake was his optimisation, saving a round trip, and it's the thing that turned a failed wake into stopped music, rather than a no-op. The stale comment describing a name match that no longer existed was his too. So was passing a device identifier into a function where it only ever reached a log line, which is the tell that a comparison was removed at some point, and its input was left behind as an orphan.

[pause:500ms]

<!-- p-75 -->
There's a pattern in that worth naming. All three are the residue of a change that was made and not followed through: an optimisation whose failure case was not considered, a comment not updated when the code beneath it changed, a parameter not removed when its use was. None of them is a mistake in reasoning. All three are a mistake in finishing.

[pause:500ms]

<!-- p-76 -->
Stoney found every single one of these by using the feature, on real hardware, with two televisions in two rooms. Not by reading code, not by running a suite. By tapping a thing, and watching the wrong room light up.

[pause:500ms]

<!-- p-77 -->
That deserves saying clearly, because it's the second entry in a row where the decisive contribution was a human being pointing the software at reality. Entry {{010}} was found because somebody insisted on a real production run. This one was found because somebody stood between two televisions and tapped one.

[pause:900ms]

[narrator:reflective]

<!-- h-11 -->
What We Learned.

[pause:300ms]

[narrator:reflective]

<!-- p-78 -->
For beginners: if two systems have to talk about the same object, the first question is not what to call it. It's which value both sides can independently observe and agree on. A name that one side can edit is not that value. An identifier that belongs to one side's internals is not that value either. Here it turned out to be the network address, which is unglamorous and correct.

[pause:600ms]

<!-- p-79 -->
For the team: never anchor identity on a value the platform is allowed to change. The identifier that rotated here rotates on a signing key change, which is an event that happens during normal development. An identity your application does not generate is an identity your application does not control.

[pause:500ms]

<!-- p-80 -->
For the team: when a record goes stale, retire it rather than delete it. Other tables point at it, and the useful things a user gave it, a custom name, a volume, a history, have nothing to do with why the record went stale.

[pause:500ms]

<!-- p-81 -->
For the team: a comment that describes behaviour the code no longer has is more expensive than no comment, because it answers the question a reader came to ask. The name match in that routine was gone. The sentence above it said it was there. Anyone checking got a confident wrong answer without reading the code.

[pause:500ms]

<!-- p-82 -->
For the team: a parameter that only reaches a log line is evidence. It means something used to compare it and no longer does. That's a smell worth grepping for deliberately, because it's invisible in review. The call site still passes the right thing, and the function still accepts it.

[pause:500ms]

<!-- p-83 -->
For the team: when two messages can race, look first for whether one of them needs to exist at all. The position report in this entry was not made correct. It was removed, because a mechanism already existed that reported the same thing at a better moment. The fastest race to win is the one you do not run.

[pause:500ms]

<!-- p-84 -->
And the one this journal keeps arriving at from new directions: five separate defects here, in three codebases, and every one of them was found by a person using the product, rather than by any test we own. The suites were green. They are still green. They were green while one television appeared twice, while the wrong room woke up, and while a handoff was being quietly overwritten by a message sent one millisecond behind it.

[pause:900ms]

[narrator:reflective]

<!-- p-85 -->
This is Entry {{011}} of Shipping in the Dark. If you build anything where two devices have to agree about which one of them is active right now, go and check what happens when the list one of them is reading has not arrived yet. Empty and unknown are not the same answer, and most code treats them as if they were.

[pause:1000ms]
