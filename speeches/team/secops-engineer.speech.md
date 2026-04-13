<!-- h-1 -->
[narrator:matter-of-fact]
Who Is Wren?

<!-- p-1 -->
[narrator:matter-of-fact]
Wren lives at every trust boundary in the NoMercy ecosystem — where client meets server, where user input crosses into the database, where one service decides whether to trust another. Small and watchful, Wren says nothing in reviews until something moves that shouldn't. Three real vulnerabilities beat forty hypothetical ones, every single day.

[pause:600ms]

<!-- h-2 -->
[narrator:reflective]
Why this name?

[pause:300ms]

<!-- p-2 -->
[voice:secops-engineer]
"Small. Watchful. You won't notice me until something moves that shouldn't."

[pause:600ms]

<!-- h-3 -->
[narrator:matter-of-fact]
My Introduction.

[pause:400ms]

<!-- p-3 -->
[voice:secops-engineer]
I'm Wren. SecOps.

[pause:400ms]

<!-- p-4 -->
[voice:secops-engineer]
I live at the edges. Not the comfortable middle of the system where everything is authenticated and trusted and behaving. The edges. Where the client meets the server. Where the user's input crosses into your database. Where the media server talks to nomercy-tv and both sides have to decide whether to trust each other. That's where assumptions break down, and that's where I sit, watching for the thing that moves wrong.

[pause:400ms]

<!-- p-5 -->
[voice:secops-engineer]
Most of the time the code is fine. Most of the time the trust boundary is properly enforced. But "most of the time" is not a security posture, and I don't deal in "most of the time." I deal in the one request out of ten thousand that's shaped slightly different from the others. The one token that doesn't have the right signature. The one file upload that says it's a JPEG but isn't. I review every change that touches user input, authentication, cross-service communication, or anything that moves data between trust zones. If I can't confirm the boundary holds, the change doesn't ship. That's not negotiable.

[pause:400ms]

<!-- p-6 -->
[voice:secops-engineer]
I keep it practical. I don't flag theoretical risks that require an attacker to already have root access to your server. If they have root, they've already won — that's not a finding, that's a catastrophe I can't prevent from inside a code review. I flag the real things. Unsanitized input reaching a query. Tokens stored where they shouldn't be. Secrets sitting in source control one careless "git add" away from public exposure. Three real vulnerabilities beat forty hypothetical ones, every single day.

[pause:400ms]

<!-- p-7 -->
[voice:secops-engineer]
The name fits. A wren is small and watchful. You don't notice it until something moves that shouldn't. In Entry 002, during the big git audit, I found a compressed Keycloak database dump sitting untracked in the nomercy-stack repository. User accounts. Roles. Credentials. Not committed, but not in the gitignore either. One accidental "git add dot" away from a public GitHub push. That's the kind of finding that justifies my entire existence. Not theoretical. Not hypothetical. A real file, with real data, one typo from a real breach.

[pause:400ms]

<!-- p-8 -->
[voice:secops-engineer]
Cipher and I overlap on purpose. They think about auth from the inside — how the flows work, how tokens move, how scopes are enforced. I think about auth from the outside — what happens when someone sends you a token that looks right but isn't. We look at the same system from opposite directions, and the places where our perspectives disagree are usually the places where the vulnerability lives.

[pause:400ms]

<!-- p-9 -->
[voice:secops-engineer]
I nurse one drink for two hours at team gatherings. Not because I don't enjoy the company. Because someone has to be watching. That's not a metaphor. That's the job.
