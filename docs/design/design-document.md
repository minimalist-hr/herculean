# Herculean: design document

Version 0.80 · 11 November 2026 · Minimalist

> Changes since 0.79: admin, a new area M, for Minimalist’s own accounts. An admin signs in on A01 like anyone, and lands on Feedback (M01) instead of the tabs: no Home, Workout, Routines, Exercises or Profile, and no setup. M01 lists every user’s tickets by status, and M10 shows one with who sent it, from which device, and a reply box; replying sets it to Answered, and Close ticket and Reopen ticket change its status, each asking first (M16, M17). Sign out sits on M01. On the web, every page sits in a centered column 640 px wide.

> Changes since 0.78: feedback, a new area F. H10 has Feedback under About, and Home ends with a card, “Something off or missing?”, whose Send feedback opens New feedback with Home as its back link. Your feedback (F01) lists your tickets with their status, and New feedback (F10) sends a bug, suggestion or other message with up to 4 screenshots. A ticket (F20) is a thread of your messages and Minimalist’s, with a reply box, and a closed one can’t be answered (F25). A reply you haven’t read shows a dot on its row, on H10’s Feedback row and on the Home avatar (H91, H92). Messages say when they were sent, “Just now”, “5 minutes ago”, “2 hours ago”, “Yesterday, 14:05”, then the date and 24-hour time, “Fri, 16th Oct, 14:05”. Your own messages sit on a raised card with the accent’s border. Screenshots show as square thumbnails, four to a row, and open full screen. H21 says feedback is stored, and its date moves to 11 November 2026. Export data adds feedback.csv, one row per message, with the screenshots as files. Pulling down on F20 reads the thread again, with the phone’s own spinner.

> Changes since 0.77: lengthened partials. On R21, Lengthened partials sits below the line, above Superset with next. The exercise then shows "· LP" after its group. On L01 each of its sets gets an LP box beside the check box (L75), and checking a set first shows "LENGTHENED PARTIALS" with Skip and Done in the rest bar's place, before the rest (L76). An LP button beside the link icon turns them on or off for that workout only, on L01 and W30 (L77). W67 and E10 sessions show "+ LP".

> Changes since 0.76: supersets. On R21, Superset with next pairs an exercise with the one after it (R51). It looks muted and says why on the last exercise, on the second of a superset, and when the next one is already in one (R52). A superset joins into one block with Superset up its edge on R05, the day cards and W67, and joins on R20, L01, L04 and W30, with Superset up its edge except while open, and the pair drags as one (R53). While logging and editing a saved workout, the link icon makes or ends a superset (L78), and Add exercise can add two as one, on R42 too (L79). R27 and R29 are gone. Neighbours in the same group no longer join, and every exercise shows its group. On L01 a superset opens whole, the set to do next is outlined, and the rest bar waits for a set of each (L74).

> Changes since 0.75: rows and names that show another exercise, routine or workout open it. E35's exercises and R05's open E10 (E85, E86). E10's Used in opens R05 (R50), and its sessions open W67 (W99). W67's exercise names open E10 (E87). On a day, the exercises open E10, and the routine's name opens R05, as does the routine up next. A routine or exercise deleted since stays plain text and opens nothing. H03 has View workout. Rows show a chevron, and names in a card or table the open-out icon. A page opens inside the tab you are in, its back link names the page it came from and reads that name as it is now, and a page already open further back is gone back to, never opened twice. The New button is 48 px.

> Changes since 0.74: H10 is titled Profile, and every back link, hint and legal line that named it says Profile. Sign out and Delete account have a chevron like every row that opens something. The Terms of service date moves to 10 November 2026.

> Changes since 0.73: a color pass. Chrome is called Titanium again, and its accent text is a steel blue, so links and In progress stand apart from plain text in both modes. Flux (fuchsia), Plasma (violet) and Neon (cyan) are new colors, chosen away from the status hues. H13 shows each color as a square before its name. On Home, the greeting is one line at 28 px, a new `greeting` text style, shrinking for a long name, with the avatar on the right. Nitro's dark `primary` is #2A62F0, so selected outlines read on raised surfaces. In light, `danger` text is #B91C1C and `border` is #C5CAD1, so errors and card edges read on every surface. Every text color passes 4.5:1 and every fill and outline 3:1 on the backgrounds it sits on.

> Changes since 0.72: New exercise, New group and New routine are a square 56 px + button with the `primary` fill, floating at the bottom right of E01 to E04, E30 and R01 to R03, above the tab bar, a floating bar or the phone's own buttons, in place of the full-width button in a box. The Resume bar and the rest bar are 56 px tall, with 36 px controls that keep a 44 px tap area, 14 px names and an 18 px rest time. Finish on L01 is a full-width primary button at the end of the page, below Add exercise and Reorder. The trash on a set's page asks first (L73), then Undo stays.

> Changes since 0.71: the Workout tab is the one page for every day. Open day on the month, a day in Home's This week and Open day on Home all open the Workout tab on that day, so W29, W92 and their Back to month and Back to Home are gone. Open month on Home opens W40 with its usual Workout back link, so W95 is gone. Editing a set (L10, L11, and on W30) is a page with Save set in the bottom box, and leaving it with a change asks first. Pages end 24 px after their content, or 12 px above a floating bar. Reorder groups rows are centered, and Add exercise on W30 has 16 px above it.

> Changes since 0.70: only a tab's first page shows the tab bar and the Resume bar; every page with a back link hides them. On E01 to E04, E30, R01 to R03 and Add or Swap exercise, the title and description scroll away, and search and chips stay at the top, with a line once content scrolls under them. E30 is a plain list in one card, and a Reorder icon beside its title opens Reorder groups (E81), where groups are dragged (E43, E44), with E82 loading and E83 a load failure. Below two groups the icon is muted and says why (E84). Add and Swap exercise start their chips with New group, which comes back with the new group selected (L72).

> Changes since 0.69: a tab always opens its first page. Leaving a tab returns it there, so a page opened from another tab never stays behind. A page opened from Home has Home as its back link, and Android's back returns to Home too. That includes logging opened from Resume workout on Home. Logging and editing a workout hide the tab bar and the Resume bar, like a modal: you go back or save. That covers every L screen, W30 and its states, and E76, and the rest bar sits at the bottom of the screen. Recent records on Home have a line between rows, like other grouped lists. Pages start below the phone's status bar, with 16 px on tabs and 8 px on sub-pages, and pages without the tab bar or a bottom box keep room for the phone's own buttons at their end.

> Changes since 0.68: H10 has Export data under Account. It shares a ZIP of CSV files (workouts, exercises, routines and account, with the profile photo if there is one), and H21 says a copy can be downloaded in Settings. H86 is the row while it exports, H88 says "Data exported.", and H87 is the failure. Rest alerts are built: when a running rest timer ends, a notification says "Rest is over", even with the phone locked. Tapping it opens L01 for that workout. Two switches under Workout on H10, "Sound when rest ends" and "Vibrate when rest ends", save at once and go back with "Couldn't save the setting. Try again." if saving fails (H90). When the phone blocks notifications, H10 says "Allow notifications in your phone's settings to get rest alerts." under Workout (H89, not captured: the web has no notifications).

> Changes since 0.67: a tile's loading value is the size of the value, on every tile. The spacing scale adds 2 and 4 px. E13 shows its tile labels while it loads. Pulling down on Home reads everything again, with the phone's own spinner. L32 and W30 have a Duration field in minutes, 1 to 600 or left out, with its errors on L70 and W98. L32 and L70 show only the Sets and Volume tiles. L71 is L30 after 4 hours: "Long workout?"

> Changes since 0.66: empty, loading and failed screens keep the filled screen's layout. On an empty screen, search, chips and range buttons stay in place, muted, and tapping one says why (E78, E79, E80, R49, E56). R03 keeps the week plan with seven rest days, and a rest day there opens New routine with that day picked. H05's streak and records, "No new records this time." and the email link pages use the dashed box. A streak that ended says "No streak right now" and keeps the best. Skeletons match the page: forms show their fields, and words that never change stay as text. A page's bottom button stays, muted, while it loads or fails, and says "This page hasn't loaded yet." If the groups fail on Add exercise, the chip row says so (L69). H84 is the email-taken page. The app only opens once it has the user, so pages that need only the user have no loading or failed state: H49, H50, H51, H54 and H55 are gone.

> Changes since 0.65: a copy pass. The default rest time says it's ready to start after every checked set, because it never starts by itself. Units are kg and lb only. Create routine on H05 and W05 is New routine. W42 says Duration, and W67 shows it in minutes. H01 says Planned for Friday, like W01. H16 and H17 label their fields Name and Email. Undo failures all say "Couldn’t undo. Try again." W65 and W83 name the workout. L30 counts "17 of 19". Limits read "At most 1,000 kg." E10 writes its groups as they are named. Apostrophes are curly, and no value is one dash. Day cells say done to screen readers.

> Changes since 0.64: parts of a screen fail apart. On the month, the calendar keeps its card and says so inside it, and swiping still works (W96). If the totals fail, the tiles show a dash and a box takes the totals' place (W97). W49 is both. On E01, the list stays if the groups fail, and the chip row says so (E77). H29 has a way out at the bottom, like H28, and H76 is H29 signed out. A refresh that fails keeps what is showing.

> Changes since 0.63: this document now says what is built. The confirmations, buttons, day headers, names, Home and sample data are corrected, and the parked list no longer holds what is built. The capture tool's sample data can now really happen and agrees across screens, and a screen shows it the next time it is captured. No screen changed.

> Changes since 0.62: 53 new screens captured from the app. They cover what was built but never drawn: Settings pages loading, saving and failing; the keep-account sheet; Home with every section failed and Are you ready; and the pages opened from Home or Logging. Every screen is recaptured.

> Changes since 0.59, the Settings consistency pass: A11 and H33 both say Send link again, look muted while they wait, and say why when tapped. H18 says "Password changed. Other devices are signed out." Typing in any form clears a failure notification.

> Changes since 0.58: H11 Profile photo is built. A photo is dragged and zoomed to a square with the phone's own picker. H39 is H10 with a photo, and the link reads Change photo. The photo also shows on the Home avatar. On H40, with no photo, Remove photo looks muted and says why. H41 is H10 after removing, with Undo. Two notifications have no capture, because the capture tool can't open the phone's picker: H42 "Allow camera access in your phone's settings." or "Allow photo access in your phone's settings.", and H43 "Couldn't save the photo. Try again."

> Changes since 0.57: deleting an account now waits 14 days. H19 says "Your account will be deleted in 14 days. Sign in before then to keep it." A07 says "Account will be deleted in 14 days." New A08: signing in during the wait opens a sheet with the day, Keep account and Not now. New H38: the email sent straight away. H37 goes out when the account is really deleted. H21 says everything is removed permanently after 14 days.

> Changes since 0.56: Sign out and Delete account are built. Sign out asks first on the sheet H36. H19 Delete account now asks for the current password. H34 shows a wrong password under the field, and H35 a failed delete in a notification, and the sheet stays open. After deleting, A07 is A01 saying "Account deleted." New H37: the last email, built like H31.

> Changes since 0.55: H17 Email is built, as a page instead of a sheet, and asks for the current password. Save email goes back to H10 and says "Link sent to new@example.com." The email stays the same until the link is opened. While a link waits, H32 shows an alert icon by the Email label. The row still opens H17, and H33 is H17 with a card above the form that says where the link went, with Send again, which then waits a minute. New H26: errors under the fields. New H27 confirming, H28 link expired and H29 could not confirm, on the screen the link opens. New H30: the confirmation email to the new address, built like A13. New H31: the notice to the old address, built like H25.

> Changes since 0.54: H18 Change password is built, as a page instead of a sheet. Save password goes back to H10 and says "Password saved. Other devices are signed out." Its subtitle says "You'll be signed out of other devices.", and New password has the helper "At least 8 characters." New H25: the email that says the password changed, built like A13, with no button. It says when, in the user's time zone. New H22: a wrong current password shows under its field. New H23: a new password that's too short, or doesn't match, shows under its field.

> Changes since 0.53: H16 Name is built, as a page instead of a sheet. Save name goes back to H10 and says "Name saved." New H24: with an empty name, Save name shows "Enter your name." under the field, like every form.

> Changes since 0.52: H12 Theme, H13 Color, H14 Units and H15 Default rest time are built, as pages instead of sheets, because create and edit are pages. Each has its choices, a Save button at the bottom, and asks before leaving with a change. Saving goes back to H10 and says "Theme saved." A theme or color applies after Save, everywhere at once, and the app opens in it next time. The colors are renamed to one sporty word each: Racing blue is now Nitro, and Titanium is Chrome.

> Changes since 0.51: H10 Settings is built. The FM avatar on Home, still the H00 placeholder, opens it. Rows that come with later issues look muted and say "Theme comes in a later update." until they're built. Terms of service and Privacy policy open H20 and H21 with the back link "Settings". Version shows the app's real version. Sound and vibrate when rest ends stay out until rest alerts exist. Sign out and Delete account are actions, so they have no chevron.

> Changes since 0.50, the consistency pass after editing: W30 and L30 say "Chest and arms 2 saved." when they close, like every other page that saves. Skeleton blocks fill their card on L03, W68, E67 and L04. W40's Back to today stays hidden while today is shown, as an action with no meaning there.

> Changes since 0.49: editing a workout is built. Edit on W03 and W20 opens W30, with every exercise open like L01 but without check boxes or Swap. Sets use the L10 and L11 sheets; removing one shows "Set 1 removed." with Undo (W31). The trash asks on L13, then offers Undo. Add exercise uses the L20 flow; an added exercise starts with 3 sets at 0 and the low end of the reps, with its last time before the workout's date. With every exercise removed, "No exercises left" shows and Save workout looks muted, saying "Add an exercise to save, or delete the workout." Nothing is sent until Save workout. New screens: W86 loading, W87 couldn't load, W88 saving, W89 couldn't save, and W90 discard changes on leaving. W03's exercise skeleton fills the card.

> Changes since 0.48: deleting a workout is built. Delete on W03 and W20 asks on W32, "Delete Back and shoulders 1?", saying its sets come out of history, best sets and month totals, with Delete workout. Then the day shows its plan, and "Workout deleted." offers Undo (W83). W84 is couldn't delete, and W85 couldn't undo.

> Changes since 0.47: the consistency pass after logging. Unavailable actions stay muted and empty screens keep their sections, so the app stays predictable. L30's Save workout looks muted with nothing checked and says "Check off a set to save, or discard the workout." (L31). L01's Reorder looks muted below two exercises and says "Add another exercise first.", and "0 of 0 sets" stays with no exercises (L02). Also works stays with one group, saying "Create another group to choose it here." Skeletons match the real content's size, so nothing moves when it loads: a sheet's skeleton is one small row as wide as the sheet, L30 and W67 keep their top line, L30 shows its warning at once, and New records and W67's exercises have skeletons. W67 and W42 load their summary and exercises apart, each failing in its own place, centered like a whole screen's failure, as the week strip (W79) and R01's week plan now are too. If W10 can't load the day, it lists the routines without a planned one. Every exercise name that opens E10 ends in an open-out icon. Empty states, no matches and failures sit in a dashed box, never as plain text on the background: L02, "No matches for …" on E01, E30, R01 and Add exercise, and every load failure.

> Changes since 0.46: an action that isn't available is muted, never hidden. A future planned day shows Start workout, Other routine and Skip workout muted, and a future rest day shows Other routine muted. Tapping one says "A workout can't be started before its day." or "A workout can't be skipped before its day." (W82).

> Changes since 0.45: while a workout is in progress on another day, Start workout, Log workout and Other routine look muted, and tapping one says "Resume or finish your workout first." (W74). W80 shows them muted, with the Resume bar.

> Changes since 0.44: the Resume bar is built, and looks like the rest bar. It floats above the tab bar and above a page's bottom buttons, such as New routine, on every tab while a workout is in progress, on any day, and hides on the logging pages. A chevron hides it to a small button with the sets done, such as "7/19" (W81). It stays hidden while it loads and if it fails, because most of the time no workout is running. On the rest bar, the REST label is smaller than the time, with room between them, and its buttons are all 44 px tall. Both bars keep room before the chevron.

> Changes since 0.43: E10's chart is built. "Heaviest set" sits between the tiles and Used in, with the change over the range, such as "70 → 82.5 kg", the range buttons 3M, 6M, 1Y and All (3M first), and a box with the chart. Each point is a session's heaviest set, spaced by date, with weights on the left and months below, or years over a year. Over 60 sessions, each point is a month's heaviest set (E70). Past 20 points, only the last one has a dot, so the line stays readable. The chart loads on its own: a skeleton (E67), "Couldn't load the chart." with Try again (E68), and "No sessions in this period" (E69). Never done, the box says "No sessions yet", without range buttons. The range buttons use the quick picks style.

> Changes since 0.42: every state of a built screen has an ID and a capture. An empty screen keeps the sections of a filled one: E35's Also works says "No exercises yet", and New records on L30 and W67 says "No new records this time." A stepper's button at a limit looks muted and says why. A part of a screen that fails says so in its own place: R01's week plan loads apart from the routines, and the week strip says "Couldn't load the week." (W79). At 30 exercises, Edit routine's Add exercise looks muted and says why.

> Changes since 0.41: E10 lists every session by month, 20 at a time, newest first. A month heading says how many sessions it has, all of them, and adds the year when it isn't this one. Each row has the date, the workout and its checked sets, with the unit under them. The next 20 load near the end of the list (E17), and a page that fails says so in place with Try again (E18). While the first page loads, the tiles already show (E19). Sessions sit in a card for each month, under its heading. E11 matches E10: the tiles show a dash, "Not done yet" and "0 times", then Used in, then All sessions with "No sessions yet" in place of the sessions. E13's skeleton has the tiles too.

> Changes since 0.40: E10 shows the Best set and Done tiles once the exercise has been done, each with a date line, and Done says since when. E11 stays for an exercise never done. E35 drops its "No sessions yet" card once one of its exercises has been done, and its rows show their best sets. Short dates follow the app's standard, Fri, 16th Oct, and a date in another year adds it.

> Changes since 0.39: a completed day (W03, W20) says Done, with its exercises and the sets actually done in the same cards as W42, View workout as the main button, then Edit and Delete. Today's card also shows Up next. W42 has tiles for time, sets and volume, with View workout and Open day. W67 is a new page with a workout's details: tiles, new records, then each exercise's total and a table of last time, weight and reps, with the record set in the accent color. W68 to W70 are its loading and failure states, and those of the cards. Its back link says Workout, or Month when it opened from W42 (W71). A dashed line divides an exercise's name from its table. Up next shows on today and future days, and never on a past day. Where exercises are only shown (W01, W02, W03, W06, W20 to W24, W42 to W46, W57, W67, R05), connected exercises have a stripe up the block's right edge with their group, and it leaves their rows. A name too long for the block ends in "…". A solo exercise keeps its group below its name, and logging, R20 and R30 stay as they were. On a saved day, an exercise's line adds its total, for example "3 sets · 990 kg". View workout is a primary button.

> Changes since 0.38: L30 and L31 are pages in the Workout tab with a Logging back link, which replaces Keep logging. L30 has Save workout and Discard workout, and L31 only Discard workout. L32 is a past day with every set checked: Duration shows a dash, and there is no warning. Discard asks first on L33, then W65 offers Undo. L34 to L39 and W66 are the loading, saving and failure states.

> Changes since 0.37: W10 and W11 are a page, not a sheet, opened by Other routine on W01, W04, W21 and past rest days. It lists only routines in the week plan, with the day's planned routine first, then the order of R01. Its tag is plain text, like New on L20. W57 asks before starting a picked routine and shows its exercises, with W58 to W62 for starting, failure and loading. W60 shows when routines exist but none is in the week plan, and W63 is the load failure. W64: Other routine on a day before the first day looks muted and says why. W12 is gone. Start workout and Log workout still start in one tap.

> Changes since 0.36: logging follows the built screens. L01 has a back link, with the date and time under the title. Exercises use the same cards as the day screens, and neighbours in a group join. One exercise is open at a time, and the next one opens when its last set is checked. Checked sets stay editable, and tapping the check unchecks them. L05 is the load failure. W02 lists its exercises like W01, with Up next. An exercise has a swap icon beside history and the trash. Add set is one full-width button, and copies the last set. L10 and L11 have only Save set, with a trash icon beside Last time, which removes the set with Undo. While building: L14 and L15 are gone, and history lives on E10. The exercise name has a small open-out icon and opens E10. Rows have no Set label and equal weight and reps boxes, and the whole row opens the sheet. The month legend is three columns and two rows, with Rest. L04 saves each drop, with a back link and no Save order. Added exercises go last at 3 × 8–10, and the first one opens.

> Changes since 0.35: a consistency pass. Day cards say Planned, not Scheduled, like the month. The day sheets use the short weekday, like the Workout tab. Weekday names in the week strip and month use a new `dayName` text role. Every built state now has a capture: waiting buttons, failures, resending a link, dragging, edit pages loading, and more month states. H00 is the placeholder Home until Home is planned.

> Changes since 0.34: the back link on the month reads Workout.

> Changes since 0.33: every month takes six weeks, with the month on one line and the year below it, so the screen no longer moves between months. Small chevrons beside the calendar replace the month buttons, and Back to today shows when another day or month is selected. A sheet's body pulls down to close it once it is at its top. Sideways swipes must be clearly sideways. Above Yesterday, Today and Tomorrow, the weekday is short, for example "Tue, 3rd November".

> Changes since 0.32: W29, W40, W41 and W43 to W49 are built, so their files come from the app. Dates on the day sheets follow the rest of the app, for example "Saturday, 3rd October". Until logging exists, a month shows no Done markers and W42 stays a drawing.

> Changes since 0.31: month days on W40 and W41 are outlined tiles, like the week strip, with W01's markers, so today and planned days show too, and the legend has Planned. Days from other months are left empty. W42 has new states: W43 Missed, W44 Skipped, W45 Planned and W46 Rest day. W41 keeps W40's heights. The calendar swipes like the week strip, or the buttons change the month, within limits shown on W47. The selected day is filled and today is outlined when another day is selected, like the week strip (W48). The day sheets use the same exercise list as the day screens, and W46 has the rest day message. W49 is the month's load failure, and W42 comes with logging. Opening a day from the month shows "Back to month" on W29.

> Changes since 0.30: every action now shows it can be used, at rest and when pressed (section 7). Chevrons beside the week strip show that weeks scroll. R20 and R30 have a pencil beside each target. R05 shows only the routine's days, each in a small box with the `card` fill, because all seven chips there looked tappable.

> Changes since 0.29: swiping the week strip opens the same weekday in the week before or after, with the strip following the finger. A short swipe springs back, and it bounces at the first day's week and 4 weeks ahead. W28 is another week, and a date in another year says the year. The selected day now stays until Back to today, and the date also updates when the app comes back after midnight.

> Changes since 0.28: W06 and W22 are built. Skip workout on W01 or W21 asks first in W26, and Undo skip asks first in W27. The card then changes, with no notification. W06 lists its exercises like W22, above Up next. A skipped day has an orange marker in the week strip, or white while selected. W22 has only Undo skip, like W06: to log that day, undo first. W21 and past rest days (W23) also offer Other routine. W27 says "This day goes back to its plan."

> Changes since 0.27: W21, W23, W24 and W25 are built. A day next to today is titled Yesterday or Tomorrow under its full date, and any other day has its weekday as the title under its date. In the week strip, the selected day is filled and today is outlined. The selected day's marker is white. Up next shows on today, later days and yesterday, and its date has an ordinal, such as Mon, 26th Oct. W21 and W24 use R05's exercise list. W22 is built with skip.

> Changes since 0.26: on the Workout tab, W01 says Start workout and shows the routine's plain name, like H01. Rest day cards say Today on W04 and the weekday on W23 and W25, not "Scheduled for". W05 and R03 say days are picked with the routine. The date on W01 has an ordinal, such as 25th October. W01's exercises look like R05's, and same-group neighbours join. In the week strip, a marker means a workout belongs on that day, and its color says how it went: muted when planned, white on today, then green, orange or red. A rest day has none. Up next always shows the day after the one shown, a routine or Rest. New: W08, a load failure, and W09, a rest day with a rest day next. Home is unchanged, because it will be planned again.

> Changes since 0.25: a consistency pass over built screens. Section titles sit flush with the cards. Text in a list card starts 16 px in. An empty section is a dashed, centered card, on E11 and E41 too. L20 joins a group's rows into one card, like E01, and its rows show the best set instead of repeating the group. Forms have no placeholders, because the label says what is needed.

> Changes since 0.24: days are picked on the routine, not per day, so R10 is gone. On R01 each weekday has its own muted color, linking its square to the routine's day tag. R20 and R30 have an optional Days row, saved with Save routine, with a small "Picking a day replaces its routine" beside its title. R05 shows the days and can't change them. On R01 the week plan is a compact strip above the routines, and R03 doesn't have it. Targets on R20 and R30 are `primaryText`, like R05, and Forgot password? on A01 lines up with the fields. Exercises on R05, R20 and R30 show their group, and neighbours in the same group join.

> Changes since 0.23: built screens now come from the running app, so their PNG, HTML and source show what is built, every state included. New states are listed in each row below. The tool is in `capture/`. Screens not built yet stay drawings. A00, A02, A13, A14 and E10 stay drawings too: the web version can't reach the first two, the next two aren't app screens, and E10 needs logging.

> Changes since 0.22: a routine now has a details screen, R05, with edit and delete buttons like E10. A routine on R01 opens R05. R20 has only Save routine, its back link names the routine and cancels, and it has a new description. R22 opens from R05. The `areas/` images and Flow boards are gone: `screens/`, `html/` and `source/` are what count. The screen index board and canvas now list every screen. Copy checked against what the app does: E11's hint names both ways to add an exercise, L22 says routines too, and W32 no longer says "for good", because it has Undo. Routines and exercises can now be undone after a delete, so only delete account can't. An exercise in a routine can't be deleted: its trash on E10 is muted, Used in lists routines by name, and E21 no longer mentions routines.

> Changes since 0.21: creating and editing are pages now, so E20, L22, E32 and E33 are pages, and E33 is Edit group, not Rename. A page has a back link named after the screen it came from, a title, one short description, the fields and Save in the bottom box. The back link cancels. Deletes and other confirmations stay sheets, and no sheet has a Cancel button: the X or a tap outside closes it. A delete button is `dangerFill` with a white label in both themes, so the label stays readable. Trash icons match it. Error text keeps `danger`. The name field on create and edit forms has no placeholder. The notification bar and the undo bar come down from the top of the screen. R20 becomes a page when it is built. Done on the keyboard only closes it. "Your training" is gone from E01 to E04, R01 to R03 and R10. E01 to E04 have a short description under the title, then full-width search and the chips, and New exercise in a box pinned above the tab bar. Groups is a link chip at the start of the chips, and alone on E04. On E04, New exercise replaces the dashed action. E03 has no button of its own. E35's rows only show an exercise and no longer open it. On E30, a short description and a search are added under the title, New group sits in a box pinned above the tab bar, and the sorting hint moves below the list. While a search has text, the rows lose their handles and the hint goes, because only part of the list shows. New is the word for every create action: New exercise, New group, New routine. R01 to R03 have a short description, search by name and New routine pinned above the tab bar, and the week plan sits below the routines. R20, R30, Add exercise (L20, L21, L23, L24) and Sets and reps (R21) are pages. R30's Exercises heading always shows its counts. On Add exercise, New exercise closes the list, after a line and a gap, the chips are one sideways line, and rows are separate and show only the group. R21's steppers are stacked. Leaving a form with changes asks first (Form pages). With no groups, New exercise on E01 to E04 and L20 is muted and says "Create a group first.", and E36 shows "No groups yet" with no search. With one group, L22 and E20 hide Also works. The "No sessions yet" card on E11 and E35 has no icon. A10 to A12 have a back link to Sign in in place of the "Forgot password?" label, A10 and A12 lose Cancel, and A11 loses Back to sign in. Email fields say "Your email", and the second password field is Confirm password. The glows on A00 to A03 use `opacity.glow`, though the drawings keep a straight fade and the app a smooth one. The undo bar no longer dims the screen. The area panels `areas/` and the Flow boards don't show this.

> Changes since 0.20: a sheet is as small as its content allows, and content that doesn't fit makes it as tall as possible and scrolls, so nothing pulls a sheet up. Every form is a sheet, and a sheet can open another. R30 and R20 are sheets, with R21 and R23 rising over them. L20 is a sheet at full height, and L22 rises over it. A routine needs at least one exercise to save, and Add exercise is a + on the Exercises title's line. On L20, Create exercise is a + in the search row, Add exercise stays muted until something is picked and says why when pressed, and rows show the group, not also works. R23 asks first, then a notification offers Undo. The drawings of R20, R21, R23, R30, L20, L21, L23 and L24 still show the older layout.

> Changes since 0.19: on R01 to R03, the title stays pinned and New routine is a + button beside it.

> Changes since 0.18: forms, deletes and similar actions open as sheets, so L22 and E20 are sheets now. A sheet opens at its content's height, up to 90% of the screen, and its content scrolls. The grabber pulls a sheet that doesn't fit up to full screen, and any sheet down to close. A failure shows above the open sheet, so it keeps what was typed, and a success shows in the usual place as the sheet closes (section 5). The account and password reset forms stay full pages for now. On E30 and E31, the title and description stay pinned and only the list scrolls, and New group is a + button on the title's line.

> Changes since 0.17: E35, a group's details: its exercises, what also works it, and edit and trash icons. E30 rows open it, and E33 and E34 now open from it, though their drawings still show E30 behind them. The area panel `areas/E-Exercises.png` doesn't show this. An action that isn't available stays tappable and says why (section 8).

> Changes since 0.16: a notification can carry an action, which is how E30 offers Undo after a delete. It stays 6 seconds then. A group's name has 1 to 30 characters. An empty group's trash on E30 is red, and a disabled one is muted at 35%, in the tokens.

> Changes since 0.15: a notification bar replaces the general error and the success line at the top of forms, and the green line on E01 (section 5). E20 says when it saved. A wrong email or password on A01 turns both fields red, with the message under Password. Tokens for the bar's text, height and timing. Screens aren't redrawn: the bar only appears after an action.

> Changes since 0.14: Delete exercise moves from E20 to a red trash icon to the right of the edit button on E10 and E11, and E21 opens over those screens (sections 5, 8 and 9). E20 keeps Save exercise and Cancel only. Sheets rise over 220 ms, in the tokens. A confirmation's question is left-aligned, as drawn (section 5). The area panel `areas/E-Exercises.png` doesn't show this.

> Changes since 0.13: after deleting an exercise, E01 shows a green line such as "Bench press deleted." (section 9).

> Changes since 0.12: on E10 and E11, the edit button sits on the title's line, not the back link's.

> Changes since 0.11: what L22 fills in, its errors and limit, and what E01 shows after saving (sections 5 and 9). The groups on L22 wrap. On L22 and E20, "optional" is quieter than the "Also works" label.

> Changes since 0.10: on E01 to E03, the title, search, Create exercise and the chips stay pinned and only the list scrolls, and the chips are one line that scrolls sideways (sections 5 and 9). Groups is a text link on the title row. E01 has no dashed Create exercise at the end of the list. The area panel `areas/E-Exercises.png` doesn't show this.

> Changes since 0.9: every search has a clear button once it has text (section 5). E01 to E04 have Create exercise in the header too, so a long list needs no scrolling to reach it. E01 to E04 and L21 are updated; the area panels `areas/E-Exercises.png` and `areas/L-Logging.png` don't show this.

> Changes since 0.8: what E01 shows when a list fails to load, and for a group without exercises (sections 5 and 9). A type role for chips, the dashed action's height and the skeleton's pulse in the tokens (sections 4.2 and 5).

> Changes since 0.7: the wording of H20 and H21 is final. H21 now says passwords are stored in a protected form that can't be read, and names the email service.

> Changes since 0.6: a success line for forms (section 5). A11 waits a minute before Send link again can be pressed, and says "Link sent again." A01 says "Password changed. Sign in with the new one." after a reset (sections 7 and 9). A11 and A13 use the type scale: `meta` for A11's card text and `body` for A13's text.

> Changes since 0.5: A13, the reset email, and A14, the page its link opens (sections 5 and 9). An expired link on A14 goes to A10 with an error line. The area panel `areas/A-Account.png` doesn't show any of this. Screens are rendered in dark only, directly in `screens/`; light stays in the tokens and the app.

> Changes since 0.4: A02, the splash without a connection (section 9). The area panel `areas/A-Account.png` doesn't show it. The logo's type role, its glow and the sign in logo area in the tokens. The glow is half as strong on A00 to A03, and ERCULEAN sits in the vertical middle of the pillars instead of on their baseline (section 3). The logo area shrinks on shorter phones and keeps room for field errors, so sign in never scrolls; at 844 px it is 344 px (sections 3 and 4.2). Pages cross-fade instead of sliding, because on Android a slide showed the page you leave empty while it moved (section 6).

> Changes since 0.3: a spacing scale, the dimmed opacity and the spinner in the tokens (sections 4.4 and 5). Error states for forms, which the canvas does not show, and the bottom action box with the keyboard open (section 5). A01 and A20 link to each other with a text link line instead of a secondary button (sections 5 and 9). Their screens, HTML and source show it; the area panel `areas/A-Account.png` still shows the old button. Page transitions (section 6). Radio cards, steppers and quick picks, with their sizes and type roles in the tokens; on A30 the rest time is shown, not typed, and the card spacing is on the scale (sections 5 and 9). The quick picks on A30 and H15 are 1 to 5 minutes, and a new account starts at 3:00 instead of 1:30.

> Changes since 0.2: the tab bar's padding and label letter spacing are tokens, and its bottom padding follows the phone's safe area (section 5).

> Changes since 0.1: R03 week plan rows read "Rest day" instead of "Not planned". Discard workout now shows an undo bar on W01. Delete routine and delete exercise no longer have undo bars (section 7).

> In this package: the canvas boards are rendered under `screens/`, and the original Claude Design source under `source/`, each in a folder per area (`account`, `home`, `workout`, `logging`, `routines`, `exercises`). See `README.md` and `screen-index.md`.

Herculean is a workout log for people who train on a fixed weekly split. You plan routines, put them on the days of the week, log your sets at the gym, and see your history and progress per exercise.

This document describes the design on the canvas "Herculean app screens" (Claude Design). It covers the canvas, the brand, the visual language, the components, the rules every screen follows, and every screen by area.

---

## 1. Scope

- **Platform:** phone app, designed at 390 × 844 px (iPhone 14/15 size). Long screens are drawn at full scroll height and marked "full scroll".
- **Screens:** eight areas, plus one brand board. `screen-index.md` lists every screen.
- **Themes:** Match my phone (default), dark and light, with two accent colors. The font is Chakra Petch and corners are sharp.
- **Not in scope yet:** see section 11, Parked.

---

## 2. How the canvas is organized

| Part | What it is |
|---|---|
| **B01 Brand** | Logo concepts and the chosen logo. At the top of the canvas. |
| **Screen index** | Every screen by ID, with its row and position. Below the brand board. |

**Screen IDs.** One letter for the area, then two digits. The first digit is the flow (row) and the second is the screen. For example, W42 is in Workout, row W4x (Month), screen 2. Board titles read `ID · Area › Screen · state`.

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
| `border` | #2C2F34 | #C5CAD1 | Every 1px border and divider |
| `text` | #F2F3F5 | #0A0B0D | Main text |
| `muted` | #A9AEB6 | #4F555D | Labels, secondary text, inactive tabs |

**Accent (Settings › Color, H13)**

| Palette | Mode | `primary` (buttons, fills) | `primaryText` (accent text) | `onPrimary` (text on primary) |
|---|---|---|---|---|
| **Nitro** (default) | Dark | #2A62F0 | #7EA2FF | #FFFFFF |
| | Light | #1446C8 | #1446C8 | #FFFFFF |
| **Titanium** | Dark | #C9CED6 | #9DB4D6 | #050506 |
| | Light | #2A2D33 | #3B5B8C | #FFFFFF |
| **Flux** | Dark | #D946EF | #F0ABFC | #050506 |
| | Light | #A21CAF | #A21CAF | #FFFFFF |
| **Plasma** | Dark | #7C4DFF | #B9A2FF | #FFFFFF |
| | Light | #6431D9 | #6431D9 | #FFFFFF |
| **Neon** | Dark | #22C3DD | #6FE0F0 | #050506 |
| | Light | #0B6F86 | #0B6F86 | #FFFFFF |

The accent is used for primary buttons, the active tab, today in the week strip and month, checked sets, links and "In progress". `primaryText` passes 4.5:1 on `bg`, `card` and `raised`, `primary` passes 3:1 against them, and `onPrimary` passes 4.5:1 on `primary`, in every palette and mode. An accent never takes a status hue (green, orange, red), so In progress never reads as done, skipped or missed.

**Status and feedback**

| Token | Dark | Light | Meaning |
|---|---|---|---|
| `success` | #4ADE80 | #166534 | Completed / Done |
| `skipped` | #FB923C | #9A3412 | Skipped |
| `danger` | #F87171 | #B91C1C | Missed, errors |
| `dangerFill` | #DC2626 | #DC2626 | Danger buttons and trash icons |
| `onDanger` | #FFFFFF | #FFFFFF | Text on danger buttons |
| `warn` | #F5B83D | #B45309 | Warning icon only (L30, L31, H32) |
| `primaryText` | (accent) | (accent) | In progress |

Status always shows as a colored 8 px dot and a label in the same color. Week strip and calendar markers use a short bar in the status color, and the month screen has a legend. Color is never the only signal: there is always a word, and the day cells have full aria labels such as "20 October, back and shoulders 1, done".

### 4.2 Typography

- **Font:** Chakra Petch, in weights 400–700.
- **Numbers:** tabular numerals everywhere, so weights, reps and timers line up.

| Role | Size / weight | Notes |
|---|---|---|
| Logo | 32 / 700 | Line height 1, letter spacing 0.14em |
| Page title | 32 / 700 | Line height 1.05, letter spacing −0.01em |
| Greeting | 28 / 700 | Home's one-line greeting, like the page title |
| Card title, sheet title | 22 / 700 | |
| Big stat number | 24 / 700 | Month summary tiles |
| Stat value | 18 / 700 | Best set, Done count, totals |
| List item name, body strong | 16 / 700 | Exercise and routine names |
| Input text | 16 | Prevents zoom on iOS |
| Primary button | 15 / 700 | Uppercase, letter spacing 0.06em |
| Body | 14 | Line height 1.45–1.55 for long text |
| Secondary button, text link | 13 / 600 | Uppercase, letter spacing 0.06em |
| Filter chip | 13 / 600 | |
| Eyebrow, field label, section label | 12 / 600 | Uppercase, letter spacing 0.1em, muted |
| Meta line | 12–13 | Muted, for example "7 exercises · 19 sets" |
| Tab label | 11 | 700 when active, 500 when not. Letter spacing 0.04em |

### 4.3 Corners

| Element | Radius |
|---|---|
| Card | 6 px |
| Control (button, input) | 4 px |
| Pill (chip, status dot) | 3 px |
| Check box | 3 px |
| Sheet top corners | 10 px |

### 4.4 Spacing and sizes

- **Side padding:** 16 px on every screen.
- **Top padding:** pages start below the phone's status bar, which keeps the background color, so nothing scrolls behind the clock. Then 16 px on tab screens and 8 px on sub-pages with a back link.
- **Bottom:** a page's end clears the phone's own buttons: the tab bar or a bottom box does it, and a page with neither keeps that room after its content, such as L01, L04 and E76.
- **Touch targets:** at least 44 px. Text links and icon buttons get padding so their hit area is 44 px.
- **List rows:** at least 56 px; radio and option rows at least 60 px.
- **Chips:** 36 px high.
- **Gaps:** 8 px between stacked buttons, 6 px between chips, and 14–20 px between sections.
- **Spacing scale:** `space` in the tokens, 2, 4, 6, 8, 12, 16 and 24 px (xxxs to xl). Every other gap and inset uses it. On A20, for example: 6 px inside the heading, 8 px between a label, its input and its helper, 12 px inside an input, 16 px between fields and 24 px between the heading, the form and the terms.

### 4.5 Icons

Inline stroke icons (24 px grid, stroke 1.75–2, square line caps), drawn at 16–22 px. No emoji. Icon-only buttons always have an aria label. Every exercise name that opens E10 ends in a small open-out icon.

---

## 5. Components

### Buttons
| Type | Look | Used for |
|---|---|---|
| **Primary** | 48 px, filled `primary`, 15 px uppercase bold | The main action: Save …, Start workout, Sign in |
| **Secondary** | 44 px, outlined, `raised` fill, 13 px uppercase | Other routine, Skip workout, Undo skip, Not now, New … |
| **Danger** | 48 px, filled `dangerFill` | The confirm action in delete and remove confirms |
| **Danger outline** | 44 px, outlined, `raised` fill, `danger` text | Delete on W03 and W20, Discard workout on L30 |
| **Text link** | 44 px tall, 13 px uppercase, `primaryText` | Forgot password?, Try again, Open day, and the way between A01 and A20 |
| **Header icon button** | 44 × 44 px, outlined, `raised` fill | W01 calendar, the Home avatar, R20 and R30 add exercise, R05, E10, E11 and E35 edit and delete |

**Waiting state.** Every button that waits on the server shows a spinner and its label in the -ing form, and the other actions on the screen are dimmed (A03 is the reference). The spinner is `size.spinner` and turns every `motion.spinMs`, and stands still when the phone asks for reduced motion. Dimmed actions use `opacity.dimmed`. This applies to Create account, Send reset link, Save password, Finish setup, Save workout and every Save in Profile.

### Bottom action box
Bottom actions sit in a box pinned to the bottom of the screen. It has the `card` fill, a top border and 12/16/28 px padding. Above a navigation bar or home indicator, the bottom padding is that bar plus 12 px, so the buttons never touch it. The primary button comes first, and any other button goes below it, such as Discard workout on L30. While the keyboard is open, the box stays behind it and only the form makes room. The keyboard's return key moves to the next text field. On the last field of a form it does the primary action; when choices that are not text follow, it closes the keyboard.

### Inputs
44 px high, `raised` fill, 1 px border. Every input has a visible uppercase label above it and helper text below when needed (for example "At least 8 characters."). Password fields have a show/hide eye button.

### Form errors
The canvas shows no error states, so every form follows these:
- **Field error:** the message replaces the helper text under the field, in `danger`, and the field's border turns `danger`. It covers the form's own checks and the API's field errors, for example "An account with this email already exists." under Email on A20.
- **Any other error** (no connection, a server error, an error with no field): a notification, for example "Couldn't create the account. Try again."
- **A part of the screen that didn't load** says so in its place, with Try again.

### Notification bar
Says that something worked or failed, when it belongs to no field. It looks like the undo bar: `raised` fill, a border, 6 px corners and at least 56 px tall, with a 20 px icon (a check in `success`, a warning in `danger`) and 14 / 600 text.
- **Place:** at the top of the screen, 8 px below the status bar, over the title, where the screen is calm.
- **Behavior:** it comes down, stays 4 seconds (a failure 6), and a tap dismisses it. A new one replaces it. Changing a field or trying again also dismisses it. It stays when the screen changes, so a screen can close and say why.
- **Sheets:** a failure or an Undo shows over the top sheet, which stays with what was typed. A failure goes when the sheet closes. Any other success shows as the sheet closes.
- **Action:** it can carry one action at its right, such as Undo on E30. It then stays 6 seconds.
- **Saving a page:** every page whose Save or Create closes it says so: "Bench press saved." or "Bench press created." That includes W30 and L30, "Chest and arms 2 saved." Actions that change the screen in place, such as skip or start, don't.
- **Examples:** "Bench press saved.", "Bench press created.", "Bench press deleted.", "Link sent again.", "Password changed. Sign in with the new one."

**Search fields.** Every search has a search icon at the start. Once it has text, a clear button (44 × 44 px) sits at the end, and tapping it shows the whole list again right away.

### Chips
36 px filter chips: "All" plus one per group, in the group order set in E30. The selected chip uses the accent. Chips stay on one line that scrolls sideways, with the last ones running off the edge, so they stay small enough to pin above a list. Chips for picking in a form, like the groups on L22, wrap instead.

### Cards
`card` fill, 1 px border, card radius, 16 px padding. A status card has an eyebrow with the status, a 22 px title and a meta line.

### Lists
Grouped lists sit inside one card, with rows divided by 1 px borders. On a list with search, the title and description scroll away, and the search and chips stay at the top, with a 1 px `border` line once content scrolls under them (E01 to E04, E30, R01 to R03, Add and Swap exercise). Section labels above lists are 12 px uppercase and muted. Long names wrap. Where a row keeps to one line, on a back link, E30, R20, R30, L04 and Recent records on Home, they end in "…".

### Radio cards
A choice of two or three side by side, like Units on A30: each card is at least `size.optionRowMin` tall, with 12 px padding, the name in `listItemName`, a `meta` line and a radio circle (`size.radio`). The chosen card has the `primary` border and `raised` fill.

### Form pages
Creating or editing something with fields is a page, with few exceptions. It has a back link named after the screen it came from, cut short on one line if long, a title and one short description. The fields scroll. Save … sits in the bottom box, and the back link cancels, so there is no Cancel. Done on the keyboard only closes it. Leaving with changes, by the back link, the phone's back button or a swipe, opens a "Discard changes?" sheet with Discard changes. Its X or a tap outside returns to the form with everything kept. Add exercise counts its picks as changes. Create account and Reset password ask too. Sign in and the other account forms don't.

### New buttons
Every create action is called New: New exercise, New group, New routine. On a list it is a square 48 px button with the `primary` fill and a +, floating 16 px from the right and 16 px above the tab bar, above a floating bar when one shows, or above the phone's own buttons on a page without the tab bar. It is named for screen readers, and the list keeps room after its last row so it never covers it.

### Steppers and quick picks
A value between − and + buttons (`size.stepper`), like the default rest time on A30 and H15. The value is shown in `stepperValue`, not typed; the buttons and the quick picks reach every allowed value. At a limit, its button looks muted, and tapping it says why, such as "At most 20 sets." (R45). Screen readers get one adjustable control that says the value in words. Quick picks are a row of common values in `quickPick` type; the one that matches the value is filled with `primary`.

### Email
An email uses the same tokens as the app, in a column of at most 480 px. It is always dark, because email apps can't follow the app's theme. Its layout is built from tables with inline styles, so it holds in every email app. The logo is `brand/wordmark-on-dark.png`, because email apps drop SVG. Chakra Petch shows where the email app allows web fonts, and the phone's system font elsewhere. A plain text copy goes with it. A13 is the reference.

### Sheets
- **Look:** a dimmed backdrop (62% black), a sheet rising from the bottom with rounded top corners and a 36 × 4 px grabber, and a 22 px title with a one-line explanation.
- **Actions:** a 44 px close X at the top right, and the main action at the bottom. There is no Cancel: the X, a tap outside or pulling down closes it.
- **Height:** it opens at its content's height. If the content doesn't fit, it takes all the room there is and its content scrolls.
- **Behavior:** a sheet closes back to the screen that opened it. Pulling the grabber down closes it.
- **Keyboard:** while it is open, the actions wait behind it so the fields keep the room. H19 is the exception: Delete account stays above the keyboard, because its one field leaves room. Done closes the keyboard. Dragging the fields closes the keyboard and brings the actions back.
- **Use:** deletes, other confirmations and quick picks open as sheets. Everything else that creates or edits is a page, including picking exercises (L20).
- **Stacking:** a sheet can open another, which rises over it. Only the top one takes touches, and closing it returns to the one below. 

### Confirmations
A question ("Delete Chest and arms 1?"), one sentence on what happens and what stays, and a danger button that repeats the verb ("Delete routine").

### Undo bar
- **Look:** 56 px, with the `raised` fill and a border. It comes down from the top of the screen, in the same place as the notification bar. The screen behind it stays as it is.
- **Content:** what happened and an Undo button, such as "Set 3 removed." L12 is the reference.

### Tab bar
Four tabs: Home, Workout, Routines, Exercises. Each item is 52 px with a 22 px icon, a 4 px gap and an 11 px label. The active tab is in the accent color and bold. The bar has 8 px padding at the top and sides. Its bottom padding is the phone's safe area, at least 8 px; the boards draw it as 28 px.

### Resume bar
When a workout is running, on any day, a bar like the rest bar floats above the tab bar. Both bars are 56 px tall, with 36 px controls that keep a 44 px tap area and 14 px text. It shows a chevron, the routine, the sets and the time, and a Resume button, which opens logging (H02). A progress line runs along its bottom edge. The chevron hides it to a small button on the right with the sets done, such as "7/19", which opens it again (W81). The phone remembers this until the next workout. Pages keep room at their end, so it never covers anything. It shows on a tab's first page and hides on every page with a back link. It stays hidden while it loads and if it fails, because most of the time no workout is running.

### Loading
A skeleton in the shape and size of the real content, so nothing moves when it loads, with a gentle pulse that turns off when the phone is set to reduce motion. Words that never change, such as a form's labels, stay as text, and only what is loading is a block. Each loading screen also has a screen-reader message, such as "Loading today's workout".

**If it fails,** one muted line says what couldn't load, with a Try again text link below it, in the dashed box of an empty state. On E01: "Couldn't load your exercises." A part of a screen that loads on its own fails in its own place, centered the same way, and the rest of the screen stays usable: R01's week plan, the week strip (W79), the month's calendar and totals (W96, W97) and E01's chips (E77). A refresh that fails keeps what is showing, so a failure only shows when there is nothing to show.

### Empty states
A short title, one sentence saying what to do, and the one action that fixes it. Empty states, no matches and failures sit in a dashed box, never as plain text on the background. Inside something that already frames it, such as E10's chart (E68, E69), the month's calendar (W96) or the chip row (E77), the line stays plain. A02's "Couldn't connect." on the launch screen is the other exception. Examples: "No routines yet" with New routine, and "No exercises yet" with New exercise.

---

## 6. Navigation

- **Tabs:**
  - **Home** is today at a glance.
  - **Workout** is today, the week, other days and the month.
  - **Routines** is the week plan and your routines.
  - **Exercises** is your exercise library and the groups.
- **Settings** opens from the FM avatar on Home. The avatar appears only on Home.
- **Feedback** opens from Feedback on H10, and New feedback from the card at the end of Home.
- **Admin:** an admin account sees only area M. It opens on M01 after sign in and at launch, with no tab bar, and every other page is closed to it.
- **Wide screens:** on the web, every page sits in a centered column 640 px wide, on the background.
- **Logging** opens from Start workout (W01, Home), Log workout (W21) or a routine picked in W10. While a workout runs, the Resume bar takes you back to it from any tab.
- **Sub-pages** have a back link above the title, named after the page it returns to (for example "‹ Profile"). Sub-pages never have both a back link and a bottom Cancel.
- **Moving between pages:** pages cross-fade, going forward and back. The screen behind them keeps the theme's background, never white.
- **Tabs** always open their first page. Leaving a tab returns it there, and pressing the open tab does too.
- **The tab bar** shows only on a tab's first page. Every page with a back link hides it and the Resume bar, like a modal: you go back, or save on a form.
- **Pages opened from Home** sit in another tab, with Home as their back link, such as a record's exercise (E75) and Resume workout. Android's back returns to Home too.
- **Links between pages:** a row or name that shows another exercise, routine or workout opens it, inside the tab you are in. Rows show a chevron; names in a card or table, the open-out icon. The back link names the page it came from, as it is named now. Something deleted since shows as plain text, never as a link to a page that can't load. A page that is already open further back is gone back to, never opened twice, so nothing behind you shows something out of date.
- **Days** all show on the Workout tab. Open day on the month and on Home, and a day in Home's This week, open the tab on that day, with "Back to today" when it isn't today.
- **Page end:** a page ends 24 px after its content, or 12 px above a floating bar when one shows.

---

## 7. Interaction rules

**Every action shows it can be used.** Anything tappable looks it at rest and reacts when pressed. Something read-only must not look tappable, so R05 shows only the routine's days, in small boxes with the `card` fill and no chevron.

| What it does | At rest | When pressed |
|---|---|---|
| Main action | Filled or outlined button | Dims to the `pressed` opacity |
| Opens another screen | A chevron on the right | The row fills with `raised` |
| Edits something on a row (R20, R30) | A small pencil beside it | Dims |
| Icon action | A boxed or colored icon | Dims |
| Pick or toggle | An outlined chip or card | Dims |
| Text link | Accent uppercase text | Dims |
| Reorder | A drag handle | The row lifts |
| Swipe (week strip) | A small muted chevron in the side padding, gone when there is nothing that way | The strip follows the finger |

**Saving**
- Save buttons name what they save: Save set, Save routine, Save color, Save workout.
- Sheets and form pages have no Cancel.
- Saves never ask for confirmation.

**Confirmations are only for these actions**
- Trash on an exercise during logging (L13) or in a routine (R23).
- Discard workout (L33).
- Delete workout (W32).
- Delete routine (R22).
- Delete exercise (E21).
- Delete group (E34).
- Delete account (H19).
- Skip workout (W26) and Undo skip (W27).
- Sign out (H36).
- Starting from another routine (W57), and Start workout on Home (H44).

Leaving a form with changes also asks (Form pages). Nothing else asks "Are you sure?".

**Undo bars after every removal**
- **Logging:** set removed (L12), exercise removed (L50), exercise swapped (L53) and workout discarded (W65).
- **Edit workout:** set removed (W31) and exercise removed.
- **Routines:** exercise removed from a routine (R25), and routine deleted (R07).
- **Exercises:** exercise deleted (E06), and group deleted (E39).
- **Other:** workout deleted (W83), and profile photo removed (H41).
- **Exception:** delete account has no undo bar (H19). Signing in within 14 days keeps the account (A08).

**Waiting before sending again.** Send link again on A11 waits a minute, from when A11 opens and again after each send, so people can't send link after link. While it waits it looks muted and counts down, "Send link again in 0:42", and tapping it says "Wait a moment before sending it again." H33 works the same, but waits only after a send.

**Delete from details.** A routine or exercise is deleted from its details: a red trash icon to the right of the edit button on R05, E10 and E11.

**Groups.** A group can only be deleted when it has no exercises. Only an empty group's trash on E35 is active, in red.

**Day colors.** Each weekday has its own muted color (`day` tokens), only on R01: its square in the week plan and its day tag on the routine below. It never means a status, and the day name always shows with it. Picked Days chips (R05, R20, R30) use `primary`.

**Forms.** A field has a label and no placeholder. Hints sit below the field.

**Empty sections.** A section with nothing in it is a dashed, centered card with a title and one line on what to do.

**Empty screens.** An empty screen keeps every section and control of the filled one, and empty content sits where filled content would. Search, chips and range buttons that can't be used yet stay in place, muted, and tapping one says why, such as "Create an exercise first."

**Pages that haven't loaded.** A page's bottom button stays in place while the page loads or fails, muted, and tapping it says "This page hasn't loaded yet."

**Optional fields.** An optional field says so after its label, as "Days · optional" and "Also works · optional". Required fields say nothing.

**Picking days.** A day holds one routine. Picking a day another routine has moves it to this one when the form is saved, and the notification says so: "Legs saved. Monday moved from Push."

**Groups in a routine.** Each exercise shows its group after its target. Exercises keep the user's order.

**Lengthened partials.** Half reps at the stretched end, right after a set. Lengthened partials on R21, below the line, turns them on for an exercise, which then shows "· LP" after its group on R05, R20, the day cards, L01 and W30. On L01 each of its sets has an LP box beside the check box, ticked when they are done (L75). Checking a set shows "LENGTHENED PARTIALS" with Skip and Done in the rest bar's place; Done ticks the box, and either goes on to the rest (L76). In a superset it shows after the first exercise's set, and the rest still waits for the second. An LP button beside the link icon on an open exercise turns them on or off for that workout only, on L01 and W30 (L77). W30 has the LP boxes too, to correct a missed tick. To leave last time room, set rows on L01 and W30 use a 24 px number column with less room after it, 48 px value boxes, and 40 px tick columns with 30 px boxes, side by side. A set with them reads "80 × 10 + LP" on W67 and in E10's sessions. L01's last time column stays short, without it. A swap turns them off, and its Undo brings them back. They never count toward volume or records.

**Supersets.** A superset is two exercises done one after the other: a set of each, then rest. Superset with next on R21 pairs an exercise with the one after it. It looks muted and says why on the last exercise ("Add an exercise after this one first."), on the second of a superset ("A superset is two exercises."), and when the next one is already in one ("Leg curl is already in a superset."). A superset joins into one block, with one line between its exercises and round corners only outside. Superset is written up its right edge on R05, R20, the day cards, L01, L04 and W67. Open cards need the room, so an open superset on L01, and every superset on W30, joins without it. On R21 a line separates the switch from the targets. While logging (L01) and editing a saved workout (W30), a link icon beside swap and trash turns Superset with next on or off, with the same reasons when it can't (L78), and Add exercise, here and on R42 when building a routine, offers Add as superset when two are picked; with another count it looks muted and says "Pick two exercises for a superset." (L79). On R20 and L04 the pair drags as one; while dragging every card separates, and they rejoin on drop. Removing either exercise ends the superset, and Undo brings it back. A swap keeps it.

**Exercises in a routine.** An exercise in a routine can't be deleted. Its trash on E10 is muted, and tapping it says "It's in Legs and Arms. Remove it from those routines first." One routine reads "It's in Legs. Remove it from that routine first." More than three read "It's in 5 routines. Remove it from them first."

**Actions that aren't available.** An action that isn't available looks muted but stays tappable, and a notification says why. It is never hidden instead, so the app stays predictable and everything stays where people remember it. Only an action that has no meaning in a state is left out, such as Undo skip on a day that wasn't skipped, or Back to today on W40 while today is shown. For example: "Move or delete this group's exercises first." A button dimmed while another action waits is different: it can't be pressed.

**Schedule.** The week plan repeats every week. Missing a day doesn't shift the schedule. Picking another routine for a day (W10) replaces only that day's plan.

---

## 8. Content rules

**Voice.** Short, plain sentences in sentence case. Say what happens and what stays: "Workouts you already logged stay."

**Labels.** Eyebrows, field labels and buttons are uppercase in the UI. They are written in sentence case in the source.

**Punctuation.** Apostrophes are curly (’). A value that isn't there yet is one dash (–). A test fails on a straight apostrophe or an em dash.

**Day headers**

| Day | Label above | Title |
|---|---|---|
| Today | Fri, 23rd October | Today |
| Yesterday | Thu, 22nd October | Yesterday |
| Tomorrow | Sat, 24th October | Tomorrow |
| Any other day | 20th October, or 20th October 2025 in another year | Tuesday |

**Home greeting (H01–H07).** The label above "Home" follows the time of day:
- "Good morning, Filip" until 12:00;
- "Good afternoon, Filip" until 18:00;
- "Good evening, Filip" after that.

**Account labels.** A13 and A14 show "Forgot password?" above the title. A10, A11 and A12 have a back link to Sign in instead, and A10 and A12 have no Cancel. A20 and A30 show "Welcome to Herculean".

**Formats**

| What | Format |
|---|---|
| Short date | Fri, 16th Oct, or Fri, 16th Oct 2023 in another year. A date that must be exact, on A08 and in emails, always has the year |
| Date and time | Fri, 16th Oct, 14:05, in the phone’s time, 24-hour |
| Since | Since 7th Aug, or Since 7th Aug 2023 in another year |
| Set | 82.5 kg × 10 |
| Bodyweight set | 10 reps |
| Target | 3 × 8–10 (sets × rep range); a fixed count uses the same number twice |
| Session sets | 80 × 10 · 82.5 × 10 · 82.5 × 8 |
| Elapsed time while logging | 6:40 |
| Duration after the workout | 64 min, or 1:04:10 on the finish screen |
| Large numbers | 9,840 kg |
| Volume in a small space (Home) | 12.4 t, or 27.3k lb, from a thousand up |

**Names.** Exercise names are written in full and wrap onto a second line, except in the one-line rows listed under Lists in section 5.

---

## 9. Screens

### A · Account

| Row | Screens | What happens |
|---|---|---|
| **A0 Launch** | A00 Splash, A02 Couldn't connect | The logo on a soft accent glow while the app checks whether you are signed in. If you are signed out, A01 opens; if you are signed in, H07 opens, or A30 if setup isn't finished. Without a connection, A02 shows "Couldn't connect." and a Try again text link below the logo, which stays in place. |
| **A1 Sign in** | A01 Sign in, A03 Signing in, A04 Fields missing, A05 Wrong email or password, A06 Couldn't sign in, A58 Keeping, A59 Couldn't keep | Logo, Email and Password, the Forgot password? link, and Sign in. Below it, "New here?" and a Create account text link. A03 is the waiting state. A01 also opens on first launch, after Sign out and after Delete account. |
| **A2 Reset password** | A10 Reset password, A11 Link sent, A13 Reset email, A14 Opening the app, A12 New password, A15 Link expired, A16 Passwords differ, A17 Sending, A18 Couldn't send, A19 Link can be sent again, A50 Sending again, A51 Link sent again, A52 Couldn't send again, A53 Saving, A54 Couldn't save, A55 Password changed, A56 Discard changes, A57 Link no longer valid, A60 Send again says why | Email → Send reset link → "Check your email" (the link works for one hour; Send link again) → the link in A13 opens A14, which opens the app → New password twice → Save password → A01, which says "Password changed. Sign in with the new one." If saving fails, A12 stays open and a notification says so. A14 is the page a browser shows for a moment; its button is there in case the app doesn't open by itself. An expired or used link opens A10 with the notification "This link has expired. Send a new one." If the link expires while the user types, A12 says the link is no longer valid (A57). Leaving A10 with an email typed asks first (A56). |
| **A3 Create account** | A20 Create account, A30 Setup, A21 Fields missing, A22 Email taken, A31 Name missing, A23 Creating, A24 Couldn't create, A32 Finishing, A33 Couldn't finish, A25 Discard changes | Email and password twice, with links to the terms (H20) and privacy policy (H21). Below Create account, "Already have an account?" and a Sign in text link. Then Setup: name, units and default rest time, all changeable later in Profile. The rest time steps by 15 seconds from 0:15 to 10:00, with quick picks of 1, 2, 3, 4 and 5 minutes. A new account starts at 3:00. Finish setup → H05. Leaving A20 with anything typed asks first (A25). |

### H · Home

| Row | Screens | What happens |
|---|---|---|
| **H1 Today states** | H07 Loading, H01 Home, H02 In progress, H03 Completed, H06 Skipped, H04 Rest day, H05 New account, H08 A section failed, H09 Setup complete, H44 Are you ready, H45 Every section failed, H46 Starting, H47 Couldn't start, H48 Start says why, H91 Feedback reply unread | The greeting on one line at 28 px (`greeting`), shrinking for a long name instead of wrapping, with the FM avatar after it on the right, then five sections that each load and fail on their own: Today, This week, This month, Streak and Recent records. Today has one action at most. Home ends with a card, “Something off or missing?”, with a Send feedback link that opens F10 with Home as its back link (F16); it loads with nothing and never fails. H91 shows a dot on the avatar while a feedback reply is unread. H01: the planned routine and Start workout, which asks first on H44. H02: progress and time, Resume workout, and the Resume bar. H03: Done, View workout (W67, with Home as its back link) and Up next. H06: Skipped and Up next. H04: Rest day and Up next. H05: No routines yet and New routine, with every other section empty. Open day opens the Workout tab on today, and another day in This week opens the Workout tab on that day. This month compares workouts, on plan and volume with last month, and Open month opens W40, whose back link goes to the Workout tab. Streak only shows, and a streak that ended says No streak right now and keeps the best. Records sit in one card with a line between rows, and a record opens E10 (E75). Resume workout opens logging with Home as its back link. Pulling down reads everything again, with the phone's own spinner. |
| **H2 Settings** | H10 Profile, H11 Profile photo, H12 Theme, H13 Color, H14 Units, H15 Default rest time, H16 Name, H17 Email, H18 Change password, H19 Delete account, H22 Wrong current password, H23 New password errors, H24 Name empty, H25 Password changed email, H26 Email errors, H27 Confirming email, H28 Link expired, H29 Could not confirm, H30 Confirmation email, H31 Email changed notice, H32 Email waiting, H33 Email page while waiting, H34 Delete account wrong password, H35 Could not delete, H36 Sign out, H37 Account deleted email, H38 Deletion scheduled email, H39 With a photo, H40 No photo, H41 Photo removed, H52 Name saving, H53 Name couldn't save, H56 Email saving, H57 Couldn't send, H58 Send again says why, H59 Sending again, H60 Sent again, H61 Couldn't send again, H62 Password saving, H63 Password couldn't save, H64 Password saved, H65 Rest time loading, H66 Rest time couldn't load, H67 Rest time saving, H68 Rest time couldn't save, H69 Couldn't remove photo, H70 Signing out, H71 Password empty, H72 Deleting, H73 Email confirmed, H74 Email confirmed signed out, H75 Link expired signed out, H76 Could not confirm signed out, H84 Email taken, H86 Exporting data, H87 Couldn't export, H88 Data exported, H89 Notifications blocked, H90 Couldn't save a rest alert, H92 Feedback reply unread | H10 sections: profile (photo, name); Appearance (Theme, Color); Workout (Units, Default rest time, Sound when rest ends, Vibrate when rest ends); Account (Name, Email, Password, Export data); About (Feedback, Terms of service, Privacy policy, Version, which is the app's real version), with a dot on Feedback while a reply is unread (H92); then Sign out and Delete account. The rest alert switches save at once; every other row opens its own page. The theme options are Match my phone (default), Dark and Light. The colors are Nitro, Titanium, Flux, Plasma and Neon, each with a square of its buttons' color, in the mode in use, before its name. The units are Metric (kg) and Imperial (lb). |
| **H3 About and legal** | H20 Terms of service, H21 Privacy policy | Full-page text with "Last updated" and numbered sections. These open from H10, or from A20 with the back link reading "Create account". |

### W · Workout

| Row | Screens | What happens |
|---|---|---|
| **W1 Today states** | W07 Loading, W08 Load failure, W01 Today, W02 In progress, W03 Completed, W06 Skipped, W26 Skip confirm, W27 Undo skip confirm, W04 Rest day, W09 Rest tomorrow, W05 No routines, W65 Workout discarded, with Undo, W66 Couldn't undo a discard, W13 Skipping, W14 Couldn't skip, W15 Undoing, W16 Couldn't undo, W72 Starting, W73 Couldn't start, W74 Another workout in progress, W75 Week strip loading, W79 Week strip load failure, W80 Start muted, W81 Resume bar hidden | The day header, a calendar icon button (→ W40) and a week strip Mon–Sun. The strip's markers load on their own (W75); if they fail, "Couldn't load the week." and Try again show under the strip, and the day stays usable (W79). While a workout is in progress on another day, Start workout, Log workout and Other routine look muted (W80), and tapping one says "Resume or finish your workout first." (W74). A marker means a workout belongs on that day: muted when planned, white on today, then green for done, orange for skipped and red for missed. A rest day has none. Today's card shows the routine and its exercises with targets. W01 has Start workout, Other routine and Skip workout. W03 has Edit and Delete. Its exercises look like R05's, on the card. W06 has its exercises, Up next and Undo skip. Skip workout asks first in W26, and Undo skip in W27, each a sheet with one button. Undoing brings W01 back today, or W21 on a past day. W09 is W04 when the next day is a rest day too. Up next always shows the day after the one shown: a routine or Rest. |
| **W2 Choose a routine** | W10 Choose a routine, W11 Loading, W57 Confirm, W58 Starting, W59 Couldn't start, W60 Nothing in the week plan, W61 Confirm loading, W62 Confirm couldn't load, W63 Load failure | A page in the Workout tab with a back link, opened by Other routine. Subtitle: "For this day only. Your schedule stays the same." It lists the routines in the week plan with their exercise count and last-done date, or "not done yet". The day's planned routine comes first, tagged Planned in plain text, even if it has since left the week plan. The rest follow the order of R01. Tapping one opens W57, a sheet: "Start Legs?", or "Log Legs?" on a past day, with the same count and date, the routine's exercises, and Start workout or Log workout, which still works if the exercises can't load. Its X returns to the list. Confirming starts that routine for that day only, then logging opens. W60 has only an empty card, "No routines in your week plan". With no routines at all, the day shows W05, so this page can't be reached. |
| **W3 Other days** | W20 Past day, W23 Yesterday rest day, W21 Missed day, W22 Skipped day, W24 Tomorrow, W25 Rest day, W28 Another week, W17 First week, no earlier weeks, W18 Last week, no later weeks, W19 Day in another year, W64 Other routine before the first day, W67 Workout details, W68 Details loading, W69 Details load failure, W70 Completed day load failure, W71 Details from the month, W99 Workout from an exercise, W82 Upcoming day, start says why, W91 Skip says why | Opened from a day in the week strip. W20 is a completed workout with Edit and Delete. W21 is missed (red) with Log workout, then Other routine and Skip workout, laid out like W01. W22 is skipped (orange) with Undo skip. W24 shows the plan with Start workout, Other routine and Skip workout muted, and W25 a rest day with Other routine muted. On a future day, tapping one says "A workout can't be started before its day." or "A workout can't be skipped before its day." (W82). The selected day stays when you leave the tab and come back, until Back to today. W28 is another week: swiping the strip opens the same weekday there, and it reaches from the week of the first day to 4 weeks ahead. |
| **W4 Edit or delete a workout** | W30 Edit workout, W31 Set removed, W32 Delete confirm, W83 Workout deleted, with Undo, W84 Couldn't delete, W85 Couldn't undo, W86 Edit loading, W87 Couldn't load, W88 Saving, W89 Couldn't save, W90 Discard changes, W93 Deleting, W94 No exercises left, W98 Duration too long | Correct the duration, edit every set's weight and reps, add or remove sets and exercises, then Save workout. W30 is like L01 with every exercise open, no check boxes and no Swap. Removing a set or an exercise offers Undo (W31, L13). An added exercise starts with 3 sets at 0 and the low end of the reps, and shows its last time before the workout's date. With no exercises left, Save workout looks muted and says why. Leaving with changes asks first (W90). Delete on W03 and W20 asks first in W32, "Delete Back and shoulders 1?": its sets come out of history, best sets and month totals, and you can undo it. Then the day shows its plan, and "Workout deleted." offers Undo (W83), like a discard. |
| **W5 Month** | W41 Loading, W40 Month, W42 Day summary, W43 Missed, W44 Skipped, W45 Planned, W46 Rest day, W47 First month, W48 Another day selected, W49 Calendar and totals failed, W96 Calendar failed, W97 Totals failed, W50 Another month, W51 Last month, a later day says why, W52 First month, an earlier day says why, W53 Nothing planned yet, W54 Today, W55 Loading, W56 Load failure, W76 In progress, W77 Completed loading, W78 Completed load failure | Summary tiles for Done, Missed and Skipped, then a calendar of outlined day tiles, with empty rows for weeks a month doesn't reach. As in the week strip, the selected day is filled in the accent, with a white marker, and today is outlined when another day is selected. Today starts selected, and a tapped day stays selected (W48). Markers follow W01: a status bar under each past day, a white bar on today when a workout is planned, a muted bar on planned days, and none on rest days. A legend sits below it, and days from other months are left empty. Below that are the month totals: time trained, sets, volume and on plan. With no planned days yet, on plan shows "–". The calendar swipes like the week strip: it follows the finger, a short swipe springs back, and it bounces at the limits. The tiles and totals follow the new month. Swiping changes the month, from the first day's month to the month holding the last day the week strip reaches, and small chevrons beside the calendar show which ways it can go. Days past those limits look muted, and tapping one says why (W47). Every month takes six weeks, and the month sits above its year, so nothing moves between months. Back to today shows when another day or month is selected (W48). The calendar and the totals load apart. If the calendar fails, its card keeps its size and says so inside, with Try again, and swiping still works (W96). If the totals fail, the tiles keep their labels with a dash, and a box takes the totals' place (W97). W49 is both. Tapping a day opens the summary sheet: W42 for a completed workout, which comes with logging, W43 to W45 with targets where nothing was logged, W46 for rest, with "Nothing planned. Recovery is part of the program." The exercises use the same list as the day screens, and neighbours in the same group join. Today uses the sheet for its state. Open day goes back to the Workout tab, on that day, in its week. |

### L · Logging

| Row | Screens | What happens |
|---|---|---|
| **L1 Log sets** | L03 Loading, L05 Load failure, L01 Logging, L06 Rest ready, L07 Rest running, L08 Rest hidden, L09 Rest over, L10 Edit weight, L11 Edit reps, L12 Set removed, L04 Reorder, L40 30 exercises says why, L41 20 sets says why, L42 Reps are whole numbers, L43 Out of range says why, L44 Only set says why, L45 Saving set, L46 Couldn't save a set, L47 Couldn't add a set, L48 Couldn't remove a set, L49 Couldn't bring the set back, L60 Reorder loading, L61 Reorder load failure, L62 Dragging, L63 Couldn't save the order, L66 Adding a set, L73 Remove set confirm, L74 Superset open, L75 Lengthened partials boxes, L76 Lengthened partials prompt, L77 Lengthened partials for this workout, L78 Superset link says why | A back link reads Workout, or Home when Resume workout on Home opened it, because every change saves as you go. The title has the date and elapsed time under it, then "x of 19 sets" and a progress bar. On a past day there is no elapsed time. Exercises use the cards of the day screens, and a superset joins, each exercise with its progress (0/3) and a chevron. One exercise is open at a time, as its own outlined card: first the first unfinished one, and the next one when its last set is checked. Checking the last set of all closes it. Any exercise can be tapped open. A superset opens whole, as one outlined block, with the set to do next outlined: a set of each in turn, and the one with more sets goes on alone. The rest bar waits for a set of each (L74). Its rows show the set number, last time, weight and reps, plus a check box, with equal weight and reps boxes. The whole row opens the set's page, and only the check box doesn't. Checked rows are tinted and stay editable, and tapping the check unchecks them. Add set, which copies the last set, Add exercise and Reorder are available, and Finish is a full-width primary button below them, at the end of the page. Below two exercises, Reorder looks muted and says "Add another exercise first.", and with none, "0 of 0 sets" stays. At 20 sets, Add set looks muted and says why. Changing a value also changes the same value on later unchecked sets, unless they were changed by hand. After each checked set except the last, a rest bar appears at the bottom of the screen, ready to start, with −15, +15 and Start, and a small REST label with room before an 18 px time (L06). Running, Start becomes Skip (L07). A chevron hides it to a small button with a clock and the time (L08), which opens it again. Past zero it counts up in green, with Done (L09). There is no alert, and a past day has no timer. Tapping a value opens the set's page, titled "Set 1" with the exercise under it, with last time, the values, steppers (±2.5 kg, ±5 lb or ±1 rep), a keypad, and Save set in the bottom box. Leaving it with a change asks first. The first key pressed replaces the value. A trash icon beside Last time asks first (L73), then removes the set, with Undo. With one set left it looks muted and says to use the exercise's trash. A value out of range mutes Save set, and tapping it says why. The swap icon opens Add exercise as Swap exercise, one pick from the same group first, keeping the set count and targets, with Undo. With checked sets it looks muted and says to uncheck them. The exercise name and targets, with a small open-out icon at the end of the name, open E10, which holds its history. |
| **L2 Exercises** | L13 Remove exercise, L29 Swap exercise, L16 Swap says why, L20 Add exercise, L24 Loading, L21 No matches, L22 New exercise, L23 New one selected, L25 Load failure, L26 Fields missing, L27 No groups, New exercise says why, L28 Nothing picked says why, L50 Exercise removed, with Undo, L51 Couldn't remove, L52 Couldn't bring it back, L53 Swapped, with Undo, L54 Swapping, L55 Couldn't swap, L56 Couldn't undo a swap, L57 Adding, L58 Couldn't add, L59 Discard picks, L65 Reorder says why, L67 Removing, L68 Nothing to swap to, L69 Groups couldn't load, L72 New group, L79 Add as superset | The trash asks first (L13), and the removal has Undo. The swap icon opens the same list as Swap exercise (L29): one pick, starting on the exercise's group, with Undo. With checked sets it looks muted and says why (L16). Add exercise is a page with a back link, a short description, search, group chips and a multi-select list, with its action in the bottom box. The chips start with New group, which opens New group with a back link to Add or Swap exercise, and comes back with the new group selected (L72). New exercise closes the list, after a line and a gap, so it doesn't read as adding to the group above it. A new exercise comes back picked, marked NEW. The button reads "Add exercise" with one picked and "Add exercises" with several. If nothing matches, New exercise is still there (name, group, and an optional "Also works"). L22 fills in the name from the search and the group from the selected chip. Without a group, it asks: "Choose a group." The group an exercise belongs to isn't offered under "Also works". A name the user already has shows under Name, and at 500 exercises a notification says "You've reached the limit of 500 exercises." The new exercise comes back selected and marked "New". Leaving with exercises picked asks first (L59). A swap or add the server refuses says why, such as a set checked since (L55) or no room left (L58). |
| **L3 Finish** | L30 Finish workout, L02 No exercises left, L31 Nothing logged, L32 Past day, L70 Past day, duration too long, L71 Long workout, L33 Discard confirm, L34 Loading, L35 Load failure, L36 Saving, L37 Couldn't save, L38 Discarding, L39 Couldn't discard, L64 Save says why | A page with a Logging back link. L30 shows a warning for unchecked sets, then Duration, Sets, Volume and Records, plus New records, with Save workout and Discard workout. With no new records, the section stays and says "No new records this time.", here and on W67. Saving removes unchecked sets and any exercise left with no sets, then the day shows as completed. A past day has no timer, so its duration is typed in minutes, or left out, and only the Sets and Volume tiles show (L32, L70). After 4 hours on the timer, L30 warns "Long workout? You can correct the time after saving." (L71). A record beats every set from earlier dates; an exercise's first session has none, and each exercise shows at most one, heaviest weight first, then most reps at a weight. With nothing checked (L31), Save workout looks muted and says "Check off a set to save, or discard the workout." The warning shows at once, from the workout logging already holds. Discard workout asks first (L33), then the day shows its plan and W65 offers Undo, which puts the workout back in progress on that day. L02 is the logging screen after every exercise has been removed, with Add exercise, and with Finish still there. |

### R · Routines

| Row | Screens | What happens |
|---|---|---|
| **R1 Routines tab** | R02 Loading, R01 Routines, R03 No routines, R04 No search matches, R06 Load failure, R07 Routine deleted, with Undo, R11 Rest day says how to plan it, R12 Couldn't undo a delete, R49 No routines, search says why | The week plan, then your routines with their day tags. The week plan ("Repeats every week") is one strip of seven days: a square in the day's color for a day with a routine, a dash for a rest day. Tapping a day with a routine opens its R05, and tapping a rest day says "Thursday is a rest day. Edit a routine to pick its days." The title and a short description scroll away, search by name stays at the top, and New routine floats at the bottom right. With no routines, the week plan shows seven rest days, search stays, muted, and says why (R49), and tapping a rest day opens R30 with that day picked. While searching, the week plan goes. The week plan and the routines load on their own, each with its skeleton; if the week plan fails, it says "Couldn't load the week plan." with Try again in its place. Today, the week strip and the month follow the plan. |
| **R3 Edit a routine** | R05 Routine details, R50 Routine from an exercise, R20 Edit routine, R21 Sets and reps, R51 Superset with next, R52 Superset says why, R53 Superset joined, R23 Remove exercise, R22 Delete routine, R28 A day moved from another routine, R33 Not on any day, R34 Dragging an exercise, R35 Loading, R36 Load failure, R37 Saving, R38 Couldn't save, R39 Deleting, R40 Couldn't delete, R08 Details loading, R09 Details load failure, R24 Name taken, R25 Exercise removed, with Undo, R26 Discard changes, R42 Add exercise, R44 Discard sets and reps, R45 At the limit, R46 Nothing to add, R47 Add exercise says why, R48 Delete, not on any day | A routine on R01 opens R05: its name and totals, edit and delete buttons, then its days and its exercises with targets, for display only. Edit opens R20, a page with name, days, exercises with targets, drag handles, trash and Add exercise (new exercises start at 3 × 8–10), then Save routine. Add exercise opens R42, the picker from L20. At 30 exercises it looks muted and says "A routine can have at most 30 exercises." R21 opens as a page from R20. Delete opens R22. Deleting a routine makes its days rest days, and a notification on R01 offers Undo, which brings them back. |
| **R4 New routine** | R30 New routine, R32 Days picked, R41 Created, R31 Fields missing, R43 Limit reached | A page with name, days and exercises, then Save routine. Days are optional. At 50 routines, saving says so (R43). Opens from New routine on R01, R03, H05 and W05. |

### E · Exercises

| Row | Screens | What happens |
|---|---|---|
| **E1 Exercises tab** | E02 Loading, E01 Exercises, E03 No matches, E04 No exercises, E05 Load failure, E77 Groups couldn't load, E06 Exercise deleted, with Undo, E07 No exercises in this group, E08 New exercise, E09 Exercise created, E29 Couldn't undo a delete, E56 No groups, New exercise says why, E57 Groups loading, E58 Limit reached, E59 Name taken, E60 Saving, E61 Couldn't save, E62 Discard changes, E63 Groups loading on New exercise, E71 One group, E72 Name too long, E78 No exercises, search says why | Search, group chips, and the list grouped by muscle. Each row shows the best set and its date, or "Not done yet". The title and its description scroll away, search and the chips stay at the top, with Groups (→ E30) as a link chip before All, and New exercise floats at the bottom right. The chips and the list load apart: if the groups fail, the list stays, and the chip row says "Couldn't load your groups." with Try again (E77). Picking a group or searching returns the list to the top. After saving a new exercise, E01 clears its filters so the exercise is in the list, and a notification says "Cable lateral raise created." With no exercises, search and the chips stay, muted, and tapping one says why (E78). With no groups either, they say to create a group first (E56). A group without exercises, with nothing searched, shows E03's layout: "No exercises in Chest", "Create one to use it in routines and workouts." |
| **E2 Exercise details** | E10 Exercise, E11 Never done, E12 In routines, trash says why, E13 Loading, E14 Load failure, E17 Loading more sessions, E18 Couldn't load sessions, E19 Sessions loading, E67 Chart loading, E68 Chart couldn't load, E69 No sessions in this period, E70 All, by month, E74 Sessions couldn't load, E75 From Home, E76 From Logging, E85 From a group, E86 From a routine, E87 From a workout, E80 Never done, range says why | Best set, times done, a heaviest-set chart (3M, 6M, 1Y, All), "Used in" routines by name with a line between them, each opening R05 with the exercise as its back link (R50), and every session by month. Edit icon in the header. Sessions load on their own, 20 at a time, newest first, and the next 20 load near the end of the list. A month heading reads "October · 3 sessions", counting the whole month, with the year when it isn't this one, above a card of that month's rows. A row shows the date, the workout's name and its checked sets, "80 × 10 · 82.5 × 10", with "kg × reps" under them, and opens that workout's W67 with the exercise as its back link (W99). While sessions load, skeleton rows show in their place (E19, and E17 at the end of the list). A failure says "Couldn't load the sessions." or "Couldn't load more sessions." in place, with Try again (E18). The chart shows the heaviest set of each session in the range, oldest first, with the change above it; a range over 60 sessions shows each month's heaviest set instead (E70). It loads on its own, with a skeleton (E67), a failure in its box (E68), and "No sessions in this period" (E69). Never done (E11), every section keeps its place: Best set shows a dash and "Not done yet", Done shows "0 times", the chart's box says "No sessions yet" without range buttons, and All sessions shows "No sessions yet", "Finish a workout with this exercise and its sessions show up here." On E11, the range buttons stay, muted, and tapping one says why (E80). |
| **E3 Edit or delete** | E20 Edit exercise, E21 Delete confirm, E22 Name taken, E23 Confirm, E15 Loading, E16 Load failure, E24 Saving, E25 Couldn't save, E26 Saved, E27 Deleting, E28 Couldn't delete | A page with name, group and "Also works", then Save exercise. Changes show everywhere, past workouts included. The edit icon on E10 and E11 opens E20, and the trash icon opens E21. Only an exercise in no routine can be deleted, and logged workouts keep it. Then a notification says "Bench press deleted." with Undo. |
| **E4 Groups** | E31 Loading, E30 Groups, E36 No groups, E35 Group, E33 Edit group, E32 New group, E34 Delete, E37 Load failure, E38 Name taken, E39 Group deleted, with Undo, E40 Trash says why, E41 No exercises, E42 No search matches, E43 Dragging a group, E44 Couldn't save the order, E45 Saving, E46 Couldn't save, E47 Group created, E48 Saved, E49 Loading, E50 Load failure, E51 Loading, E52 Load failure, E53 Deleting, E54 Couldn't delete, E55 Couldn't undo a delete, E64 Name missing, E65 Discard changes, E66 Not done yet, E73 Name too long, E79 No groups, search says why, E81 Reorder groups, E82 Reorder loading, E83 Reorder load failure, E84 Reorder says why | Groups with exercise counts, in one card. The title scrolls away and search stays at the top, and New group floats at the bottom right. While searching, New group starts from what was typed. A Reorder icon beside the title opens Reorder groups (E81), where each group has a handle and each drop saves, which sets the chip order (E43, E44). Below two groups the icon is muted and says "Create another group first." (E84). New group and Edit group are pages. A row opens E35: the exercises in the group and those that also work it, with their best sets, each opening E10 with the group as its back link (E85), with Edit and Delete in the header; only an empty group can be deleted. Its "No sessions yet" card shows until one of its exercises has been done; E66 shows it before. Exercises and Also works always show; an empty one says "No exercises yet", and Also works adds "Choose this group under Also works when you create or edit an exercise." With no groups, search stays, muted, and says why (E79). |

### F · Feedback

| Row | Screens | What happens |
|---|---|---|
| **F0 Your feedback** | F03 Loading, F01 Your feedback, F02 No feedback, F04 Load failure | A page from Feedback on H10, with Profile as its back link, titled Your feedback, “Bugs, suggestions and anything else you sent.” Status chips All, Open, Answered and Closed sit below the title, Answered picked first; with no feedback they look muted and say “Send feedback first.” A status with nothing says “Nothing open”, “Nothing answered” or “Nothing closed”, “Pick All to see everything you sent.” Your tickets in one card, newest first, with a line between rows. A row shows the type, the message's first line ending in “…”, the status as a dot and label (Open in the accent, Answered green, Closed muted) and the date and time of the last message, with a chevron, and opens F20 with Your feedback as its back link. A row with a reply you haven't read has an 8 px accent dot after its type, and its label says “new reply”. New feedback floats at the bottom right. Empty, a dashed box says “No feedback yet”, “Report a bug or suggest something.”, with the New button still floating. It fails with “Couldn’t load your feedback.” and Try again. |
| **F1 New feedback** | F10 New feedback, F11 Message missing, F12 With screenshots, F13 Sending, F14 Couldn't send, F15 Discard changes, F16 From Home, F17 Add screenshot says why | A page titled New feedback, “Tell us what went wrong or what you’d like.”, with Type (radio cards Bug, Suggestion, Other, Bug picked first), Message (up to 2,000 characters), and Add screenshot, then Send feedback in the bottom box. A hint under the message says “Sent with your app version, phone and OS.” A screenshot is picked with the phone's own picker, compressed on the phone to at most 1 MB, and shows as a square thumbnail with Remove, four to a row in equal columns; at 4, Add screenshot looks muted and says “At most 4 screenshots.” (F17). An empty message says “Write a message.” under the field (F11). Screenshots come from the phone’s photos, several at once. If photo access is blocked, a notification says “Allow photo access in your phone’s settings.”, and if one can’t be read, “Couldn’t add the screenshot. Try another.”, with no capture, like H42 and H43. If sending fails, “Couldn’t send. Try again.” (F14), and after 10 in a day, “You’ve sent a lot of feedback today. Try again tomorrow.” Sending replaces the page with the new ticket's F20 and “Feedback sent.” Leaving with anything typed or added asks first (F15). |
| **F2 Ticket** | F21 Loading, F20 Ticket, F22 Load failure, F23 Sending a reply, F24 Couldn't send a reply, F25 Closed, reply says why, F26 Reply with screenshots, F27 Send says why | The type as the title and the status below it, then the messages oldest first, each a card headed You or Minimalist with when it was sent, and its screenshots as square thumbnails under the text, four to a row. Your own messages sit on a raised card with the accent’s border. Each thumbnail loads on its own, a failed one shows the alert icon and tapping it tries again, and tapping a loaded one opens it full screen with a Close button. The page fails with “Couldn’t load this feedback.” (F22), and while it loads or fails the reply box looks muted and says “This page hasn’t loaded yet.” The reply box sits in the bottom box in one row: an Add screenshot icon button (up to 4, F26), the Reply field, which grows to three lines, and Send, all 44 px tall and lined up, with its screenshots above the row. Send looks muted until something is typed and says “Write a reply first.” (F27). If sending fails, the reply stays in the box and a notification says “Couldn’t send. Try again.” (F24). Opening the keyboard to reply scrolls the thread so the latest message shows above it. After Send, the keyboard closes and the thread scrolls to the new message. Opening a ticket marks its replies read, and pulling down reads it again, with the phone’s own spinner. On a closed ticket the reply box looks muted and says “This feedback is closed. Send new feedback instead.” (F25). |

### M · Admin

| Row | Screens | What happens |
|---|---|---|
| **M0 Inbox** | M02 Loading, M01 Feedback, M03 Nothing in this status, M04 Load failure, M05 Sign out | The admin’s first page, titled Feedback, with Sign out as a text link at the right of the title, which asks first on M05, H36’s sheet. Status chips All, Open, Answered and Closed stay at the top, Open picked first. The tickets sit in one card, the latest message first, with a line between rows, like F01: the type, the sender’s name (or email without one, or “Account deleted” once the account is gone), the message’s first line ending in “…”, the status as a dot and label, and when the last message was sent, with a chevron. A row whose last message is the user’s has an 8 px accent dot after its type, and its label says “waiting for a reply”. Empty, a dashed box says “Nothing open”, “Nothing answered”, “Nothing closed” or “No feedback yet”, with “New feedback shows here.” It fails with “Couldn’t load the inbox.” and Try again. Pulling down reads it again. |
| **M1 Ticket** | M11 Loading, M10 Ticket, M12 Load failure, M13 Couldn’t send, M14 Couldn’t change the status, M15 Closed, reply says why, M16 Close ticket, M17 Reopen ticket | F20 from the other side, with Feedback as its back link. Below the type and status, a card shows who sent it, name and email, and the device: app version, phone and OS. Close ticket, an outlined button with red text, or Reopen ticket, a secondary button once closed, sits below that card. Each asks first on a sheet: M16 “Close this ticket?”, “No one can reply until you reopen it.” with a danger Close ticket, and M17 “Reopen this ticket?”, “It waits for your reply again, and the user can reply too.” with Reopen ticket. Saving updates the status and the inbox; a failure says “Couldn’t change the status. Try again.” (M14). The thread is F20’s, with the admin’s messages headed You on the raised card with the accent’s border, and the user’s headed with their name (or email, or “Account deleted”). The reply box is F20’s, and after Send the keyboard closes and the thread scrolls to the new message; sending sets the ticket to Answered and gives the user an unread reply. A closed ticket’s reply box looks muted and says “Reopen it to reply.” (M15). |

---

## 10. Sample data on the canvas

This is what the capture tool answers with. Screens captured before version 0.64 can show older data.

- **Today:** Friday 23 October 2026, planned Chest and arms 2.
- **Week plan:**
  - Mon: Chest and arms 1
  - Tue: Back and shoulders 1
  - Wed: Legs
  - Thu: rest
  - Fri: Chest and arms 2
  - Sat: Back and shoulders 2
  - Sun: rest
- **This week:** Mon 19 and Tue 20 done; Wed 21 missed (W22 shows the same day as skipped).
- **October:** 13 done, 1 missed (the 21st), 1 skipped (the 3rd). On plan 87%.
- **Streak:** 6 weeks on plan, best 11.
- **Exercises:** 13 in E01. Cable lateral raise has never been done and is in no routine.
- **Groups:** Chest, Back, Shoulders, Biceps, Triceps, Legs.
- **Reference exercise:** Flat barbell bench press. Best set 82.5 kg × 10 (Fri, 9th Oct), done 25 times since 1st May. L01 and E10 agree.

---

## 11. Parked and decided

**Parked for later**
- A separate bodyweight exercise type.
- Highlighting today in the R01 week plan.
- A progression nudge.
- Exercise notes.
- Opening a day from an E10 session.
- A sort switch on E01.
- "Used in" day tags on E01 rows.

**Decided**
- Filter chips stay on one line and scroll sideways. Chips for picking in a form wrap.
- Completed is green, skipped is orange, missed is red and in progress uses the accent.
- The accents are called Nitro, Titanium, Flux, Plasma and Neon.
