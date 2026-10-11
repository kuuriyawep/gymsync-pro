import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { PHONE_COUNTRIES } from "@/lib/phoneCountries";

const DEFAULT_COUNTRY = "SO";

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function findCountryForPhone(value) {
  const raw = String(value || "").trim();
  if (!raw.startsWith("+")) return null;
  const digits = digitsOnly(raw);
  return [...PHONE_COUNTRIES]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((country) => digits.startsWith(digitsOnly(country.dialCode))) || null;
}

async function detectCountryFromDevice() {
  const reverseGeocode = async (position) => {
    const params = new URLSearchParams({ localityLanguage: "en" });
    if (position) {
      params.set("latitude", String(position.coords.latitude));
      params.set("longitude", String(position.coords.longitude));
    }
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`
    );
    if (!response.ok) throw new Error("Location lookup failed");
    return response.json();
  };

  try {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 15 * 60 * 1000,
        });
      });
      const data = await reverseGeocode(position);
      if (data?.countryCode) return data.countryCode.toUpperCase();
    }
  } catch {
    // If location permission is denied/unavailable, use the same service's IP fallback.
  }

  try {
    const data = await reverseGeocode();
    return data?.countryCode ? data.countryCode.toUpperCase() : null;
  } catch {
    return null;
  }
}

export default function PhoneNumberField({ value, onChange, error }) {
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [detecting, setDetecting] = useState(false);
  const manualCountry = useRef(false);
  const initializedValue = useRef(false);

  const selectedCountry = useMemo(
    () => PHONE_COUNTRIES.find((country) => country.code === countryCode) || PHONE_COUNTRIES.find((country) => country.code === DEFAULT_COUNTRY),
    [countryCode]
  );

  const countryPhoneDigits = selectedCountry ? digitsOnly(selectedCountry.dialCode) : "252";
  const nationalNumber = useMemo(() => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (raw.startsWith("+")) {
      const country = findCountryForPhone(raw);
      if (country) return digitsOnly(raw).slice(digitsOnly(country.dialCode).length);
      return digitsOnly(raw);
    }
    return digitsOnly(raw);
  }, [value]);

  useEffect(() => {
    if (initializedValue.current) return;
    initializedValue.current = true;

    const existingCountry = findCountryForPhone(value);
    if (existingCountry) {
      manualCountry.current = true;
      setCountryCode(existingCountry.code);
      return;
    }

    let cancelled = false;
    setDetecting(true);
    detectCountryFromDevice()
      .then((detectedCode) => {
        if (cancelled || manualCountry.current) return;
        const country = PHONE_COUNTRIES.find((item) => item.code === detectedCode);
        if (country) {
          setCountryCode(country.code);
          if (!value) onChange(country.dialCode);
        }
      })
      .finally(() => {
        if (!cancelled) setDetecting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [onChange, value]);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter((country) =>
      country.name.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query) ||
      country.dialCode.includes(query.replace(/\s/g, ""))
    );
  }, [search]);

  const chooseCountry = (country) => {
    manualCountry.current = true;
    setCountryCode(country.code);
    setOpen(false);
    setSearch("");
    const currentDigits = digitsOnly(value);
    const currentCountry = findCountryForPhone(value);
    const currentNational = currentCountry
      ? currentDigits.slice(digitsOnly(currentCountry.dialCode).length)
      : currentDigits;
    onChange(`${country.dialCode}${currentNational}`);
  };

  const handleNationalChange = (event) => {
    const next = digitsOnly(event.target.value);
    onChange(`${selectedCountry.dialCode}${next}`);
  };

  return (
    <div className="relative">
      <div className={`rounded-lg border bg-white overflow-visible transition-colors ${error ? "border-black bg-black/5" : "border-black/15 focus-within:border-black focus-within:ring-1 focus-within:ring-black"}`}>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="w-full min-h-[46px] px-3 py-2.5 border-b border-black/10 flex items-center gap-2 text-left hover:bg-black/[0.03]"
          aria-label="Select country calling code"
          aria-expanded={open}
        >
          <span className="truncate flex-1 text-sm font-medium">{selectedCountry?.name || "Country"}</span>
          <span className="text-sm text-black/50 tabular-nums">{selectedCountry?.dialCode}</span>
          {detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black/40" /> : <ChevronDown className="w-3.5 h-3.5 text-black/40" />}
        </button>

        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={nationalNumber}
          onChange={handleNationalChange}
          placeholder="Mobile"
          className="w-full min-h-[46px] px-3 py-2.5 bg-transparent text-sm outline-none"
          aria-label="Mobile phone number"
        />
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-40 mt-2 bg-white border border-black/10 rounded-xl shadow-xl overflow-hidden">
            <div className="p-2 border-b border-black/10 flex items-center gap-2">
              <Search className="w-4 h-4 text-black/40 shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search country"
                className="flex-1 bg-transparent outline-none text-sm"
                aria-label="Search country"
              />
              <button type="button" onClick={() => setSearch("")} className="p-1 rounded-md hover:bg-black/5" aria-label="Clear country search">
                <X className="w-4 h-4 text-black/40" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto overscroll-contain">
              {filteredCountries.length === 0 ? (
                <p className="px-4 py-6 text-sm text-black/50 text-center">No country found.</p>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={`${country.code}-${country.dialCode}`}
                    type="button"
                    onClick={() => chooseCountry(country)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-black/[0.04] text-sm"
                  >
                    <span className="flex-1 truncate">{country.name}</span>
                    <span className="text-black/50 tabular-nums">{country.dialCode}</span>
                    {country.code === countryCode && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
