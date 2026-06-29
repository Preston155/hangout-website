import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="glass max-w-lg rounded-[2rem] p-8 text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-4xl font-black">Profile slipped into the void.</h1>
        <p className="mt-3 text-white/60">That page does not exist or has been made private.</p>
        <Link href="/explore" className="btn mt-6 inline-block">Explore profiles</Link>
      </div>
    </main>
  );
}