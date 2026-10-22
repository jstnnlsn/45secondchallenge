# Dossier: Pañe

One-page personal site for Justin Nelson Pañe. It is a turn-based fight. Each guardian you beat reveals a part of the page: place, portrait, hobbies and interests, then skills.

No install. No build step.

## Files

| File | Job |
| --- | --- |
| `index.html` | The page frame. One `<main id="app">`. Links the other two files. |
| `styles.css` | Color, type, layout, and the hit / shake animations. |
| `script.js` | The fight, the 45-second clock, the reveals, and the sound. |
| `theme.mp3` | Background music. It starts when the page opens and loops. The Snd button pauses it. Browsers sometimes wait for the first tap. |
| `art/` | Your photo and the four guardians. |

## Open it

Double-click `index.html`, or on GitHub: Settings → Pages → Deploy from branch → `main` → `/ (root)`.

## How a turn works

1. The telegraph shows the guardian's next move before you choose.
2. Strike, Guard, Focus, or Expose. Keys `1` `2` `3` `4` do the same thing.
3. If it is still standing, it acts. If you drop it, a dossier card opens.
4. Losing a fight does not erase cards you already won.

The clock records whether a visitor stayed 45 seconds. It never locks the page.
