export default function Input({ label, name, type = "text", textarea = false, className = "", ...props }) {
  const kelas =
    "min-h-[44px] w-full rounded-[8px] border border-garis-tegas bg-latar px-3.5 py-2.5 text-[15px] text-teks placeholder:text-teks-lembut transition-colors focus:border-utama focus:outline-none";

  return (
    <label className={`flex flex-col gap-1.5 text-[13px] font-semibold tracking-[-0.01em] text-teks ${className}`}>
      <span>{label}</span>
      {textarea ? (
        <textarea name={name} rows={4} className={kelas} {...props} />
      ) : (
        <input name={name} type={type} className={kelas} {...props} />
      )}
    </label>
  );
}
