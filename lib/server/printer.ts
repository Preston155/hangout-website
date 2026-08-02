import { EpsonEposNetworkPrinterAdapter, MockPrinterAdapter, type PrinterAdapter, type PrinterMode } from '@/lib/pos/printer';

export function createPrinterAdapter(): PrinterAdapter {
  const mode = (process.env.PRINTER_MODE || 'MOCK') as PrinterMode;
  if (mode === 'EPSON_EPOS_NETWORK') {
    return new EpsonEposNetworkPrinterAdapter({
      ipAddress: process.env.EPSON_PRINTER_IP || '',
      port: Number(process.env.EPSON_PRINTER_PORT || 8008),
      timeoutMs: Number(process.env.EPSON_PRINTER_TIMEOUT_MS || 5000),
    });
  }
  return new MockPrinterAdapter();
}
