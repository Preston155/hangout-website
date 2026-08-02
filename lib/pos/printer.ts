export type PrinterMode = 'EPSON_EPOS_NETWORK' | 'BROWSER_PRINT' | 'MOCK';

export type PrinterStatus =
  | { ok: true; online: true; paper: 'OK'; cover: 'CLOSED' }
  | { ok: false; online: false; message: string }
  | { ok: false; online: true; message: string; paper?: 'OUT' | 'UNKNOWN'; cover?: 'OPEN' | 'UNKNOWN' };

export type ReceiptPrintPayload = {
  receiptNumber: string;
  receiptText: string;
  qrUrl: string;
  openDrawer: boolean;
  cutPaper: boolean;
};

export interface PrinterAdapter {
  readonly mode: PrinterMode;
  testConnection(): Promise<PrinterStatus>;
  getStatus(): Promise<PrinterStatus>;
  printTestReceipt(): Promise<void>;
  printReceipt(payload: ReceiptPrintPayload): Promise<void>;
  openCashDrawer(reason: string): Promise<void>;
}

export class MockPrinterAdapter implements PrinterAdapter {
  readonly mode = 'MOCK' as const;

  async testConnection(): Promise<PrinterStatus> {
    return { ok: true, online: true, paper: 'OK', cover: 'CLOSED' };
  }

  async getStatus(): Promise<PrinterStatus> {
    return { ok: true, online: true, paper: 'OK', cover: 'CLOSED' };
  }

  async printTestReceipt(): Promise<void> {
    return;
  }

  async printReceipt(_payload: ReceiptPrintPayload): Promise<void> {
    return;
  }

  async openCashDrawer(_reason: string): Promise<void> {
    return;
  }
}

export class EpsonEposNetworkPrinterAdapter implements PrinterAdapter {
  readonly mode = 'EPSON_EPOS_NETWORK' as const;
  private readonly config: {
    ipAddress: string;
    port: number;
    timeoutMs: number;
  };

  constructor(config: { ipAddress: string; port: number; timeoutMs: number }) {
    this.config = config;
  }

  async testConnection(): Promise<PrinterStatus> {
    return {
      ok: false,
      online: false,
      message: `Epson ePOS network adapter is configured for ${this.config.ipAddress}:${this.config.port}, but physical TM-m30III verification is still required.`,
    };
  }

  async getStatus(): Promise<PrinterStatus> {
    return this.testConnection();
  }

  async printTestReceipt(): Promise<void> {
    throw new Error('Physical Epson TM-m30III verification required before enabling ePOS printing.');
  }

  async printReceipt(_payload: ReceiptPrintPayload): Promise<void> {
    throw new Error('Physical Epson TM-m30III verification required before enabling ePOS printing.');
  }

  async openCashDrawer(_reason: string): Promise<void> {
    throw new Error('Cash drawer pulse requires physical printer/drawer verification.');
  }
}
