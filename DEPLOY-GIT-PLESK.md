# GitHub → Plesk auto-deploy

This repo is the **source project**. Plesk should deploy the built site from **`httpdocs-ready/`**, not the repo root.

## Before you push changes

```bash
npm run build:httpdocs
git add .
git commit -m "Your message"
git push
```

Plesk will pull `main` and run the deploy script (or copy `httpdocs-ready/`).

## Plesk Git settings (paste these)

| Field | Value |
|-------|--------|
| **Repository URL** | `https://github.com/Preston155/hangout-website.git` |
| **Repository name** | `hangout-website` (or any label you like) |
| **Branch** | `main` |
| **Deployment mode** | **Automatic deployment** |
| **Server path** | `/httpdocs` (your domain document root) |
| **Deploy from directory** | `httpdocs-ready` *(if Plesk shows this option)* |

### Additional deployment actions

**Enable** additional deployment actions if Plesk offers a shell hook **instead of** “deploy from directory”, paste:

```bash
bash scripts/plesk-git-deploy.sh
```

That script copies `httpdocs-ready/` into `httpdocs` and **keeps existing `data/` and `uploads/`** on the server.

If your panel only supports “deploy from directory” and no custom script, set **deploy directory** to `httpdocs-ready` and **do not** enable delete-all deploy modes that wipe `data/` or `uploads/`.

## GitHub access

1. Plesk → **Git** → **Add Repository**
2. Choose **Remote Git hosting** → GitHub
3. Authorize GitHub or use a **Personal Access Token** with `repo` scope
4. Select `Preston155/hangout-website`, branch `main`
5. Enable **Pull updates automatically** (webhook) if available
6. Click **Deploy** once to test

## What must stay on the server (never in Git)

- `data/*.json` — users, servers, messages
- `uploads/` — avatars, banners, attachments, server icons

These are in `.gitignore`. The deploy script preserves them on the server.

## Verify after deploy

- Site: `https://prestonhq.com`
- API: `https://prestonhq.com/api/health.php` → `{"ok":true,"mode":"php"}`

## Project type

PHP + static frontend. **No Node build required on Plesk** if `httpdocs-ready/` is committed.

Optional local build command:

```bash
npm run build:httpdocs
```

Output folder for Plesk: **`httpdocs-ready/`** (contains `index.html` at its root).
