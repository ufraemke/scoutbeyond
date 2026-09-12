export default function Home() {
  return (
    <div className="min-h-full">
      <header className="mx-auto flex h-14 max-w-[1440px] items-center border-b border-border px-8">
        <p className="text-[15px] font-medium tracking-tight text-text-primary">
          Technology Scanner
        </p>
      </header>

      <main className="mx-auto flex max-w-[1200px] flex-col px-8 py-24">
        <p className="mb-4 text-[14px] font-medium text-accent">Hello World</p>
        <h1 className="max-w-2xl text-[48px] font-medium leading-[1.1] tracking-tight text-text-primary">
          Find technologies beyond your industry.
        </h1>
        <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-text-secondary">
          Initial project scaffold is live. Team development can start from this
          Next.js baseline on Vercel.
        </p>
      </main>
    </div>
  );
}
