# Epson TM-m30III Setup Guide

The target printer is the Epson TM-m30III 80 mm Ethernet/USB thermal receipt printer.

## Official Epson references

- Epson ePOS SDK for JavaScript for TM-m30III support.
- Epson ePOS-Print XML / ePOS-Device documentation.
- Epson TM-m30III technical reference and network setup documentation.

This application isolates Epson behavior behind `PrinterAdapter` in `lib/pos/printer.ts`. The Epson adapter is intentionally not wired to fake SDK calls. Hardware printing must be verified against a real printer before enabling production Epson mode.

## Required setup checklist

1. Connect the TM-m30III to Ethernet or USB.
2. Print the printer network status sheet.
3. Find the printer IP address.
4. Reserve that IP in the router/DHCP server.
5. Enable required Epson ePOS/network settings in Epson printer configuration.
6. Confirm the POS server and printer are on the same trusted local network.
7. Configure:
   - `PRINTER_MODE=EPSON_EPOS_NETWORK`
   - `EPSON_PRINTER_IP=printer-ip`
   - `EPSON_PRINTER_PORT=printer-port`
8. Run printer connection test.
9. Print a test receipt.
10. Confirm auto-cut behavior.
11. Connect and test cash drawer pulse.

## Troubleshooting

- Browser security: direct browser-to-printer calls may be blocked by mixed content, HTTPS, CORS, or local-network rules.
- CORS: use a server-side printer service if browser calls are blocked.
- Mixed content: do not call insecure printer endpoints from an HTTPS page unless the architecture explicitly supports it.
- Printer offline: verify power, paper, cover, IP, and network route.
- Paper out: replace thermal paper and re-run status check.
- Cover open: close printer cover and retry.
- Duplicate receipts: never create a new sale for reprints. Reprint from the saved transaction and create a new print-job record.
