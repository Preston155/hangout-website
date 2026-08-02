# Akron Tire Shop POS

Private web-based point-of-sale and receipt-printing system for Akron Tire Shop.

Target private host: `pos.prestonhq.com`

## Stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Zod validation
- PWA manifest
- Docker / Docker Compose
- Modular printer adapters for Epson network printing, browser fallback, and mock development mode

## Current implementation stage

The app now has the first production-backed POS slice implemented:

- Touchscreen-friendly private POS shell
- Server-side employee PIN login with bcrypt-hashed PINs
- HTTP-only signed sessions
- Failed-login tracking and temporary lockout
- Checkout screen
- Quick sale buttons loaded from PostgreSQL
- Integer-cent money calculations
- Cash received and change due
- Receipt preview
- Real transaction save API with idempotency keys
- Server-side receipt numbers generated in a database transaction
- Print-job records that cannot erase or duplicate completed sales
- Transaction history loaded from PostgreSQL
- Inventory/report/settings UI shell
- POS Prisma schema
- Initial Prisma migration
- Development seed script
- Printer adapter contract
- Mock printer adapter
- Epson adapter placeholder requiring physical TM-m30III validation
- Automated tests for core POS logic

See `docs/POS_IMPLEMENTATION_CHECKLIST.md` for the staged build plan.

## 1. Local installation

```bash
npm install
cp .env.example .env
```

## 2. Database setup

Start PostgreSQL with Docker:

```bash
docker compose up postgres
```

Then run:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

## 3. Environment variables

Required:

- `DATABASE_URL`
- `SESSION_SECRET`
- `PRINTER_MODE`

Optional Epson settings:

- `EPSON_PRINTER_IP`
- `EPSON_PRINTER_PORT`
- `EPSON_PRINTER_TIMEOUT_MS`

Never commit live secrets.

## 4. Creating the first owner account

Run the seed command once after migrations:

```bash
npm run db:seed
```

By default it creates hashed starter PINs:

- Owner: `1111`
- Manager: `2222`
- Employee: `3333`

Set `SEED_OWNER_PIN`, `SEED_MANAGER_PIN`, and `SEED_EMPLOYEE_PIN` before seeding production. PINs are hashed with bcrypt and are never stored in plain text.

## 5. Starting the development server

```bash
npm run dev
```

Open `http://localhost:3000`.

## 6. Production deployment

```bash
npm run test
npm run typecheck
npm run build
npm run start
```

Use HTTPS and restrict `pos.prestonhq.com` to trusted staff/network access when possible.

### Plesk Node.js setup

If Plesk shows the static fallback page, Node.js hosting is not running this app yet.

In Plesk, open the domain or subdomain and go to **Node.js**:

- **Node.js:** Enabled
- **Application mode:** Production
- **Application root:** the Git checkout folder for this repo
- **Document root:** the same domain/subdomain document root Plesk created
- **Application startup file:** `server.js`
- **Package manager install command:** `npm install`
- **Build command:** `npm run build`
- **Run command:** `npm run start`

Set these environment variables in Plesk:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/akron_pos?schema=public
SESSION_SECRET=use-a-long-random-secret-at-least-24-characters
NEXT_PUBLIC_APP_URL=https://pos.prestonhq.com
PRINTER_MODE=MOCK
EPSON_PRINTER_IP=
EPSON_PRINTER_PORT=8008
EPSON_PRINTER_TIMEOUT_MS=5000
```

Then run these once from the Plesk terminal or SSH on the website host:

```bash
npm run db:migrate
npm run db:seed
```

After that, restart the Node.js app in Plesk. If the fallback page is still visible, the domain is still pointing at static hosting instead of the Node.js app.

## 7. Connecting the Epson TM-m30III through Ethernet

The target printer is Epson TM-m30III, 80 mm, Ethernet/USB.

Use Epson official ePOS SDK/documentation for the TM-m30III. This repo does not fabricate Epson SDK calls. All Epson behavior is isolated behind `PrinterAdapter` in `lib/pos/printer.ts`.

## 8. Finding and reserving the printer IP

1. Connect the printer to Ethernet.
2. Print the network status sheet.
3. Find the IPv4 address.
4. Reserve that IP in the router/DHCP server.
5. Set `EPSON_PRINTER_IP`.

## 9. Enabling Epson network/ePOS settings

Use Epson’s official printer configuration tools/documentation to enable the required network/ePOS services for the TM-m30III. Exact steps must be verified against the real printer firmware and network configuration.

## 10. Printing a test receipt

Use mock mode during development:

```env
PRINTER_MODE=MOCK
```

Only switch to Epson mode after physical printer verification.

## 11. Configuring the cash drawer

Cash drawer pulses must be tested with the real printer and connected drawer. Manual drawer opens must create audit log records.

## 12. Troubleshooting

- Browser security: HTTPS pages may block insecure local printer calls.
- Network: POS server and printer must be able to route to each other.
- Certificates: avoid mixed-content printer calls from HTTPS.
- CORS: if direct browser printing is blocked, use server-side printing.
- Printer offline: check power, IP address, port, and network route.
- Paper out: replace paper and retry.
- Cover open: close cover and retry.
- Duplicate transactions: use idempotency keys and save the sale before printing.
- Failed print: keep the completed sale and create/retry a print job.

## Backup and restore

See `docs/DEPLOYMENT.md`.

## Hardware verification warning

Do not claim Epson TM-m30III printing works in production until it has been tested on the real printer.
