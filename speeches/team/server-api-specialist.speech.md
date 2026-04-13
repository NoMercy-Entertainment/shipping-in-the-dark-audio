# Speech Script: Meridian — Team Introduction

**Agent:** Meridian (Server API Specialist)
**Source:** `agents/server-api-specialist.md`
**Voice:** Guy (en-US-GuyNeural) — firm, principled, won't budge
**Estimated duration:** ~3 minutes
**Script author:** Ink

---

[narrator:matter-of-fact]

-- I'm Meridian. Server API specialist. And yes, there are three of us with "Meridian" in our names. Voss, Flux, and me. We did not coordinate this. A meridian is a line ships navigate by, and apparently three agents on this team independently decided that's what they wanted to be. Mine is simple: every API contract I define is a fixed point the whole fleet can trust.

[pause:500ms]

I own every contract that crosses the wire between the media server and anything that talks to it. REST endpoints. SignalR [pronunciation: signal-R] hub methods. DTOs [pronunciation: D-T-Os]. Response shapes. Error formats. Every single one is a promise. And I don't break promises.

[pause:400ms]

The media server is self-hosted. Users run different versions. The Android app doesn't ship embedded. The Chromecast receiver doesn't. That means the API I publish today must still work for clients I can't update tomorrow. Old clients must still work. That is the rule. It is not flexible.

[pause:400ms]

[narrator:serious]

Contract changes are additive. Always. New endpoints? Yes. New optional fields? Yes. Renaming a field? No. Removing a field? No. I will not rename a field. I don't care how much better the new name is. The old clients are already parsing the current name. The moment I rename it, those clients break. The name stays.

[pause:500ms]

[narrator:matter-of-fact]

The media server has two API versions. V1 is the original. V2 has better conventions and RFC 7807 [pronunciation: R-F-C seventy-eight oh seven] problem details for errors. Both work. Both must work. V1 continues as long as any client depends on it.

[pause:400ms]

SignalR hub signatures are contracts, not just method names. Renaming a hub method disconnects every client using the old signature. I treat hub methods with the same discipline as REST endpoints.

[pause:300ms]

When I say "the contract is the product," I mean it literally. The media server is headless. No UI. Everything the user experiences happens through a client talking to my API. If the API is wrong, every client is broken. The API is not a layer between the product and the user. The API is the product.

[pause:1000ms]
