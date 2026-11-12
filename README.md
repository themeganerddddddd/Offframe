# Offframe V6 — Community Dashboard, Profiles & Private Artwork Views

## Open

- **Interactive all-in-one demo:** `../offframe-interactive-v6.html`. Works offline with bundled demonstration images and local browser state.
- **Separate web source:** `index.html`, `styles.css`, `app.js`, and `assets/`. Open via a static website host for local use (or use the one-file demo).
- This is a **concept prototype**, not a published social network. Sign-in and Google/Apple buttons are demonstrative and do not authenticate real users. Sample artist accounts and posts are fictional.

## V6 additions

### Community dashboard
- Communities now open on a Tumblr-inspired dashboard: a For You stream mixing posts from different communities, recommended community cards, horizontal browseable cards, joining controls, and the option to browse posts only from joined communities.
- Once you click **+ Join**, the group appears under **Communities you follow** and in the **View a community** selector. Select a group to filter the dashboard to that group's posts; click **Visit community** to open its fully customizable page.
- The **Following** filter shows only posts from groups you've joined. **Surprise me** reshuffles the demonstrative mix rather than claiming an actual trained algorithm.
- Each post identifies its originating community and links back to it. Group membership and posts are saved only in your browser.

### Profile navigation
- When signed out, the top-right control reads **Sign in**. After selecting a demo role, it becomes a **My profile** button that takes you **straight to your profile**, not to an account menu.
- Artist demo opens Nia's existing customizable artist storefront; community demo opens the admin's customizable community; collector demo opens a new personal profile page with display name, bio, favorite works, followed artists, and collection links.
- On mobile, the last tab changes from **Saved** to **Profile** when signed in. Favorites remain accessible through the collector profile and the desktop sidebar.
- Account and sign-out options are now inside the user's profile or studio. The collector can edit their name, handle, and bio.

### Private work view analytics
- Open **Sign in → Try artist studio → Artwork views** (also in **Insights**).
- Shows total artwork views as well as **per-artwork view counts**, plus existing post views and engagement counts. In the owner's Works tab, a discreet **viewed · only you** indicator appears below each work.
- Work impressions are registered when artwork is actually visible in Explore or a gallery, at most once per artwork per browser session. The artist's own previews do not count. Nothing is visible to other visitors.
- Because this is a local demo, these **are NOT real unique people, website audience data or authenticated analytics**. Views exist on this device only. For production use an authenticated, privacy-respecting backend events system with a clear definition of views and deduplication.

## Test the viewed count

1. Signed out or in collector mode, open **Explore** and look at Nia Calder's artwork. That records a local preview impression.
2. Sign in as **Try artist studio**. The top-right profile button now points directly to her page.
3. Select **Artwork views** / **Insights**. The overview shows the total work views, and the list shows the recorded count for each artwork.
4. Open her **Works** tab: a private viewed indicator appears under each work. If you are viewing your own work, no additional view is registered.

## Still demo-only

- Payments, verified sales histories and commission requests are examples, not real transactions. The source contains only a Stripe integration starter.
- Comments, follows, favorites, joins, edited design themes, price settings and analytics live in browser storage; they aren't synchronized across people or devices.
- Authenticated ownership, creator verification, actual purchases, production analytics, copyright protections, community moderation and backend data persistence must be implemented before a public launch.
