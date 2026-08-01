'use client';

import { FormEvent, useMemo, useState } from 'react';

type PageKey = 'home' | 'tires' | 'services' | 'about' | 'contact';
type FilterKey = 'condition' | 'width' | 'ratio' | 'rim' | 'brand' | 'price';

type Tire = {
  brand: string;
  model: string;
  size: string;
  width: string;
  ratio: string;
  rim: string;
  condition: 'New' | 'Used';
  price: number;
  availability: string;
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

const tires: Tire[] = [
  { brand: 'Goodyear', model: 'Assurance All-Season', size: '225/60R17', width: '225', ratio: '60', rim: '17', condition: 'New', price: 129, availability: 'In stock' },
  { brand: 'Michelin', model: 'Defender T+H', size: '215/55R17', width: '215', ratio: '55', rim: '17', condition: 'Used', price: 78, availability: 'Call to confirm' },
  { brand: 'Firestone', model: 'All Season', size: '205/55R16', width: '205', ratio: '55', rim: '16', condition: 'New', price: 105, availability: 'In stock' },
  { brand: 'Cooper', model: 'Endeavor Plus', size: '235/65R18', width: '235', ratio: '65', rim: '18', condition: 'Used', price: 92, availability: 'Limited' },
  { brand: 'Continental', model: 'TrueContact Tour', size: '245/45R18', width: '245', ratio: '45', rim: '18', condition: 'New', price: 148, availability: 'In stock' },
  { brand: 'Goodyear', model: 'Eagle Sport', size: '225/45R17', width: '225', ratio: '45', rim: '17', condition: 'Used', price: 70, availability: 'Call to confirm' },
];

const heroImage = 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1400&q=85';
const shopImage = 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1200&q=85';

export function AkronTireShop({ initialPage = 'home' }: { initialPage?: PageKey }) {
  const [page, setPage] = useState<PageKey>(initialPage);
  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    condition: 'Any',
    width: 'Any',
    ratio: 'Any',
    rim: 'Any',
    brand: 'Any',
    price: 'Any',
  });
  const [formMessage, setFormMessage] = useState('');

  const filteredTires = useMemo(() => {
    return tires.filter((tire) => {
      const inPrice =
        filters.price === 'Any' ||
        (filters.price === 'Under $75' && tire.price < 75) ||
        (filters.price === '$75-$125' && tire.price >= 75 && tire.price <= 125) ||
        (filters.price === '$125+' && tire.price > 125);

      return (
        (filters.condition === 'Any' || tire.condition === filters.condition) &&
        (filters.width === 'Any' || tire.width === filters.width) &&
        (filters.ratio === 'Any' || tire.ratio === filters.ratio) &&
        (filters.rim === 'Any' || tire.rim === filters.rim) &&
        (filters.brand === 'Any' || tire.brand === filters.brand) &&
        inPrice
      );
    });
  }, [filters]);

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
  ];

  return (
    <main className="min-h-screen bg-[#151515] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,.08),transparent_28rem)] text-tire-cream">
      <div className="mx-auto min-h-screen w-[min(1440px,calc(100%-28px))] bg-[#070707] shadow-[0_24px_80px_rgba(0,0,0,.7)]">
        <header className="relative z-40 border-b border-white/10 bg-black/70 px-5 py-4 backdrop-blur-xl lg:px-20">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <button onClick={() => setPage('home')} className="group text-left" aria-label="Akron Tire Shop home">
              <span className="block font-display text-5xl font-black uppercase italic leading-[.72] tracking-[-.06em] text-white [text-shadow:3px_3px_0_rgba(185,28,28,.65)] md:text-6xl">
                Akron
              </span>
              <span className="-mt-1 block rotate-[-4deg] font-display text-4xl font-black uppercase italic leading-none tracking-[-.05em] text-tire-red [text-shadow:2px_2px_0_rgba(0,0,0,.85)] md:text-5xl">
                Tire Shop
              </span>
            </button>

            <nav className="flex flex-wrap items-center gap-2 lg:justify-center" aria-label="Main navigation">
              {navItems.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPage(key)}
                  className={`border-b-2 px-4 py-3 font-display text-xl font-black uppercase tracking-wide transition hover:text-tire-red ${
                    page === key ? 'border-tire-red text-tire-red' : 'border-transparent text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            <a className="flex items-center gap-3 font-display text-2xl font-black tracking-wide text-white" href={BUSINESS.phoneHref}>
              <span className="text-tire-red">☎</span>
              {BUSINESS.phoneDisplay}
            </a>
          </div>
        </header>

        {page === 'home' && (
          <>
            <HeroSection setPage={setPage} />
            <HomeServiceStrip />
            <ServicesSection compact />
            <InventoryPreview setPage={setPage} />
            <WhyChooseUs />
            <ContactSection onSubmit={submitContact} formMessage={formMessage} compact />
          </>
        )}

        {page === 'tires' && <TiresSection filteredTires={filteredTires} filters={filters} updateFilter={updateFilter} />}
        {page === 'services' && <ServicesSection />}
        {page === 'about' && <AboutSection />}
        {page === 'contact' && <ContactSection onSubmit={submitContact} formMessage={formMessage} />}

        <footer className="border-t border-white/10 bg-black px-5 py-10 text-sm text-tire-muted lg:px-20">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} Akron Tire Shop. Placeholder details ready for business updates.</p>
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

function HeroSection({ setPage }: { setPage: (page: PageKey) => void }) {
  return (
    <section className="relative overflow-hidden px-5 py-12 lg:px-20 lg:py-16">
      <div className="absolute inset-0 opacity-[.12] [background-image:linear-gradient(135deg,transparent_45%,rgba(255,255,255,.5)_48%,transparent_50%),linear-gradient(45deg,transparent_45%,rgba(255,255,255,.3)_48%,transparent_50%)] [background-size:44px_44px]" />
      <div className="absolute left-10 top-16 h-24 w-[440px] -rotate-12 bg-tire-red/35 blur-sm" />
      <div className="relative grid gap-8 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
        <div className="z-10 max-w-2xl text-center lg:text-left">
          <p className="mb-4 font-display text-xl font-black uppercase tracking-[.22em] text-tire-red">New & Used Tires. Mount & Balance. Tire Repairs.</p>
          <h1 className="font-display text-[clamp(5rem,11vw,10.5rem)] font-black uppercase italic leading-[.78] tracking-[-.075em] text-white [text-shadow:4px_4px_0_rgba(0,0,0,.95)]">
            Good Tires.
            <span className="block rotate-[-2deg] text-tire-red [text-shadow:4px_4px_0_rgba(0,0,0,.95)]">Good Grip.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-xl font-black uppercase leading-7 tracking-wide text-white/90 lg:mx-0">
            Good prices. Get back on the road.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
            <button className="tire-btn tire-btn-red min-w-44" onClick={() => setPage('tires')}>Browse Tires</button>
            <button className="tire-btn tire-btn-dark min-w-44" onClick={() => setPage('services')}>Our Services</button>
          </div>
        </div>

        <div className="relative min-h-[390px] overflow-hidden lg:min-h-[520px]">
          <div className="absolute inset-0 bg-cover bg-center grayscale" style={{ backgroundImage: `linear-gradient(90deg,rgba(7,7,7,.12),rgba(7,7,7,.42)),url(${heroImage})` }} />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#070707] to-transparent" />
        </div>
      </div>
    </section>
  );
}

function HomeServiceStrip() {
  return (
    <section className="mx-5 border-t-2 border-tire-red bg-gradient-to-b from-[#151515] to-[#090909] lg:mx-28">
      <div className="grid divide-y divide-white/10 md:grid-cols-4 md:divide-x md:divide-y-0">
        {[
          ['◉', 'New & Used Tires', 'All brands. All sizes.'],
          ['◎', 'Mount & Balance', 'Smooth ride. Every time.'],
          ['◌', 'Tire Repairs', 'Patches & plugs.'],
          ['◍', 'Quality Tires', 'Great prices. Guaranteed.'],
        ].map(([icon, title, text]) => (
          <div className="flex items-center gap-5 p-7" key={title}>
            <span className="font-display text-6xl leading-none text-tire-red">{icon}</span>
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
      <div className="mb-9 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="tire-eyebrow">Services</p>
          <h2 className="font-display text-[clamp(3.4rem,7vw,6.5rem)] font-black uppercase italic leading-none tracking-[-.06em]">Only tires. Done right.</h2>
        </div>
        <p className="max-w-xl leading-8 text-tire-muted">We focus on new tires, used tires, tire mounting, tire balancing, and tire repairs. No unrelated work.</p>
      </div>
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

function TiresSection({ filteredTires, filters, updateFilter }: { filteredTires: Tire[]; filters: Record<FilterKey, string>; updateFilter: (key: FilterKey, value: string) => void }) {
  return (
    <section className="px-5 py-16 lg:px-20 lg:py-24">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="tire-eyebrow">Tires</p>
          <h1 className="font-display text-[clamp(4rem,8vw,8rem)] font-black uppercase italic leading-none tracking-[-.07em]">Sample Tire Inventory</h1>
        </div>
        <p className="max-w-xl border-l-4 border-tire-red bg-tire-red/10 p-4 text-tire-muted">Sample data only - this inventory can later be connected to a database.</p>
      </div>
      <div className="tire-card mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Filter label="New or Used" value={filters.condition} options={['Any', 'New', 'Used']} onChange={(value) => updateFilter('condition', value)} />
        <Filter label="Tire Width" value={filters.width} options={['Any', '205', '215', '225', '235', '245']} onChange={(value) => updateFilter('width', value)} />
        <Filter label="Aspect Ratio" value={filters.ratio} options={['Any', '45', '50', '55', '60', '65']} onChange={(value) => updateFilter('ratio', value)} />
        <Filter label="Rim Size" value={filters.rim} options={['Any', '16', '17', '18', '20']} onChange={(value) => updateFilter('rim', value)} />
        <Filter label="Brand" value={filters.brand} options={['Any', 'Goodyear', 'Michelin', 'Firestone', 'Cooper', 'Continental']} onChange={(value) => updateFilter('brand', value)} />
        <Filter label="Price Range" value={filters.price} options={['Any', 'Under $75', '$75-$125', '$125+']} onChange={(value) => updateFilter('price', value)} />
      </div>
      <div className="grid gap-4">
        {filteredTires.map((tire) => (
          <article key={`${tire.brand}-${tire.model}-${tire.size}`} className="tire-card grid gap-5 md:grid-cols-[92px_1fr_auto] md:items-center">
            <div className="h-24 border border-white/10 bg-[radial-gradient(circle,transparent_32%,#111_33%,#111_50%,transparent_51%),repeating-linear-gradient(90deg,#2b2b2b_0_6px,#111_6px_12px)]" aria-hidden="true" />
            <div>
              <h3 className="font-display text-3xl font-black uppercase italic">{tire.brand} {tire.model}</h3>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-tire-muted">
                <span className="tire-tag">{tire.size}</span>
                <span className="tire-tag">{tire.condition}</span>
                <span className="tire-tag">{tire.availability}</span>
              </div>
            </div>
            <div className="space-y-3 md:text-right">
              <div className="font-display text-4xl font-black">${tire.price}</div>
              <a className="tire-btn tire-btn-red inline-flex" href={BUSINESS.phoneHref}>Call to Confirm</a>
            </div>
          </article>
        ))}
        {filteredTires.length === 0 && <div className="tire-card text-tire-muted">No sample tires match those filters. Reset filters or call to confirm availability.</div>}
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

function InventoryPreview({ setPage }: { setPage: (page: PageKey) => void }) {
  return (
    <section className="border-y border-white/10 bg-zinc-950 px-5 py-16 lg:px-20">
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
        <div>
          <p className="tire-eyebrow">Inventory preview</p>
          <h2 className="font-display text-6xl font-black uppercase italic leading-none tracking-[-.05em]">Sample tires ready to browse.</h2>
          <button className="tire-btn tire-btn-red mt-6" onClick={() => setPage('tires')}>Open Tires Page</button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {tires.slice(0, 3).map((tire) => (
            <article className="tire-card" key={tire.model}>
              <p className="tire-eyebrow">{tire.condition}</p>
              <h3 className="font-display text-3xl font-black uppercase italic">{tire.brand}</h3>
              <p className="mt-2 text-tire-muted">{tire.model}<br />{tire.size}</p>
              <strong className="mt-4 block font-display text-3xl">${tire.price}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChooseUs() {
  return (
    <section className="bg-[#f3eee4] px-5 py-16 text-zinc-950 lg:px-20 lg:py-24">
      <p className="tire-eyebrow">Why choose us</p>
      <h2 className="mb-8 font-display text-[clamp(3rem,7vw,6rem)] font-black uppercase italic leading-none tracking-[-.05em]">Local. Straightforward. Tire-focused.</h2>
      <div className="grid gap-5 md:grid-cols-4">
        {['Clear pricing', 'Fast service', 'Used tire options', 'Akron owned'].map((item) => (
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
    <section className="grid gap-8 px-5 py-16 lg:grid-cols-[1fr_.75fr] lg:items-center lg:px-20 lg:py-24">
      <div>
        <p className="tire-eyebrow">About Us</p>
        <h1 className="font-display text-[clamp(4rem,8vw,8rem)] font-black uppercase italic leading-none tracking-[-.07em]">A straightforward Akron tire shop.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-tire-muted">Akron Tire Shop is built for drivers who need honest tire options, clear service, and a quick path back onto the road. The shop keeps the service list focused so every visit stays simple.</p>
      </div>
      <div className="tire-card">
        <h2 className="font-display text-4xl font-black uppercase italic">What we handle</h2>
        <p className="mt-4 leading-8 text-tire-muted">New tires, used tires, tire mounting, tire balancing, and tire repairs. That&apos;s it - focused work, cleaner communication, better experience.</p>
      </div>
    </section>
  );
}

function ContactSection({ onSubmit, formMessage, compact = false }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; formMessage: string; compact?: boolean }) {
  return (
    <section className="px-5 py-16 lg:px-20 lg:py-24">
      {!compact && (
        <div className="mb-8">
          <p className="tire-eyebrow">Contact</p>
          <h1 className="font-display text-[clamp(4rem,8vw,8rem)] font-black uppercase italic leading-none tracking-[-.07em]">Call or stop by.</h1>
        </div>
      )}
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
