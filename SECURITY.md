# Privacy & security

**Short version:** Costbook has no server, no accounts, no analytics and no tracking.
Your recipes and prices are saved only in your own browser, on your own device.
The app cannot send them anywhere, and anyone can check this.

## What the app does with your data

| What | Where it goes |
|---|---|
| Items, recipes, prices, notes | Your browser's `localStorage` on this device. Nowhere else. |
| Language choice | Your browser's `localStorage`. |
| Backup file | Created **in your browser** and saved to your device when you press “Download backup”. Nothing is uploaded. |
| Restoring a backup | The file is read **in your browser**. Nothing is uploaded. |

## How the “no sending” promise is enforced

1. **Browser-enforced block.** The published page carries a Content-Security-Policy
   (see `vite.config.ts`). It includes `connect-src 'none'`, which makes the browser
   refuse every `fetch`, XHR, WebSocket or beacon, and `default-src 'none'`, so the page
   may only load its own files (no outside scripts, fonts, images or trackers).
   You can see it at the top of the live page source: `<meta http-equiv="Content-Security-Policy" …>`.
2. **No network code.** `scripts/check-no-network.mjs` scans the source code and the
   built website for network APIs (`fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`…)
   and for links to other websites. GitHub runs it on every change
   (`.github/workflows/deploy.yml`); if it finds anything, the site is **not** published.
3. **Tiny dependency list.** The app ships only React and React-DOM
   (see `package.json`). Fonts are stored in this repo (`public/fonts`), not loaded from Google.
4. **Built in public.** The live site is built by GitHub Actions directly from the code
   in this repository, so what you read here is what runs.

## Things to know (honest limits)

- **Clearing browser data deletes your items.** So can Safari after 7 days without
  a visit. Download a backup now and then (Settings → Download backup file).
- **Same website address = same storage.** Data is stored per website address.
  Other pages published from the same GitHub account (`username.github.io/...`) share
  that address and could technically read it. For full independence, **fork** this
  repository to your own GitHub account and use your own copy, or run it on your computer.
- **Your device is the security boundary.** Anyone who can use your browser can open the app
  and see your items, just like your other browser data.
- Backup files are plain JSON. Keep them somewhere private.

## Ask an AI to check it for you

Copy this, replace the link, and paste it into ChatGPT, Claude, Gemini or any AI assistant:

> Please audit this GitHub repository for privacy: `<paste the repository link here>`
>
> It is a cost calculator web app that claims it never sends user data anywhere and only
> stores it in the browser's localStorage. Please check:
> 1. Does any code send data over the network (fetch, XMLHttpRequest, WebSocket,
>    sendBeacon, image/script tags pointing to other sites, form submissions, analytics)?
> 2. Does the build add a Content-Security-Policy with `connect-src 'none'` and
>    `default-src 'none'` (see `vite.config.ts` and `index.html`)?
> 3. Do the dependencies in `package.json` include anything that could phone home?
> 4. Does the GitHub Actions workflow (`.github/workflows/deploy.yml`) build the site
>    from this code and run the privacy check (`scripts/check-no-network.mjs`)?
> 5. Anything else that could leak recipes or prices?
> Give me a plain-language answer for a non-programmer.

## Reporting a problem

If you find a way the app could leak data, please open an issue on this repository.
