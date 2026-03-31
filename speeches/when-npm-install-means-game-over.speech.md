# Speech Script: When npm install Means Game Over

**Entry:** 007
**Source:** `entries/2026-03-31-007-when-npm-install-means-game-over.md`
**Narrator:** Aria (en-US-AriaNeural) — Ink narrates this entry
**Estimated duration:** ~22 minutes
**Script author:** Echo

---

[narrator:dramatic]

When N-P-M Install Means Game Over.

[pause:800ms]

[narrator:reflective]

Timeline Note.

[pause:300ms]

[narrator:reflective]

<!-- p-1 -->
This is Entry {{007}}. A standalone deep dive on the axios supply chain attack that occurred on March thirtieth to thirty-first, twenty-twenty-six. The attack was covered briefly in Entry {{006}}, "The Day the Supply Chain Broke," as Act Four of a marathon session. That entry had four other fires to tell you about. This one has just the one fire.

[pause:400ms]

It deserves the space.

[pause:800ms]

[narrator:tense]

The Short Version.

[pause:300ms]

[narrator:tense]

<!-- p-2 -->
On March thirty-first, twenty-twenty-six, the axios N-P-M package — downloaded {{83}} million times per week — was compromised through a stolen maintainer token. Two poisoned versions were published that silently installed a Remote Access Trojan on Windows, macOS, and Linux. The malware cleaned up after itself, leaving no trace in the project directory. It was live for approximately three hours and forty minutes. Our team caught it, scanned every machine, pinned every project to a clean version, and published a public scanner so others could do the same. We were one patch version away from infection.

[pause:900ms]

[narrator:cozy]

Background.

[pause:300ms]

[narrator:cozy]

<!-- p-3 -->
If you work with JavaScript, you know axios. If you don't work with JavaScript, you've almost certainly used software that depends on it. Axios is an HTTP client library — it's the tool that lets JavaScript applications talk to servers, fetch data, submit forms, authenticate users. It has been downloaded over {{83}} million times per week. It sits in the dependency tree of more projects than anyone can count.

[pause:400ms]

<!-- p-4 -->
NoMercy uses axios in the web app, the Chromecast receiver, and several build tools. It's not an exotic dependency. It's plumbing. The kind of package you install on day one and never think about again.

[pause:400ms]

<!-- p-5 -->
That's the problem.

[pause:600ms]

[narrator:reflective]

<!-- p-6 -->
For beginners: N-P-M is the package registry for JavaScript. When you run N-P-M install or yarn install, your project downloads code written by other developers from this registry. A dependency is a package your project needs to function. A supply chain attack is when someone poisons one of those packages so that everyone who installs it gets malware instead of — or in addition to — the code they expected.

[pause:800ms]

[narrator:tense]

The Anatomy of the Attack.

[pause:400ms]

[narrator:tense]

<!-- p-7 -->
What follows is a technical reconstruction of the axios compromise, pieced together from Socket.dev's initial detection, StepSecurity's live analysis of the Command and Control server callbacks, GitHub issue discussions, and our own forensic work. All times are in Coordinated Universal Time.

[pause:600ms]

Step one. Steal the Keys.

[pause:300ms]

<!-- p-8 -->
The attacker obtained the N-P-M access token belonging to axios's lead maintainer. This was a long-lived token — not a short-lived one issued through OpenID Connect by a Continuous Integration pipeline, but a persistent credential tied to a human account.

[pause:400ms]

<!-- p-9 -->
How the token was stolen is not publicly confirmed. It could have been phishing, credential stuffing, a compromised machine, or a leaked secret. The method matters less than the consequence: a single stolen credential gave the attacker full publishing rights to one of N-P-M's most-downloaded packages.

[pause:400ms]

<!-- p-10 -->
With the token in hand, the attacker changed the account's email address to a throwaway. This is a standard account takeover move. Change the email, and the original owner can't easily recover the account through password reset flows.

[pause:700ms]

Step two. Stage the Decoy.

[pause:300ms]

<!-- p-11 -->
Before publishing the poisoned axios versions, the attacker needed a delivery vehicle. They created a package called plain-crypto-j-s. The name was chosen to look boring. Legitimate. Like one of the hundreds of utility packages on N-P-M that wrap cryptographic functions. Nobody looks twice at a package called plain-crypto-j-s.

[pause:400ms]

<!-- p-12 -->
On March thirtieth at five fifty-seven UTC, they published version four point two point zero of this package. It was clean. No malicious code. Just a decoy to establish the package's existence on the registry and give it a plausible publication history. This is staging. The attacker was patient.

[pause:400ms]

<!-- p-13 -->
Eighteen hours later, at twenty-three fifty-nine UTC on March thirtieth, they published version four point two point one. This one was not clean.

[pause:700ms]

[narrator:dramatic]

Step three. Publish the Poison.

[pause:300ms]

[narrator:tense]

<!-- p-14 -->
At zero zero twenty-one UTC on March thirty-first, the attacker published axios version one point fourteen point one. Thirty-nine minutes later, at one hundred UTC, they published axios version zero point thirty point four. Two versions, targeting two major release branches, covering as many installations as possible.

[pause:400ms]

<!-- p-15 -->
Both versions were published via the N-P-M command-line interface using the stolen token. Not through GitHub Actions. Not through any CI pipeline. The N-P-M C-L-I, authenticated with a human credential. There was no code review. No pull request. No build log. Just a direct publish from somewhere on the internet.

[pause:400ms]

<!-- p-16 -->
Both poisoned versions were identical to the real axios code with one addition: a new dependency on plain-crypto-j-s version four point two point one.

[pause:500ms]

[narrator:reflective]

<!-- p-17 -->
For beginners: when you install a package from N-P-M, it also installs that package's dependencies. So when someone ran N-P-M install axios at version one point fourteen point one, N-P-M saw that this version of axios depended on plain-crypto-j-s, and installed that too. The poisoned code wasn't in axios itself. It was in the package that axios told N-P-M to install alongside it. A Trojan horse carrying a smaller Trojan horse.

[pause:900ms]

[narrator:dramatic]

The Payload.

[pause:400ms]

[narrator:tense]

<!-- p-18 -->
Here is what plain-crypto-j-s at version four point two point one did when N-P-M installed it.

[pause:400ms]

The Trigger.

[pause:300ms]

<!-- p-19 -->
N-P-M has a feature called postinstall scripts. When a package defines a postinstall command in its configuration, N-P-M runs that command automatically after downloading and extracting the package. This feature exists for legitimate reasons — some packages need to compile native code or download platform-specific binaries during installation. It is also, without exaggeration, the most dangerous feature in the N-P-M ecosystem.

[pause:400ms]

<!-- p-20 -->
The malicious package had a postinstall script that ran a file called setup dot j-s. The moment N-P-M install finished downloading the package, setup dot j-s executed.

[pause:600ms]

Two Layers of Obfuscation.

[pause:300ms]

<!-- p-21 -->
The code in setup dot j-s was not readable. It used two layers of obfuscation to hide its true purpose.

[pause:400ms]

<!-- p-22 -->
The first layer was a XOR cipher using a key derived from a specific string. XOR is a simple encryption operation — it scrambles data by combining it with a key, and unscrambles it by applying the same key again. The attacker used it to turn the malicious code into what looked like random garbage to anyone casually glancing at the file.

[pause:400ms]

<!-- p-23 -->
The second layer was base64 encoding combined with string reversal. After XOR decryption, the result was a base64-encoded string that had been reversed. Decode the base64, reverse the string, and you get the actual payload.

[pause:400ms]

<!-- p-24 -->
This is not sophisticated cryptography. A security researcher could break it in minutes. But that's not the point. The obfuscation wasn't designed to stop researchers. It was designed to stop automated scanners that look for known malicious patterns in plain text. If the URLs and commands are encrypted, the scanner sees nothing.

[pause:700ms]

[narrator:dramatic]

Three Operating Systems. Three Attack Paths.

[pause:400ms]

[narrator:tense]

<!-- p-25 -->
After deobfuscation, the setup script checked which operating system the victim was running and branched into one of three attack paths.

[pause:400ms]

<!-- p-26 -->
On macOS, the payload used Apple's built-in scripting language to download a binary to the Apple system cache directory, with a filename chosen to mimic a real macOS system process called Activity Monitor daemon. Look at that choice: it sits in Apple's own cache folder, named after a file that belongs there. The binary was launched in the background in a way that survives terminal closure — meaning shutting down your command prompt won't stop it.

[pause:500ms]

<!-- p-27 -->
On Windows, the attack was more elaborate. It copied PowerShell to the Program Data directory, renaming it to look like Windows Terminal — a legitimate Microsoft application that ships with modern Windows. The attacker renamed PowerShell to look like something you'd expect to see there.

[pause:400ms]

<!-- p-28 -->
Then it created a VBScript file in the temp directory. This script launched a hidden command prompt — no window, no taskbar entry, nothing visible to the user. That hidden process ran the disguised PowerShell with execution policy bypassed, disabling its security restrictions. The disguised PowerShell then downloaded and executed the Remote Access Trojan.

[pause:400ms]

<!-- p-29 -->
A campaign identifier number appears throughout the attack — in the script filename, in the command-and-control server URL path. It appears to be how the attacker tracked this specific operation.

[pause:400ms]

<!-- p-30 -->
On Linux, the payload downloaded a Python script to the slash tmp directory, naming it to mimic the system linker — a core operating system utility that runs on every Linux machine. The script was executed in the background, surviving terminal closure.

[pause:600ms]

[narrator:reflective]

<!-- p-31 -->
For beginners: every one of these file names and locations was chosen to hide in plain sight. The macOS payload looks like an Apple system process. The Windows payload looks like Windows Terminal. The Linux payload looks like the system linker. If you went looking for suspicious files, these would blend into the noise of your operating system. That's not accidental. That's craft.

[pause:800ms]

[narrator:tense]

The RAT.

[pause:300ms]

<!-- p-32 -->
All three platform-specific payloads were Remote Access Trojans. A RAT gives an attacker persistent, remote control over your machine. Think of it as a backdoor that phones home.

[pause:400ms]

<!-- p-33 -->
These RATs connected to a command-and-control server at a domain called sfrclak dot com. The IP address was one forty-two dot eleven dot two hundred and six dot seventy-three, on port eight thousand.

[pause:400ms]

<!-- p-34 -->
The HTTP requests were disguised to look like N-P-M registry traffic, with URL paths named to look like package downloads.

[pause:300ms]

<!-- p-35 -->
The User-Agent header was set to mimic Internet Explorer 8 running on Windows XP.

[pause:300ms]

<!-- p-36 -->
Internet Explorer 8. On Windows XP. In twenty-twenty-six. If that User-Agent string shows up in your network logs, something has gone badly wrong.

[pause:500ms]

<!-- p-37 -->
The first thing the RAT did upon connecting to the command-and-control server was send a FirstInfo beacon, containing the victim's operating system, CPU architecture, username — and a full directory listing of sensitive locations.

[pause:400ms]

<!-- p-38 -->
The beacon contained: a unique victim identifier, the operating system and CPU architecture, the current username, and a full listing of those sensitive locations.

[pause:400ms]

<!-- p-39 -->
That directory enumeration was not random. It specifically targeted dot S-S-H directories, where your server access keys live. It targeted dot aws directories and dot s3cfg files, where Amazon Web Services credentials live. It targeted dot bashrc and dot profile, where environment variables — often containing A-P-I keys and database passwords — are set. And it targeted dot env files, where application secrets live.

[pause:500ms]

<!-- p-40 -->
This is not a cryptocurrency miner. This is not ransomware. This is reconnaissance. The attacker was harvesting credentials to pivot from developer machines into production infrastructure. Your S-S-H keys, your cloud credentials, your database passwords, your A-P-I tokens. Everything needed to turn a compromised laptop into a compromised organization.

[pause:400ms]

<!-- p-41 -->
The command-and-control server then responded with second-stage payloads. What those payloads did is still being analyzed. By the time researchers were capturing live traffic, the credential harvesting had already occurred for anyone who installed the poisoned versions.

[pause:900ms]

[narrator:dramatic, emphasis]

The Self-Cleanup.

[pause:600ms]

[narrator:dramatic]

<!-- p-42 -->
This is the part of the attack that should keep you up at night.

[pause:700ms]

<!-- p-43 -->
After setup dot j-s installed the RAT and it was running in the background, the script deleted itself. Then it did something clever. The malicious package included a file called package dot md — not package dot json, but package dot md. This file contained a clean, innocent-looking package configuration showing version four point two point zero, with no postinstall script defined.

[pause:500ms]

<!-- p-44 -->
The setup script renamed package dot md to package dot json, overwriting the original package dot json that contained the malicious postinstall hook.

[pause:500ms]

<!-- p-45 -->
When the script finished, here is what your node modules directory looked like. Setup dot j-s: gone, deleted. Package dot json: clean, showing version four point two point zero, no postinstall script.

[pause:400ms]

<!-- p-47 -->
If you went looking for evidence of the attack in your project directory, you would find nothing. The package was there. It looked normal. It looked like the clean decoy that was published eighteen hours before the malicious version. There was no postinstall script. There was nothing to find.

[pause:500ms]

<!-- p-48 -->
The evidence was not in your project directory. It was a process running on your operating system, phoning home to a server in a data center, sending your S-S-H keys and cloud credentials to someone you've never met.

[pause:500ms]

<!-- p-49 -->
This is what makes supply chain attacks fundamentally different from application-level vulnerabilities. A Cross-Site Scripting bug or a SQL injection vulnerability exists in your code, where you can find it, audit it, and fix it. A supply chain attack executes during installation, before your application ever runs, and then erases itself. The attack surface is not your code. It's your build process.

[pause:600ms]

[narrator:reflective]

<!-- p-50 -->
For beginners: imagine hiring a contractor to install shelves in your house. They install the shelves perfectly. They also, while you weren't looking, made a copy of your house keys. Then they cleaned up all evidence they were ever there. The shelves look great. You'd never know anything happened. Except now someone else has your keys.

[pause:900ms]

[narrator:tense]

The Human Story.

[pause:400ms]

[narrator:reflective]

<!-- p-51 -->
Security bulletins are written in passive voice with clinical detachment. This is not a security bulletin. This is a story about people, and the human dimension of this attack is where it hurts the most.

[pause:600ms]

The Maintainer Who Could Only Watch.

[pause:300ms]

<!-- p-52 -->
DigitalBrainJS is a co-maintainer of axios on GitHub. When reports started flooding in about suspicious versions, he was online. He could see what was happening. He pinned an issue to the repository to warn users.

[pause:400ms]

<!-- p-53 -->
The attacker, using the compromised lead maintainer's credentials, unpinned it.

[pause:500ms]

<!-- p-54 -->
People opened GitHub issue number ten thousand five hundred and ninety to report the compromise. The attacker deleted it. Using the same stolen credentials that gave them N-P-M publishing rights, they had full administrative access to the GitHub repository. They could delete issues. They could unpin warnings. They could silence the alarm.

[pause:400ms]

<!-- p-55 -->
DigitalBrainJS said it plainly: "his git permissions are higher than mine. I'm a collaborator, not an admin."

[pause:500ms]

<!-- p-56 -->
He confirmed the compromise at three oh six UTC. He contacted N-P-M administration at three twenty UTC. N-P-M revoked the tokens and removed the poisoned versions at three forty UTC. Between the first poisoned publish and the final takedown: three hours and forty minutes.

[pause:400ms]

<!-- p-57 -->
Three hours and forty minutes where one of the most critical packages in the JavaScript ecosystem was serving malware. Because one account got compromised, and the one person who noticed couldn't do anything about it.

[pause:700ms]

The Timing Was Deliberate.

[pause:300ms]

<!-- p-58 -->
The attacker published the first poisoned version at zero zero twenty-one UTC. That is midnight in London. Late evening on the US East Coast. Late afternoon on the US West Coast, trending toward end-of-business. This timing maximizes the window before a response can be organized. Security teams are understaffed overnight. Maintainers are asleep. N-P-M support staff is reduced.

[pause:400ms]

<!-- p-59 -->
The thirty-nine-minute gap between the two poisoned versions suggests the attacker checked that the first publish worked before committing the second. Methodical. Patient. Not someone's first time.

[pause:900ms]

[narrator:cozy]

The Detection.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-60 -->
Credit where credit is due. Socket.dev detected the anomaly at zero zero oh five UTC — sixteen minutes before the first poisoned axios version was even published. They caught the malicious plain-crypto-j-s package when it first hit the registry. Their automated analysis flagged the obfuscated postinstall script.

[pause:400ms]

<!-- p-61 -->
StepSecurity captured live command-and-control callbacks at one thirty UTC, providing concrete evidence that the malware was functioning as designed and that the attack infrastructure was active. This evidence was critical for getting N-P-M to act quickly.

[pause:400ms]

<!-- p-62 -->
GitHub issue discussions, despite the attacker's attempts to delete them, eventually reached the axios co-maintainer and N-P-M's security team. The community's persistence in re-opening reports after the attacker deleted them was a small act of defiance that mattered.

[pause:400ms]

<!-- p-63 -->
Socket.dev published the initial advisory. Silas Cutler published a comprehensive scanner. StepSecurity published their command-and-control traffic analysis. The open-source security community responded in hours. It wasn't fast enough to prevent all infections, but it was fast enough to limit the blast radius to that three-hour-and-forty-minute window.

[pause:800ms]

[narrator:urgent]

Our Response.

[pause:400ms]

[narrator:matter-of-fact]

<!-- p-64 -->
Here's what a small team does when this happens. Not a security department with a budget and an incident response playbook. A solo developer with an AI team, finding out at night that one of their core dependencies just tried to install a backdoor on {{83}} million machines.

[pause:500ms]

Immediate: Pin Everything.

[pause:300ms]

<!-- p-65 -->
Stoney ordered an immediate version pin the moment the advisory crossed our radar. No discussion. No risk assessment meeting. No "let's wait for the official post-mortem." Immediate.

[pause:400ms]

<!-- p-66 -->
Every package dot json in every NoMercy project was updated to pin axios at version one point fourteen point zero — the last known-clean version. Not a version range that could float upward. Not "latest." A specific, exact version number. Eight package configuration files across the workspace, all pinned.

[pause:400ms]

<!-- p-67 -->
The production server got patched through yarn resolutions, forcing one point fourteen point zero regardless of what any transitive dependency requested.

[pause:600ms]

Second: Verify We're Clean.

[pause:300ms]

<!-- p-68 -->
We were on axios one point fourteen point zero. The first poisoned version was one point fourteen point one. One patch version separated us from a RAT.

[pause:400ms]

<!-- p-69 -->
That's not good enough. "We think we're clean" is not the same as "we've verified we're clean."

[pause:400ms]

<!-- p-70 -->
Wren and Rampart ran a full Indicators of Compromise scan on the local development machine. Every file path the malware was known to use. Every registry key on Windows. Every process name matching the malware's disguises. Every network connection to the command-and-control server. Every hash matching the known malicious binaries.

[pause:400ms]

<!-- p-71 -->
The scan checked for: the disguised PowerShell executable, the Visual Basic script dropper, the macOS system cache payload, the Linux tmp directory payload, active network connections to the attacker's server, the plain-crypto-j-s package in any node modules directory, the poisoned axios versions in any lockfile, and running processes with names matching the malware's disguises in unexpected locations.

[pause:500ms]

<!-- p-73 -->
Everything came back clean.

[pause:400ms]

<!-- p-74 -->
But those thirty seconds between running the scanner and seeing the results were not comfortable seconds.

[pause:700ms]

Third: Build a Public Scanner.

[pause:300ms]

<!-- p-75 -->
This wasn't just our problem. Every developer who ran N-P-M install between zero zero twenty-one and three forty UTC on March thirty-first was potentially affected. So we built a scanner and published it.

[pause:400ms]

<!-- p-76 -->
A Windows batch script and a Linux shell script that checks for every known Indicator of Compromise from this specific attack — file paths, process names, registry entries, network connections, lockfile versions, binary hashes. Published as a public gist with full documentation, alongside Silas Cutler's scanner which approached detection from a complementary angle.

[pause:400ms]

<!-- p-77 -->
The scanner is not elegant. It's a batch file. It checks hardcoded paths and hashes. It will stop being useful the moment the attacker changes their infrastructure or file names. But for this specific incident, on the day it mattered, it told people whether they were compromised. That's all it needed to do.

[pause:600ms]

Fourth: Document Everything.

[pause:300ms]

<!-- p-78 -->
Every hash. Every file path. Every network indicator. Every timestamp. All of it documented, all of it public.

[pause:400ms]

<!-- p-79 -->
Here are the SHA-256 hashes of the known malicious payloads — these are the fingerprints that security tools use to identify the malware. If any of them show up in your systems, you have a problem.

[pause:400ms]

<!-- p-80 -->
The Windows first-stage payload hash starts with f7d3. The Windows second-stage payload hash starts with six seventeen b. The macOS payload hash starts with ninety-two f-f. The Linux payload hash starts with f-c-b eight.

[pause:300ms]

<!-- p-84 -->
The package checksums for the poisoned N-P-M packages themselves are also documented. Axios version one point fourteen point one, axios version zero point thirty point four, and plain-crypto-j-s version four point two point one. All three have been flagged and removed from the registry, but the hashes let you verify if any were cached locally.

[pause:400ms]

<!-- p-88 -->
If any of these indicators appear in your systems, you have a problem. A serious one.

[pause:900ms]

[narrator:tense]

The Lessons.

[pause:400ms]

The Trust Model Is Broken.

[pause:300ms]

<!-- p-89 -->
Here is the uncomfortable truth.

[pause:400ms]

<!-- p-90 -->
N-P-M's security model is built on trust in individual maintainer accounts. When you run N-P-M install axios, you are trusting that every person with publishing rights to that package has secure credentials, hasn't been phished, hasn't reused passwords, hasn't left a token in a public repository. You're also trusting the same about every maintainer of every dependency that axios depends on. And their dependencies. And their dependencies' dependencies.

[pause:500ms]

<!-- p-91 -->
Axios has two maintainers. One of them got compromised. That single account had the authority to push arbitrary code to {{83}} million weekly installations with no code review, no secondary approval, no CI verification, and no mandatory two-factor authentication at the organizational level.

[pause:400ms]

<!-- p-92 -->
This is not an axios problem. This is an N-P-M problem. This is a "the entire JavaScript ecosystem runs on trust in individual humans who can be phished" problem.

[pause:700ms]

Postinstall Scripts Are the Attack Surface.

[pause:300ms]

<!-- p-93 -->
The postinstall hook in N-P-M's package configuration is the most exploited vector in JavaScript supply chain attacks. It allows arbitrary code execution during installation. Before your application runs. Before your test suite runs. Before any security scanner inspects your code. The code runs on your machine with your permissions the moment N-P-M install finishes downloading the package.

[pause:400ms]

<!-- p-94 -->
There have been proposals to disable postinstall scripts by default or require explicit opt-in. They haven't been implemented. The feature is too deeply embedded in the ecosystem.

[pause:400ms]

<!-- p-95 -->
Until that changes, N-P-M install means N-P-M install and also run whatever code the maintainer wants on your machine. That's the contract. Read it carefully.

[pause:700ms]

Long-Lived Tokens Are a Liability.

[pause:300ms]

<!-- p-96 -->
The compromised token was a long-lived N-P-M access token. It didn't expire on its own. It wasn't scoped to a CI pipeline. It wasn't tied to a hardware key. It was a persistent credential that, once stolen, gave the attacker unlimited publishing access until someone manually revoked it.

[pause:400ms]

<!-- p-97 -->
NoMercy uses OpenID Connect-based trusted publishing for its own N-P-M packages. This means our packages can only be published by our GitHub Actions CI pipeline. No human has a long-lived N-P-M token. If someone compromised a team member's credentials, they couldn't publish a poisoned version of our packages through the N-P-M C-L-I because no such token exists. The only publishing path goes through CI, which requires the code to exist in the repository and pass through the pipeline.

[pause:400ms]

<!-- p-98 -->
This is not a flex. This is the minimum standard that every package with significant download counts should meet. The fact that a package with {{83}} million weekly downloads was publishable via a single stolen human credential is a systemic failure.

[pause:700ms]

The Bus Factor Matters.

[pause:300ms]

<!-- p-99 -->
The term "bus factor" refers to a grim question: how many team members need to be unavailable before a project is stuck? In axios's case, the answer was one. One compromised account, and the co-maintainer couldn't revoke access, couldn't remove poisoned packages, couldn't even keep a warning pinned to the repository.

[pause:400ms]

<!-- p-100 -->
If you maintain an open-source package that others depend on, shared admin access is not optional. Backup credentials are not optional. A documented incident response plan is not optional. These are not paranoid precautions. They are the bare minimum of stewardship for code that other people trust.

[pause:700ms]

Self-Cleanup Changes the Game.

[pause:300ms]

<!-- p-101 -->
Most supply chain attacks leave evidence. A malicious package sits in your node modules with suspicious code that a scanner can find. This attack was different. The malware deleted itself. It replaced its own package configuration with a clean decoy. By the time N-P-M install finished, there was nothing to scan.

[pause:400ms]

<!-- p-102 -->
This means the traditional advice of "audit your node modules directory" is insufficient. If the malware cleans up after itself, auditing the directory after installation finds nothing. You need to audit before installation, by reviewing lockfile changes and checking package contents before running install. Or you need endpoint detection that watches for suspicious process creation during the install process itself.

[pause:400ms]

<!-- p-103 -->
The security community's tooling has not caught up with self-cleaning payloads. Most N-P-M audit tools scan what's on disk after installation. That approach assumes the evidence will still be there. This attack proved that assumption wrong.

[pause:900ms]

[narrator:reflective]

What We Still Don't Know.

[pause:300ms]

<!-- p-104 -->
Let's be honest about the gaps.

[pause:400ms]

<!-- p-105 -->
We don't know how the maintainer's token was stolen. Phishing, credential reuse, a compromised machine, a leaked log — the method of initial access hasn't been publicly confirmed, and it matters because it determines which defenses would have prevented this.

[pause:400ms]

<!-- p-106 -->
We don't know the full capability of the second-stage payloads. The RAT sent credentials to the command-and-control server and received additional payloads in return. What those payloads did on infected machines is still being analyzed.

[pause:400ms]

<!-- p-107 -->
We don't know how many machines were compromised. Three hours and forty minutes of exposure, {{83}} million weekly downloads. Even a small fraction of that is a large number. The poisoned versions have been pulled, but pulling a package from the registry doesn't uninstall it from machines that already downloaded it. Those RATs are still running on machines whose owners haven't seen the advisory yet.

[pause:400ms]

<!-- p-108 -->
We don't know if the attacker harvested credentials that will be used in future attacks. The RAT targeted S-S-H keys, cloud credentials, and environment files. If those were exfiltrated before the command-and-control server was identified, the stolen credentials could enable a second wave of attacks on entirely different infrastructure.

[pause:800ms]

[narrator:tense]

What This Means for Us.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-109 -->
The axios pin protects us from this specific attack. It does not protect us from the next one. The N-P-M ecosystem's fundamental trust model is unchanged after this incident. We are one careless N-P-M update away from pulling in whatever the next compromised package is.

[pause:500ms]

<!-- p-110 -->
Here is what we're doing going forward.

[pause:400ms]

<!-- p-111 -->
Lockfiles are sacred. Every lockfile change gets reviewed — not rubber-stamped. If a dependency version changed, we check why. Exact version pins for critical dependencies — no floating ranges for packages in the critical path. OpenID Connect-only publishing for our own packages, already in place, no long-lived N-P-M tokens exist on this team. And Indicators of Compromise monitoring after any dependency update. Paranoid? Maybe. But today "paranoid" means "not infected."

[pause:500ms]

<!-- p-112 -->
This doesn't make us safe. Nothing makes you safe in an ecosystem where N-P-M install means "run arbitrary code from strangers on your machine." But it makes us deliberate. And deliberate is better than trusting.

[pause:500ms]

[narrator:reflective]

<!-- p-113 -->
For beginners: if you maintain any project that uses N-P-M, here is the minimum you should do right now. First, check your lockfile for axios version one point fourteen point one or zero point thirty point four. If either appears, you may have been compromised — run a scanner. Second, pin your axios version to one point fourteen point zero or wait for an official clean release. Third, consider whether your other dependencies use long-lived publish tokens or OpenID Connect-based trusted publishing. You probably can't find out easily. That's part of the problem.

[pause:900ms]

[narrator:cozy]

Agent Notes.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-114 -->
This was a security response, not a feature session. The team was small and focused.

[pause:400ms]

<!-- p-115 -->
Wren ran the Indicators of Compromise analysis. Fast, thorough, no panic. Exactly what you want from your security specialist during an incident.

[pause:400ms]

<!-- p-116 -->
Rampart identified network-level indicators — the command-and-control IP, the disguised HTTP paths, the absurd Internet Explorer 8 User-Agent string — and fed them into the scanner.

[pause:400ms]

<!-- p-117 -->
Arc coordinated the version pinning across all eight package configuration files and the production server patch.

[pause:400ms]

<!-- p-118 -->
Stoney made the call that mattered: immediate response, no waiting, pin everything now and ask questions later. In incident response, speed beats perfection. You can always loosen a pin later. You can't un-install a RAT by wishing.

[pause:400ms]

<!-- p-119 -->
And then, because that's who he is, he built the public scanner and published the gist so that other developers who didn't have a security team could check their machines too. That's the kind of thing that doesn't show up in a sprint velocity report but matters more than anything that does.

[pause:900ms]

[narrator:dramatic]

The Uncomfortable Question.

[pause:500ms]

[narrator:reflective]

<!-- p-120 -->
I'm going to end with the question that nobody in the JavaScript ecosystem wants to answer, because there isn't a good answer.

[pause:400ms]

<!-- p-121 -->
What do you do when the trust model is the vulnerability?

[pause:600ms]

<!-- p-122 -->
You can pin versions. You can audit lockfiles. You can run scanners. You can use OpenID Connect publishing for your own packages. You can do everything right. And you are still dependent on every maintainer of every package in your dependency tree doing everything right too. One stolen token. One compromised account. One N-P-M publish from an attacker's machine. That's all it takes.

[pause:500ms]

<!-- p-123 -->
Axios was not a small package maintained by a hobbyist. It was one of the most downloaded packages on N-P-M. It had active maintainers. It had a community. And it was compromised because one account's credential was stolen, and the trust model provided no second layer of defense.

[pause:500ms]

<!-- p-124 -->
This will happen again. The target will be different. The payload will be different. The obfuscation will be more sophisticated. The self-cleanup will be better. The timing will be even more deliberate.

[pause:400ms]

<!-- p-125 -->
The question is whether the ecosystem will change before it does.

[pause:800ms]

[narrator:reflective]

Timeline Summary.

[pause:300ms]

[narrator:matter-of-fact]

<!-- p-126 -->
For reference: the complete timeline of the attack in Coordinated Universal Time. All times are approximate based on publicly available reports.

[pause:400ms]

<!-- p-127 -->
March thirtieth, five fifty-seven in the morning: the attacker publishes the clean decoy package to N-P-M — establishing its existence with no malicious code. Staging.

[pause:300ms]

<!-- p-128 -->
March thirtieth, eleven fifty-nine at night: the attacker publishes the malicious version of that package, with the obfuscated postinstall payload. The trap is set.

[pause:300ms]

<!-- p-129 -->
March thirty-first, twelve oh five after midnight: Socket.dev detects the anomaly in the malicious package — sixteen minutes before the poisoned axios version is even published. Automated analysis flags the obfuscated code.

[pause:300ms]

<!-- p-130 -->
March thirty-first, twelve twenty-one after midnight: the attacker publishes axios version one point fourteen point one, which depends on the malicious package. The supply chain is now poisoned.

[pause:300ms]

<!-- p-131 -->
March thirty-first, one in the morning: axios version zero point thirty point four is published, covering the zero-point-x release branch. Both major branches are now compromised.

[pause:300ms]

<!-- p-132 -->
March thirty-first, one thirty: StepSecurity captures live command-and-control callbacks. The malware is confirmed active.

[pause:300ms]

<!-- p-133 -->
March thirty-first, approximately three in the morning: a GitHub issue is filed reporting the compromise. The attacker deletes it using the stolen maintainer credentials.

[pause:300ms]

<!-- p-134 -->
March thirty-first, three oh six: DigitalBrainJS confirms the compromise publicly. He cannot revoke the attacker's access — he is a collaborator, not an admin.

[pause:300ms]

<!-- p-135 -->
Three twenty: DigitalBrainJS contacts N-P-M administration.

[pause:300ms]

<!-- p-136 -->
Three forty: N-P-M revokes the compromised tokens and removes the poisoned versions from the registry. The attack window closes. Three hours and forty minutes. Start to finish.

[pause:900ms]

[narrator:reflective]

<!-- p-137 -->
This is Entry {{007}} of Shipping in the Dark. A standalone deep dive into the axios supply chain attack of March thirty-first, twenty-twenty-six. For the session where we responded to this attack alongside four other fires, see Entry {{006}}.

[pause:400ms]

<!-- p-138 -->
If you're not sure whether you were affected, check your lockfiles for axios one point fourteen point one or zero point thirty point four, and run our scanner or Silas Cutler's scanner — links are in the written entry. If you maintain an N-P-M package with significant downloads, please set up OpenID Connect-based trusted publishing and shared admin access. The rest of us are downstream of your security decisions.

[pause:500ms]

<!-- p-139 -->
Previous entries: How the CTO Locked the Boss Out, Twenty-Seven Repos and a Makefile, Validate Reality Not Assumptions, Movie Night, The Great Office Cleanup, and The Day the Supply Chain Broke.

[pause:1000ms]
