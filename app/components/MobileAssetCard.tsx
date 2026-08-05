"use client";

type MobileAssetCardProps = {
  asset: any;
  loading: boolean;
  savingAudit: boolean;
  savingMaintenance: boolean;
  openDeviceProfile: (assetId: number) => void;
  openEditAsset: (asset: any) => void;
  openAuditForAsset: (asset: any) => void;
  createMaintenance: (asset: any) => void;
};

function healthBadgeClass(score: number) {
  if (score >= 85) return "border-emerald-200 bg-emerald-100 text-emerald-700";
  if (score >= 65) return "border-amber-200 bg-amber-100 text-amber-700";
  if (score >= 40) return "border-orange-200 bg-orange-100 text-orange-700";
  return "border-red-200 bg-red-100 text-red-700";
}

function healthLabel(score: number) {
  if (score >= 85) return "Healthy";
  if (score >= 65) return "Watch";
  if (score >= 40) return "Needs Upgrade";
  return "Critical";
}

function operationalBadgeClass(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "operational":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "limited service":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "unavailable":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "out of service":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function MobileAssetCard({
  asset,
  loading,
  savingAudit,
  savingMaintenance,
  openDeviceProfile,
  openEditAsset,
  openAuditForAsset,
  createMaintenance,
}: MobileAssetCardProps) {
  const parsedScore = Number(asset.displayScore);
  const score = Number.isFinite(parsedScore) ? parsedScore : 100;
  const alerts = Array.isArray(asset.alerts) ? asset.alerts : [];
  const operationalStatus = asset.operationalStatus || "Operational";

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="break-all text-[11px] font-black uppercase tracking-[0.16em] text-cyan-700">
              {asset.asset_tag}
            </p>

            <h3 className="mt-1 break-words text-lg font-black leading-tight text-slate-950">
              {asset.item_name}
            </h3>

            <p className="mt-1 break-words text-sm leading-5 text-slate-500">
              {[asset.brand, asset.model].filter(Boolean).join(" ") || "Brand / model not recorded"}
            </p>
          </div>

          <div className={`shrink-0 rounded-2xl border px-3 py-2 text-center ${healthBadgeClass(score)}`}>
            <p className="text-lg font-black leading-none">{score}%</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide">
              {healthLabel(score)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-slate-200">
        <div className="bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Location</p>
          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
            {asset.location || "No location"}
          </p>
        </div>

        <div className="bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Assigned to</p>
          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
            {asset.assigned_to || "Unassigned"}
          </p>
        </div>

        <div className="bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">System</p>
          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
            {asset.os || "Not recorded"}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{asset.ram || "RAM not recorded"}</p>
        </div>

        <div className="bg-slate-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Asset status</p>
          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
            {asset.status || "Not recorded"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3">
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${operationalBadgeClass(operationalStatus)}`}>
          {operationalStatus}
        </span>

        {alerts.length > 0 ? (
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
            {alerts.length} alert{alerts.length === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            No alerts
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 p-4 pt-1">
        <button
          type="button"
          onClick={() => openDeviceProfile(asset.id)}
          className="col-span-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-black text-white shadow-sm transition active:scale-[0.99]"
        >
          View Device Profile
        </button>

        <button
          type="button"
          onClick={() => openEditAsset(asset)}
          disabled={loading}
          className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-3 text-xs font-black text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => openAuditForAsset(asset)}
          disabled={savingAudit || loading}
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs font-black text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Audit
        </button>

        <button
          type="button"
          onClick={() => createMaintenance(asset)}
          disabled={savingMaintenance || loading}
          className="col-span-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-black text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Create Repair Ticket
        </button>
      </div>
    </article>
  );
}
