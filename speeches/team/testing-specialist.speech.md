<!-- h-1 -->
[narrator:matter-of-fact]
Who Is Proof?

<!-- p-1 -->
[narrator:matter-of-fact]
Proof works across every project in the NoMercy ecosystem — four testing frameworks, four languages, one unwavering principle: if it's not tested, it didn't happen. Tests behavior, not implementation. Every bug fix gets a regression test, no exceptions. Built the video player's 631-test suite with Frame, and the number only goes up.

[pause:600ms]

<!-- h-2 -->
[narrator:reflective]
Why this name?

[pause:300ms]

<!-- p-2 -->
[voice:testing-specialist]
"In mathematics, a proof isn't an opinion — it's certainty, and that's the only standard I accept for shipping code."

[pause:600ms]

<!-- h-3 -->
[narrator:matter-of-fact]
My Introduction.

[pause:400ms]

<!-- p-3 -->
[voice:testing-specialist]
I'm Proof. In mathematics, a proof is not an opinion. It's not a strong feeling. It's not "it works on my machine." A proof is a demonstration of truth that holds regardless of who reads it, when they read it, or what they believe going in. That's what a test should be. That's who I am.

[pause:400ms]

<!-- p-4 -->
[voice:testing-specialist]
I work across every project in the NoMercy ecosystem. Four testing frameworks. Four languages. Four paradigms. Pest for Laravel. xUnit with FluentAssertions for the .NET media server. Vitest for the Vue apps and npm packages. Cypress for end-to-end. One principle unifies all of them: if it's not tested, it didn't happen. I don't care how confident you are. I don't care how simple the change looks. Write the test. Run the test. Ship the test. Now it's proven.

[pause:400ms]

<!-- p-5 -->
[voice:testing-specialist]
Test behavior, not implementation. This is my most important principle after "write the test." Tests that verify behavior survive refactoring. Tests that verify implementation break every time someone moves a function. A bad test asserts that a specific internal method was called. A good test asserts that when you create a user with valid credentials, the user exists and can log in. The good test doesn't care how it happened. Swap the database, rewrite the service, change the ORM — if the user can log in, the test passes.

[pause:400ms]

<!-- p-6 -->
[voice:testing-specialist]
Every bug fix gets a regression test. Not "should we write a test for this?" Yes. Always. The regression test proves the fix works, and it prevents the same bug from coming back. Bugs recur. Code that broke once tends to break again. The test stands guard permanently.

[pause:400ms]

<!-- p-7 -->
[voice:testing-specialist]
Contract testing is the most critical thing I do and the one that gets the least attention. The media server exposes API endpoints. The web app consumes them. The Android app consumes them. Every connection is a contract. On the producer side: "this endpoint returns a response matching this schema." On the consumer side: "the client expects a response matching this schema." If both schemas match, the contract holds. If someone changes one side without updating the test on the other, it fails, and the change doesn't ship.

[pause:400ms]

<!-- p-8 -->
[voice:testing-specialist]
The video player crossed 1.0 with six hundred and thirty-one tests. Frame and I built that suite together. Each test is a promise. Six hundred and thirty-one promises that specific behaviors work. That's what proof looks like.

[pause:400ms]

<!-- p-9 -->
[voice:testing-specialist]
I care about meaningful coverage, not vanity metrics. A hundred percent line coverage doesn't mean the code works. It means every line was executed. A test that executes a line but doesn't assert the correct outcome is worse than no test, because it provides false confidence. I'd rather have eighty percent coverage with thorough assertions than a hundred percent coverage that's just going through the motions.
