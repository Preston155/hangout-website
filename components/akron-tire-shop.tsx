'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';

type PageKey = 'home' | 'tires' | 'services' | 'about' | 'contact' | 'admin';
type FilterKey = 'condition' | 'width' | 'ratio' | 'rim' | 'brand' | 'price';
type TireQty = 'Set of 4' | 'Pair of 2' | 'Single';

type Tire = {
  id: string;
  brand: string;
  model: string;
  size: string;
  width: string;
  ratio: string;
  rim: string;
  condition: 'New' | 'Used';
  quantityType: TireQty;
  price: number;
  availability: 'In Stock' | 'Limited' | 'Sold';
  image: string;
};

const BUSINESS = {
  // Edit these placeholder business details when the real info is ready.
  phoneDisplay: '330-XXX-XXXX',
  phoneHref: 'tel:+13305550000',
  address: 'Akron, Ohio',
  directions: 'https://maps.google.com/?q=Akron%2C%20Ohio',
  hours: 'Monday-Saturday, 9:00 AM-6:00 PM',
  sunday: 'Closed',
};

const fallbackImage =
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=900&q=85';

const defaultTires: Tire[] = [
  { id: 't1', brand: 'Goodyear', model: 'Assurance All-Season', size: '225/60R17', width: '225', ratio: '60', rim: '17', condition: 'New', quantityType: 'Set of 4', price: 516, availability: 'In Stock', image: fallbackImage },
  { id: 't2', brand: 'Michelin', model: 'Defender T+H', size: '215/55R17', width: '215', ratio: '55', rim: '17', condition: 'Used', quantityType: 'Pair of 2', price: 156, availability: 'Limited', image: fallbackImage },
  { id: 't3', brand: 'Firestone', model: 'All Season', size: '205/55R16', width: '205', ratio: '55', rim: '16', condition: 'New', quantityType: 'Single', price: 105, availability: 'In Stock', image: fallbackImage },
  { id: 't4', brand: 'Cooper', model: 'Endeavor Plus', size: '235/65R18', width: '235', ratio: '65', rim: '18', condition: 'Used', quantityType: 'Set of 4', price: 368, availability: 'In Stock', image: fallbackImage },
];

export function AkronTireShop({ initialPage = 'home' }: { initialPage?: PageKey }) {
  const [page, setPage] = useState<PageKey>(initialPage);
  const [inventory, setInventory] = useState<Tire[]>(defaultTires);
  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    condition: 'Any',
    width: 'Any',
    ratio: 'Any',
    rim: 'Any',
    brand: 'Any',
    price: 'Any',
  });
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [formMessage, setFormMessage] = useState('');

  useEffect(() => {
    const saved = window.localStorage.getItem('akron-tire-inventory-v2');
    if (saved) {
      try {
        setInventory(JSON.parse(saved));
      } catch {
        setInventory(defaultTires);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('akron-tire-inventory-v2', JSON.stringify(inventory));
  }, [inventory]);

  const brands = useMemo(() => ['Any', ...Array.from(new Set(inventory.map((tire) => tire.brand)))], [inventory]);

  const filteredTires = useMemo(() => {
    return inventory.filter((tire) => {
      const inPrice =
        filters.price === 'Any' ||
        (filters.price === 'Under $100' && tire.price < 100) ||
        (filters.price === '$100-$300' && tire.price >= 100 && tire.price <= 300) ||
        (filters.price === '$300+' && tire.price > 300);

      return (
        tire.availability !== 'Sold' &&
        (filters.condition === 'Any' || tire.condition === filters.condition) &&
        (filters.width === 'Any' || tire.width === filters.width) &&
        (filters.ratio === 'Any' || tire.ratio === filters.ratio) &&
        (filters.rim === 'Any' || tire.rim === filters.rim) &&
        (filters.brand === 'Any' || tire.brand === filters.brand) &&
        inPrice
      );
    });
  }, [filters, inventory]);

  function updateFilter(key: FilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const message = String(data.get('message') || '').trim();

    if (!name || !phone || !message) {
      setFormMessage('Please fill out your name, phone number, and message.');
      return;
    }

    setFormMessage('Thanks - this demo form is ready to connect to email or a backend.');
    event.currentTarget.reset();
  }

  const navItems: [PageKey, string][] = [
    ['home', 'Home'],
    ['tires', 'Tires'],
    ['services', 'Services'],
    ['about', 'About Us'],
    ['contact', 'Contact'],
    ['admin', 'Admin'],
  ];

  return (
    <main className="min-h-screen bg-[#111] text-tire-cream">
      <div className="mx-auto min-h-screen w-[min(1500px,calc(100%-24px))] overflow-hidden bg-[#070707] shadow-[0_30px_100px_rgba(0,0,0,.72)]">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 px-5 py-4 backdrop-blur-xl lg:px-20">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <button onClick={() => setPage('home')} className="w-[min(280px,42vw)] text-left" aria-label="Akron Tire Shop home">
              <img
                src="/assets/akron-tire-shop-logo.png"
                alt="Akron Tire Shop"
                className="h-24 w-full object-contain object-left drop-shadow-[0_18px_24px_rgba(185,28,28,.22)]"
              />
            </button>

            <nav className="flex flex-wrap items-center gap-2 lg:justify-center" aria-label="Main navigation">
              {navItems.map(([key, label]) => (
                <button key={key} onClick={() => setPage(key)} className={`border-b-2 px-4 py-3 font-display text-xl font-black uppercase tracking-wide transition hover:text-tire-red ${page === key ? 'border-tire-red text-tire-red' : 'border-transparent text-white'}`}>
                  {label}
                </button>
              ))}
            </nav>

            <a className="flex items-center gap-3 font-display text-2xl font-black tracking-wide text-white" href={BUSINESS.phoneHref}>
              <span className="text-tire-red">CALL</span>
              {BUSINESS.phoneDisplay}
            </a>
          </div>
        </header>

        {page === 'home' && (
          <>
            <HeroSection setPage={setPage} inventoryCount={filteredTires.length} />
            <HomeServiceStrip />
            <InventoryPreview setPage={setPage} tires={filteredTires} />
            <ServicesSection compact />
            <WhyChooseUs />
            <ContactSection onSubmit={submitContact} formMessage={formMessage} compact />
          </>
        )}

        {page === 'tires' && <TiresSection filteredTires={filteredTires} filters={filters} updateFilter={updateFilter} brands={brands} />}
        {page === 'services' && <ServicesSection />}
        {page === 'about' && <AboutSection />}
        {page === 'contact' && <ContactSection onSubmit={submitContact} formMessage={formMessage} />}
        {page === 'admin' && <AdminSection adminCode={adminCode} setAdminCode={setAdminCode} adminUnlocked={adminUnlocked} setAdminUnlocked={setAdminUnlocked} inventory={inventory} setInventory={setInventory} />}

        <footer className="border-t border-white/10 bg-black px-5 py-10 text-sm text-tire-muted lg:px-20">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p>(c) {new Date().getFullYear()} Akron Tire Shop. Placeholder details ready for business updates.</p>
            <p>New tires. Used tires. Mounting. Balancing. Repairs.</p>
          </div>
        </footer>
      </div>

      <a className="fixed bottom-4 left-4 right-4 z-50 block border border-tire-red bg-tire-red px-5 py-4 text-center font-black uppercase tracking-wide text-white shadow-2xl md:hidden" href={BUSINESS.phoneHref}>
        Call Akron Tire Shop
      </a>
    </main>
  );
}

function HeroSection({ setPage, inventoryCount }: { setPage: (page: PageKey) => void; inventoryCount: number }) {
  return (
    <section className="relative overflow-hidden px-5 py-12 lg:px-20 lg:py-16">
      <div className="absolute inset-0 opacity-[.1] [background-image:linear-gradient(135deg,transparent_45%,rgba(255,255,255,.45)_48%,transparent_50%),linear-gradient(45deg,transparent_45%,rgba(255,255,255,.24)_48%,transparent_50%)] [background-size:44px_44px]" />
      <div className="absolute left-8 top-20 h-28 w-[520px] -rotate-12 bg-tire-red/35 blur-sm" />
      <div className="relative grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div className="z-10 max-w-2xl text-center lg:text-left">
          <p className="mb-4 font-display text-xl font-black uppercase tracking-[.22em] text-tire-red">New & Used Tires. Mount & Balance. Tire Repairs.</p>
          <h1 className="font-display text-[clamp(5.2rem,11vw,11rem)] font-black uppercase italic leading-[.76] tracking-[-.08em] text-white [text-shadow:4px_4px_0_rgba(0,0,0,.95)]">
            Good Tires.
            <span className="block rotate-[-2deg] text-tire-red [text-shadow:4px_4px_0_rgba(0,0,0,.95)]">Good Grip.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-xl font-black uppercase leading-7 tracking-wide text-white/90 lg:mx-0">Good prices. Get back on the road.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
            <button className="tire-btn tire-btn-red min-w-44" onClick={() => setPage('tires')}>Browse Tires</button>
            <button className="tire-btn tire-btn-dark min-w-44" onClick={() => setPage('services')}>Our Services</button>
          </div>
          <div className="mt-8 grid max-w-xl grid-cols-3 border border-white/10 bg-black/45">
            <Stat value={String(inventoryCount)} label="tires listed" />
            <Stat value="5" label="tire services" />
            <Stat value="6" label="days open" />
          </div>
        </div>

        <div className="relative min-h-[390px] overflow-hidden border border-white/10 lg:min-h-[560px]">
          <div className="absolute inset-0 scale-105 bg-cover bg-center grayscale" style={{ backgroundImage: `linear-gradient(90deg,rgba(7,7,7,.04),rgba(7,7,7,.45)),url(${fallbackImage})` }} />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#070707] to-transparent" />
          <div className="absolute bottom-7 left-7 border-l-4 border-tire-red bg-black/75 px-5 py-4 backdrop-blur">
            <p className="font-display text-3xl font-black uppercase italic">Mounted. Balanced. Road Ready.</p>
            <p className="text-tire-muted">Akron tire service without the runaround.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-r border-white/10 p-4 last:border-r-0">
      <b className="block font-display text-4xl font-black">{value}</b>
      <span className="text-xs font-black uppercase tracking-[.16em] text-tire-muted">{label}</span>
    </div>
  );
}

function HomeServiceStrip() {
  return (
    <section className="mx-5 border-t-2 border-tire-red bg-gradient-to-b from-[#151515] to-[#090909] lg:mx-28">
      <div className="grid divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
        {[
          ['New & Used Tires', 'All brands. All sizes.'],
          ['Mount & Balance', 'Smooth ride. Every time.'],
          ['Tire Repairs', 'Patches & plugs.'],
        ].map(([title, text]) => (
          <div className="flex items-center gap-5 p-7" key={title}>
            <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-tire-red font-display text-3xl font-black text-tire-red">T</span>
            <div>
              <h3 className="font-display text-2xl font-black uppercase">{title}</h3>
              <p className="mt-1 text-tire-muted">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ServicesSection({ compact = false }: { compact?: boolean }) {
  const serviceList = [
    ['New Tires', 'Fresh tire options for everyday vehicles. Call to confirm current availability.'],
    ['Used Tires', 'Budget-friendly used tires checked for practical tread and road-ready condition.'],
    ['Tire Mounting', 'Professional mounting for purchased or customer-provided tires.'],
    ['Tire Balancing', 'Wheel balancing to reduce vibration and support smoother driving.'],
    ['Tire Repairs', 'Leak checks and puncture repairs when the tire can be safely fixed.'],
  ];

  return (
    <section className="px-5 py-16 lg:px-20 lg:py-24">
      <SectionHead eyebrow="Services" title="Only Tires. Done Right." body="We focus on new tires, used tires, tire mounting, tire balancing, and tire repairs. No unrelated work." />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {serviceList.map(([title, body]) => (
          <article className="tire-card border-t-2 border-tire-red" key={title}>
            <h3 className="font-display text-4xl font-black uppercase italic tracking-tight">{title}</h3>
            <p className="mt-4 leading-7 text-tire-muted">{body}</p>
          </article>
        ))}
      </div>
      {!compact && <p className="mt-7 border-l-4 border-tire-red bg-tire-red/10 p-4 text-tire-muted">Clear service list: no alignments, rims, oil changes, brakes, TPMS service, towing, or any other services.</p>}
    </section>
  );
}

function TiresSection({ filteredTires, filters, updateFilter, brands }: { filteredTires: Tire[]; filters: Record<FilterKey, string>; updateFilter: (key: FilterKey, value: string) => void; brands: string[] }) {
  return (
    <section className="px-5 py-16 lg:px-20 lg:py-24">
      <SectionHead eyebrow="Tires" title="Live Tire Inventory" body="Inventory can be updated from the admin dashboard. Sample/default data is stored until you add real stock." />
      <div className="tire-card mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Filter label="New or Used" value={filters.condition} options={['Any', 'New', 'Used']} onChange={(value) => updateFilter('condition', value)} />
        <Filter label="Tire Width" value={filters.width} options={['Any', '205', '215', '225', '235', '245']} onChange={(value) => updateFilter('width', value)} />
        <Filter label="Aspect Ratio" value={filters.ratio} options={['Any', '45', '50', '55', '60', '65']} onChange={(value) => updateFilter('ratio', value)} />
        <Filter label="Rim Size" value={filters.rim} options={['Any', '16', '17', '18', '20']} onChange={(value) => updateFilter('rim', value)} />
        <Filter label="Brand" value={filters.brand} options={brands} onChange={(value) => updateFilter('brand', value)} />
        <Filter label="Price Range" value={filters.price} options={['Any', 'Under $100', '$100-$300', '$300+']} onChange={(value) => updateFilter('price', value)} />
      </div>
      <TireGrid tires={filteredTires} />
    </section>
  );
}

function TireGrid({ tires }: { tires: Tire[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {tires.map((tire) => (
        <article key={tire.id} className="overflow-hidden border border-white/10 bg-white/[.055] shadow-2xl">
          <div className="h-56 bg-cover bg-center grayscale" style={{ backgroundImage: `linear-gradient(180deg,transparent,rgba(0,0,0,.35)),url(${tire.image || fallbackImage})` }} />
          <div className="p-5">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="tire-tag">{tire.condition}</span>
              <span className="tire-tag">{tire.quantityType}</span>
              <span className="tire-tag">{tire.availability}</span>
            </div>
            <h3 className="font-display text-4xl font-black uppercase italic">{tire.brand} {tire.model}</h3>
            <p className="mt-2 text-tire-muted">{tire.size}</p>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div className="font-display text-5xl font-black">${tire.price}</div>
              <a className="tire-btn tire-btn-red" href={BUSINESS.phoneHref}>Call To Confirm</a>
            </div>
          </div>
        </article>
      ))}
      {tires.length === 0 && <div className="tire-card text-tire-muted">No in-stock tires match those filters.</div>}
    </div>
  );
}

function InventoryPreview({ setPage, tires }: { setPage: (page: PageKey) => void; tires: Tire[] }) {
  return (
    <section className="border-y border-white/10 bg-zinc-950 px-5 py-16 lg:px-20">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="tire-eyebrow">In-stock preview</p>
          <h2 className="font-display text-6xl font-black uppercase italic leading-none tracking-[-.05em]">Ready to roll.</h2>
        </div>
        <button className="tire-btn tire-btn-red" onClick={() => setPage('tires')}>View All Tires</button>
      </div>
      <TireGrid tires={tires.slice(0, 3)} />
    </section>
  );
}

function AdminSection({ adminCode, setAdminCode, adminUnlocked, setAdminUnlocked, inventory, setInventory }: {
  adminCode: string;
  setAdminCode: (value: string) => void;
  adminUnlocked: boolean;
  setAdminUnlocked: (value: boolean) => void;
  inventory: Tire[];
  setInventory: (value: Tire[] | ((current: Tire[]) => Tire[])) => void;
}) {
  const [image, setImage] = useState('');
  const [message, setMessage] = useState('');

  function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (adminCode === '1111') {
      setAdminUnlocked(true);
      setMessage('');
    } else {
      setMessage('Wrong code.');
    }
  }

  function readImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result || ''));
    reader.readAsDataURL(file);
  }

  function addTire(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const tire: Tire = {
      id: `tire-${Date.now()}`,
      brand: String(data.get('brand') || '').trim() || 'Unknown',
      model: String(data.get('model') || '').trim() || 'Tire',
      size: String(data.get('size') || '').trim() || '225/60R17',
      width: String(data.get('width') || '').trim() || '225',
      ratio: String(data.get('ratio') || '').trim() || '60',
      rim: String(data.get('rim') || '').trim() || '17',
      condition: String(data.get('condition')) === 'Used' ? 'Used' : 'New',
      quantityType: (String(data.get('quantityType')) || 'Single') as TireQty,
      price: Number(data.get('price') || 0),
      availability: (String(data.get('availability')) || 'In Stock') as Tire['availability'],
      image: image || fallbackImage,
    };
    setInventory((current) => [tire, ...current]);
    setImage('');
    setMessage('Tire added and saved on this browser.');
    event.currentTarget.reset();
  }

  function updateTire(id: string, patch: Partial<Tire>) {
    setInventory((current) => current.map((tire) => (tire.id === id ? { ...tire, ...patch } : tire)));
  }

  function deleteTire(id: string) {
    setInventory((current) => current.filter((tire) => tire.id !== id));
  }

  if (!adminUnlocked) {
    return (
      <section className="px-5 py-16 lg:px-20 lg:py-24">
        <div className="mx-auto max-w-xl tire-card">
          <p className="tire-eyebrow">Admin dashboard</p>
          <h1 className="font-display text-6xl font-black uppercase italic">Inventory Login</h1>
          <form className="mt-6 space-y-4" onSubmit={unlock}>
            <input className="tire-input" value={adminCode} onChange={(event) => setAdminCode(event.target.value)} placeholder="Enter admin code" type="password" />
            <button className="tire-btn tire-btn-red" type="submit">Unlock Admin</button>
            <p className="text-sm text-red-200">{message}</p>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 py-16 lg:px-20 lg:py-24">
      <SectionHead eyebrow="Admin dashboard" title="Manage Tire Stock" body="Code: 1111. Add real tires, upload tire photos, and mark stock as set of 4, pair of 2, or single." />
      <form className="tire-card mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={addTire}>
        <input className="tire-input" name="brand" placeholder="Brand" required />
        <input className="tire-input" name="model" placeholder="Model" required />
        <input className="tire-input" name="size" placeholder="Size ex. 225/60R17" required />
        <input className="tire-input" name="price" placeholder="Price" type="number" min="0" required />
        <input className="tire-input" name="width" placeholder="Width ex. 225" required />
        <input className="tire-input" name="ratio" placeholder="Ratio ex. 60" required />
        <input className="tire-input" name="rim" placeholder="Rim ex. 17" required />
        <select className="tire-input" name="condition"><option>New</option><option>Used</option></select>
        <select className="tire-input" name="quantityType"><option>Set of 4</option><option>Pair of 2</option><option>Single</option></select>
        <select className="tire-input" name="availability"><option>In Stock</option><option>Limited</option><option>Sold</option></select>
        <input className="tire-input lg:col-span-2" type="file" accept="image/*" onChange={readImage} />
        {image && <img src={image} alt="New tire preview" className="h-28 w-40 object-cover grayscale" />}
        <button className="tire-btn tire-btn-red lg:col-span-2" type="submit">Add Tire</button>
        <p className="text-sm text-tire-muted lg:col-span-4">{message}</p>
      </form>

      <div className="grid gap-4">
        {inventory.map((tire) => (
          <article key={tire.id} className="tire-card grid gap-4 md:grid-cols-[120px_1fr_auto] md:items-center">
            <img src={tire.image || fallbackImage} alt={`${tire.brand} ${tire.model}`} className="h-28 w-full object-cover grayscale md:w-28" />
            <div>
              <h3 className="font-display text-3xl font-black uppercase italic">{tire.brand} {tire.model}</h3>
              <p className="text-tire-muted">{tire.size} - {tire.condition} - {tire.quantityType} - ${tire.price}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(['In Stock', 'Limited', 'Sold'] as Tire['availability'][]).map((status) => (
                  <button key={status} onClick={() => updateTire(tire.id, { availability: status })} className={`tire-tag ${tire.availability === status ? 'border-tire-red text-white' : ''}`}>{status}</button>
                ))}
              </div>
            </div>
            <button className="tire-btn tire-btn-dark" onClick={() => deleteTire(tire.id)}>Delete</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="tire-label">{label}</span>
      <select className="tire-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function SectionHead({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="mb-9 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="tire-eyebrow">{eyebrow}</p>
        <h1 className="font-display text-[clamp(3.5rem,8vw,8rem)] font-black uppercase italic leading-none tracking-[-.07em]">{title}</h1>
      </div>
      <p className="max-w-xl leading-8 text-tire-muted">{body}</p>
    </div>
  );
}

function WhyChooseUs() {
  return (
    <section className="bg-[#f3eee4] px-5 py-16 text-zinc-950 lg:px-20 lg:py-24">
      <p className="tire-eyebrow">Why choose us</p>
      <h2 className="mb-8 font-display text-[clamp(3rem,7vw,6rem)] font-black uppercase italic leading-none tracking-[-.05em]">Local. Straightforward. Tire-focused.</h2>
      <div className="grid gap-5 md:grid-cols-4">
        {['Clear pricing', 'Fast service', 'Real stock control', 'Akron owned'].map((item) => (
          <div className="border border-black/15 bg-white p-6 shadow-xl" key={item}>
            <h3 className="font-display text-3xl font-black uppercase italic">{item}</h3>
            <p className="mt-3 leading-7 text-zinc-600">A practical shop experience built around getting customers back on the road.</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="px-5 py-16 lg:px-20 lg:py-24">
      <SectionHead eyebrow="About Us" title="A Straightforward Akron Tire Shop." body="Akron Tire Shop is built for drivers who need honest tire options, clear service, and a quick path back onto the road." />
      <div className="grid gap-5 md:grid-cols-3">
        <article className="tire-card"><h3 className="font-display text-4xl font-black uppercase italic">Focused Work</h3><p className="mt-3 text-tire-muted">New tires, used tires, tire mounting, tire balancing, and tire repairs. That is it.</p></article>
        <article className="tire-card"><h3 className="font-display text-4xl font-black uppercase italic">Local Feel</h3><p className="mt-3 text-tire-muted">Built for Akron drivers who need fair tire options and practical service.</p></article>
        <article className="tire-card"><h3 className="font-display text-4xl font-black uppercase italic">No Runaround</h3><p className="mt-3 text-tire-muted">Clear service list, clear communication, and tire-focused help.</p></article>
      </div>
    </section>
  );
}

function ContactSection({ onSubmit, formMessage, compact = false }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; formMessage: string; compact?: boolean }) {
  return (
    <section className="px-5 py-16 lg:px-20 lg:py-24">
      {!compact && <SectionHead eyebrow="Contact" title="Call Or Stop By." body="Placeholder business information can be replaced when the final phone, address, and hours are ready." />}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="tire-card">
          <h2 className="font-display text-4xl font-black uppercase italic">Akron Tire Shop</h2>
          <p className="mt-4 leading-8 text-tire-muted"><strong>Phone:</strong> <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a><br /><strong>Address:</strong> {BUSINESS.address}<br /><strong>Hours:</strong> {BUSINESS.hours}<br /><strong>Sunday:</strong> {BUSINESS.sunday}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="tire-btn tire-btn-red" href={BUSINESS.phoneHref}>Click to Call</a>
            <a className="tire-btn tire-btn-light" href={BUSINESS.directions} target="_blank" rel="noreferrer">Get Directions</a>
          </div>
          <div className="mt-6 grid min-h-[300px] place-items-center border border-white/10 bg-[linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),#121212] bg-[size:34px_34px] text-center text-tire-muted">
            Embedded map placeholder for Akron, Ohio
          </div>
        </div>
        <form className="tire-card space-y-4" onSubmit={onSubmit} noValidate>
          <h2 className="font-display text-4xl font-black uppercase italic">Contact Form</h2>
          <label className="grid gap-2"><span className="tire-label">Name</span><input className="tire-input" name="name" autoComplete="name" required /></label>
          <label className="grid gap-2"><span className="tire-label">Phone</span><input className="tire-input" name="phone" autoComplete="tel" required /></label>
          <label className="grid gap-2"><span className="tire-label">What do you need?</span><textarea className="tire-input min-h-32" name="message" required /></label>
          <p className="min-h-6 text-sm text-red-200" aria-live="polite">{formMessage}</p>
          <button className="tire-btn tire-btn-red" type="submit">Send Request</button>
        </form>
      </div>
    </section>
  );
}
