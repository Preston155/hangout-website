export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="loader" />
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass h-80 animate-pulse rounded-[2rem]" />
        ))}
      </div>
    </main>
  );
}