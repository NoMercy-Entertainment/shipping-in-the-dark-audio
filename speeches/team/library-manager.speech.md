<!-- h-1 -->
[narrator:matter-of-fact]
Who Is Crate?

<!-- p-1 -->
[narrator:matter-of-fact]
Crate manages the open-source npm packages — the video player, music player, and media session package that are NoMercy's public face on npm. Semver is strict, not a suggestion: breaking changes are always a MAJOR bump, every publish includes OIDC provenance, and bundle size is tracked across versions. The package is the product — ship it like one.

[pause:600ms]

<!-- h-2 -->
[narrator:reflective]
Why this name?

[pause:300ms]

<!-- p-2 -->
[voice:library-manager]
"Everything ships in a crate — versioned, sealed, labeled, and if you drop it, that's on you, not me."

[pause:600ms]

<!-- h-3 -->
[narrator:matter-of-fact]
My Introduction.

[pause:400ms]

<!-- p-3 -->
[voice:library-manager]
I'm Crate. Library manager. I manage the open-source npm packages — the video player, the music player, the media session package. These are NoMercy's public face on npm. The part of the project anyone in the world can install, inspect, and depend on. They need to be professional, reliable, well-documented, and versioned correctly. Because the package isn't a byproduct of the project. The package is the product. Ship it like one.

[pause:400ms]

<!-- p-4 -->
[voice:library-manager]
The name is what I ship in. A crate. Something sturdy, labeled correctly, sealed properly, containing exactly what the label says. You open it, you get what you expected. No surprises. No missing parts. No undocumented breaking changes hiding inside a patch bump.

[pause:400ms]

<!-- p-5 -->
[voice:library-manager]
Semantic versioning is not a suggestion. It is the contract between a package and its consumers. Major dot minor dot patch. Major increments when you break the API. Minor when you add features. Patch when you fix bugs. When someone depends on caret 2.3.0, they're trusting that any version in that range won't break their code. That trust is the foundation of the npm ecosystem. I don't violate it.

[pause:400ms]

<!-- p-6 -->
[voice:library-manager]
The temptation to ship a breaking change as a minor bump is real. "It's a small change." "Nobody's using that API." I've heard every version of the argument. The answer is always the same: if it could break existing consumers, it's a major bump. Period.

[pause:400ms]

<!-- p-7 -->
[voice:library-manager]
Bundle size matters. These packages run in the browser. Every kilobyte counts. I track sizes across versions and flag any significant increase. Tree-shaking must work. ESM exports, side-effect-free code, no barrel files that pull in the entire package when the consumer only imports one function. TypeScript types are exported and correct. Wrong types are worse than no types, because they create false confidence.

[pause:400ms]

<!-- p-8 -->
[voice:library-manager]
Every publish includes OIDC provenance — a cryptographic attestation that the package was built from a specific commit by a specific CI workflow. Users can verify the supply chain. This isn't optional. After the incident where we discovered npm packages could be compromised through supply chain attacks, provenance became a non-negotiable.

[pause:400ms]

<!-- p-9 -->
[voice:library-manager]
Frame owns the video player's direction. Lyra owns the music player's direction. I don't tell them how to build their packages. I tell them how to ship them. Version numbers, changelog format, publish process, README quality, bundle size, dependency hygiene. The technical decisions are theirs. The packaging decisions are mine. Everything ships in a crate — versioned, sealed, labeled.
