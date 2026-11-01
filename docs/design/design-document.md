# Herculean: design document

Version 0.6 · 1 November 2026 · Minimalist

> Changes since 0.5: A13, the reset email, and A14, the page its link opens (sections 5 and 9). An expired link on A14 goes to A10 with an error line. The area panel `areas/A-Account.png` doesn't show any of this. Screens are rendered in dark only, directly in `screens/`; light stays in the tokens and the app.

> Changes since 0.4: A02, the splash without a connection (section 9). The area panel `areas/A-Account.png` doesn't show it. The logo's type role, its glow and the sign in logo area in the tokens. The glow is half as strong on A00 to A03, and ERCULEAN sits in the vertical middle of the pillars instead of on their baseline (section 3). The logo area shrinks on shorter phones and keeps room for field errors, so sign in never scrolls; at 844 px it is 344 px (sections 3 and 4.2). Pages cross-fade instead of sliding, because on Android a slide showed the page you leave empty while it moved (section 6).

> Changes since 0.3: a spacing scale, the dimmed opacity and the spinner in the tokens (sections 4.4 and 5). Error states for forms, which the canvas does not show, and the bottom action box with the keyboard open (section 5). A01 and A20 link to each other with a text link line instead of a secondary button (sections 5 and 9). Their screens, HTML and source show it; the area panel `areas/A-Account.png` still shows the old button. Page transitions (section 6). Radio cards, steppers and quick picks, with their sizes and type roles in the tokens; on A30 the rest time is shown, not typed, and the card spacing is on the scale (sections 5 and 9). The quick picks on A30 and H15 are 1 to 5 minutes, and a new account starts at 3:00 instead of 1:30.

> Changes since 0.2: the tab bar's padding and label letter spacing are tokens, and its bottom padding follows the phone's safe area (section 5).

> Changes since 0.1: R03 week plan rows read "Rest day" instead of "Not planned". Discard workout now shows an undo bar on W01. Delete routine and delete exercise no longer have undo bars (section 7).

> In this package: the canvas boards are rendered under `screens/`, the area panels with their flows under `areas/`, and the original Claude Design source under `source/`. See `README.md` and `screen-index.md`.

Herculean is a workout log for people who train on a fixed weekly split. You plan routines, put them on the days of the week, log your sets at the gym, and see your history and progress per exercise.

This document describes the design on the canvas "Herculean app screens" (Claude Design). It covers the canvas, the brand, the visual language, the components, the rules every screen follows, and every screen by area.

---

## 1. Scope

- **Platform:** phone app, designed at 390 × 844 px (iPhone 14/15 size). Long screens are drawn at full scroll height and marked "full scroll".
- **Screens:** 90 app screens in six areas, plus one brand board.
- **Themes:** dark (default) and light, two accent colors, four fonts and two corner styles. Each one can be switched on every board through Tweaks.
- **Not in scope yet:** see section 11, Parked.

---

## 2. How the canvas is organized

| Part | What it is |
|---|---|
| **B01 Brand** | Logo concepts and the chosen logo. At the top of the canvas. |
| **Screen index** | Every screen by ID, with its row and position. Below the brand board. |
| **Area panels** | One panel per area, top to bottom: A Account, H Home, W Workout, L Logging, R Routines, E Exercises. |

**Screen IDs.** One letter for the area, then two digits. The first digit is the flow (row) and the second is the screen. For example, W42 is in Workout, row W4x (Month), screen 2. Board titles read `ID · Area › Screen · state`.

**Rows.** Inside an area panel, each flow is one horizontal row with a dashed outline. The starting screen is on the left, and the screens it opens follow to the right with labelled arrows. Each row has a title (for example "W3 · Other days") and a one-line note saying how you get there.

**"Already designed" notes.** A screen is never drawn twice. When a flow reaches a screen that exists elsewhere, a dashed note names it and its row instead (for example "Same as L20 → L22 → L23").

---

## 3. Brand

- **Name:** Herculean = Hercules + lean.
- **Mark:** the Pillars of Hercules, drawn to match Chakra Petch: square stems, 45° cut corners on the capitals and bases, and a crossbar in the accent color that leans forward. It's used alone for the app icon and small spaces.
- **Logo in the app:** the pillars replace the H. They are scaled 1.3× so they stand taller than ERCULEAN, like an initial, and ERCULEAN sits in their vertical middle. "ERCU" is in the text color and "LEAN" is in the accent text color.
- **Plain wordmark:** HERCULEAN in Chakra Petch Bold with wide letter spacing. Below about 18 px, use it instead of the pillars, because the pillar capitals blur.
- **Where the logo appears:** A00 and A02 Splash (centered, with a soft accent glow) and A01/A03 Sign in (in the same place, so it carries over from the splash). On sign in, it sits in the middle of an area that takes the height the form leaves, less `size.signInErrorRoom` for an error under each field, and at most `size.signInHeroMax`. So the screen never scrolls before the keyboard opens, even with errors. The keyboard scrolls the screen and never resizes this area. At 844 px the area is 344 px, as drawn.
- **Glow:** `primary` at `opacity.glow`, fading out in an ellipse. It stays soft, a hint of the accent behind the logo.

---

## 4. Visual language

### 4.1 Colors

Every color is a token (`{{c.*}}`). No screen uses a raw hex value for app UI. Machine-readable copy: `tokens/design-tokens.json`.

**Neutrals**

| Token | Dark | Light | Used for |
|---|---|---|---|
| `bg` | #050506 | #F4F5F7 | Screen background, tab bar |
| `card` | #0F1012 | #ECEEF1 | Cards, sheets, the bottom action box |
| `raised` | #17181B | #E2E5E9 | Inputs, secondary buttons, undo bar, header icon buttons |
| `border` | #2C2F34 | #D0D4DA | Every 1px border and divider |
| `text` | #F2F3F5 | #0A0B0D | Main text |
| `muted` | #A9AEB6 | #4F555D | Labels, secondary text, inactive tabs |

**Accent (Settings › Color, H13)**

| Palette | Mode | `primary` (buttons, fills) | `primaryText` (accent text) | `onPrimary` (text on primary) |
|---|---|---|---|---|
| **Racing blue** (default) | Dark | #1A55E6 | #7EA2FF | #FFFFFF |
| | Light | #1446C8 | #1446C8 | #FFFFFF |
| **Titanium** | Dark | #C9CED6 | #DDE1E6 | #050506 |
| | Light | #2A2D33 | #1446C8 | #FFFFFF |

The accent is used for primary buttons, the active tab, today in the week strip and month, checked sets, links and "In progress".

**Status and feedback**

| Token | Dark | Light | Meaning |
|---|---|---|---|
| `success` | #4ADE80 | #166534 | Completed / Done |
| `skipped` | #FB923C | #9A3412 | Skipped |
| `danger` | #F87171 | #DC2626 | Missed, delete and remove actions |
| `onDanger` | #050506 | #FFFFFF | Text on danger buttons |
| `warn` | #F5B83D | #B45309 | Warning icon only (L30, L31) |
| `primaryText` | (accent) | (accent) | In progress |

Status always shows as a colored 8 px dot and a label in the same color. Week strip and calendar markers use a short bar in the status color, and the month screen has a legend. Color is never the only signal: there is always a word, and the day cells have full aria labels such as "20 October, back and shoulders 1, done".

### 4.2 Typography

- **Font:** Chakra Petch (default). Oxanium, Exo 2 and Saira are alternatives in Tweaks. They load from Google Fonts in weights 400–700.
- **Numbers:** tabular numerals everywhere, so weights, reps and timers line up.

| Role | Size / weight | Notes |
|---|---|---|
| Logo | 32 / 700 | Line height 1, letter spacing 0.14em |
| Page title | 32 / 700 | Line height 1.05, letter spacing −0.01em |
| Card title, sheet title | 22 / 700 | |
| Big stat number | 24 / 700 | Month summary tiles |
| Stat value | 18 / 700 | Best set, Done count, totals |
| List item name, body strong | 16 / 700 | Exercise and routine names |
| Input text | 16 | Prevents zoom on iOS |
| Primary button | 15 / 700 | Uppercase, letter spacing 0.06em |
| Body | 14 | Line height 1.45–1.55 for long text |
| Secondary button, text link | 13 / 600 | Uppercase, letter spacing 0.06em |
| Eyebrow, field label, section label | 12 / 600 | Uppercase, letter spacing 0.1em, muted |
| Meta line | 12–13 | Muted, for example "7 exercises · 19 sets" |
| Tab label | 11 | 700 when active, 500 when not. Letter spacing 0.04em |

### 4.3 Corners

| Element | Sharp (default) | Soft |
|---|---|---|
| Card | 6 px | 16 px |
| Control (button, input) | 4 px | 10 px |
| Pill (chip, status dot) | 3 px | fully round |
| Check box | 3 px | 8 px |
| Sheet top corners | 10 px | 24 px |

### 4.4 Spacing and sizes

- **Side padding:** 16 px on every screen.
- **Top padding:** 48 px on tab screens and 40 px on sub-pages with a back link.
- **Touch targets:** at least 44 px. Text links and icon buttons get padding so their hit area is 44 px.
- **List rows:** at least 56 px; radio and option rows at least 60 px.
- **Chips:** 36 px high.
- **Gaps:** 8 px between stacked buttons, 6 px between chips, and 14–20 px between sections.
- **Spacing scale:** `space` in the tokens, 6, 8, 12, 16 and 24 px (xs to xl). Every other gap and inset uses it. On A20, for example: 6 px inside the heading, 8 px between a label, its input and its helper, 12 px inside an input, 16 px between fields and 24 px between the heading, the form and the terms.

### 4.5 Icons

Inline stroke icons (24 px grid, stroke 1.75–2, square line caps), drawn at 16–22 px. No emoji. Icon-only buttons always have an aria label.

---

## 5. Components

### Buttons
| Type | Look | Used for |
|---|---|---|
| **Primary** | 48 px, filled `primary`, 15 px uppercase bold | The main action: Save …, Start workout, Load routine, Sign in |
| **Secondary** | 44 px, outlined, `raised` fill, 13 px uppercase | Cancel, Other routine, Skip workout, View workout |
| **Danger** | 48 px, filled `danger` | The confirm action in delete and remove confirms |
| **Danger text** | 44 px, `danger` text | Delete … inside edit screens (R20, E20) and Remove set |
| **Text link** | 44 px tall, 13 px uppercase, `primaryText` | Forgot password?, Create exercise, Add set, and the way between A01 and A20 |
| **Header icon button** | 44 × 44 px, outlined, `raised` fill | W01 calendar, E01 groups, E10 edit |

**Waiting state.** Every button that waits on the server shows a spinner and its label in the -ing form, and the other actions on the screen are dimmed (A03 is the reference). The spinner is `size.spinner` and turns every `motion.spinMs`, and stands still when the phone asks for reduced motion. Dimmed actions use `opacity.dimmed`. This applies to Create account, Send reset link, Save password, Finish setup, Save workout and every Save in Settings.

### Bottom action box
Bottom actions sit in a box pinned to the bottom of the screen. It has the `card` fill, a top border and 12/16/28 px padding. Above a navigation bar or home indicator, the bottom padding is that bar plus 12 px, so the buttons never touch it. The primary button comes first and Cancel goes below it. While the keyboard is open, the box stays behind it and only the form makes room. The keyboard's return key moves to the next text field. On the last field of a form it does the primary action; when choices that are not text follow, it closes the keyboard.

### Inputs
44 px high, `raised` fill, 1 px border. Every input has a visible uppercase label above it and helper text below when needed (for example "At least 8 characters."). Password fields have a show/hide eye button.

### Form errors
The canvas shows no error states, so every form follows these:
- **Field error:** the message replaces the helper text under the field, in `danger`, and the field's border turns `danger`. It covers the form's own checks and the API's field errors, for example "An account with this email already exists." under Email on A20.
- **Any other error** (no connection, a server error, an error with no field): one line in `danger` at the top of the form, above the first field, for example "Couldn't create the account. Try again." The form scrolls up to show it. It clears when a field changes or the action is tried again.

### Chips
36 px filter chips: "All" plus one per group, in the group order set in E30. The selected chip uses the accent. Chips wrap onto new lines; this was decided and is kept.

### Cards
`card` fill, 1 px border, card radius, 16 px padding. A status card has an eyebrow with the status, a 22 px title and a meta line.

### Lists
Grouped lists sit inside one card, with rows divided by 1 px borders. Section labels above lists are 12 px uppercase and muted. Long names wrap; they are never cut off with "…".

### Radio cards
A choice of two or three side by side, like Units on A30: each card is at least `size.optionRowMin` tall, with 12 px padding, the name in `listItemName`, a `meta` line and a radio circle (`size.radio`). The chosen card has the `primary` border and `raised` fill.

### Steppers and quick picks
A value between − and + buttons (`size.stepper`), like the default rest time on A30 and H15. The value is shown in `stepperValue`, not typed; the buttons and the quick picks reach every allowed value. At a limit, its button is dimmed. Screen readers get one adjustable control that says the value in words. Quick picks are a row of common values in `quickPick` type; the one that matches the value is filled with `primary`.

### Email
An email uses the same tokens as the app, in a column of at most 480 px. It is always dark, because email apps can't follow the app's theme. Its layout is built from tables with inline styles, so it holds in every email app. The logo is `brand/wordmark-on-dark.png`, because email apps drop SVG. Chakra Petch shows where the email app allows web fonts, and the phone's system font elsewhere. A plain text copy goes with it. A13 is the reference.

### Sheets
- **Look:** a dimmed backdrop (62% black), a sheet rising from the bottom with rounded top corners and a 36 × 4 px grabber, and a 22 px title with a one-line explanation.
- **Actions:** a 44 px close X at the top right, and Save … and Cancel at the bottom.
- **Behavior:** a sheet closes back to the screen that opened it.

### Confirmations
A centered question ("Delete Chest and arms 1?"), one sentence on what happens and what stays, a danger button that repeats the verb ("Delete routine"), and Cancel below.

### Undo bar
- **Look:** 56 px, with the `raised` fill and a border. It sits above the tab bar and dims the screen behind it.
- **Content:** two lines (what happened and what it happened to) and an Undo button. Example: "Set 3 removed · Smith machine incline bench press". L12 is the reference.

### Tab bar
Four tabs: Home, Workout, Routines, Exercises. Each item is 52 px with a 22 px icon, a 4 px gap and an 11 px label. The active tab is in the accent color and bold. The bar has 8 px padding at the top and sides. Its bottom padding is the phone's safe area, at least 8 px; the boards draw it as 28 px.

### Resume bar
When a workout is running, a bar above the tab bar shows the routine, the progress and the time, with a Resume button (H02). It shows on every tab.

### Loading
A skeleton in the shape of the real content, with a gentle pulse that turns off when the phone is set to reduce motion. Each loading screen also has a screen-reader message, such as "Loading today's workout".

### Empty states
A short title, one sentence saying what to do, and the one action that fixes it. Examples: "No routines yet" with Create routine, and "No exercises yet" with Create exercise.

---

## 6. Navigation

- **Tabs:**
  - **Home** is today at a glance.
  - **Workout** is today, the week, other days and the month.
  - **Routines** is the week plan and your routines.
  - **Exercises** is your exercise library and the groups.
- **Settings** opens from the FM avatar on Home. The avatar appears only on Home.
- **Logging** opens from Load routine (W01), Start workout (Home) or a routine picked in W10. While a workout runs, the Resume bar takes you back to it from any tab.
- **Sub-pages** have a back link above the title, named after the page it returns to (for example "‹ Settings"). Sub-pages never have both a back link and a bottom Cancel.
- **Moving between pages:** pages cross-fade, going forward and back. The screen behind them keeps the theme's background, never white.
- **Day screens** opened from the week strip have "Back to today". Opened from the month, the same link reads "Back to month".

---

## 7. Interaction rules

**Saving**
- Save buttons name what they save: Save set, Save routine, Save color, Save workout.
- Cancel always sits below the Save button.
- Saves never ask for confirmation.

**Confirmations are only for these actions**
- Trash on an exercise during logging (L13) or in a routine (R23).
- Delete workout (W32).
- Delete account (H19).
- Delete routine (R22).
- Delete exercise (E21).
- Delete group (E34).

Nothing else asks "Are you sure?". Discard workout happens right away.

**Undo bars after every removal**
- **Logging:** set removed (L12), exercise removed, and workout discarded (shown on W01).
- **Edit workout:** set removed (W31) and exercise removed.
- **Routines:** exercise removed from a routine.
- **Exercises:** group deleted (shown on E30).
- **Other:** workout deleted, and profile photo removed (shown on H10).
- **Exceptions:** delete account, delete routine and delete exercise have no undo. Each asks first (H19, R22, E21).

**Delete inside edit screens.** "Delete routine" (R20) and "Delete exercise" (E20) sit below Cancel, styled as danger text.

**Groups.** A group can only be deleted when it has no exercises. E30 explains this, and only an empty group's trash is active.

**Schedule.** The week plan repeats every week. Missing a day doesn't shift the schedule. Picking another routine for today (W10) replaces only today's plan.

---

## 8. Content rules

**Voice.** Short, plain sentences in sentence case. Say what happens and what stays: "Workouts you already logged stay."

**Labels.** Eyebrows, field labels and buttons are uppercase in the UI. They are written in sentence case in the source.

**Day headers**

| Day | Label above | Title |
|---|---|---|
| Today | Friday, 23 October | Today |
| Yesterday | Thursday, 22 October | Yesterday |
| Tomorrow | Saturday, 24 October | Tomorrow |
| Any other day | 20 October | Tuesday |

**Home greeting (H01–H07).** The label above "Home" follows the time of day:
- "Good morning, Filip" until 12:00;
- "Good afternoon, Filip" until 18:00;
- "Good evening, Filip" after that.

**Account labels.** A10–A14 show "Forgot password?" above the title. A20 and A30 show "Welcome to Herculean".

**Formats**

| What | Format |
|---|---|
| Short date | Fri, 16 Oct |
| Set | 82.5 kg × 10 |
| Bodyweight set | 10 reps |
| Target | 3 × 8–10 (sets × rep range); a fixed count uses the same number twice |
| Session sets | 80 × 10 · 82.5 × 10 · 82.5 × 8 |
| Elapsed time while logging | 6:40 |
| Duration after the workout | 64 min, or 1:04:10 on the finish screen |
| Large numbers | 9,840 kg |

**Names.** Exercise names are always written in full and wrap onto a second line. They are never cut off with "…".

---

## 9. Screens

### A · Account

| Row | Screens | What happens |
|---|---|---|
| **A0 Launch** | A00 Splash, A02 Couldn't connect | The logo on a soft accent glow while the app checks whether you are signed in. If you are signed out, A01 opens; if you are signed in, H07 opens, or A30 if setup isn't finished. Without a connection, A02 shows "Couldn't connect." and a Try again text link below the logo, which stays in place. |
| **A1 Sign in** | A01 Sign in, A03 Signing in | Logo, Email and Password, the Forgot password? link, and Sign in. Below it, "New here?" and a Create account text link. A03 is the waiting state. A01 also opens on first launch, after Sign out and after Delete account. |
| **A2 Reset password** | A10 Reset password, A11 Link sent, A13 Reset email, A14 Opening the app, A12 New password | Email → Send reset link → "Check your email" (the link works for one hour; Send link again) → the link in A13 opens A14, which opens the app → New password twice → Save password → A01. A14 is the page a browser shows for a moment; its button is there in case the app doesn't open by itself. An expired or used link opens A10 with the error line "This link has expired. Send a new one." If the link expires while the user types, the same line shows at the top of A12. |
| **A3 Create account** | A20 Create account, A30 Setup | Email and password twice, with links to the terms (H20) and privacy policy (H21). Below Create account, "Already have an account?" and a Sign in text link. Then Setup: name, units and default rest time, all changeable later in Settings. The rest time steps by 15 seconds from 0:15 to 10:00, with quick picks of 1, 2, 3, 4 and 5 minutes. A new account starts at 3:00. Finish setup → H05. |

### H · Home

| Row | Screens | What happens |
|---|---|---|
| **H1 Today states** | H07 Loading, H01 Home, H02 In progress, H03 Completed, H06 Skipped, H04 Rest day, H05 No routines | A greeting and "Home" with the FM avatar, plus one card for today. H01: scheduled routine → Start workout. H02: progress and time → Resume workout, with the Resume bar. H03: Completed today (green), Up next, and View workout. H06: Skipped today (orange), Up next, and Undo skip. H04: Rest day, Up next, and Other routine. H05: Create routine. |
| **H2 Settings** | H10 Settings, H11 Profile photo, H12 Theme, H13 Color, H14 Units, H15 Default rest time, H16 Name, H17 Email, H18 Change password, H19 Delete account | H10 sections: profile (photo, name); Appearance (Theme, Color); Workout (Units, Default rest time); Account (Name, Email, Password); About (Terms of service, Privacy policy, Version 0.1); then Sign out and Delete account. Each row opens its own sheet. The theme options are Match my phone (default), Dark and Light. The colors are Racing blue and Titanium. The units are Metric (kg, cm) and Imperial (lb, in). |
| **H3 About and legal** | H20 Terms of service, H21 Privacy policy | Full-page text with "Last updated" and numbered sections. These open from H10, or from A20 with the back link reading "Create account". The final wording comes from a lawyer before release. |

### W · Workout

| Row | Screens | What happens |
|---|---|---|
| **W1 Today states** | W07 Loading, W01 Today, W02 In progress, W03 Completed, W06 Skipped, W04 Rest day, W05 No routines | The day header, a calendar icon button (→ W40) and a week strip Mon–Sun with status markers. Today's card shows the routine and its exercises with targets. W01 has Load routine, Other routine and Skip workout. W03 has Edit and Delete. W06 has Undo skip. |
| **W2 Choose a routine** | W10 Choose a routine, W11 Loading | A sheet listing every routine with its last-done date. Picking one replaces today's plan only, then logging opens. |
| **W3 Other days** | W20 Past day, W23 Yesterday rest day, W21 Missed day, W22 Skipped day, W24 Tomorrow, W25 Rest day | Opened from a day in the week strip. W20 is a completed workout with Edit and Delete. W21 is missed (red) with Log workout and Skip workout. W22 is skipped (orange) with Log workout and Undo skip. W24 shows the plan, and W25 shows a rest day. |
| **W4 Edit or delete a workout** | W30 Edit workout, W31 Set removed, W32 Delete confirm | Edit every set's weight and reps, add or remove sets and exercises, then Save workout. Delete asks first, then shows an undo bar. |
| **W5 Month** | W41 Loading, W40 Month, W42 Day summary | Summary tiles for Done, Missed and Skipped, then a calendar with today filled in the accent and a status bar under each past day, plus a legend. Below that are the month totals: time trained, sets, volume and consistency. Previous and next month buttons. Tapping a day opens the W42 summary sheet, and Open day goes to the full day screen. |

### L · Logging

| Row | Screens | What happens |
|---|---|---|
| **L1 Log sets** | L03 Loading, L01 Logging, L10 Edit weight, L11 Edit reps, L12 Set removed, L14 Exercise history, L15 History empty, L04 Reorder | The header shows the date and elapsed time, the routine name, Finish and "x of 19 sets". The current exercise is open, with rows for set, last time, kg and reps plus a check box. The other exercises are collapsed with their progress (0/3). Add set, Add exercise and Reorder are available. After each checked set, a rest timer appears with −15, +15 and Skip. Tapping a value opens a sheet with steppers (±2.5 kg or ±1 rep), Save set, Cancel and Remove set. The clock icon or the exercise name opens its recent history, with Full history → E10. |
| **L2 Exercises** | L13 Remove exercise, L20 Add exercise, L24 Loading, L21 No matches, L22 Create exercise, L23 New one selected | The trash asks first (L13). Add exercise has search, group chips and a multi-select list. The button reads "Add exercise" with one picked and "Add exercises" with several. If nothing matches, you're offered Create exercise (name, group, and an optional "Also works"). The new exercise comes back selected and marked "New". |
| **L3 Finish** | L30 Finish workout, L02 No exercises left, L31 Nothing logged | L30 shows a warning for unchecked sets, then Duration, Sets, Volume and Records, plus New records, with Save workout, Keep logging and Discard workout. With nothing checked (L31), there's no Save. L02 is the logging screen after every exercise has been removed. |

### R · Routines

| Row | Screens | What happens |
|---|---|---|
| **R1 Routines tab** | R02 Loading, R01 Routines, R03 No routines | The week plan ("Repeats every week") with one row per day, then your routines with their day tags, then New routine. |
| **R2 Week plan** | R10 Week plan day | A sheet to pick the routine or Rest day for a weekday → Save day. Today, the week strip and the month follow the plan. |
| **R3 Edit a routine** | R20 Edit routine, R21 Sets and reps, R23 Remove exercise, R22 Delete routine | Name, exercises with targets, drag handles, trash and Add exercise (new exercises start at 3 × 8–10), then Save routine, Cancel and Delete routine. Deleting a routine makes its days rest days. |
| **R4 New routine** | R30 New routine | Name and exercises, then Save routine. Opens from New routine on R01/R03 and from Create routine on H05/W05. |

### E · Exercises

| Row | Screens | What happens |
|---|---|---|
| **E1 Exercises tab** | E02 Loading, E01 Exercises, E03 No matches, E04 No exercises | Search, group chips, and the list grouped by muscle. Each row shows the best set and its date, or "Not done yet". The groups icon (→ E30) and Create exercise are on this screen. |
| **E2 Exercise details** | E10 Exercise, E11 Never done | Best set, times done, a heaviest-set chart (3M, 6M, 1Y, All), "Used in" routines, and every session by month. Edit icon in the header. |
| **E3 Edit or delete** | E20 Edit exercise, E21 Delete confirm | Name, group and "Also works", then Save exercise, Cancel and Delete exercise. Changes show everywhere, past workouts included. Deleting removes the exercise from routines; logged workouts keep it. |
| **E4 Groups** | E31 Loading, E30 Groups, E33 Rename, E32 New group, E34 Delete | Groups with exercise counts, which you can drag to reorder (this sets the chip order). New group, Rename and Delete; only an empty group can be deleted. |

---

## 10. Sample data on the canvas

- **Today:** Friday 23 October 2026, scheduled Chest and arms 2.
- **Week plan:**
  - Mon: Chest and arms 1
  - Tue: Back and shoulders 1
  - Wed: Legs
  - Thu: rest
  - Fri: Chest and arms 2
  - Sat: Back and shoulders 2
  - Sun: rest
- **This week:** Mon 19 and Tue 20 done; Wed 21 missed (W22 shows the same day as skipped).
- **October:** 13 done, 1 missed, 1 skipped.
- **Exercises:** 35 in E01: Filip's 26, six preloaded ones and Cable lateral raise, which is created in L22.
- **Groups:** Chest, Back, Shoulders, Biceps, Triceps, Legs.
- **Reference exercise:** Smith machine incline bench press. Best set 82.5 kg × 10 (Fri, 16 Oct), done 11 times since 7 Aug. L01, L14 and E10 agree.

---

## 11. Parked and decided

**Parked for later**
- Home content beyond today's card.
- Bodyweight logging (Pull-up, Triceps dip).
- Highlighting today's row in the R01 week plan.
- A progression nudge.
- Exercise notes.
- Supersets.
- Opening a day from an E10 session.
- A sort switch on E01.
- "Used in" day tags on E01 rows.
- Swapping an exercise during logging.

**Decided**
- Group chips wrap, even if someone creates many groups.
- Completed is green, skipped is orange, missed is red and in progress uses the accent.
- The second accent is called Titanium.
