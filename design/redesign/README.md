# Companion redesign: design source

The redesign for the multi-user, AI-connected version of the app. These files are copies of the design canvas at <https://claude.ai/artifact/6D1kRABcirsw3F9yvXpdrS> (private until shared from its Share menu). The canvas is the place to view and click through the design. These files are the reference for implementing it.

## Files

Each `*.dc.html` is one screen. They are plain HTML with inline styles, plus a small logic block at the bottom (`class Component extends DCLogic`) for the clickable screens. `{{name}}` placeholders are filled from that block's `renderVals()`. The files load `./support.js` from the canvas host, so opening them straight from disk shows the markup but not the dynamic parts. `canvas.json` is the canvas layout (positions, titles, order).

| File | Screen | Clickable | Data it needs (from the plan) |
|---|---|---|---|
| `OnboardingGoal.dc.html` | Onboarding 1/3: goal, priority muscles, experience, target | yes | `goals`, `profiles.experience` |
| `Onboarding.dc.html` | Onboarding 2/3: days/week, session length, equipment, injuries | yes | `constraints` |
| `PlanPreview.dc.html` | Generated program preview before saving | no | `generateProgram()` output, weekly sets per muscle vs effective range |
| `Main.dc.html` | Today: check-in, block progress, today's session, goal, habits | no | `useToday()`, `checkins`, `autoregulate()` result |
| `Workout.dc.html` | Live session: suggested load, sets with reps/RIR, rest timer | yes | `nextPrescription()`, `set_logs`, realtime sync |
| `Progress.dc.html` | Goal trend chart, weekly review, measurements | no | `get_progress`, `weeklyReview()` |
| `Nutrition.dc.html` | Habits (user-defined) and morning check-in | yes | `habits`, `habit_logs`, `checkins` |
| `Settings.dc.html` | Profile, connected AI apps, coach memory, export, delete account | no | `profiles`, `coach_notes`, OAuth grants |
| `ChatInline.dc.html` | Example conversation in a host chat: inline logging and an `adjust_program` diff | yes | MCP widgets |
| `WidgetKit.dc.html` | One card per MCP tool: onboarding form, progress chart, calendar, weekly review, check-in | no | MCP widgets (`packages/widgets`) |

The tab bar has five tabs: Today, Train, Progress, Habits, You.

## Tokens

| Token | Value | Use |
|---|---|---|
| `chalk` | `#F2F2EE` | App background |
| `surface` | `#FFFFFF` | Cards, with a `#E4E4DE` 1px border |
| `ink` | `#111113` | Text, primary buttons, selected states |
| `graphite` | `#141518` | Hero / dark cards |
| `graphite-2` | `#24252A` | Chips and controls on dark cards |
| `volt` | `#D4F55A` | The single accent. Only on dark surfaces or as a filled button with ink text |
| `volt-ink` | `#6F8F12` / `#3E6B12` | Accent on light backgrounds (priority markers, positive deltas) |
| `muted` | `#5C5C63` | Secondary text (passes 4.5:1 on chalk) |
| `muted-dark` | `#A9A9B0` | Secondary text on graphite |
| `hairline` | `#ECECE6` / `#D8D8D1` | Dividers / unselected control borders |
| `danger` | `#A3311F` on border `#E8C4BD` | Account deletion only |

Type: **Space Grotesk** 600 for headings and numbers (28px screen titles, 20–40px stats, letter-spacing −0.02em). **Inter** 400–600 for everything else (13–15px body, 11–12px labels, uppercase labels at 0.06–0.08em tracking).

Shape: cards 16–24px radius, controls 10–16px, pills 999px. 20px side padding on phone, 12px gaps between cards. Touch targets are at least 44px.

## Rules carried by the design

- The engine suggests loads and the user can override. Show the override ("your override, suggested 82.5").
- Autoregulation is always explained in place ("Trimmed from 30 sets for short sleep").
- AI program changes are shown as a before/after with Apply / Not now. Nothing is saved without a press.
- Coach memory is visible and deletable item by item.
- Chat widgets have no app chrome, one primary action, and a fixed width of 360 or 720px.
- Numbers in the mockups (FFMI 18.1, bench 82.5 kg, weekly review stats) are sample data. Bracketed values like `[your target]` are placeholders.
