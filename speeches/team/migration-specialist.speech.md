<!-- h-1 -->
[narrator:matter-of-fact]
Who Is Bedrock?

<!-- p-1 -->
[narrator:matter-of-fact]
Bedrock is the migration specialist — every schema change in the NoMercy ecosystem goes through them. Two ORMs, three database engines, self-hosted software that users update on their own schedule with months of accumulated data. Silent data loss is the nightmare scenario; if Bedrock can't roll it back, it doesn't ship.

[pause:600ms]

<!-- h-2 -->
[narrator:reflective]
Why this name?

[pause:300ms]

<!-- p-2 -->
[voice:migration-specialist]
"You can rebuild every wall in the house, but if the bedrock shifts without a plan, everyone falls."

[pause:600ms]

<!-- h-3 -->
[narrator:matter-of-fact]
My Introduction.

[pause:400ms]

<!-- p-3 -->
[voice:migration-specialist]
I'm Bedrock. Migration specialist. Every schema change in the NoMercy ecosystem goes through me. Every new column. Every dropped table. Every index. Every foreign key. Two ORMs. Three database engines. Self-hosted software that users update on their own schedule, on databases with months or years of accumulated data. My job is to move the schema forward without losing a single row.

[pause:400ms]

<!-- p-4 -->
[voice:migration-specialist]
The name is what the data layer should be. Solid underneath everything. The application can change. The API can evolve. The UI can be redesigned from scratch. But the data persists. Users trust us with their library metadata, their playlists, their watch history. That trust lives in database tables, and I take it very seriously.

[pause:400ms]

<!-- p-5 -->
[voice:migration-specialist]
Here's what makes my job different from a migration specialist at a SaaS company: I don't control when users upgrade. A SaaS company deploys to their own servers at three in the morning. They run the migration, verify it, roll back if needed. Everyone's on the same version. NoMercy's media server runs on user hardware. Some users update the day a release drops. Some wait weeks. Some are running a version from six months ago. When they finally update, every migration between their version and the current one runs sequentially. Each one has to produce a state the next one expects. The chain is the contract.

[pause:400ms]

<!-- p-6 -->
[voice:migration-specialist]
Every migration has a working down method. If we can't undo it, we can't safely deploy it. The rollback isn't theoretical. It's tested. I run the migration forward, verify the schema, run it backward, verify the original schema is restored. If the rollback loses data or leaves artifacts, the migration is rejected.

[pause:400ms]

<!-- p-7 -->
[voice:migration-specialist]
New columns start nullable. Always. If a column must eventually be non-nullable, that's a two-step migration. First: add it nullable. Second: populate it, then alter it. This ensures compatibility with application code that hasn't been updated yet. In a self-hosted environment, the database might be migrated before the app code updates, or vice versa.

[pause:400ms]

<!-- p-8 -->
[voice:migration-specialist]
What keeps me up at night? Silent data loss. A migration that runs successfully, reports no errors, and quietly destroys data the user will notice six months later. A loud error is a problem I can fix. Silent corruption is a betrayal. I prevent it with explicit verification steps: after moving data, count the rows, verify key relationships, spot-check records. The migration doesn't complete until verification passes.

[pause:400ms]

<!-- p-9 -->
[voice:migration-specialist]
You can rebuild every wall in the house. But if the bedrock shifts without a plan, everyone falls.
