# Offframe V9 — Growing the historical archive

Offframe's mobile-first static prototype now includes eight additional historical artist profiles, editorial movement cards, a searchable tag library, and archive-specific artist dossiers. Museum images and metadata are loaded only from public-domain records from the Art Institute of Chicago. If the museum API is unavailable, a clearly labeled archive-in-progress state appears instead of fabricated artwork.

The historical profiles are discovery entries, **not** artist-operated accounts, impersonations, sellers, or simulated social metrics. Artist biographies and discovery tags are editorial, not museum-attributed metadata. Per-artwork title, date, medium and image come from museum catalog records. When available, each artwork links to its museum record.

## Preview

Open `index.html` from a local HTTP server, or use the standalone offline-bundled HTML. Choose **Moods** to view the new movements and tag cloud, then select a historical artist profile; **Archives** in Explore shows the added archive in an art-first feed once public-domain catalog images are available. Search accepts styles, mediums, tag queries and region.

The current version remains a frontend-only demo. Sign-in, collections, likes, comment posting, and transactions are not connected to a production backend. No real sales or verification are represented.

## Technical

- Static HTML, CSS, JS, and local design images; no framework.
- Public Art Institute of Chicago API: `https://api.artic.edu/api/v1/artworks/search`; only entries with `is_public_domain: true` and `image_id` are displayed as artworks.
- Museum catalog results are verified against attributed artist name, deduplicated, and cached in browser localStorage for 24 hours (`offframe_v2_museum_v9`).
- Images are streamed from the museum IIIF service, not invented or sold.
- To deploy: Vercel preset Other, root `/`, no build command.

One verified Berthe Morisot artwork, *Woman at Her Toilette* (Art Institute of Chicago, record 11723), is pinned in the archive. Additional public-domain museum records are loaded progressively online.
