# Guiding Analytics portfolio integration test

The existing `/guiding-tracker.js` is unchanged. It sends `page_view` events and exposes `window.GuidingAnalytics.track(eventType, extra)`.

`/guiding-tour-events.js` is new. It reuses the original tracker and the same visitor/session IDs. It does not send additional page views.

`/ga-tracking-test.html` is a `noindex` test page. Open `https://jackmoxey.com/ga-tracking-test.html` to trigger one test `tour_view` on load. Click the two buttons to trigger `booking_click` and a simulated `enquiry`.

Expected: on the Guiding Analytics dashboard select **Jack Moxey Portfolio**, **Last 7 days**, and view the relevant metric pages. Look for tour ID `ga-integration-test-tour`.

Important: This is a simulated enquiry. On a real customer website, dispatch `ga:enquiry-success` only after a server-confirmed successful form submission. Tour views are triggered by `data-ga-tour-view="tour-id"` on a tour page, not on a general listing of tour cards. Booking buttons use `data-ga-booking-click="tour-id"`.

No dashboard, SQL, or Netlify changes are needed for this portfolio test. Once verified, delete the test page and remove the test records from Supabase before using the dataset for customer-facing reporting.
