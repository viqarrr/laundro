"use client";

import { useEffect, useId, useRef, useState } from "react";

export default function CustomSelect({
  name,
  options = [],
  value,
  defaultValue,
  onChange,
  placeholder = "Pilih opsi",
  ariaLabel,
  className = "",
}) {
  const isControlled = value !== undefined;
  const normalizedOptions = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const [internalValue, setInternalValue] = useState(
    defaultValue ?? normalizedOptions[0]?.value ?? ""
  );
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const listboxId = useId();

  const selectedValue = isControlled ? value : internalValue;
  const selectedOption = normalizedOptions.find((opt) => opt.value === selectedValue);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleSelect(nextValue) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    setOpen(false);
    if (onChange) {
      onChange(nextValue);
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {name ? <input type="hidden" name={name} value={selectedValue ?? ""} /> : null}

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-3 rounded-[12px] border bg-latar px-3.5 py-2 text-left text-sm font-medium transition-colors ${
          open
            ? "border-utama ring-2 ring-utama/15"
            : "border-garis-tegas hover:border-utama/70"
        }`}
      >
        <span className={selectedOption ? "truncate text-teks" : "truncate text-teks-lembut"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className={`shrink-0 text-teks-lembut transition-transform duration-150 ${
            open ? "rotate-180 text-utama" : ""
          }`}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute right-0 left-0 z-40 mt-1.5 max-h-64 overflow-y-auto rounded-[16px] border border-garis bg-latar p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === selectedValue;
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`flex min-h-[40px] w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-utama-lembut font-semibold text-utama"
                      : "text-teks hover:bg-permukaan"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                      className="shrink-0 text-utama"
                    >
                      <path
                        d="M3.5 8.5L6.5 11.5L12.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
