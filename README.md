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

Stage 1 is implemented:

- Touchscreen-friendly private POS shell
- Employee PIN demo login
- Checkout screen
- Quick sale buttons
- Integer-cent money calculations
- Cash received and change due
- Receipt preview
- Transaction history UI
- Inventory/report/settings UI shell
- POS Prisma schema
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
npm run db:push
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

Stage 1 uses demo PINs in the UI:

- Owner: `1111`
- Manager: `2222`
- Employee: `3333`

Stage 2 will move PIN auth server-side with hashed PINs, lockouts, login audit records, and owner account creation.

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
