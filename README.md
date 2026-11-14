# Offframe V7 — Swipe & Community UI Refinements

This is the updated source code for the existing Offframe V6 prototype. No framework installation required.

## Preview / deployment

Open `index.html` in a local static web server or deploy the directory to Vercel using Framework Preset **Other** and no build command. The standalone file `offframe-v7-preview.html` works without a server and includes the images.

### Changes from V6

- Replaced decorative icon glyphs with consistent SVG outline icons in main navigation and discovery actions.
- Redesigned mood categories into art-led, editorial tiles without emoji badges.
- Horizontal touch swiping switches artworks from the same artist; vertical scrolling continues through artist cards. Keyboard arrows and on-screen previous/next controls also work. Includes New Releases cards.
- Artwork images on the immersive Explore screen do not open zoom controls; pinch is disabled only within this feed, not across the rest of the website.
- Comments open in a TikTok-inspired overlay sheet, without navigating to a separate page. Comments persist locally in this demo.
- The signed-in artist's public profile shows a prominent **Edit profile** button in the primary action row. The existing live editor remains intact.
- Existing portfolio, commissions, community feeds, market preview, favorites, and private stats are retained.

## Important prototype limitations

Authentication is simulated; comments, likes, follows and profile edits remain in the visitor's browser. Purchases are demonstration interactions and do not process payments. Museum data is fetched from the Art Institute of Chicago when available. Artist images and profiles used in the demonstration are illustrative.

## QA

Tested with headless Chromium at desktop and 390px mobile: touch swipe changes artwork, comment sheet opens, submissions persist, owner Edit Profile enters the live editor, mood filters render, and no uncaught JS errors were observed.
