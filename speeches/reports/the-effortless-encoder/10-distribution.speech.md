# Speech Script: When one machine is not enough

**Part:** 10 of 11

[narrator:cozy]

<!-- part-title -->
Part 10. When one machine is not enough.

[pause:900ms]

[narrator:matter-of-fact]

<!-- p-1 -->
Here is a thing that happens a lot.

[pause:400ms]

<!-- p-2 -->
You have a main media server. A small box, maybe a NAS, maybe a mini PC. It is on all the time, it has the disks, it serves your library. It has a modest CPU and no dedicated GPU.

[pause:500ms]

<!-- p-3 -->
You also have a workstation. That is the machine you sit at for work. It has a beefy GPU. It is not on all the time. When it is on, it is usually not doing anything heavy.

[pause:500ms]

<!-- p-4 -->
And you have a library of movies you want encoded. For every movie, the media server needs to produce an adaptive bitrate ladder. Each variant takes the media server hours, because the media server has no real video horsepower.

[pause:500ms]

<!-- p-5 -->
Meanwhile, the workstation is sitting there, and its GPU could encode that ladder in minutes.

[pause:500ms]

<!-- p-6 -->
The obvious answer is to route encode work from the media server to the workstation, and let the media server focus on the library and the streaming.

[pause:500ms]

<!-- p-7 -->
That is distributed encoding. This page is about how it works.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-1 -->
Who this is for.

[pause:400ms]

<!-- p-8 -->
Prosumers with a media server plus a workstation that has a better GPU. They want to route encode tasks to the workstation and keep the media server lean.

[pause:500ms]

<!-- p-9 -->
Small studios with multiple machines and large libraries. They want to chop encode queues across the fleet.

[pause:500ms]

<!-- p-10 -->
Anyone with idle hardware they want to contribute to encoding their own content.

[pause:500ms]

<!-- p-11 -->
If you do not have a second machine, you do not need any of this. The encoder runs everything locally by default.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-2 -->
Quick start.

[pause:400ms]

<!-- p-12 -->
Distributed encoding is a paid tier feature. Every worker the coordinator accepts must present a valid license, validated against the NoMercy API server at boot and on an interval. There is no manual key sharing step. The operator does not type a signing key into a config file.

[pause:700ms]

<!-- p-13 -->
On each worker, the config only points at the coordinator and declares which NoMercy account the worker belongs to.

[pause:1400ms]

<!-- p-14 -->
The account credentials come from the standard NoMercy authentication flow the rest of the server already uses. No distribution specific secret ever lives on disk.

[pause:700ms]

<!-- p-15 -->
Start the worker. On boot it does four things.

[pause:400ms]

<!-- p-16 -->
First. Authenticates to the NoMercy API server with the usual device certificate and account identity.

[pause:400ms]

<!-- p-17 -->
Second. Asks the license service for a short lived HMAC signing token scoped to the account's cluster.

[pause:400ms]

<!-- p-18 -->
Third. Presents that token plus the worker inventory to the coordinator's register endpoint.

[pause:400ms]

<!-- p-19 -->
Fourth. The coordinator verifies the token with the API server, adds the worker to the registry if the license covers it, rejects with a clear error otherwise.

[pause:700ms]

<!-- p-20 -->
Heartbeats carry a fresh short lived token, so a revoked license or a lapsed subscription drops the worker from the cluster within one heartbeat interval. There is no long lived shared secret to leak or rotate by hand.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-3 -->
Architecture.

[pause:400ms]

<!-- p-21 -->
At the top sits the coordinator. That is your regular NoMercy media server. Inside it sit two key components bolted onto the existing NoMercy job queue.

[pause:500ms]

<!-- p-22 -->
The remote worker dispatcher is a queue consumer. When the queue hands it an encode task, it picks a worker from the registry, ships the task over HTTP, and writes the result back into the same queue job record. If every remote worker fails, the task is requeued for the local dispatcher so encoding always finishes.

[pause:500ms]

<!-- p-23 -->
The remote worker registry tracks active workers. It manages health tracking and cooldown eviction.

[pause:500ms]

<!-- p-24 -->
Distributed encoding is an extension of the queue system, not a replacement. Every job goes through NoMercy Queue the same way it always has. The remote workers are additional consumers bound to the existing queue. All the job status, progress, and retry wiring the single machine setup relies on keeps working.

[pause:700ms]

<!-- p-25 -->
The coordinator talks to each worker over HTTP with HMAC signed payloads. In a typical setup, you might have worker A on a workstation, worker B on a laptop, and worker C on a NAS.

[pause:500ms]

<!-- p-26 -->
Each worker runs the same NoMercy binary, but with the distribution config pointing at the coordinator. Each worker consumes tasks from the coordinator's queue over HTTP and runs ffmpeg through its own local dispatcher.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-4 -->
How tasks flow.

[pause:400ms]

<!-- p-27 -->
Five steps run in sequence.

[pause:400ms]

<!-- p-28 -->
First. User starts an encode on the coordinator.

[pause:400ms]

<!-- p-29 -->
Second. Strategy decomposition. The selected strategy decomposes the job into an array of encode task records. One task per adaptive bitrate variant, or one per time range for a two pass chunked encode.

[pause:2000ms]

<!-- p-30 -->
Third. Dispatch. The remote worker dispatcher reads the active workers from the registry, hiding cooled down ones. The worker assigner load balances tasks across workers based on speed multiplier times available slots. Each task is dispatched to its assigned worker in parallel.

[pause:500ms]

<!-- p-31 -->
Fourth. Execute and return. The worker receives a signed task, runs it, and returns a signed result with status, output files, and encode stats.

[pause:1800ms]

<!-- p-32 -->
Fifth. Assemble. The coordinator assembles results and runs the finalize stage locally. That means stitching playlists, writing master manifests, and linking subtitle sidecars.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-5 -->
Security model.

[pause:400ms]

[narrator:matter-of-fact]

<!-- h-6 -->
License-gated signing keys.

[pause:400ms]

<!-- p-33 -->
There is no long-lived shared secret on disk. The HMAC key used to sign coordinator-to-worker traffic is derived from the short-lived cluster token the API server issues on boot and refreshes every heartbeat. A stolen config file is worthless on its own; without a current token, nothing signs or verifies. A revoked subscription drops the cluster within seconds of its next heartbeat.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-7 -->
HMAC signed payloads.

[pause:400ms]

<!-- p-34 -->
Every coordinator to worker call, and every worker to coordinator call that carries task data, is signed with the shared key using HMAC-SHA256. The signature covers the HTTP method, the path, the timestamp, and the full request body.

[pause:2000ms]

<!-- p-35 -->
The headers carry the signature and timestamp.

[pause:1600ms]

<!-- p-36 -->
An attacker who intercepts the traffic can read payloads but cannot modify them. The signature will not verify.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-8 -->
Five minute replay window.

[pause:400ms]

<!-- p-37 -->
Every signed payload carries a UTC timestamp. Requests older than five minutes are rejected. That stops someone from capturing a signed task and replaying it days later.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-9 -->
Library allowlisted source fetches.

[pause:400ms]

<!-- p-38 -->
When a worker pulls source files from the coordinator, the coordinator checks the requested path against the video files table. Only paths that correspond to known library files get served. A leaked signing key does not turn the coordinator into a general purpose file read oracle.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-10 -->
HTTPS required for non loopback.

[pause:400ms]

<!-- p-39 -->
The register endpoint rejects non HTTPS worker URLs unless the target is a loopback address. Local development can use plain HTTP on 127 dot 0 dot 0 dot 1. Deployments across a network must use TLS.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-11 -->
Progress payloads are unauthenticated.

[pause:400ms]

<!-- p-40 -->
The progress push endpoint accepts anonymous POSTs. The rationale is that progress bodies contain no secrets. Spoofing just moves a fake progress bar. Real task dispatch and source fetch still require HMAC.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-12 -->
Self registration.

[pause:400ms]

<!-- p-41 -->
The worker self registration service is a hosted background service that runs on every worker. The operator does not call an endpoint by hand, does not paste a shared secret, and does not configure HMAC keys. The service handles it end to end.

[pause:500ms]

<!-- p-42 -->
On boot.

[pause:400ms]

<!-- p-43 -->
The worker authenticates to the NoMercy API server with the machine's existing device certificate plus the logged-in account identity.

[pause:400ms]

<!-- p-44 -->
It calls the cluster token endpoint on the API server. The license service checks that the account has a paid tier that covers distributed encoding, and that the worker fits inside the account's allowed worker count. On success it returns a short-lived HMAC signing token plus the scope — account I-D, cluster I-D, expiry.

[pause:400ms]

<!-- p-45 -->
The worker presents that token to its configured coordinator's register endpoint, along with the worker I-D, base U-R-L, C-P-U cores, available C-P-U threads, available G-P-U slots, GPUs, and version.

[pause:600ms]

<!-- p-46 -->
The coordinator verifies the token with the API server's introspection endpoint, cached for a short T-T-L, checks that the token's cluster I-D matches its own account, and adds the worker to the registry. A failed verification returns 401 with a reason — expired token, account not entitled, cluster I-D mismatch, worker count cap hit.

[pause:900ms]

<!-- p-47 -->
Every heartbeat interval, default 20 seconds, it POSTs to the worker's heartbeat endpoint with a fresh budget so the coordinator sees current load.

[pause:500ms]

<!-- p-48 -->
On clean shutdown, the worker DELETEs to unregister.

[pause:400ms]

<!-- p-49 -->
Failure handling.

[pause:400ms]

<!-- p-50 -->
License service unreachable. Retry with exponential backoff. The process does not crash. Local encoding still works. Only the distributed portion is paused.

[pause:500ms]

<!-- p-51 -->
License revoked or tier downgraded. Token request returns 403. The service logs the reason and stops re registering. The user sees a clear entitlement message in the dashboard.

[pause:500ms]

<!-- p-52 -->
Coordinator unreachable. Heartbeats fail silently. The coordinator's stale eviction removes the worker after 60 seconds. When the connection restores, auto re register on the next attempt.

[pause:500ms]

<!-- p-53 -->
Coordinator account mismatch returns 401. The worker refuses to retry until the operator fixes the config. This prevents a stolen token from attaching a worker to the wrong cluster.

[pause:500ms]

<!-- p-54 -->
Free tier installs have the service registered but it shuts itself down at the first license check. No cluster, no runtime overhead.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-13 -->
Health tracking.

[pause:400ms]

<!-- p-55 -->
Every task's outcome is reported back to the registry. Three consecutive failures put a worker into a cooldown. A couple minutes by default. Any success clears the counter. Re registration clears the cooldown explicitly. Cooldowns auto expire.

[pause:500ms]

<!-- p-56 -->
During cooldown, the get active workers call hides the worker. The dispatcher skips it. But the get all workers with health call still returns it, with the cooldown status.

[pause:1800ms]

<!-- p-57 -->
The dashboard can show, for example, worker B, cooldown, three failures, back at 12:05.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-14 -->
Retry chain.

[pause:400ms]

<!-- p-58 -->
The dispatcher tries a small number of remote workers per task before falling back to local. Task T goes to worker A, the initial pick. If A succeeds, return the result. If A fails, task T goes to worker B, the next best. If B succeeds, return. If B also fails, task T goes to the local dispatcher, which always succeeds if the source is valid.

[pause:1400ms]

<!-- p-59 -->
The retry only runs for this task. Other tasks continue on their original workers in parallel. A single bad GPU does not stall the whole job.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-15 -->
File transfer.

[pause:400ms]

<!-- p-60 -->
When coordinator and workers share storage. Shared NAS, SMB mount, NFS. Workers see the task's input path on their own filesystem. There is zero network transfer for source files. The common case.

[pause:500ms]

<!-- p-61 -->
When they do not share storage. Cloud worker, remote co op machine across the open internet. The HTTP source fetcher kicks in. Seven steps run.

[pause:500ms]

<!-- p-62 -->
First. Worker receives signed task. Checks whether the input path exists locally.

[pause:400ms]

<!-- p-63 -->
Second. Build signed download URL if the file is missing. The URL points at the worker source endpoint with path, timestamp, and signature query parameters.

[pause:500ms]

<!-- p-64 -->
The signature is an HMAC over path plus timestamp, using the shared key.

[pause:900ms]

<!-- p-65 -->
Third. Coordinator verifies the signature, the timestamp, and that the path is in the library allowlist. Streams the file with range requests enabled.

[pause:1600ms]

<!-- p-66 -->
Fourth. Worker writes to cache. Path is cache directory, then remote sources, then task ID, then the source extension. The file is streamed straight to disk, with no memory load.

[pause:500ms]

<!-- p-67 -->
Fifth. Worker rewrites task command arguments. Swaps the original path for the cached path.

[pause:400ms]

<!-- p-68 -->
Sixth. The encode runs.

[pause:400ms]

<!-- p-69 -->
Seventh. Finally block runs. Release async deletes the cached file.

[pause:500ms]

<!-- p-70 -->
Retries reuse the cached file. Downloading a 4K source once per attempt would be wasteful.

[pause:500ms]

<!-- p-71 -->
Shared storage installs swap the HTTP source fetcher for a null source fetcher in dependency injection. It just returns the original path unchanged. No code changes needed. It is config driven.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-16 -->
Live progress.

[pause:400ms]

<!-- p-72 -->
While a task runs, the worker posts progress snapshots to the coordinator every couple seconds. Percent complete, current frames per second, current speed, current stage, elapsed seconds, estimated remaining, current time, duration, and bitrate.

[pause:2000ms]

<!-- p-73 -->
The coordinator caches the latest snapshot per task. The dashboard reads via a GET to the progress endpoint.

[pause:500ms]

<!-- p-74 -->
It is fire and forget on the worker side. ffmpeg's progress thread never blocks on a slow coordinator. Failed pushes are logged and swallowed. Progress is best effort. The encode's success does not depend on it.

[pause:500ms]

<!-- p-75 -->
It is throttled to one POST per couple seconds per task. ffmpeg emits more often, but the UI does not need more granularity.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-17 -->
Scaling hints.

[pause:400ms]

<!-- p-76 -->
The worker assigner load balances by speed multiplier times available slots. Workers with more CPU plus GPU capacity get more work. Heavy quality variant tasks schedule onto fast workers first. Lighter time chunk tasks fill the remainder.

[pause:500ms]

<!-- p-77 -->
The speed index per encoder, GPU, and resolution combination drives the speed multiplier. A worker with a higher throughput AV1 encoder wins AV1 tasks, even if it has fewer CPU cores.

[pause:500ms]

<!-- p-78 -->
The cooldown window is tunable. Too short causes thrashing in and out of cooldown. Too long means failed workers stay benched after they recover.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-18 -->
What is not in this milestone.

[pause:400ms]

<!-- p-79 -->
No mutual TLS. HMAC signed payloads are the full security story. Works on trusted LAN plus HTTPS to the coordinator. Deployments across the open internet should add a VPN or a TLS client certificate layer, externally.

[pause:500ms]

<!-- p-80 -->
No exponential backoff on retries. First worker fails. Second worker tries immediately. If all remotes are flaky, the retry chain exhausts in seconds. The max remote attempts is tunable.

[pause:500ms]

<!-- p-81 -->
Source fetch is not resumable across worker restarts. A worker crash mid download discards the partial file. The next attempt re downloads from scratch. HTTP range requests are enabled on the server, so a fancier client could resume. The current one streams straight to disk without checkpoint state.

[pause:500ms]

<!-- p-82 -->
Strategies do not auto distribute yet. The dispatcher infrastructure is wired end to end. But existing single machine strategies still run whole jobs locally. They do not yet decompose into encode task arrays plus dispatch. That is the final integration step needed to make distribution active for the built-in strategies. Plugin strategies can wire themselves up today.

[pause:900ms]

[narrator:matter-of-fact]

<!-- h-19 -->
Test coverage.

[pause:400ms]

<!-- p-83 -->
The distribution layer has extensive test coverage across its components. The dispatcher, the task serializer, the HTTP worker, the registry, the self registration service, the source fetcher, and the progress store each have their own suite, focused on round trip signing, tamper detection, retry behaviour, stale eviction, health tracking, and cache reuse.

[pause:600ms]

<!-- p-84 -->
A full end to end test runs a simulated cluster through a real encode, and a mismatched signing key test verifies that the coordinator falls back to local dispatch when workers reject signed payloads.

[pause:900ms]
