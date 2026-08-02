'use client';

import {
  AlertTriangle,
  BadgeDollarSign,
  BarChart3,
  ClipboardList,
  CreditCard,
  DollarSign,
  Download,
  History,
  KeyRound,
  Lock,
  PackageCheck,
  Printer,
  ReceiptText,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  CircleDot,
  UserRound,
  Warehouse,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { calculateSaleTotals, cents, formatMoney } from '@/lib/pos/money';
import { normalizeTireSize } from '@/lib/pos/tire-size';

type Screen = 'checkout' | 'history' | 'inventory' | 'reports' | 'settings';
type PaymentMethod = 'Cash' | 'Credit/debit card' | 'Cash App' | 'Zelle' | 'Other';
type TireCondition = 'New' | 'Used';

type SaleLine = {
  id: string;
  label: string;
  quantity: number;
  unitCents: number;
  type: 'tire' | 'service' | 'fee' | 'discount';
};

type Transaction = {
  id: string;
  receiptNumber: string;
  customer: string;
  phone: string;
  tireSize: string;
  vehicle: string;
  employee: string;
  paymentMethod: PaymentMethod;
  totalCents: number;
  status: 'Saved' | 'Printed' | 'Print failed' | 'Refunded' | 'Voided';
  createdAt: string;
  lines: SaleLine[];
};

const employees = [
  { name: 'Owner', role: 'Owner', pin: '1111' },
  { name: 'Manager', role: 'Manager', pin: '2222' },
  { name: 'Employee', role: 'Employee', pin: '3333' },
];

const quickButtons: SaleLine[] = [
  { id: 'used-one', label: 'One used tire', quantity: 1, unitCents: cents(65), type: 'tire' },
  { id: 'used-two', label: 'Two used tires', quantity: 2, unitCents: cents(60), type: 'tire' },
  { id: 'used-set', label: 'Set of four used tires', quantity: 1, unitCents: cents(240), type: 'tire' },
  { id: 'new-one', label: 'One new tire', quantity: 1, unitCents: cents(135), type: 'tire' },
  { id: 'new-set', label: 'Set of four new tires', quantity: 1, unitCents: cents(520), type: 'tire' },
  { id: 'mount-balance', label: 'Mount and balance', quantity: 1, unitCents: cents(80), type: 'service' },
  { id: 'repair', label: 'Tire repair', quantity: 1, unitCents: cents(25), type: 'service' },
  { id: 'rotation', label: 'Tire rotation', quantity: 1, unitCents: cents(35), type: 'service' },
  { id: 'disposal', label: 'Disposal fee', quantity: 1, unitCents: cents(16), type: 'fee' },
  { id: 'valve', label: 'Valve stem', quantity: 1, unitCents: cents(8), type: 'fee' },
  { id: 'wheel', label: 'Wheel installation', quantity: 1, unitCents: cents(20), type: 'service' },
];

const seedTransactions: Transaction[] = [
  {
    id: 'txn-1',
    receiptNumber: 'ATS-2026-000001',
    customer: 'Walk-in Customer',
    phone: '(330) 555-0000',
    tireSize: '215/65R17',
    vehicle: '2016 Honda Accord',
    employee: 'Owner',
    paymentMethod: 'Cash',
    totalCents: cents(359.76),
    status: 'Printed',
    createdAt: 'Today, 9:42 AM',
    lines: [
      { id: 'l1', label: 'Set of four used tires', quantity: 1, unitCents: cents(240), type: 'tire' },
      { id: 'l2', label: 'Mounting and balancing', quantity: 1, unitCents: cents(80), type: 'service' },
      { id: 'l3', label: 'Disposal fee', quantity: 1, unitCents: cents(16), type: 'fee' },
    ],
  },
];

export function AkronTireShop({ initialScreen = 'checkout' }: { initialScreen?: Screen }) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [employee, setEmployee] = useState<(typeof employees)[number] | null>(null);
  const [pin, setPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [tireSize, setTireSize] = useState('215/65R17');
  const [brand, setBrand] = useState('Mixed');
  const [model, setModel] = useState('All-season');
  const [condition, setCondition] = useState<TireCondition>('Used');
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('2016 Honda Accord');
  const [mileage, setMileage] = useState('');
  const [plate, setPlate] = useState('');
  const [notes, setNotes] = useState('');
  const [warranty, setWarranty] = useState('Used tires sold as-is unless otherwise written on receipt.');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountReceived, setAmountReceived] = useState('400.00');
  const [discount, setDiscount] = useState('0');
  const [taxRate, setTaxRate] = useState('7.25');
  const [lines, setLines] = useState<SaleLine[]>([
    { id: 'used-set', label: 'Set of four used tires', quantity: 1, unitCents: cents(240), type: 'tire' },
    { id: 'mount-balance', label: 'Mounting and balancing', quantity: 1, unitCents: cents(80), type: 'service' },
    { id: 'disposal', label: 'Disposal fee', quantity: 1, unitCents: cents(16), type: 'fee' },
  ]);
  const [transactions, setTransactions] = useState<Transaction[]>(seedTransactions);
  const [status, setStatus] = useState<'Saved' | 'Saving' | 'Printing' | 'Printed' | 'Print failed' | 'Offline'>('Saved');
  const [selectedTransactionId, setSelectedTransactionId] = useState('txn-1');

  const totals = useMemo(
    () =>
      calculateSaleTotals({
        lines,
        discountCents: cents(Number(discount || 0)),
        taxRateBasisPoints: Math.round(Number(taxRate || 0) * 100),
        amountReceivedCents: paymentMethod === 'Cash' ? cents(Number(amountReceived || 0)) : undefined,
      }),
    [amountReceived, discount, lines, paymentMethod, taxRate],
  );

  const selectedTransaction = transactions.find((transaction) => transaction.id === selectedTransactionId) ?? transactions[0];
  const normalizedTire = normalizeTireSize(tireSize);
  const canComplete = paymentMethod !== 'Cash' || totals.changeDueCents >= 0;

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = employees.find((item) => item.pin === pin);
    if (!found) {
      setAuthError('Wrong PIN. Accounts lock temporarily after repeated failed attempts in the server implementation.');
      return;
    }
    setEmployee(found);
    setAuthError('');
  }

  function addQuick(line: SaleLine) {
    setLines((current) => [...current, { ...line, id: `${line.id}-${Date.now()}` }]);
  }

  function removeLine(id: string) {
    setLines((current) => current.filter((line) => line.id !== id));
  }

  function completeSale() {
    if (!employee || !canComplete) return;
    setStatus('Saving');
    window.setTimeout(() => {
      const receiptNumber = `ATS-2026-${String(transactions.length + 1).padStart(6, '0')}`;
      const saved: Transaction = {
        id: `txn-${Date.now()}`,
        receiptNumber,
        customer: customer || 'Walk-in Customer',
        phone,
        tireSize: normalizedTire.value || tireSize,
        vehicle,
        employee: employee.name,
        paymentMethod,
        totalCents: totals.totalCents,
        status: 'Saved',
        createdAt: 'Just now',
        lines,
      };
      setTransactions((current) => [saved, ...current]);
      setSelectedTransactionId(saved.id);
      setStatus('Printing');
      window.setTimeout(() => setStatus('Printed'), 650);
    }, 450);
  }

  if (!employee) {
    return (
      <main className="min-h-screen bg-[#07080a] text-white [background-image:radial-gradient(circle_at_20%_10%,rgba(229,57,53,.18),transparent_28rem),radial-gradient(circle_at_85%_0%,rgba(255,255,255,.08),transparent_22rem),linear-gradient(135deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:auto,auto,42px_42px]">
        <div className="grid min-h-screen lg:grid-cols-[1.1fr_.9fr]">
          <section className="relative hidden overflow-hidden border-r border-white/10 bg-zinc-950 p-12 lg:block">
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:46px_46px]" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.28em] text-red-400">Akron Tire Shop POS</p>
                <h1 className="mt-8 max-w-3xl text-7xl font-black leading-[.88] tracking-[-.06em] text-white xl:text-8xl">
                  Touchscreen tire sales, receipts, inventory, and reports.
                </h1>
                <p className="mt-6 max-w-2xl text-xl leading-8 text-zinc-400">
                  Private register system for used/new tires, mount and balance, repairs, fees, cash change, and Epson thermal receipt workflows.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <LoginStat label="Printer modes" value="3" />
                <LoginStat label="Roles" value="3" />
                <LoginStat label="Receipt width" value="80mm" />
              </div>
            </div>
          </section>
          <section className="grid place-items-center p-6">
            <form onSubmit={login} className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,.11),rgba(255,255,255,.035))] p-8 shadow-[0_30px_100px_rgba(0,0,0,.5)] backdrop-blur-xl">
              <div className="mb-8 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-red-800 text-white shadow-lg shadow-red-950/40">
                <KeyRound />
              </div>
              <h2 className="text-4xl font-black tracking-tight">Employee PIN</h2>
              <p className="mt-2 text-zinc-400">Demo PINs: Owner 1111, Manager 2222, Employee 3333.</p>
              <input
                className="mt-8 h-20 w-full rounded-2xl border border-white/10 bg-black px-6 text-center text-5xl font-black tracking-[.35em] outline-none ring-red-500/20 transition focus:border-red-400 focus:ring-4"
                inputMode="numeric"
                maxLength={8}
                type="password"
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
                autoFocus
              />
              <button className="mt-5 h-16 w-full rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-lg font-black uppercase tracking-wide text-white shadow-lg shadow-red-950/30 transition hover:-translate-y-0.5 hover:from-red-500 hover:to-red-400" type="submit">
                Sign In
              </button>
              {authError && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{authError}</p>}
            </form>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090b] text-white [background-image:radial-gradient(circle_at_0%_0%,rgba(229,57,53,.12),transparent_30rem),radial-gradient(circle_at_100%_10%,rgba(255,255,255,.07),transparent_24rem),linear-gradient(135deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:auto,auto,44px_44px]">
      <header className="sticky top-3 z-40 mx-3 rounded-[1.65rem] border border-white/10 bg-[#08090b]/82 px-4 py-3 shadow-[0_18px_70px_rgba(0,0,0,.35)] backdrop-blur-2xl lg:mx-6 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-red-800 shadow-lg shadow-red-950/30"><CircleDot /></div>
            <div>
              <p className="text-sm font-black uppercase tracking-[.2em] text-red-300">Akron Tire Shop</p>
              <h1 className="text-xl font-black tracking-tight">Private POS Register</h1>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {[
              ['checkout', ShoppingCart, 'Checkout'],
              ['history', History, 'History'],
              ['inventory', Warehouse, 'Inventory'],
              ['reports', BarChart3, 'Reports'],
              ['settings', Settings, 'Settings'],
            ].map(([key, Icon, label]) => (
              <button
                key={String(key)}
                onClick={() => setScreen(key as Screen)}
                className={`flex min-h-12 items-center gap-2 rounded-2xl border px-4 text-sm font-black transition ${
                  screen === key ? 'border-red-400 bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-950/30' : 'border-white/10 bg-white/[.055] text-zinc-300 hover:-translate-y-0.5 hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4" /> {String(label)}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.055] px-4 py-3">
            <UserRound className="h-5 w-5 text-red-300" />
            <div>
              <p className="text-sm font-black">{employee.name}</p>
              <p className="text-xs text-zinc-400">{employee.role}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 p-4 lg:grid-cols-[1fr_420px] lg:p-6">
        <div className="space-y-4">
          {screen === 'checkout' && (
            <>
              <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
                <Panel title="New tire sale" icon={<ReceiptText />} eyebrow={status}>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="Tire size" value={tireSize} setValue={setTireSize} hint={normalizedTire.ok ? normalizedTire.value : 'Use format 215/65R17'} />
                    <Field label="Brand" value={brand} setValue={setBrand} />
                    <Field label="Model" value={model} setValue={setModel} />
                    <Select label="Condition" value={condition} setValue={(value) => setCondition(value as TireCondition)} options={['New', 'Used']} />
                    <Field label="Customer name" value={customer} setValue={setCustomer} />
                    <Field label="Telephone" value={phone} setValue={setPhone} />
                    <Field label="Vehicle" value={vehicle} setValue={setVehicle} />
                    <Field label="Mileage" value={mileage} setValue={setMileage} />
                    <Field label="License plate" value={plate} setValue={setPlate} />
                    <Field label="Employee notes" value={notes} setValue={setNotes} wide />
                    <Field label="Warranty notes" value={warranty} setValue={setWarranty} wide />
                  </div>
                </Panel>
                <Panel title="Quick sale buttons" icon={<BadgeDollarSign />} eyebrow="Configurable">
                  <div className="grid grid-cols-2 gap-3">
                    {quickButtons.map((button) => (
                      <button key={button.id} onClick={() => addQuick(button)} className="min-h-20 rounded-2xl border border-white/10 bg-black/50 p-3 text-left font-black transition hover:border-red-400 hover:bg-red-500/10">
                        <span className="block text-sm text-white">{button.label}</span>
                        <span className="mt-1 block text-xs text-zinc-400">{formatMoney(button.unitCents)}</span>
                      </button>
                    ))}
                  </div>
                </Panel>
              </div>

              <Panel title="Cart" icon={<ClipboardList />} eyebrow={`${lines.length} items`}>
                <div className="space-y-3">
                  {lines.map((line) => (
                    <div key={line.id} className="grid gap-3 rounded-2xl border border-white/10 bg-black/35 p-4 md:grid-cols-[1fr_90px_120px_auto] md:items-center">
                      <div>
                        <p className="font-black">{line.label}</p>
                        <p className="text-xs uppercase tracking-[.16em] text-zinc-500">{line.type}</p>
                      </div>
                      <p className="font-black">Qty {line.quantity}</p>
                      <p className="font-black">{formatMoney(line.quantity * line.unitCents)}</p>
                      <button onClick={() => removeLine(line.id)} className="rounded-xl border border-white/10 px-3 py-2 text-sm font-black text-zinc-300 hover:bg-white/10">Remove</button>
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}

          {screen === 'history' && <HistoryPanel transactions={transactions} selectedId={selectedTransactionId} setSelectedId={setSelectedTransactionId} />}
          {screen === 'inventory' && <InventoryPanel />}
          {screen === 'reports' && <ReportsPanel transactions={transactions} />}
          {screen === 'settings' && <SettingsPanel />}
        </div>

        <aside className="space-y-4">
          <Panel title="Totals" icon={<DollarSign />} eyebrow="Server recalculated before save">
            <div className="space-y-3">
              <MoneyRow label="Subtotal" value={totals.subtotalCents} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Discount $" value={discount} setValue={setDiscount} />
                <Field label="Tax %" value={taxRate} setValue={setTaxRate} />
              </div>
              <MoneyRow label="Discount" value={-totals.discountCents} />
              <MoneyRow label="Tax" value={totals.taxCents} />
              <div className="rounded-3xl bg-white p-5 text-black">
                <p className="text-sm font-black uppercase tracking-[.18em] text-zinc-500">Total due</p>
                <p className="text-6xl font-black tracking-[-.06em]">{formatMoney(totals.totalCents)}</p>
              </div>
              <Select label="Payment method" value={paymentMethod} setValue={(value) => setPaymentMethod(value as PaymentMethod)} options={['Cash', 'Credit/debit card', 'Cash App', 'Zelle', 'Other']} />
              {paymentMethod === 'Cash' && (
                <>
                  <Field label="Amount received" value={amountReceived} setValue={setAmountReceived} />
                  <MoneyRow label="Change due" value={totals.changeDueCents} danger={totals.changeDueCents < 0} />
                </>
              )}
              {!canComplete && <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">Cash received is below the total. Complete Sale is locked.</p>}
              <button disabled={!canComplete || status === 'Saving' || status === 'Printing'} onClick={completeSale} className="h-16 w-full rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 text-lg font-black uppercase tracking-wide shadow-lg shadow-red-950/30 transition hover:-translate-y-0.5 hover:from-red-600 hover:to-red-400 disabled:cursor-not-allowed disabled:from-zinc-700 disabled:to-zinc-700">
                {status === 'Saving' ? 'Saving...' : status === 'Printing' ? 'Printing...' : 'Complete Sale'}
              </button>
            </div>
          </Panel>

          <ReceiptPreview transaction={selectedTransaction} activeLines={lines} activeTotals={totals} customer={customer || 'Walk-in Customer'} tireSize={normalizedTire.value || tireSize} paymentMethod={paymentMethod} employee={employee.name} />
        </aside>
      </section>
    </main>
  );
}

function LoginStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[.055] p-5">
      <p className="text-4xl font-black">{value}</p>
      <p className="text-xs font-black uppercase tracking-[.18em] text-zinc-500">{label}</p>
    </div>
  );
}

function Panel({ title, icon, eyebrow, children }: { title: string; icon: ReactNode; eyebrow?: string; children: ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,.09),rgba(255,255,255,.035))] p-5 shadow-[0_24px_80px_rgba(0,0,0,.36)] ring-1 ring-white/[.03] backdrop-blur">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-red-300">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">{title}</h2>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-black/40 text-red-300">{icon}</div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value, setValue, hint, wide = false }: { label: string; value: string; setValue: (value: string) => void; hint?: string; wide?: boolean }) {
  return (
    <label className={`grid gap-2 ${wide ? 'md:col-span-3' : ''}`}>
      <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-500">{label}</span>
      <input className="min-h-14 rounded-2xl border border-white/10 bg-black/45 px-4 text-base font-bold outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/15" value={value} onChange={(event) => setValue(event.target.value)} />
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

function Select({ label, value, setValue, options }: { label: string; value: string; setValue: (value: string) => void; options: string[] }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-500">{label}</span>
      <select className="min-h-14 rounded-2xl border border-white/10 bg-black/45 px-4 text-base font-bold outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/15" value={value} onChange={(event) => setValue(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function MoneyRow({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
      <span className="font-bold text-zinc-400">{label}</span>
      <span className={`text-xl font-black ${danger ? 'text-red-300' : 'text-white'}`}>{formatMoney(value)}</span>
    </div>
  );
}

function ReceiptPreview({ transaction, activeLines, activeTotals, customer, tireSize, paymentMethod, employee }: {
  transaction?: Transaction;
  activeLines: SaleLine[];
  activeTotals: ReturnType<typeof calculateSaleTotals>;
  customer: string;
  tireSize: string;
  paymentMethod: PaymentMethod;
  employee: string;
}) {
  const lines = activeLines.length ? activeLines : transaction?.lines ?? [];
  const total = activeLines.length ? activeTotals.totalCents : transaction?.totalCents ?? 0;
  return (
    <Panel title="80mm receipt preview" icon={<Printer />} eyebrow="Thermal receipt">
      <div className="mx-auto max-w-[320px] rounded-xl bg-white p-5 font-mono text-xs text-black shadow-[0_24px_70px_rgba(0,0,0,.45)] ring-1 ring-white/60">
        <div className="text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full border-2 border-black bg-black text-sm font-black text-white">ATS</div>
          <h3 className="text-lg font-black">AKRON TIRE SHOP</h3>
          <p>Akron, Ohio</p>
          <p>(330) 555-0000</p>
        </div>
        <hr className="my-3 border-black" />
        <p>Receipt: {transaction?.receiptNumber ?? 'ATS-2026-DRAFT'}</p>
        <p>Date: {transaction?.createdAt ?? 'Draft'}</p>
        <p>Employee: {employee}</p>
        <p>Customer: {customer}</p>
        <p>Tire: {tireSize}</p>
        <hr className="my-3 border-black" />
        {lines.map((line) => (
          <div className="mb-2 flex justify-between gap-3" key={line.id}>
            <span>{line.quantity}x {line.label}</span>
            <span>{formatMoney(line.quantity * line.unitCents)}</span>
          </div>
        ))}
        <hr className="my-3 border-black" />
        <div className="flex justify-between"><b>Total</b><b>{formatMoney(total)}</b></div>
        <p>Payment: {paymentMethod}</p>
        <p className="text-center">Thank you for supporting a local business</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button className="rounded-2xl border border-white/10 bg-white/[.055] px-4 py-3 font-black hover:bg-white/10"><Printer className="mr-2 inline h-4 w-4" />Print</button>
        <button className="rounded-2xl border border-white/10 bg-white/[.055] px-4 py-3 font-black hover:bg-white/10"><RefreshCw className="mr-2 inline h-4 w-4" />Reprint</button>
      </div>
    </Panel>
  );
}

function HistoryPanel({ transactions, selectedId, setSelectedId }: { transactions: Transaction[]; selectedId: string; setSelectedId: (id: string) => void }) {
  return (
    <Panel title="Transaction history" icon={<History />} eyebrow="Append-only records">
      <div className="mb-4 flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4">
        <Search className="h-5 w-5 text-zinc-500" />
        <input className="w-full bg-transparent font-bold outline-none" placeholder="Search receipt, customer, phone, tire size, vehicle..." />
      </div>
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <button key={transaction.id} onClick={() => setSelectedId(transaction.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === transaction.id ? 'border-red-400 bg-red-500/10' : 'border-white/10 bg-black/35 hover:bg-white/[.06]'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-black">{transaction.receiptNumber}</p>
              <p className="text-xl font-black">{formatMoney(transaction.totalCents)}</p>
            </div>
            <p className="mt-1 text-sm text-zinc-400">{transaction.customer} - {transaction.tireSize} - {transaction.paymentMethod} - {transaction.status}</p>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function InventoryPanel() {
  return (
    <Panel title="Inventory" icon={<Warehouse />} eyebrow="Manager approval for manual adjustments">
      <div className="grid gap-4 md:grid-cols-3">
        {['215/65R17 Used Set', '225/60R17 New', '235/65R18 Used Pair'].map((item, index) => (
          <article className="rounded-3xl border border-white/10 bg-black/35 p-5" key={item}>
            <PackageCheck className="mb-4 text-red-300" />
            <h3 className="text-xl font-black">{item}</h3>
            <p className="mt-2 text-zinc-400">Stock: {index + 2} - Low threshold: 2 - Location: Rack {index + 1}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function ReportsPanel({ transactions }: { transactions: Transaction[] }) {
  const total = transactions.reduce((sum, transaction) => sum + transaction.totalCents, 0);
  return (
    <Panel title="Dashboard and reports" icon={<BarChart3 />} eyebrow="CSV export ready">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Today sales" value={formatMoney(total)} icon={<DollarSign />} />
        <Metric label="Transactions" value={String(transactions.length)} icon={<ReceiptText />} />
        <Metric label="Tax collected" value={formatMoney(cents(23.76))} icon={<ShieldCheck />} />
        <Metric label="Cash sales" value="1" icon={<DollarSign />} />
        <Metric label="Card sales" value="0" icon={<CreditCard />} />
        <Metric label="Low stock tires" value="2" icon={<AlertTriangle />} />
      </div>
      <button className="mt-5 rounded-2xl border border-white/10 bg-white/[.055] px-5 py-4 font-black hover:bg-white/10"><Download className="mr-2 inline h-4 w-4" />Export CSV</button>
    </Panel>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-black/35 p-5">
      <div className="mb-4 text-red-300">{icon}</div>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-500">{label}</p>
    </article>
  );
}

function SettingsPanel() {
  return (
    <Panel title="Settings" icon={<Settings />} eyebrow="Owner / manager controls">
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ['Shop info', 'Name, logo, address, telephone, website'],
          ['Tax and receipt', 'Tax rate, prefix, footer, warranty, return policy'],
          ['Printer', 'Epson IP, port, mode, test receipt, auto-cut, drawer pulse'],
          ['Security', 'PIN users, approval limits, lockouts, audit logs'],
          ['Backups', 'Database export, backup and restore docs'],
          ['PWA', 'Installable register mode for Windows touchscreen and iPad'],
        ].map(([title, body]) => (
          <article className="rounded-3xl border border-white/10 bg-black/35 p-5" key={title}>
            <Lock className="mb-4 text-red-300" />
            <h3 className="text-xl font-black">{title}</h3>
            <p className="mt-2 text-zinc-400">{body}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}
