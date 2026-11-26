export default function LoadingAdmin() {
  return (
    <div className="flex flex-col gap-6 py-8 animate-pulse" aria-busy="true" aria-label="Memuat panel admin">
      <div className="h-12 w-full rounded-full bg-permukaan" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-28 rounded-[20px] border border-garis bg-permukaan" />
        ))}
      </div>
      <div className="h-64 w-full rounded-[20px] border border-garis bg-permukaan" />
    </div>
  );
}
