export default function LoadingDetailProduk() {
  return (
    <div className="py-10 sm:py-12 animate-pulse" aria-busy="true" aria-label="Memuat detail layanan">
      <div className="h-5 w-36 rounded-full bg-permukaan" />
      <div className="mt-6 grid gap-8 md:grid-cols-[0.95fr_1.05fr] md:gap-12">
        <div className="aspect-square max-h-[380px] w-full rounded-[20px] bg-permukaan" />
        <div className="flex flex-col gap-4">
          <div className="h-6 w-28 rounded-full bg-permukaan" />
          <div className="h-10 w-3/4 rounded-[12px] bg-permukaan" />
          <div className="h-20 w-full rounded-[14px] bg-permukaan" />
          <div className="h-44 w-full rounded-[20px] bg-permukaan" />
          <div className="flex gap-3">
            <div className="h-11 w-44 rounded-full bg-permukaan" />
            <div className="h-11 w-44 rounded-full bg-permukaan" />
          </div>
        </div>
      </div>
    </div>
  );
}
