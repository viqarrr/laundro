export default function LoadingBeranda() {
  return (
    <div className="flex flex-col gap-10 py-12 animate-pulse" aria-busy="true" aria-label="Memuat halaman">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col gap-4">
          <div className="h-4 w-44 rounded-full bg-permukaan" />
          <div className="h-12 w-3/4 rounded-[14px] bg-permukaan" />
          <div className="h-6 w-full max-w-md rounded-[10px] bg-permukaan" />
          <div className="mt-2 flex gap-3">
            <div className="h-11 w-36 rounded-full bg-permukaan" />
            <div className="h-11 w-40 rounded-full bg-permukaan" />
          </div>
        </div>
        <div className="h-72 w-full rounded-[20px] bg-permukaan" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-44 rounded-[20px] border border-garis bg-permukaan" />
        ))}
      </div>
    </div>
  );
}
