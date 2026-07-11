# PWA / iPhone Test Checklist

## Local Desktop QA

- Run `npm run build`.
- Run `npm run dev`.
- Open `http://localhost:3000`.
- Check these viewports:
  - iPhone SE: `375 x 667`
  - iPhone 13/14/15: `390 x 844`
  - iPhone Pro Max: `430 x 932`
- Verify:
  - bottom navigation has 4 items and does not wrap;
  - round editor sticky save button does not overlap bottom navigation;
  - settings reset works;
  - logs can be deleted;
  - app reload keeps local data.

## PWA Assets

- Manifest URL: `/manifest.webmanifest`.
- Apple touch icon: `/icons/icon-180.png`.
- PWA icons:
  - `/icons/icon-192.png`
  - `/icons/icon-512.png`
- Service worker: `/sw.js`.

## iPhone Install QA

Use a deployed HTTPS URL, preferably Vercel.

1. Open the deployed URL in Safari on iPhone.
2. Tap Share.
3. Tap Add to Home Screen.
4. Confirm the name `Scores`.
5. Launch from the home screen icon.
6. Verify it opens without Safari browser chrome.
7. Create a match.
8. Add a manual round.
9. Close the app.
10. Reopen from home screen.
11. Verify data is still there.

## Offline Shell QA

1. Open the installed PWA once while online.
2. Put iPhone into Airplane Mode.
3. Reopen the PWA.
4. Verify the app shell opens.
5. Verify previously saved local data still appears.

Known MVP limitation: there is no server sync yet, so offline behavior is local-device only.

## Pass Criteria

- App installs on iPhone home screen.
- App opens in standalone mode.
- Main navigation works.
- Local data survives reload/reopen.
- No bottom nav overlap on iPhone.
- Build passes before deploy.
