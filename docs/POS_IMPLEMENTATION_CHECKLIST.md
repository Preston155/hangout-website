# Akron Tire Shop POS Implementation Checklist

This project is being rebuilt as a private POS and receipt-printing system for `pos.prestonhq.com`.

## Stage 1 - Foundation

- [x] Replace public website UI with private POS shell
- [x] PIN sign-in demo screen
- [x] Touchscreen checkout interface
- [x] Quick-sale buttons
- [x] Integer-cent money calculations
- [x] Tire-size normalization
- [x] Receipt preview
- [x] Transaction history UI
- [x] Inventory/report/settings UI placeholders
- [x] Prisma POS schema
- [x] PrinterAdapter abstraction
- [x] Mock printer adapter
- [x] Epson adapter placeholder that clearly requires real TM-m30III verification
- [x] Tests for money, tire size, receipt numbers, and mock printer

## Stage 2 - Server persistence

- [ ] Implement secure server-side PIN auth with hashed PINs
- [ ] Add HTTP-only session cookies
- [ ] Add login rate limits and temporary lockouts
- [ ] Implement transaction create API with idempotency keys
- [ ] Generate sequential receipt numbers inside a database transaction
- [ ] Recalculate totals on the server before saving
- [ ] Save print job after transaction save
- [ ] Add audit records for every protected action

## Stage 3 - Inventory and customers

- [ ] Tire inventory CRUD
- [ ] Manager approval for manual adjustments
- [ ] Inventory reduction on sale
- [ ] Customer and vehicle records
- [ ] Service history views

## Stage 4 - Printing

- [ ] Browser print fallback
- [ ] Development mock-printer mode
- [ ] Epson TM-m30III Ethernet connection test
- [ ] Printer status check
- [ ] Print test receipt
- [ ] Receipt print
- [ ] Logo print
- [ ] QR code print
- [ ] Auto-cut
- [ ] Cash-drawer pulse
- [ ] Offline, paper-out, and cover-open error handling

Hardware note: do not mark Epson network printing as production-ready until it is tested on the real Epson TM-m30III.

## Stage 5 - Reports and exports

- [ ] Date-range reporting
- [ ] CSV exports
- [ ] Refund and void workflows
- [ ] Approval flows
- [ ] Backup and restore automation
