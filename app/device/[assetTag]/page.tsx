"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type PublicAssetRecord = {
  asset_tag: string;
  item_name: string;
  category: string | null;
  brand: string | null;
  model: string | null;
  status: string | null;
  location: string | null;
};

function InfoCard({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="relative z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-900">
        {value || "Not recorded"}
      </p>
    </div>
  );
}

function getPublicAvailability(status?: string | null) {
  const value = (status || "").toLowerCase();

  if (value === "under repair") {
    return {
      label: "Under Maintenance",
      message: "This asset is currently being attended to by authorised KOPKOP College ICT personnel.",
      dotClass: "bg-amber-500",
      panelClass: "border-amber-200 bg-amber-50",
      textClass: "text-amber-800",
    };
  }

  if (value === "damaged") {
    return {
      label: "Out of Service",
      message: "This asset is not currently available for normal use and is under ICT review.",
      dotClass: "bg-red-500",
      panelClass: "border-red-200 bg-red-50",
      textClass: "text-red-800",
    };
  }

  if (value === "lost") {
    return {
      label: "Reported Missing",
      message: "This asset has been reported missing. Please contact the KOPKOP College ICT Department.",
      dotClass: "bg-red-600",
      panelClass: "border-red-200 bg-red-50",
      textClass: "text-red-800",
    };
  }

  if (value === "retired") {
    return {
      label: "Retired",
      message: "This asset has been retired from active ICT service.",
      dotClass: "bg-slate-500",
      panelClass: "border-slate-200 bg-slate-50",
      textClass: "text-slate-700",
    };
  }

  if (value === "in store") {
    return {
      label: "In ICT Storage",
      message: "This asset is registered and currently held in authorised ICT storage.",
      dotClass: "bg-blue-500",
      panelClass: "border-blue-200 bg-blue-50",
      textClass: "text-blue-800",
    };
  }

  return {
    label: "Operational",
    message: "This asset is registered for active use and managed by the KOPKOP College ICT Department.",
    dotClass: "bg-emerald-500",
    panelClass: "border-emerald-200 bg-emerald-50",
    textClass: "text-emerald-800",
  };
}

export default function PublicDevicePassportPage() {
  const params = useParams<{ assetTag: string }>();
  const assetTag = useMemo(
    () => decodeURIComponent(params?.assetTag || "").trim(),
    [params]
  );

  const [asset, setAsset] = useState<PublicAssetRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPublicRecord() {
      if (!assetTag) {
        setError("No asset tag was provided.");
        setLoading(false);
        return;
      }

      const { data, error: rpcError } = await supabase.rpc(
        "get_public_asset_passport",
        { requested_asset_tag: assetTag }
      );

      if (!active) return;

      if (rpcError) {
        console.error(rpcError);
        setError(
          "This public asset record is currently unavailable. Please contact the KOPKOP College ICT Department."
        );
        setLoading(false);
        return;
      }

      const record = Array.isArray(data) ? data[0] : data;

      if (!record) {
        setError(`No KOPKOP College ICT asset was found for ${assetTag}.`);
        setLoading(false);
        return;
      }

      setAsset(record as PublicAssetRecord);
      setLoading(false);
    }

    void loadPublicRecord();

    return () => {
      active = false;
    };
  }, [assetTag]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
        <div className="rounded-3xl bg-white px-8 py-7 text-center shadow-sm">
          <img
            src="/kopkop-logo.jpg"
            alt="KOPKOP College logo"
            className="mx-auto h-20 w-20 rounded-full object-cover"
          />
          <p className="mt-4 text-sm font-semibold text-slate-700">
            Verifying KOPKOP College ICT asset…
          </p>
        </div>
      </main>
    );
  }

  if (!asset || error) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
        <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <img
            src="/kopkop-logo.jpg"
            alt="KOPKOP College logo"
            className="mx-auto h-24 w-24 rounded-full object-cover shadow-sm"
          />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
            KOPKOP College ICT
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Asset record unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
          <a
            href="/"
            className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Authorised ICT staff login
          </a>
        </section>
      </main>
    );
  }

  const verifiedDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const availability = getPublicAvailability(asset.status);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <img
        src="/kopkop-logo.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-1/2 z-0 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover opacity-[0.025]"
      />

      <div className="relative z-10 mx-auto max-w-3xl space-y-5">
        <header className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-lg">
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src="/kopkop-logo.jpg"
                  alt="KOPKOP College logo"
                  className="h-16 w-16 rounded-full border border-white/20 object-cover shadow-md sm:h-20 sm:w-20"
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
                    KOPKOP College ICT
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    Official Public Asset Verification Record
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-emerald-200">
                <span aria-hidden="true">✓</span>
                Verified ICT Asset
              </span>
            </div>

            <div className="mt-7 border-t border-white/10 pt-6">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {asset.item_name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                <span>Asset Tag: {asset.asset_tag}</span>
                <span>Verification ID: {asset.asset_tag}</span>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <InfoCard label="Asset Tag" value={asset.asset_tag} />
          <InfoCard label="Device Type" value={asset.category} />
          <InfoCard
            label="Brand / Model"
            value={[asset.brand, asset.model].filter(Boolean).join(" ") || null}
          />
          <InfoCard label="Device Availability" value={availability.label} />
          <InfoCard label="Department / Location" value={asset.location} />
          <InfoCard label="Verified On" value={verifiedDate} />
          <InfoCard label="Managed By" value="KOPKOP College ICT Department" />
          <InfoCard label="Record Type" value="Public read-only verification" />
        </section>

        <section className={`rounded-3xl border p-5 shadow-sm ${availability.panelClass}`}>
          <div className="flex items-start gap-4">
            <span
              className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full ${availability.dotClass}`}
              aria-hidden="true"
            />
            <div>
              <p className={`text-xs font-bold uppercase tracking-[0.18em] ${availability.textClass}`}>
                Device Availability
              </p>
              <h2 className="mt-2 text-lg font-bold text-slate-950">
                {availability.label}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {availability.message}
              </p>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="absolute right-5 top-5 grid h-16 w-16 place-items-center rounded-full border-4 border-emerald-200 bg-emerald-50 text-2xl font-black text-emerald-700">
            ✓
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Digital Verification Seal
          </p>
          <h2 className="mt-2 pr-20 text-lg font-bold text-slate-950">
            Verified KOPKOP College ICT Asset
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            This equipment is registered and managed institutionally by the KOPKOP College ICT Department. Verification is generated automatically from the official ICT Asset Management System and remains available to authorised ICT personnel now and in the future.
          </p>
        </section>

        <section className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">
            Public Verification Notice
          </p>
          <h2 className="mt-2 text-sm font-bold text-cyan-950">
            Public access is intentionally limited
          </h2>
          <p className="mt-2 text-sm leading-6 text-cyan-900">
            This page confirms the identity and current status of a KOPKOP College ICT asset.
            Serial numbers, assigned users, technical specifications, network details, maintenance
            records, audit history, supplier information and administrative controls are protected
            and available only to authorised ICT staff.
          </p>
        </section>

        <div className="text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            <span aria-hidden="true">🔒</span>
            ICT Staff Login
          </a>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Authorised ICT personnel only — current and future staff
          </p>
        </div>

        <footer className="rounded-3xl bg-white p-6 text-center text-xs leading-5 text-slate-500 shadow-sm">
          <img
            src="/kopkop-logo.jpg"
            alt="KOPKOP College logo"
            className="mx-auto h-14 w-14 rounded-full object-cover"
          />
          <p className="mt-3 font-bold uppercase tracking-[0.16em] text-slate-700">
            KOPKOP College ICT Department
          </p>
          <p className="mt-1">Official Institutional Asset Verification Service</p>
          <p>Maintained for current and future KOPKOP College ICT personnel</p>
          <p className="mt-2">© {new Date().getFullYear()} KOPKOP College</p>
        </footer>
      </div>
    </main>
  );
}
