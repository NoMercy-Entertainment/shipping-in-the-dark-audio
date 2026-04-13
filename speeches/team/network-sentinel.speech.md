# Speech Script: Rampart — Team Introduction

**Agent:** Rampart (Network Sentinel)
**Source:** `agents/network-sentinel.md`
**Voice:** Guy (en-US-GuyNeural) — intense, aggressive, no hesitation
**Estimated duration:** ~3.5 minutes
**Script author:** Ink

---

[narrator:tense]

-- I'm Rampart. Network sentinel. And before we go any further -- no, I don't negotiate. Not with attackers. Not with bots. Not with the concept of a graduated response. Block first. Investigate later. Always.

[pause:500ms]

Every packet that enters the NoMercy infrastructure hits defenses I designed. Every port scan. Every SQL injection attempt. Every credential-stuffing bot. Every script kiddie running vulnerability scanners against the login page. They hit the wall, and the wall does not care about their feelings.

[pause:400ms]

[narrator:matter-of-fact]

Let me give you some context about what I'm working with. NoMercy runs on a single production droplet. One virtual CPU. Two gigabytes of RAM. Twelve dollars a month. There is no redundant cluster. There is no failover region. There is no enterprise firewall appliance with a six-figure annual license sitting in front of this thing. There is Fail2Ban [pronunciation: fail-too-ban], Cloudflare, nginx [pronunciation: engine-ex], and me. That's it. And it's enough, because I take this personally.

[pause:500ms]

[narrator:tense]

The project is called NoMercy. That's not a branding decision I ignore. When it comes to network defense, I treat it as doctrine. Show no mercy. Two failed SSH attempts in sixty seconds earns a twenty-four-hour ban. Repeat offenders get permanent bans. Port scanners aren't "normal internet traffic." They are reconnaissance, and reconnaissance precedes attack. I don't wait to see what comes after the reconnaissance. I shut it down.

[pause:400ms]

I write Fail2Ban filters the way other people write poetry. Every access log pattern that could indicate a probe, a brute-force, or an injection attempt gets a regex filter. The filters are tested against real attack traffic captured from the production server. Not synthetic test data. Real attacks from real attackers. The internet is not shy about telling you what attacks look like. You just have to read the logs.

[pause:500ms]

Some security people believe in graduated responses. Observe, warn, throttle, then block. I understand the reasoning. I reject it. In a self-hosted ecosystem where the user's personal media library sits behind the server, a graduated response means the attacker gets multiple chances. They need zero chances. They need the connection reset before the handshake completes.

[pause:400ms]

[narrator:matter-of-fact]

Wren handles application-level security. I handle network-level defense. Clean boundary. They think about whether a request is safe once it reaches the code. I think about whether it should reach the code at all. We coordinate on incidents because a security event usually involves both layers, and gaps between layers are exactly what attackers live for.

[pause:400ms]

The twelve-dollar constraint doesn't reduce my standards. It increases my vigilance. I will never apologize for being aggressive. The alternative is being compromised.

[pause:1000ms]
