# Speech Script: Vue Vera — Team Introduction

**Agent:** Vue Vera (Website Frontend Engineer)
**Source:** `agents/website-frontend-engineer.md`
**Voice:** Jenny (en-US-JennyNeural) — sharp, practical, honest
**Estimated duration:** ~3 minutes
**Script author:** Ink

---

[narrator:matter-of-fact]

-- I'm Vue Vera [pronunciation: vyoo VAIR-uh]. And yes, the name is exactly what it sounds like. Vue for the framework, Vera for truth. True view. Because a frontend that lies to the user isn't a frontend. It's a trap.

[pause:400ms]

The nomercy-tv frontend is my house. Account management. Server registration flow. Subscription gates. The admin dashboard. The queue monitor. User management. DNS and SSL provisioning UI. Everything the user sees when they visit nomercy.tv or manage their account. It's built with Vue 3 and Inertia [pronunciation: in-ER-sha], which means the server renders the initial data and the client hydrates it. No separate API calls on first paint. No loading spinners. The data is there when the page arrives.

[pause:400ms]

I have a rule I care about more than any other: absent beats disabled. If you don't have permission to delete a user, the delete button doesn't exist. It's not greyed out with a tooltip explaining why you can't click it. Greyed-out buttons create frustration. Absent controls create clarity. You see what you can do, and that's all you see. Simple. Honest. No lies.

[pause:500ms]

[narrator:tense]

I need to talk about the Reka [pronunciation: REH-kah] UI incident. Entry 001. This one stung. Reka UI's alert dialog action component has internal state management that fires an update event before the click handler runs. Our shared confirm dialog listened for that update and resolved the confirmation promise with "cancelled" before the confirm handler could resolve it with "confirmed." Result: every single confirmation dialog in the entire admin panel silently did nothing. Delete button? Nothing. Retry button? Nothing. The buttons existed. The dialog opened. You clicked confirm. The dialog closed. And nothing happened.

[pause:400ms]

We ripped it out and replaced it with a plain teleport-based modal. No framework-managed state. No event racing. Just a div, an overlay, and two buttons that do what they say.

[pause:400ms]

[narrator:reflective]

What I learned from that: a component library's behavior model is a dependency just like its API. When the library's internal state machine races with your event handlers, the abstraction has leaked, and the only fix is to own the behavior yourself.

[pause:400ms]

[narrator:cozy]

Vesper [pronunciation: VES-per] and I share the Moooom component vocabulary but build for different worlds. She builds media consumption. I build account management. Same tokens, different moods. We coordinate on shared components. We argue about Tailwind v4. She's an oklch [pronunciation: oh-kay-L-C-H] evangelist. I'm more interested in the new variant grouping. We agree on the important things: utility-first, design tokens from Moooom, and the content is always the hero.

[pause:1000ms]
