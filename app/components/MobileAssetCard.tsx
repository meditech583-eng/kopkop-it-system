type MobileAssetCardProps = {
  asset: any;
  loading: boolean;
  savingAudit: boolean;
  savingMaintenance: boolean;
  openDeviceProfile: (assetId: number) => void;
  openAuditForAsset: (asset: any) => void;
  createMaintenance: (asset: any) => void;
};

function healthBadgeClass(score: number) {
  if (score >= 85) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (score >= 65) return "bg-amber-100 text-amber-700 border-amber-200";
  if (score >= 40) return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-red-100 text-red-700 border-red-200";
}

function healthLabel(score: number) {
  if (score >= 85) return "Healthy";
  if (score >= 65) return "Watch";
  if (score >= 40) return "Needs Upgrade";
  return "Critical";
}

export default function MobileAssetCard({
  asset,
  loading,
  savingAudit,
  savingMaintenance,
  openDeviceProfile,
  openAuditForAsset,
  createMaintenance,
}: MobileAssetCardProps) {
  const score = Number(asset.displayScore || 0);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
            {asset.asset_tag}
          </p>
          <h3 className="mt-1 truncate text-lg font-bold text-slate-900">
            {asset.item_name}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {asset.brand || "-"} {asset.model || ""}
          </p>
        </div>

        <div className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${healthBadgeClass(score)}`}>
          {score}%
        </div>
      </div>

      <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
        <p>📍 {asset.location || "No location"}</p>
        <p>👤 {asset.assigned_to || "Unassigned"}</p>
        <p>💻 {asset.os || "-"} / {asset.ram || "-"}</p>
        <p>🔧 {asset.status || "-"}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${healthBadgeClass(score)}`}>
          {healthLabel(score)}
        </span>

        {asset.alerts?.length ? (
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
            {asset.alerts.length} alert{asset.alerts.length === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            No alerts
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => openDeviceProfile(asset.id)}
          className="rounded-2xl bg-slate-900 px-3 py-3 text-xs font-bold text-white"
        >
          Profile
        </button>

        <button
          type="button"
          onClick={() => openAuditForAsset(asset)}
          disabled={savingAudit || loading}
          className="rounded-2xl bg-emerald-600 px-3 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Audit
        </button>

        <button
          type="button"
          onClick={() => createMaintenance(asset)}
          disabled={savingMaintenance || loading}
          className="rounded-2xl bg-red-600 px-3 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Repair
        </button>
      </div>
    </div>
  );
}
