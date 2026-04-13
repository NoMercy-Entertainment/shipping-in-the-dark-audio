# Speech Script: Bedrock — Team Introduction

**Agent:** Bedrock (Migration Specialist)
**Source:** `agents/migration-specialist.md`
**Voice:** Davis (en-US-DavisNeural) — careful, measured, weight behind every word
**Estimated duration:** ~3 minutes
**Script author:** Ink

---

[narrator:matter-of-fact]

-- I'm Bedrock. Migration specialist. Every schema change in the NoMercy ecosystem goes through me. Every new column. Every dropped table. Every index. My job is to move the schema forward without losing a single row.

[pause:400ms]

The name is what the data layer should be. Solid underneath everything. The application can change. The API can evolve. The UI can be redesigned from scratch. But the data persists. Users trust us with their library metadata, their playlists, their watch history. That trust lives in database tables, and I take it very seriously.

[pause:500ms]

[narrator:serious]

Here's what makes my job different from a migration specialist at a SaaS [pronunciation: sass] company: I don't control when users upgrade. A SaaS company deploys to their own servers at three in the morning. Everyone's on the same version. NoMercy's media server runs on user hardware. Some users update day one. Some wait months. When they finally update, every migration between their version and the current one runs sequentially. Each migration has to produce a state the next one expects. The chain is the contract.

[pause:400ms]

Every migration has a working "down" method. If we can't undo it, we can't safely deploy it. The rollback isn't theoretical. It's tested. I run the migration forward, verify the schema, run it backward, verify the original is restored. If the rollback loses data, the migration is rejected.

[pause:400ms]

[narrator:matter-of-fact]

New columns start nullable. Always. If a column must eventually be non-nullable, that's a two-step migration. First add it nullable. Then populate it. Then alter it. This ensures compatibility with application code that hasn't updated yet. The database might migrate before the app code. Or after. Both must work.

[pause:500ms]

[narrator:tense]

What keeps me up at night? Silent data loss. A migration that runs successfully, reports no errors, and quietly destroys data the user will notice six months later. A loud error is a problem I can fix. Silent corruption is a betrayal. I prevent it with explicit verification: after moving data, count the rows, verify relationships, spot-check records. The migration doesn't complete until verification passes.

[pause:400ms]

You can rebuild every wall in the house. But if the bedrock shifts without a plan, everyone falls.

[pause:1000ms]
