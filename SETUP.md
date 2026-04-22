# Setup

One-time Firebase + Netlify steps needed after switching to Google Sign-In.

## 1. Enable Google as a sign-in provider

1. Open the Firebase Console → project **tkwp-f8078** → **Authentication → Sign-in method**.
2. Click **Google** → toggle **Enable** → set the support email → **Save**.

## 2. Authorized domains

**Authentication → Settings → Authorized domains**. Make sure these are listed:

| Domain | Why |
| --- | --- |
| `localhost` | Dev server (`npm run dev`) — added by default. |
| `tkwp-f8078.firebaseapp.com` | Firebase auth redirect target — added by default. |
| `tkwp.netlify.app` | **Add this.** Production deployment. |
| *(any custom domain)* | Add it here too if you point one at the Netlify site. |

Without `tkwp.netlify.app` in the list, Google sign-in from the deployed app will fail with `auth/unauthorized-domain`.

## 3. Deploy the Firestore rules

The repo now has `firestore.rules` (per-user access, Google-only). Deploy it:

```bash
# One-off: install the Firebase CLI if you don't have it
npm i -g firebase-tools

# From the repo root
firebase login
firebase use tkwp-f8078
firebase deploy --only firestore:rules
```

If you prefer the console, copy the file's contents into **Firestore Database → Rules** and publish.

## 4. Migrating existing data

If you were previously using a sync code, you don't need to do anything — on your first Google sign-in on each device, the app reads the old `users/{syncCode}` doc and copies it into `users/{yourGoogleUid}`, then clears the local sync-code pointer. After migration you can delete the old sync-code doc from Firestore.

## 5. Local dev

```bash
npm install
npm run dev
```

Sign-in works on `http://localhost:5173` because `localhost` is a default authorized domain.

## 6. Build + deploy

```bash
npm run build   # produces dist/
```

Netlify is already configured via `netlify.toml` (`publish = "dist"`). Pushing to `main` (or the configured branch) will deploy automatically.
