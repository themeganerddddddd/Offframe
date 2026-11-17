# Offframe V10 — Personalized Discovery and Art Events

Static, mobile-first prototype. No production user accounts, real sales, verified events, or synchronized RSVPs.

## For You recommendations

An on-device content-based heuristic uses artwork tags, styles, moods and mediums. Favorites and likes are strong signals; followed artists and attentive viewing time are weaker. Viewing-time influence begins at 6 seconds while the artwork is mostly visible and the tab is active, and is capped at 120 seconds per artwork. Exploration slots add diversity. Users may pause personalization or clear watch-time history. Stored in localStorage, never transmitted to an external recommendation server.

## Events MVP

Browse Washington, DC or New Orleans event previews, filter by date/category, discover artists and their featured works, save events, mark Interested/Going, create local event previews, share invitation details and export .ics calendar invitations. Nearby sample events appear in artist profiles and expanded artwork feed overlays.

**Every built-in event is a fictional sample, prominently labeled.** Local drafts, RSVPs and event preferences are browser-local. Links may carry event details but cannot synchronize attendees. Real event imports, organizer confirmations, reminders and multiuser RSVP require a backend. Historical artist profiles represent archival works, not living artist attendance.

## Deploy

Vercel Framework Preset: Other; no build step. Root index.html loads styles.css, app.js, offframe-v10.css and offframe-v10.js in that order. To create a standalone offline HTML preview, run python build_standalone.py.

Offframe retains the archival artist collection, three-second art-first overlays, swipeable artwork gallery, creator portfolio customization, community pages and demo purchases.
