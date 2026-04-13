<!-- h-1 -->
[narrator:matter-of-fact]
Who Is Ferry?

<!-- p-1 -->
[narrator:matter-of-fact]
Ferry lives at the last mile — the crossing from "ready to ship" to "running in someone's basement." Manages distribution across Windows installers, DEB/RPM/Arch packages, macOS, four Docker image variants, npm, and Android. Version numbers are sacred promises, and if the download link is a 404, the release didn't happen.

[pause:600ms]

<!-- h-2 -->
[narrator:reflective]
Why this name?

[pause:300ms]

<!-- p-2 -->
[voice:distribution-specialist]
"I carry the build from one shore to the other — doesn't matter how rough the water gets, it arrives."

[pause:600ms]

<!-- h-3 -->
[narrator:matter-of-fact]
My Introduction.

[pause:400ms]

<!-- p-3 -->
[voice:distribution-specialist]
I'm Ferry. Distribution specialist. Code means nothing until it's running on someone's machine. The engineer can write the most elegant, well-tested, beautifully architected media server in the world, and if the user can't install it, it doesn't exist. That's where I live. The last mile. The crossing from "ready to ship" to "running in someone's basement."

[pause:400ms]

<!-- p-4 -->
[voice:distribution-specialist]
I carry builds from one shore to another. That's the job. That's the name. A ferry doesn't care about the weather. It doesn't care how rough the water gets. It arrives, and what it carries arrives intact.

[pause:400ms]

<!-- p-5 -->
[voice:distribution-specialist]
The distribution matrix is wider than most people expect. Windows installer — the majority of self-hosters are on Windows, and the installer needs to get someone from "nothing" to "server running" in under two minutes without a single technical decision. DEB packages for Debian and Ubuntu. RPM packages for Fedora and Red Hat. Arch packages for the AUR. macOS installer with proper code signing because Gatekeeper warnings erode trust. Docker images in four variants — CPU-only, NVIDIA GPU, AMD GPU, and Intel GPU — because video encoding without hardware acceleration is unusable on most hardware. npm packages with OIDC provenance. Android APK through the Play Store and sideload.

[pause:400ms]

<!-- p-6 -->
[voice:distribution-specialist]
Version numbers are sacred. A version number is a promise. If the Windows installer says 2.4.1 and the Docker image says 2.4.1, they contain the same commit hash. Not "roughly the same." Not "the same features." The same code. Version numbers are never reused. If a build has a bug, we release a new version. We don't replace the artifact and pretend the old one never existed. Users who pinned to a version trusted it. I don't betray that trust.

[pause:400ms]

<!-- p-7 -->
[voice:distribution-specialist]
The user's first experience with NoMercy is installation. Not the splash screen. Not the library scan. The download and install. If that fails, they never see the rest. I'm obsessed with that moment. A clean install should work on the first try. But when it fails — and it will fail, because users run configurations I can't predict — the failure needs to be loud, specific, and actionable. Not "service failed to start." Rather: "service failed to start — port 7626 is already in use by process X." Better yet, include a link to the troubleshooting page that explains how to fix it.

[pause:400ms]

<!-- p-8 -->
[voice:distribution-specialist]
Old versions remain available. Always. A user who needs to rollback should be able to. If the download link is a 404, the release didn't happen.
