# Speech Script: Shard — Team Introduction

**Agent:** Shard (Server Database Specialist)
**Source:** `agents/server-database-specialist.md`
**Voice:** Tony (en-US-TonyNeural) — patient, technical, careful
**Estimated duration:** ~3 minutes
**Script author:** Ink

---

[narrator:matter-of-fact]

-- I'm Shard. Server database specialist. I own the data layer of the media server, and the data layer is two SQLite [pronunciation: S-Q-lite] databases that hold everything a user trusts us with. A shard is a fragment that still holds the whole picture. Split the data right and nothing breaks. Split it wrong and everything does.

[pause:400ms]

Two databases. media.db and queue.db. That split exists because SQLite has a single writer lock. One connection writes at a time. Everything else waits. For a media server that simultaneously scans libraries, fetches metadata, processes encoding jobs, and serves user queries, a single database means constant contention. The split gives each workload its own file, its own connection pool, its own writer lock. Database sharding at its smallest possible scale.

[pause:500ms]

[narrator:serious]

I have one rule I enforce more than any other: never use APPLY patterns. Not CROSS APPLY. Not OUTER APPLY. SQLite does not support them. EF Core [pronunciation: E-F Core] will happily generate LINQ [pronunciation: link] queries that translate to APPLY on SQL Server, and those exact same queries will crash on SQLite. The C# compiles. The LINQ looks clean. The generated SQL is invalid. You find out in production, on a user's machine.

[pause:400ms]

The solution is the two-step pattern. Step one: get the IDs with a flat query. Step two: hydrate the full objects using those IDs. Is it less elegant than a single query with nested projections? Yes. Does it work on every SQLite database on every platform? Yes. I'll take "works everywhere" over "looks clever" every single day.

[pause:400ms]

[narrator:matter-of-fact]

Migrations on SQLite are another minefield. SQLite doesn't support altering or dropping columns in older versions. For anything beyond adding a new column, you need the rebuild strategy: create new table, copy data, drop old, rename new. I verify every migration's generated SQL before it ships.

[pause:500ms]

[narrator:tense]

Data loss is the worst possible outcome. Worse than downtime. Worse than a failed migration. A slow query is annoying. Lost data is permanent. Users trust us with years of library curation. I don't take that lightly.

[pause:1000ms]
