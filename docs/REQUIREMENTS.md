# Requirements

Add new requests under Backlog.
I will implement items from top to bottom.

## Backlog

### A Student can get lesson for multiple subjects

- [x] add a check box for each subjects to be selected
- [x] the subject should be an array to hold the data (or may be subjects?)
- [x] The display should reviesited once the development is done - it should not break anyting in the UX

### Input box display

- [x] The dropdown boxes are having more height than th etext boxes. Needs fixing.

### Student display - utilise the space

- [x] there are a lot of space under progress bar which can be used
- [x] please re deisgn this section and should be applied for all the students

### Dashboard

- [x] Should contain a calendar view for upcoming sessions for the teacher
- [x] We will integrate with google calendar later

### Create Student component

- [x] There should be a student page dedicated for a student
- [x] Every student name should have a link.
- [x] Remove the expanded accordion section, instead link that to navigate to the student page
- [x] Once the ink is clicked, user will get navigated to that student page.

### Icon in the web app tap

- [x] Need a nice icon in the tab when opened - currently there is nothing

### Class scheduling

- [x] Need to have a separate tab for scheduling a class
- [x] The Student name and year group should appear in an autocomplete dropdown
- [x] Once the student name is selected, there should be a nice calendar view to book the next session date an time
- [x] The calendar should be able to show the date and time already booked in and on hovering, the student's name should be displayed
- [x] These data should get reflected in all the relevant areas of the app
- [x] There should be a button to save the details
- [x] Unit tests should cover the code.

### Quotation

- [x] Everytime the page is refreshed or the app is relaunched, a nice Teacher - student quotation should get displayed Just below the the welcome message.

# Dashboard chart

- [x] I need a chart chart in the showing the student and class rleated information

# Payment Tracker

- [x] I need a payment tracker menu
- [x] An editable tabular structure monthly basis for each student
- [x] An Overall summary of the month - payemnets received, not yet paid with proper color coded rows
- [x] Total amount received and yet to be paid
- [x] After this is done, apply the unit tetsts and make suer coverage is 100%
- [x] fix if there are any terminal errors
      _(sass legacy-js-api deprecation, the >500 kB chunk warning, and the two
      React Router future-flag console warnings — all silenced)_

# Modal behaviour

- [x] The Add New Student Modal : box alignments do not look good. Fix those.
- [x] The Add New Student Modal : Save Student button should be top-right, No Cancel
- [x] The Add New Student Modal : Mode : Add "Both"
      _(also on the student detail page's Mode select; a "Both" student counts
      in both dashboard tiles; API accepts and seeds it)_
- [x] The Add New Student, class scheduling Modal : A "X" button should show at top right corner to dismiss the modal

- [x] Both the modals should look similar w.r.t the buttons, alignments and button functionality.
      _(shared header: title left, primary action + ✕ top-right)_

# Calendar - Class scheuling

- [x] Does not look good while opened from mobile browser - for the space - can we do something for that
      _(the phone layout collapsed the month to 2 columns ~20 screens tall; it
      now keeps all 7 weekday columns with compact tappable cells)_

# Students menu

- [x] Only 3 upcomiung sessions to be shown per student rest of those can be expanded to view.
      _(upcoming only — past and cancelled classes no longer pad the list;
      "Show all N" / "Show fewer" toggles the rest)_
- [x] Fees should be editable
      _(already shipped with REQ-002: student page → Edit → "Fee per session (£)"
      → Save persists via the API; re-verified end-to-end in the browser)_
- [x] Duration of a class should be another option - 30mins, 1Hr, 1.5hour, 2hour will be the options.
      _(planner's day modal + the API; shown on the student page's session list)_

# Loader & Toasts

- [x] On successful/unsuccessful API invokations need to show a toast (success/failure with relevant message using react-toastify or anything mbetter). This can be added for all API operations
      _(MUI Snackbar — no new dependency; success toasts auto-hide, error
      toasts stay until dismissed and also surface previously-invisible fetch
      failures)_
- [x] Need a loader to show in th UI while API operation is in progress.
      _(thin progress bar pinned to the top of the page — one global signal
      covering the initial loads and every save)_

# Architecture Document

- [ ] NOT TO WORK ON NOW. Need a detail level Architecture Document for this project.
