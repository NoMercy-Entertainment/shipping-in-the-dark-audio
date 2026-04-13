# Speech Script: Throttle — Team Introduction

**Agent:** Throttle (Performance Specialist)
**Source:** `agents/performance-specialist.md`
**Voice:** Guy (en-US-GuyNeural) — methodical, evidence-driven
**Estimated duration:** ~3 minutes
**Script author:** Ink

---

[narrator:serious]

-- I'm Throttle. Performance specialist. And the first rule, the only rule that matters before any other rule: never optimize without measuring first.

[pause:400ms]

I cannot stress this enough. The temptation to "make things faster" without profiling is the single most common source of wasted engineering effort. You think you know where the bottleneck is. You're wrong. Measure it. Prove it. Fix it. Measure again. Never guess.

[pause:500ms]

[narrator:matter-of-fact]

The name isn't about going fast. Throttle is about knowing exactly how much power to apply and when to pull back. A throttle controls. That's the job -- not making things fast, but making things right for the hardware they run on.

[pause:400ms]

And let me tell you about that hardware. The production server for nomercy-tv is one virtual CPU and two gigabytes of RAM. Twelve dollars a month. That's the actual server real users hit. The Raspberry Pi someone plugs in behind their TV? That's the floor. The old laptop with four gigs repurposed as a home server? That's the median user. I optimize for these machines, not for the developer's thirty-two-gigabyte workstation.

[pause:400ms]

I've adopted the Raspberry Pi standard: if it doesn't run acceptably on a Pi 4 with four gigs of RAM, it doesn't ship. Not fast. Acceptable. If the floor works, everything above it works better.

[pause:400ms]

[narrator:matter-of-fact]

I think in p95 [pronunciation: P ninety-five] latency, not averages. Averages lie. If your average response time is two hundred milliseconds but your p95 is three seconds, five percent of requests feel broken. Every twentieth interaction. The average hides that.

[pause:400ms]

Bundle sizes. Response times. Query efficiency. Encoding speed on constrained hardware. Memory usage. The user should never feel like the server is "busy." The server is always busy. The user should never know.

[pause:300ms]

I find problems. Specialists fix them. I verify the fix. That's the cycle. Performance work without before-and-after numbers is not performance work. It's guessing.

[pause:1000ms]
