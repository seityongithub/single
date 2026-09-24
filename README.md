# XCLUE — 6 standalone member profiles

This build is intentionally **not a member directory/homepage**. Each member is an independent profile page, while all six can be deployed under one domain.

## Routes

- `/den`
- `/member2`
- `/member3`
- `/member4`
- `/member5`
- `/member6`

`/` redirects directly to `/den`; it does not render a homepage.

## Configure members

Edit `data/members.json`. Each object is independent. Keep `discordId` as the permanent identity and use `profilePath` for the public URL.

Example:

```json
{
  "name": "den",
  "username": "@den",
  "role": "FOUNDER",
  "profilePath": "den",
  "discordId": "1351488243325210634",
  "youtubeUrl": "https://www.youtube.com/watch?v=fJsJU7E7X-M",
  "background": "/backgrounds/default.gif",
  "socials": {
    "kick": "denxlr"
  }
}
```

## Included changes

- Six independent profile routes on one domain.
- Click-anywhere / Enter intro gate before the main profile is shown.
- Music starts after the intro interaction so the browser has a real user gesture.
- Music artwork uses the actual YouTube video thumbnail from the configured YouTube URL instead of the GIF.
- YouTube title is read from oEmbed and the player keeps progress/volume controls.
- KICK live/offline status is checked server-side and refreshed every 30 seconds.
- Card glow/shadow effects are removed; borders remain subtle.
- Profile views increment only after the visitor enters the profile.

## Run

```bash
npm install
npm run dev
```

## Latest profile UI fixes

- Site-wide Goth cross cursor is now rendered from a 20x20 asset with the correct hotspot.
- Volume slider uses direct input handling and a dedicated resize cursor so dragging is reliable even with the custom cursor.
- The profile layout uses an exact 400px center column on wide screens, a centered single profile card on tablets, and a one-column mobile layout.
- Added Discord Presence and Profile Info panels to the left side.
- Latest upload fetching was hardened for YouTube channel feeds and TikTok public profile parsing/oEmbed fallback.

## Profile dashboard data

- Profile views use Neon through `DATABASE_URL` (also accepts `POSTGRES_URL` or `NEON_DATABASE_URL`). The `profile_views` table is created/updated automatically.
- Recent Discord activity is persisted in Neon in `recent_activities` and retained for six hours from the activity start time. The profile syncs the live Lanyard activity every 10 seconds.
- Discord status labels use `Online`, `Away`, `Do Not Disturb`, and `Offline`.
