"use client";

import { useState } from "react";

export default function SwitchToggle({
  name,
  label,
  description,
  defaultChecked = false,
  tone = "utama",
}) {
  const [checked, setChecked] = useState(Boolean(defaultChecked));

  const activeTrackClass = tone === "sukses" ? "bg-sukses" : "bg-utama";

  return (
    <div
      onClick={() => setChecked((prev) => !prev)}
      className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3.5 transition-colors select-none hover:bg-permukaan/60"
    >
      <input type="hidden" name={name} value={checked ? "on" : "false"} />

      <div className="min-w-0">
        <p className="text-sm font-semibold text-teks">{label}</p>
        {description ? <p className="mt-0.5 text-xs text-teks-lembut">{description}</p> : null}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          setChecked((prev) => !prev);
        }}
        className={`relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-utama ${
          checked ? activeTrackClass : "bg-garis-tegas/70"
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-[27px] w-[27px] rounded-full bg-white shadow-xs transition-transform duration-200 ${
            checked ? "translate-x-[22px]" : "translate-x-[2px]"
          }`}
        />
      </button>
    </div>
  );
}
