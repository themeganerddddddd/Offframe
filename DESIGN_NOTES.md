# V6 Design notes

**Community home:** Mobile-first Tumblr-inspired feed, cross-community discovery, suggested spaces, explicit joined communities and a selectable filtered community stream. Community pages retain the V5 WYSIWYG customization controls.

**Sign-in and personal navigation:** The authentication preview becomes a direct route to a user's profile after sign-in. Collector accounts have a personal profile with editing, while artist and community role buttons go directly to their public pages. Sign out is reachable from Account inside the profile.

**Private viewed statistics:** Visible artwork impressions are tracked once per browser session per work (except the owner's own views). Metrics display only in the artist's own insights screen and own Works gallery. The V6 number is a per-browser demo counter, not a legitimate population, marketing metric or verified unique viewer count.

**Implementation requirements for production:** Add users/profiles, memberships, canonical artwork IDs, per-work analytics aggregates, authenticated event ingestion with deduplication, data-retention controls, anti-bot limits, user-consent/privacy documentation, row-level security so only artists access private view metrics, and server-mediated payment/order status. Never use client-generated views as authoritative market metrics. Preserve accessibility contrast with artist-customized designs.
