# Offframe V11 — Art Events, Creator Uploads & Personal Discovery

A frontend-only, mobile-first Offframe prototype. Run `python -m http.server` in this folder and open `http://localhost:8000`, or use the generated standalone file `offframe-interactive-v11.html`.

## Art recommendations

The **For You** artwork feed now uses a transparent content-based ranking based on overlapping artwork tags, artistic style, medium and mood. Favorites (+7), Likes (+4), followed-artist artworks, and attentive viewing time contribute different strengths. Time is only registered while an artwork occupies at least 70% of the vertical feed viewport and the tab is visible; it becomes a weak positive signal after 6 seconds, capped at 120 seconds for each work. A diversity slot among ranked artists provides exploration, and existing **Less** filtering remains in effect. The top-of-feed recommendation strip is hidden; signed-in users can manage recommendation settings from their account menu. Data is stored in this browser only.

This is a heuristic, not a trained ML model or an established production recommendation service. The original demo artwork and historical records have no true popularity, multi-user ranking metrics, or coordinated accounts.

## Events

An **Events** section now supports choosing Washington, DC or New Orleans, searching and filtering sample events, viewing event pages, seeing associated artist portfolios and artwork galleries, and local Save / Going / Interested interactions. The **Create an event** form collects date, time, venue/neighborhood, category, description and linked artists. It creates a sharable event preview link containing a limited event payload, and can export an `.ics` calendar invitation. Artist profiles and the full discovery overlay can show an upcoming **sample event near you** based on selected city.

**Important:** All built-in listings are fictitious, prominently marked SAMPLE EVENT. No live event scraping or verified venue listings are integrated. Created events, private event response selections and locally recorded viewing time live in browser localStorage; RSVPs cannot be shared across devices. Linked artists on event drafts are invitations, not verified participants; only a user signing into the matching demo-artist role can confirm them. No email invitations are actually sent by Offframe.

## Deploy

This is a plain static project that can be deployed with Vercel Framework Preset **Other** and no build step. `index.html` loads `styles.css`, `app.js`, `offframe-v10.css`, `offframe-v10.js`, `offframe-v11.css`, and `offframe-v11.js`. All asset paths are relative. The Art Institute of Chicago public-domain catalog API remains an optional background source for verified archive records.

The image-first 3-second overlay, horizontal artwork navigation, archive profiles, design editors and earlier demo flows remain in place.

## Finding events and posting images (V11)

**Events** is accessible from the desktop left sidebar, the mobile bottom bar, and a new compact **Art events** link beside the Explore tabs. The Events page offers **Create an event**, city/date filters, saved events, event pages, calendar files, and linked artist portfolios. Its built-in events are illustrative, not real listings.

Artists can select the demo **Try artist studio** sign-in, then use **Add artwork** in their profile, Works/Overview gallery, top bar (desktop), or account menu. Uploaded JPG/PNG/WebP images are compressed and saved in browser localStorage. They appear in the artist portfolio and discovery feed on the same browser. Uploaded works can be removed. The preview permits up to 10 uploaded works per artist and has no real accounts, cloud storage, or shared publishing.

Community visitors can click **Share an image** to save a locally visible image post with caption. This is not published across accounts or devices. Only share images you own or have permission to display.
