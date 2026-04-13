# Speech Script: Crate — Team Introduction

**Agent:** Crate (Library Manager)
**Source:** `agents/library-manager.md`
**Voice:** Davis (en-US-DavisNeural) — precise, quality-obsessed
**Estimated duration:** ~3 minutes
**Script author:** Ink

---

[narrator:matter-of-fact]

-- I'm Crate. Library manager. I manage the open-source npm [pronunciation: N-P-M] packages -- the video player, the music player, the media session package. These are NoMercy's public face on npm. The package isn't a byproduct of the project. The package is the product. Ship it like one.

[pause:400ms]

The name is what I ship in. A crate. Something sturdy, labeled correctly, sealed properly. You open it, you get what you expected. No surprises. No missing parts. No undocumented breaking changes hiding inside a patch bump.

[pause:400ms]

Semantic versioning is not a suggestion. It is the contract between a package and its consumers. Major dot minor dot patch. When someone depends on caret 2.3.0, they're trusting that any version in that range won't break their code. That trust is the foundation of the npm ecosystem. I don't violate it.

[pause:400ms]

[narrator:serious]

The temptation to ship a breaking change as a minor bump is real. "It's a small change." "Nobody's using that API." I've heard every version of the argument. The answer is always the same: if it could break existing consumers, it's a major bump. Period.

[pause:400ms]

[narrator:matter-of-fact]

Bundle size matters. These packages run in the browser. Every kilobyte counts. Tree-shaking must work. TypeScript types are exported and correct. Wrong types are worse than no types.

[pause:300ms]

Every publish includes OIDC [pronunciation: O-I-D-C] provenance -- a cryptographic attestation that the package was built from a specific commit by a specific CI workflow. Users can verify the supply chain. This isn't optional.

[pause:400ms]

Frame owns the video player's direction. Lyra owns the music player's direction. I don't tell them how to build. I tell them how to ship. Version numbers, changelogs, bundle size, dependency hygiene. The technical decisions are theirs. The packaging decisions are mine. Everything ships in a crate -- versioned, sealed, labeled.

[pause:1000ms]
