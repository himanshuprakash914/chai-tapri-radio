# Truck Wala — Highway Radio

Single-page music player using a backend-configured YouTube playlist.

## What changed

- Removed playlist input from the UI.
- Playlist remains configured in `server.js`.
- Compact bottom music player inspired by the supplied reference.
- Visible controls are only Previous, Play/Pause, and Next.
- Controls are never disabled on page load/reload.
- Current YouTube thumbnail, title, artist, duration and progress are shown.
- The player is restored from the backend playlist every time the page loads.

## Run

```bash
node server.js
```

Open:

```text
http://localhost:3000
```

## Change playlist

Edit `PLAYLIST_URL` in `server.js`. The playlist link is never exposed as an input in the frontend.
