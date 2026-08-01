'use client';

import { FormEvent, useMemo, useState } from 'react';

type PageKey = 'home' | 'tires' | 'services' | 'about' | 'contact';
type DesignKey = 'dark' | 'local' | 'street';
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
  // Edit business information here when the real details are ready.
  phoneDisplay: '(330) 555-0000',
  phoneHref: 'tel:+13305550000',
  address: 'Akron, Ohio',
  directions: 'https://maps.google.com/?q=Akron%2C%20Ohio',
  hours: 'Monday–Saturday, 9:00 AM–6:00 PM',
  sunday: 'Closed',
};

const services = [
  {
    title: 'New & Used Tires',
    body: 'Road-ready new and used tire options for daily drivers, work vehicles, and quick replacements.',
  },
  {
    title: 'Mount & Balance',
    body: 'Professional mounting and balancing for a smoother ride and safer handling.',
  },
  {
    title: 'Tire Repairs',
    body: 'Leak checks and dependable repairs when the tire can be safely fixed.',
  },
];

const tires: Tire[] = [
  { brand: 'Goodyear', model: 'Assurance All-Season', size: '225/60R17', width: '225', ratio: '60', rim: '17', condition: 'New', price: 129, availability: 'In stock' },
  { brand: 'Michelin', model: 'Defender T+H', size: '215/55R17', width: '215', ratio: '55', rim: '17', condition: 'Used', price: 78, availability: 'Call to confirm' },
  { brand: 'Firestone', model: 'All Season', size: '205/55R16', width: '205', ratio: '55', rim: '16', condition: 'New', price: 105, availability: 'In stock' },
  { brand: 'Cooper', model: 'Endeavor Plus', size: '235/65R18', width: '235', ratio: '65', rim: '18', condition: 'Used', price: 92, availability: 'Limited' },
  { brand: 'Continental', model: 'TrueContact Tour', size: '245/45R18', width: '245', ratio: '45', rim: '18', condition: 'New', price: 148, availability: 'In stock' },
  { brand: 'Goodyear', model: 'Eagle Sport', size: '225/45R17', width: '225', ratio: '45', rim: '17', condition: 'Used', price: 70, availability: 'Call to confirm' },
];

const tireImage = 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1100&q=80';
const shopImage = 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1100&q=80';
const streetImage = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1100&q=80';

export function AkronTireShop({ initialPage = 'home' }: { initialPage?: PageKey }) {
  const [design, setDesign] = useState<DesignKey>('dark');
  const [page, setPage] = useState<PageKey>(initialPage);
  const [filters, setFilters] = useState({
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
        (filters.price === '$75–$125' && tire.price >= 75 && tire.price <= 125) ||
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

  function updateFilter(key: keyof typeof filters, value: string) {
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

    setFormMessage('Thanks — this demo form is ready to connect to email or a backend.');
    event.currentTarget.reset();
  }

  const showHome = page === 'home';

  return (
    <main className="min-h-screen bg-tire-black text-tire-cream">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-tire-black/90 backdrop-blur-xl">
        <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <button onClick={() => setPage('home')} className="flex items-center gap-3 text-left" aria-label="Akron Tire Shop home">
            <span className="grid h-12 w-12 place-items-center border-2 border-tire-cream bg-tire-red font-display text-xl font-black">ATS</span>
            <span>
              <span className="block font-display text-2xl font-black uppercase leading-none tracking-tight">Akron Tire Shop</span>
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-tire-muted">New • Used • Mount • Balance • Repair</span>
            </span>
          </button>

          <nav className="flex flex-wrap gap-2" aria-label="Main navigation">
            {(['home', 'tires', 'services', 'about', 'contact'] as PageKey[]).map((item) => (
              <button key={item} onClick={() => setPage(item)} className={`tire-nav ${page === item ? 'tire-nav-active' : ''}`}>
                {item}
              </button>
            ))}
          </nav>

          <div className="flex flex-wrap gap-2">
            <a className="tire-btn tire-btn-red" href={BUSINESS.phoneHref}>Call Now</a>
            <a className="tire-btn tire-btn-dark" href={BUSINESS.directions} target="_blank" rel="noreferrer">Get Directions</a>
          </div>
        </div>
      </header>

      {showHome && (
        <section className="border-b border-white/10 bg-zinc-950/80">
          <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] flex-wrap items-center justify-between gap-3 py-4">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-tire-muted">Preview homepage design</p>
            <div className="flex flex-wrap gap-2" aria-label="Homepage design switcher">
              {[
                ['dark', 'Design 1'],
                ['local', 'Design 2'],
                ['street', 'Design 3'],
              ].map(([key, label]) => (
                <button key={key} onClick={() => setDesign(key as DesignKey)} className={`tire-tab ${design === key ? 'tire-tab-active' : ''}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {page === 'home' && (
        <>
          {design === 'dark' && <DarkPerformanceHero />}
          {design === 'local' && <CleanLocalHero setPage={setPage} />}
          {design === 'street' && <StreetAutomotiveHero />}
        </>
      )}

      {page === 'tires' && <TiresPage filteredTires={filteredTires} filters={filters} updateFilter={updateFilter} />}
      {page === 'services' && <ServicesPage />}
      {page === 'about' && <AboutPage />}
      {page === 'contact' && <ContactPage onSubmit={submitContact} formMessage={formMessage} />}

      {page === 'home' && (
        <>
          <ServicesPage compact />
          <TiresPreview setPage={setPage} />
          <WhyChooseUs />
          <ReviewsAndHours />
          <ContactPage onSubmit={submitContact} formMessage={formMessage} compact />
        </>
      )}

      <footer className="border-t border-white/10 bg-black py-10 text-sm text-tire-muted">
        <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Akron Tire Shop. Placeholder details ready for business updates.</p>
          <p>Only new tires, used tires, mounting, balancing, and tire repairs.</p>
        </div>
      </footer>

      <a className="fixed bottom-4 left-4 right-4 z-50 block border border-tire-red bg-tire-red px-5 py-4 text-center font-black uppercase tracking-wide text-white shadow-2xl md:hidden" href={BUSINESS.phoneHref}>
        Call Akron Tire Shop
      </a>
    </main>
  );
}

function DarkPerformanceHero() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <TreadTexture />
      <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-10 lg:grid-cols-[1fr_.82fr] lg:items-center">
        <div className="space-y-7">
          <p className="tire-eyebrow">Akron, Ohio • Locally owned tire shop</p>
          <h1 className="font-display text-[clamp(4.5rem,13vw,11rem)] font-black uppercase leading-[.82] tracking-[-.07em]">Akron Tire Shop</h1>
          <h2 className="font-display text-[clamp(2.4rem,6vw,5.7rem)] font-black uppercase leading-[.9] tracking-[-.05em]">Good Tires. Good Prices. Get Back on the Road.</h2>
          <p className="max-w-2xl text-lg leading-8 text-tire-muted">New and used tires, professional mounting and balancing, and dependable tire repairs.</p>
          <div className="flex flex-wrap gap-3">
            <a className="tire-btn tire-btn-red" href={BUSINESS.phoneHref}>Call Now</a>
            <a className="tire-btn tire-btn-light" href={BUSINESS.directions} target="_blank" rel="noreferrer">Get Directions</a>
          </div>
        </div>
        <HeroImage image={tireImage} label="Mount • Balance • Repair" />
      </div>
      <ServiceCards />
    </section>
  );
}

function CleanLocalHero({ setPage }: { setPage: (page: PageKey) => void }) {
  return (
    <section className="bg-[#f3eee4] py-16 text-[#171414] lg:py-24">
      <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
        <div className="space-y-7">
          <p className="tire-eyebrow">Clean local shop</p>
          <h1 className="font-display text-[clamp(4rem,10vw,9rem)] font-black uppercase leading-[.86] tracking-[-.065em]">Reliable tires without the runaround.</h1>
          <p className="max-w-xl text-lg leading-8 text-zinc-700">Akron Tire Shop keeps it simple: new tires, used tires, mounting, balancing, and repairs from a shop that respects your time.</p>
          <div className="flex flex-wrap gap-3">
            <a className="tire-btn tire-btn-red" href={BUSINESS.phoneHref}>Call Now</a>
            <button className="tire-btn border-black bg-black text-white" onClick={() => setPage('tires')}>View Sample Tires</button>
          </div>
        </div>
        <div className="min-h-[420px] border border-black/15 bg-cover bg-center shadow-2xl" style={{ backgroundImage: `linear-gradient(135deg,rgba(255,255,255,.2),rgba(0,0,0,.45)),url(${shopImage})` }} role="img" aria-label="Tire shop service bay" />
      </div>
    </section>
  );
}

function StreetAutomotiveHero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_80%_10%,rgba(185,28,28,.28),transparent_30rem),#080808] py-20 lg:py-32">
      <div className="absolute right-[-12%] top-16 h-52 w-3/4 -rotate-6 opacity-10 [background:repeating-linear-gradient(115deg,transparent_0_18px,#fff_18px_28px,transparent_28px_48px)]" />
      <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-10 lg:grid-cols-[1fr_.82fr] lg:items-center">
        <div className="space-y-7">
          <p className="tire-eyebrow">Street automotive • Akron tire work</p>
          <h1 className="font-display text-[clamp(4.5rem,13vw,11rem)] font-black uppercase leading-[.82] tracking-[-.075em]">
            We Keep <span className="bg-gradient-to-t from-tire-red from-35% to-transparent to-35%">Akron</span> Moving
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-tire-muted">Tough, no-nonsense tire service: new tires, used tires, mounting, balancing, and tire repairs.</p>
          <div className="flex flex-wrap gap-3">
            <a className="tire-btn tire-btn-red" href={BUSINESS.phoneHref}>Call Now</a>
            <a className="tire-btn tire-btn-light" href={BUSINESS.directions} target="_blank" rel="noreferrer">Get Directions</a>
          </div>
        </div>
        <HeroImage image={streetImage} label="Akron Tire Work" />
      </div>
      <ServiceCards />
    </section>
  );
}

function HeroImage({ image, label }: { image: string; label: string }) {
  return (
    <div className="relative min-h-[420px] border border-white/15 bg-cover bg-center shadow-2xl lg:rotate-1" style={{ backgroundImage: `linear-gradient(135deg,rgba(0,0,0,.05),rgba(0,0,0,.72)),url(${image})` }}>
      <div className="absolute -bottom-5 -left-5 bg-tire-red px-5 py-3 font-display text-2xl font-black uppercase tracking-wide">{label}</div>
    </div>
  );
}

function ServiceCards() {
  return (
    <div className="mx-auto mt-16 grid w-[min(1180px,calc(100%-32px))] gap-5 md:grid-cols-3">
      {services.map((service, index) => (
        <article key={service.title} className="tire-card">
          <span className="mb-5 grid h-12 w-12 place-items-center border-2 border-tire-red font-black text-tire-red">{String(index + 1).padStart(2, '0')}</span>
          <h3 className="font-display text-4xl font-black uppercase tracking-tight">{service.title}</h3>
          <p className="mt-4 leading-7 text-tire-muted">{service.body}</p>
        </article>
      ))}
    </div>
  );
}

function ServicesPage({ compact = false }: { compact?: boolean }) {
  return (
    <section className="py-16 lg:py-24" id="services">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="tire-eyebrow">Services</p>
            <h2 className="font-display text-[clamp(3rem,7vw,6rem)] font-black uppercase leading-none tracking-[-.05em]">Only tires. Done right.</h2>
          </div>
          <p className="max-w-xl leading-8 text-tire-muted">We focus on the tire services listed here. No alignments, rims, oil changes, brakes, TPMS service, towing, or unrelated work.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            ['New Tires', 'Fresh tire options for everyday vehicles. Call to confirm current availability.'],
            ['Used Tires', 'Budget-friendly used tires checked for practical tread and road-ready condition.'],
            ['Tire Mounting', 'Professional mounting for purchased or customer-provided tires.'],
            ['Tire Balancing', 'Wheel balancing to reduce vibration and support smoother driving.'],
            ['Tire Repairs', 'Leak checks and puncture repairs when the tire can be safely fixed.'],
          ].map(([title, body]) => (
            <article className="tire-card" key={title}>
              <h3 className="font-display text-4xl font-black uppercase tracking-tight">{title}</h3>
              <p className="mt-4 leading-7 text-tire-muted">{body}</p>
            </article>
          ))}
        </div>
        {!compact && <p className="mt-7 border-l-4 border-tire-red bg-tire-red/10 p-4 text-tire-muted">Keeping the service list focused helps customers know exactly what Akron Tire Shop does.</p>}
      </div>
    </section>
  );
}

function TiresPage({ filteredTires, filters, updateFilter }: { filteredTires: Tire[]; filters: Record<FilterKey, string>; updateFilter: (key: FilterKey, value: string) => void }) {
  return (
    <section className="py-16 lg:py-24" id="tires">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="tire-eyebrow">Tires</p>
            <h2 className="font-display text-[clamp(3rem,7vw,6rem)] font-black uppercase leading-none tracking-[-.05em]">Sample tire inventory.</h2>
          </div>
          <p className="max-w-xl border-l-4 border-tire-red bg-tire-red/10 p-4 text-tire-muted">Sample data only — this inventory can later be connected to a database.</p>
        </div>
        <div className="tire-card mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Filter label="New or Used" value={filters.condition} options={['Any', 'New', 'Used']} onChange={(value) => updateFilter('condition', value)} />
          <Filter label="Tire Width" value={filters.width} options={['Any', '205', '215', '225', '235', '245']} onChange={(value) => updateFilter('width', value)} />
          <Filter label="Aspect Ratio" value={filters.ratio} options={['Any', '45', '50', '55', '60', '65']} onChange={(value) => updateFilter('ratio', value)} />
          <Filter label="Rim Size" value={filters.rim} options={['Any', '16', '17', '18', '20']} onChange={(value) => updateFilter('rim', value)} />
          <Filter label="Brand" value={filters.brand} options={['Any', 'Goodyear', 'Michelin', 'Firestone', 'Cooper', 'Continental']} onChange={(value) => updateFilter('brand', value)} />
          <Filter label="Price Range" value={filters.price} options={['Any', 'Under $75', '$75–$125', '$125+']} onChange={(value) => updateFilter('price', value)} />
        </div>
        <div className="grid gap-4">
          {filteredTires.map((tire) => (
            <article key={`${tire.brand}-${tire.model}-${tire.size}`} className="tire-card grid gap-5 md:grid-cols-[92px_1fr_auto] md:items-center">
              <div className="h-24 border border-white/10 bg-[radial-gradient(circle,transparent_32%,#111_33%,#111_50%,transparent_51%),repeating-linear-gradient(90deg,#2b2b2b_0_6px,#111_6px_12px)]" aria-hidden="true" />
              <div>
                <h3 className="font-display text-3xl font-black uppercase">{tire.brand} {tire.model}</h3>
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
      </div>
    </section>
  );
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[.16em] text-tire-muted">{label}</span>
      <select className="tire-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TiresPreview({ setPage }: { setPage: (page: PageKey) => void }) {
  return (
    <section className="border-y border-white/10 bg-zinc-950 py-16">
      <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
        <div>
          <p className="tire-eyebrow">Inventory preview</p>
          <h2 className="font-display text-6xl font-black uppercase leading-none tracking-[-.05em]">Sample tires ready to browse.</h2>
          <button className="tire-btn tire-btn-red mt-6" onClick={() => setPage('tires')}>Open Tires Page</button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {tires.slice(0, 3).map((tire) => (
            <article className="tire-card" key={tire.model}>
              <p className="tire-eyebrow">{tire.condition}</p>
              <h3 className="font-display text-3xl font-black uppercase">{tire.brand}</h3>
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
    <section className="bg-[#f3eee4] py-16 text-zinc-950 lg:py-24">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <p className="tire-eyebrow">Why choose us</p>
        <h2 className="mb-8 font-display text-[clamp(3rem,7vw,6rem)] font-black uppercase leading-none tracking-[-.05em]">Local. Straightforward. Tire-focused.</h2>
        <div className="grid gap-5 md:grid-cols-4">
          {['Clear pricing', 'Fast service', 'Used tire options', 'Akron owned'].map((item) => (
            <div className="border border-black/15 bg-white p-6 shadow-xl" key={item}>
              <h3 className="font-display text-3xl font-black uppercase">{item}</h3>
              <p className="mt-3 leading-7 text-zinc-600">A practical shop experience built around getting customers back on the road.</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewsAndHours() {
  return (
    <section className="py-16">
      <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-5 lg:grid-cols-2">
        <div className="tire-card">
          <p className="mb-3 tracking-[.15em] text-yellow-400">★★★★★</p>
          <h3 className="font-display text-4xl font-black uppercase">Customer Review</h3>
          <p className="mt-4 text-lg leading-8 text-tire-muted">“Quick, honest, and got me rolling again without trying to sell me things I didn’t need.”</p>
          <strong className="mt-5 block">— Sample customer</strong>
        </div>
        <div className="tire-card">
          <h3 className="font-display text-4xl font-black uppercase">Location & Hours</h3>
          <p className="mt-4 leading-8 text-tire-muted"><strong>Phone:</strong> {BUSINESS.phoneDisplay}<br /><strong>Address:</strong> {BUSINESS.address}<br /><strong>Hours:</strong> {BUSINESS.hours}<br /><strong>Sunday:</strong> {BUSINESS.sunday}</p>
        </div>
      </div>
    </section>
  );
}

function AboutPage() {
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-8 lg:grid-cols-[1fr_.75fr] lg:items-center">
        <div>
          <p className="tire-eyebrow">About</p>
          <h1 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-none tracking-[-.06em]">A straightforward Akron tire shop.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-tire-muted">Akron Tire Shop is built for drivers who need honest tire options, clear service, and a quick path back onto the road. The shop keeps the service list focused so every visit stays simple.</p>
        </div>
        <div className="tire-card">
          <h2 className="font-display text-4xl font-black uppercase">What we handle</h2>
          <p className="mt-4 leading-8 text-tire-muted">New tires, used tires, tire mounting, tire balancing, and tire repairs. That’s it — focused work, cleaner communication, better experience.</p>
        </div>
      </div>
    </section>
  );
}

function ContactPage({ onSubmit, formMessage, compact = false }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; formMessage: string; compact?: boolean }) {
  return (
    <section className="py-16 lg:py-24" id="contact">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        {!compact && (
          <div className="mb-8">
            <p className="tire-eyebrow">Contact</p>
            <h1 className="font-display text-[clamp(3.5rem,8vw,7rem)] font-black uppercase leading-none tracking-[-.06em]">Call or stop by.</h1>
          </div>
        )}
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="tire-card">
            <h2 className="font-display text-4xl font-black uppercase">Akron Tire Shop</h2>
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
            <h2 className="font-display text-4xl font-black uppercase">Contact Form</h2>
            <label className="grid gap-2"><span className="tire-label">Name</span><input className="tire-input" name="name" autoComplete="name" required /></label>
            <label className="grid gap-2"><span className="tire-label">Phone</span><input className="tire-input" name="phone" autoComplete="tel" required /></label>
            <label className="grid gap-2"><span className="tire-label">What do you need?</span><textarea className="tire-input min-h-32" name="message" required /></label>
            <p className="min-h-6 text-sm text-red-200" aria-live="polite">{formMessage}</p>
            <button className="tire-btn tire-btn-red" type="submit">Send Request</button>
          </form>
        </div>
      </div>
    </section>
  );
}

function TreadTexture() {
  return <div className="pointer-events-none absolute inset-0 opacity-[.07] [background-image:linear-gradient(135deg,transparent_46%,rgba(255,255,255,.45)_48%,transparent_50%),linear-gradient(45deg,transparent_46%,rgba(255,255,255,.3)_48%,transparent_50%)] [background-size:42px_42px]" />;
}
