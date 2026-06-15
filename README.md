# Discord Remake

Full Discord-style app with **live chat**, **server creation**, **channels**, and **custom profiles**.

## Plesk / httpdocs deploy

```bash
cd guns
npm run build:httpdocs
```

Upload everything inside **`httpdocs-ready/`** into your Plesk **httpdocs** folder.

**GitHub auto-deploy:** see **`DEPLOY-GIT-PLESK.md`** for Plesk Git settings.

Then in Plesk → **Node.js** (optional):
- Enable Node.js
- Startup file: `app.js`
- Run **NPM Install** → **Restart App**

See `httpdocs-ready/DEPLOY-PLESK.md` for full steps.

## Local dev

```bash
npm install
npm start
```

Open **http://localhost:3847**
