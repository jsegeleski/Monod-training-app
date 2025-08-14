# Shopify Training App — Starter Kit

A minimal, clean training/onboarding app you can host (e.g., on Vercel) and embed on a Shopify page.

## Features

- **Front-end training portal**: Slides + periodic quizzes, clean UI, progress bar, and **localStorage progress** (30 days).
- **"Redo section" gating**: If a quiz is failed, the user jumps back to the start of that section.
- **Multiple modules**: Create as many trainings as you like; show a module picker or link to a specific module.
- **Admin dashboard** (password-protected): Create/edit modules, re-order slides, add quizzes, publish/unpublish, optional access code per module.
- **Easy embed**: Drop a single `<script>` tag on a Shopify Page to show the portal.
- **Simple storage**: JSON file (`data/db.json`). No database required for MVP.

> You can later migrate to a proper DB or Shopify Embedded App with Polaris; this starter focuses on speed and simplicity.

---

## Quick Start

1. **Install**

```bash
cp .env.example .env
# set ADMIN_PASSWORD in .env

npm install
npm run dev
```

2. **Open Admin**

- Visit `http://localhost:3000/admin`
- Login with your `ADMIN_PASSWORD`
- Create or edit a module; click **Save**

3. **Preview the portal**

- Visit `http://localhost:3000/portal?moduleId=mod_welcome` to preview JSON in the browser
- Or just use the embed (next step)

4. **Embed on Shopify (MVP)**

Create a hidden Shopify Page (e.g., **/pages/training**). In the content editor (HTML mode), paste:

```html
<!-- Module picker (all published modules) -->
<div id="training-root"></div>
<script src="https://YOUR-DEPLOYED-APP/embed.js"></script>
```

Or target a specific module:

```html
<!-- Single module -->
<div id="training-root"></div>
<script src="https://YOUR-DEPLOYED-APP/embed.js" data-module="mod_welcome"></script>
```

If you set an **access code** on a module, you can optionally prefill it:

```html
<script src="https://YOUR-DEPLOYED-APP/embed.js" data-module="mod_welcome" data-access="STAFF2025"></script>
```

> The embed uses a Shadow DOM + its own CSS to avoid theme conflicts.

5. **Publish**

- Deploy to Vercel (or similar). Set `ADMIN_PASSWORD` and `APP_BASE_URL` environment variables.
- `APP_BASE_URL` should be your production URL (e.g., `https://training.monodsports.com` or `https://your-app.vercel.app`).

---

## Content Model

The JSON file `data/db.json` stores modules like:

```json
{
  "id": "mod_welcome",
  "title": "Monod Sports — Store Onboarding",
  "description": "Intro...",
  "isPublished": true,
  "accessCode": "",
  "slides": [
    { "id": "s1", "type": "content", "title": "Welcome", "bodyHtml": "<p>...</p>", "imageUrl": "" },
    { "id": "s2", "type": "quiz", "title": "Quick check", "question": {
        "text": "Which statement matches our tone?",
        "options": [
          { "id": "o1", "text": "Over-the-top hype", "isCorrect": false },
          { "id": "o2", "text": "Minimal & grounded", "isCorrect": true }
        ]
      }
    }
  ]
}
```

Notes:
- **Slides** can be `content` or `quiz`.
- **Quiz** slide shows multiple options and requires selecting an option marked `isCorrect: true` to proceed.
- On **wrong** answer, the portal sends the user back to the beginning of the section (first slide after the previous quiz).

---

## Admin

- `/admin` lists modules
- Create new module via `/admin/modules/new`
- Edit a module via `/admin/modules/[id]`: add content slides, quiz slides, reorder, publish/unpublish, set optional access code.

Auth is a simple cookie set by `/admin/login` after posting the correct `ADMIN_PASSWORD`.
You can rotate the password anytime in your hosting env vars.

---

## Progress Tracking

- Stored in `localStorage` under the key `training_progress::<moduleId>`
- Contains `{ moduleId, idx, at }`
- Automatically expires after 30 days (ignored by the UI if older)

No server-side identity or tracking is stored in this MVP.

---

## Styling

- The admin uses a compact, clean dark UI.
- The embed uses a white card style with a minimal progress bar.
- Both are intentionally minimal to integrate smoothly with your existing theme.

---

## Roadmap Ideas (Optional)

- Shopify **Theme App Extension** block instead of raw `<script>` embed.
- Embedded Admin app using **Polaris** in Shopify Admin with OAuth.
- Rich text editor for `bodyHtml`.
- Section titles and per-section wrap-ups.
- Export/Import content as JSON for versioning.
- Optional short server-side 'completion code' to sign off training modules.

---

## Troubleshooting

- **Admin says Not Authorized**: Ensure `ADMIN_PASSWORD` is set and you're posting the correct value in `/admin/login`.
- **Embed not loading**: Confirm your script URL is reachable (`/embed.js` + `/embed.css` must resolve) and the module is published.
- **Images not visible**: Ensure absolute URLs or host images in Shopify Files and paste the direct URL.
