
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats?: string[] }): {
        detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
      };
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

type AssetStatus =
  | "In Use"
  | "In Store"
  | "Under Repair"
  | "Damaged"
  | "Lost"
  | "Retired";

type AssetCondition = "Good" | "Fair" | "Damaged";

type FinalStatus =
  | "Operational"
  | "Needs Minor Repair"
  | "Needs Major Repair"
  | "Out of Service";

type PriorityLevel = "Low" | "Medium" | "High" | "Critical";

type ITAsset = {
  id: number;
  asset_tag: string;
  item_name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  quantity: number;
  condition: AssetCondition | null;
  status: AssetStatus | null;
  assigned_to: string | null;
  location: string | null;
  supplier: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  notes: string | null;
  os: string | null;
  ram: string | null;
  system_type: string | null;
  connection_type: string | null;
  ms_office: string | null;
  monitor: string | null;
  keyboard: string | null;
  mouse: string | null;
  storage: string | null;
  online_status: string | null;
  windows_update: string | null;
  desktop_loading_speed: string | null;
  booting_speed: string | null;
  performance: string | null;
  created_at: string;
};

type DeviceStatusCheck = {
  id: number;
  asset_id: number | null;
  asset_tag: string | null;
  item_name: string | null;
  category: string | null;
  location: string | null;
  assigned_to: string | null;
  inspected_by: string;
  inspection_date: string;
  division: string | null;
  department: string | null;
  office_area: string | null;
  assigned_role: string | null;
  issue_detected: boolean | null;
  priority_level: PriorityLevel | null;
  final_status: FinalStatus;
  health_score: number | null;
  remarks: string | null;
  created_at: string;
};

type AssetFormState = {
  assetTag: string;
  itemName: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  quantity: string;
  condition: AssetCondition;
  status: AssetStatus;
  assignedTo: string;
  location: string;
  supplier: string;
  purchaseDate: string;
  warrantyExpiry: string;
  notes: string;
  os: string;
  ram: string;
  systemType: string;
  connectionType: string;
  msOffice: string;
  monitor: string;
  keyboard: string;
  mouse: string;
  storage: string;
  onlineStatus: string;
  windowsUpdate: string;
  desktopLoadingSpeed: string;
  bootingSpeed: string;
  performance: string;
};

type AuditFormState = {
  assetId: string;
  inspectedBy: string;
  inspectionDate: string;
  division: string;
  department: string;
  officeArea: string;
  assignedRole: string;
  priorityLevel: PriorityLevel;
  finalStatus: FinalStatus;
  healthScore: string;
  issueDetected: boolean;
  remarks: string;
};

type EnrichedAsset = ITAsset & {
  lastAudit: DeviceStatusCheck | null;
  displayScore: number;
  recommendation: string;
  alerts: string[];
  healthLabel: "Healthy" | "Watch" | "Needs Upgrade" | "Critical";
};

const EMPTY_ASSET_FORM: AssetFormState = {
  assetTag: "",
  itemName: "",
  category: "Desktop",
  brand: "",
  model: "",
  serialNumber: "",
  quantity: "1",
  condition: "Good",
  status: "In Store",
  assignedTo: "",
  location: "",
  supplier: "",
  purchaseDate: "",
  warrantyExpiry: "",
  notes: "",
  os: "",
  ram: "",
  systemType: "",
  connectionType: "",
  msOffice: "",
  monitor: "",
  keyboard: "",
  mouse: "",
  storage: "",
  onlineStatus: "",
  windowsUpdate: "",
  desktopLoadingSpeed: "",
  bootingSpeed: "",
  performance: "",
};

const EMPTY_AUDIT_FORM: AuditFormState = {
  assetId: "",
  inspectedBy: "",
  inspectionDate: new Date().toISOString().slice(0, 10),
  division: "",
  department: "",
  officeArea: "",
  assignedRole: "",
  priorityLevel: "Low",
  finalStatus: "Operational",
  healthScore: "100",
  issueDetected: false,
  remarks: "",
};

const DIVISIONS = [
  "KOPKOP College Admin Team",
  "Primary School",
  "Secondary School",
  "SOLI (School of Learning & Innovation)",
] as const;

const DEPARTMENTS_BY_DIVISION: Record<string, string[]> = {
  "KOPKOP College Admin Team": ["Admin Office", "IT Department", "Finance Department", "HR Department"],
  "Primary School": ["Senior School", "Middle School", "Junior School", "ECCE", "Primary Staff Room", "Primary IT Lab"],
  "Secondary School": ["Academic", "LSS School", "Secondary Staff Room", "Secondary IT Lab"],
  "SOLI (School of Learning & Innovation)": ["Grade 11", "Grade 12"],
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function safeNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function statusPillClass(status?: string | null) {
  switch ((status || "").toLowerCase()) {
    case "in use":
    case "operational":
    case "updated":
    case "online":
    case "good":
    case "healthy":
      return "bg-emerald-100 text-emerald-700";
    case "in store":
      return "bg-slate-100 text-slate-700";
    case "under repair":
    case "needs minor repair":
    case "slow":
    case "watch":
      return "bg-amber-100 text-amber-700";
    case "needs major repair":
    case "out of service":
    case "damaged":
    case "not updated":
    case "offline":
    case "poor":
    case "critical":
      return "bg-red-100 text-red-700";
    case "fair":
    case "needs upgrade":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function scoreTone(score: number) {
  if (score >= 90) return "text-emerald-700 bg-emerald-50";
  if (score >= 70) return "text-amber-700 bg-amber-50";
  if (score >= 40) return "text-orange-700 bg-orange-50";
  return "text-red-700 bg-red-50";
}

function inferHealthScore(asset: ITAsset) {
  let score = 100;
  const performance = (asset.performance || "").toLowerCase();
  const boot = (asset.booting_speed || "").toLowerCase();
  const desktopLoad = (asset.desktop_loading_speed || "").toLowerCase();
  const update = (asset.windows_update || "").toLowerCase();
  const online = (asset.online_status || "").toLowerCase();
  const condition = (asset.condition || "").toLowerCase();

  if (performance.includes("poor") || performance.includes("bad")) score -= 35;
  else if (performance.includes("fair") || performance.includes("average")) score -= 15;

  if (boot.includes("slow")) score -= 20;
  if (desktopLoad.includes("slow")) score -= 15;
  if (update.includes("not") || update.includes("pending")) score -= 15;
  if (online.includes("offline")) score -= 10;
  if (condition === "damaged") score -= 30;
  if (condition === "fair") score -= 10;

  return Math.max(0, Math.min(100, score));
}

function getHealthLabel(score: number): EnrichedAsset["healthLabel"] {
  if (score >= 85) return "Healthy";
  if (score >= 65) return "Watch";
  if (score >= 40) return "Needs Upgrade";
  return "Critical";
}

function getHealthAlerts(asset: ITAsset) {
  const alerts: string[] = [];
  const ram = (asset.ram || "").toLowerCase();
  const storage = (asset.storage || "").toLowerCase();
  const performance = (asset.performance || "").toLowerCase();
  const boot = (asset.booting_speed || "").toLowerCase();
  const desktopLoad = (asset.desktop_loading_speed || "").toLowerCase();
  const update = (asset.windows_update || "").toLowerCase();
  const online = (asset.online_status || "").toLowerCase();
  const condition = (asset.condition || "").toLowerCase();

  if (ram.includes("2gb") || ram.includes("4gb")) alerts.push("Low RAM");
  if (storage.includes("hdd") && !storage.includes("ssd")) alerts.push("HDD upgrade");
  if (performance.includes("poor") || performance.includes("bad")) alerts.push("Poor performance");
  if (boot.includes("slow")) alerts.push("Slow boot");
  if (desktopLoad.includes("slow")) alerts.push("Slow desktop load");
  if (update.includes("not") || update.includes("pending")) alerts.push("Windows update needed");
  if (online.includes("offline")) alerts.push("Offline");
  if (condition === "damaged") alerts.push("Physical condition issue");

  return alerts;
}

function inferRecommendation(asset: ITAsset, score: number) {
  const ram = (asset.ram || "").toLowerCase();
  const storage = (asset.storage || "").toLowerCase();

  if (score < 40) return "Urgent IT attention required";
  if (score < 65) return "Plan upgrade or repair soon";
  if (ram.includes("2gb") || ram.includes("4gb")) return "RAM upgrade recommended";
  if (storage.includes("hdd") && !storage.includes("ssd")) return "SSD upgrade recommended";
  return "Device looks acceptable";
}

function computeAssetHealth(asset: ITAsset, audit?: DeviceStatusCheck | null) {
  const score = audit?.health_score ?? inferHealthScore(asset);
  const label = getHealthLabel(score);
  const alerts = getHealthAlerts(asset);
  return { score, label, alerts };
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function Badge({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className || "bg-slate-100 text-slate-700"}`}>
      {text}
    </span>
  );
}

function MiniBar({
  label,
  value,
  max,
  tone = "slate",
}: {
  label: string;
  value: number;
  max: number;
  tone?: "emerald" | "amber" | "orange" | "red" | "blue" | "slate";
}) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0;
  const toneMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    slate: "bg-slate-700",
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100">
        <div className={`h-2.5 rounded-full ${toneMap[tone]}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function DonutRing({
  value,
  total,
  label,
  tone = "emerald",
}: {
  value: number;
  total: number;
  label: string;
  tone?: "emerald" | "amber" | "orange" | "red" | "blue";
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  const toneMap: Record<string, string> = {
    emerald: "#10b981",
    amber: "#f59e0b",
    orange: "#f97316",
    red: "#ef4444",
    blue: "#3b82f6",
  };
  const background = `conic-gradient(${toneMap[tone]} 0 ${percent}%, #e2e8f0 ${percent}% 100%)`;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="grid h-20 w-20 place-items-center rounded-full" style={{ background }}>
          <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-sm font-bold text-slate-900">
            {percent}%
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">out of {total} devices</p>
        </div>
      </div>
    </div>
  );
}

function HealthIndicator({ score }: { score: number }) {
  const label = getHealthLabel(score);
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusPillClass(label)}`}>
      <span className="h-2.5 w-2.5 rounded-full bg-current opacity-70" />
      <span>{label}</span>
      <span className="opacity-80">{score}%</span>
    </div>
  );
}

export default function KopkopCollegeICTAssetAuditComplianceSystem() {
  const [assets, setAssets] = useState<ITAsset[]>([]);
  const [deviceChecks, setDeviceChecks] = useState<DeviceStatusCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingAsset, setSavingAsset] = useState(false);
  const [savingAudit, setSavingAudit] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<number | null>(null);
  const [assetForm, setAssetForm] = useState<AssetFormState>(EMPTY_ASSET_FORM);
  const [auditForm, setAuditForm] = useState<AuditFormState>(EMPTY_AUDIT_FORM);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [performanceFilter, setPerformanceFilter] = useState("All");
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "inventory" | "scan" | "audit" | "history">("dashboard");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [scannerSupported, setScannerSupported] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerStatus, setScannerStatus] = useState("Ready to scan asset tags or serial numbers.");
  const [manualScanCode, setManualScanCode] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  useEffect(() => {
    refreshAll(false);
  }, []);

  useEffect(() => {
    setScannerSupported(typeof window !== "undefined" && "BarcodeDetector" in window);
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAssets() {
    const { data, error } = await supabase.from("it_assets").select("*").order("asset_tag", { ascending: true });
    if (error) throw error;
    setAssets((data || []) as ITAsset[]);
  }

  async function loadDeviceChecks() {
    const { data, error } = await supabase
      .from("device_status_checks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    setDeviceChecks((data || []) as DeviceStatusCheck[]);
  }

  async function refreshAll(showBusy = true) {
    try {
      if (showBusy) setRefreshing(true);
      setLoading(true);
      await Promise.all([loadAssets(), loadDeviceChecks()]);
      setLastSyncedAt(new Date().toLocaleString());
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const latestAuditByAssetId = useMemo(() => {
    const map = new Map<number, DeviceStatusCheck>();
    for (const check of deviceChecks) {
      if (check.asset_id && !map.has(check.asset_id)) map.set(check.asset_id, check);
    }
    return map;
  }, [deviceChecks]);

  const enrichedAssets = useMemo<EnrichedAsset[]>(() => {
    return assets.map((asset) => {
      const lastAudit = latestAuditByAssetId.get(asset.id) || null;
      const displayScore = lastAudit?.health_score ?? inferHealthScore(asset);
      const alerts = getHealthAlerts(asset);
      return {
        ...asset,
        lastAudit,
        displayScore,
        alerts,
        healthLabel: getHealthLabel(displayScore),
        recommendation: inferRecommendation(asset, displayScore),
      };
    });
  }, [assets, latestAuditByAssetId]);

  const filteredAssets = useMemo(() => {
    const term = search.trim().toLowerCase();
    return enrichedAssets.filter((asset) => {
      const matchesSearch =
        !term ||
        asset.asset_tag.toLowerCase().includes(term) ||
        asset.item_name.toLowerCase().includes(term) ||
        (asset.brand || "").toLowerCase().includes(term) ||
        (asset.model || "").toLowerCase().includes(term) ||
        (asset.assigned_to || "").toLowerCase().includes(term) ||
        (asset.location || "").toLowerCase().includes(term) ||
        (asset.serial_number || "").toLowerCase().includes(term);

      const matchesStatus = statusFilter === "All" || (asset.status || "") === statusFilter;
      const matchesCategory = categoryFilter === "All" || (asset.category || "") === categoryFilter;
      const matchesPerformance =
        performanceFilter === "All" ||
        (asset.performance || "").toLowerCase() === performanceFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCategory && matchesPerformance;
    });
  }, [enrichedAssets, search, statusFilter, categoryFilter, performanceFilter]);

  const selectedAsset = useMemo(
    () => filteredAssets.find((asset) => asset.id === selectedAssetId) || filteredAssets[0] || null,
    [filteredAssets, selectedAssetId]
  );

  useEffect(() => {
    if (selectedAsset && selectedAssetId !== selectedAsset.id) setSelectedAssetId(selectedAsset.id);
  }, [selectedAsset, selectedAssetId]);

  const stats = useMemo(() => {
    const total = enrichedAssets.length;
    const inUse = enrichedAssets.filter((a) => a.status === "In Use").length;
    const slowDevices = enrichedAssets.filter((a) => (a.booting_speed || "").toLowerCase().includes("slow")).length;
    const outdated = enrichedAssets.filter((a) => {
      const update = (a.windows_update || "").toLowerCase();
      return update.includes("not") || update.includes("pending");
    }).length;
    const poorPerformance = enrichedAssets.filter((a) => (a.performance || "").toLowerCase().includes("poor")).length;
    const avgScore = total ? Math.round(enrichedAssets.reduce((sum, asset) => sum + asset.displayScore, 0) / total) : 0;
    const critical = enrichedAssets.filter((a) => a.displayScore < 40).length;
    const needsUpgrade = enrichedAssets.filter((a) => a.displayScore >= 40 && a.displayScore < 65).length;
    return { total, inUse, slowDevices, outdated, poorPerformance, avgScore, critical, needsUpgrade };
  }, [enrichedAssets]);

  const healthBreakdown = useMemo(() => {
    return {
      healthy: enrichedAssets.filter((asset) => asset.displayScore >= 85).length,
      watch: enrichedAssets.filter((asset) => asset.displayScore >= 65 && asset.displayScore < 85).length,
      upgrade: enrichedAssets.filter((asset) => asset.displayScore >= 40 && asset.displayScore < 65).length,
      critical: enrichedAssets.filter((asset) => asset.displayScore < 40).length,
    };
  }, [enrichedAssets]);

  const departmentGraphData = useMemo(() => {
    return Object.entries(
      enrichedAssets.reduce((acc, asset) => {
        const key = asset.location || "Unassigned";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [enrichedAssets]);

  const categoryGraphData = useMemo(() => {
    return Object.entries(
      enrichedAssets.reduce((acc, asset) => {
        const key = asset.category || "Uncategorized";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [enrichedAssets]);

  const performanceGraphData = useMemo(() => {
    return {
      good: enrichedAssets.filter((asset) => (asset.performance || "").toLowerCase() === "good").length,
      fair: enrichedAssets.filter((asset) => (asset.performance || "").toLowerCase() === "fair").length,
      poor: enrichedAssets.filter((asset) => (asset.performance || "").toLowerCase() === "poor").length,
      unknown: enrichedAssets.filter((asset) => !(asset.performance || "").trim()).length,
    };
  }, [enrichedAssets]);

  const graphMaxDepartment = useMemo(() => Math.max(1, ...departmentGraphData.map((item) => item.value)), [departmentGraphData]);
  const graphMaxCategory = useMemo(() => Math.max(1, ...categoryGraphData.map((item) => item.value)), [categoryGraphData]);
  const categoryOptions = useMemo(
    () => ["All", ...Array.from(new Set(assets.map((a) => a.category).filter(Boolean))).sort()],
    [assets]
  );

  function findAssetByCode(code: string) {
    const normalized = code.trim().toLowerCase();
    return enrichedAssets.find(
      (asset) =>
        asset.asset_tag?.toLowerCase() === normalized ||
        asset.serial_number?.toLowerCase() === normalized
    );
  }

  function handleScannedCode(code: string) {
    const matched = findAssetByCode(code);
    if (!matched) {
      setScannerStatus(`No asset found for code: ${code}`);
      return false;
    }

    setManualScanCode(code);
    setSelectedAssetId(matched.id);
    setActiveTab("inventory");
    setScannerStatus(`Matched ${matched.asset_tag} - ${matched.item_name}`);
    stopScanner();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  }

  async function startScanner() {
    if (!scannerSupported || !window.BarcodeDetector) {
      setScannerStatus("Camera scanner is not supported on this browser. Use manual scan instead.");
      return;
    }

    try {
      setScannerStatus("Starting camera scanner...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      setScannerOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new window.BarcodeDetector({
        formats: ["qr_code", "code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e"],
      });

      const scan = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          scanLoopRef.current = window.setTimeout(scan, 400);
          return;
        }

        try {
          const results = await detector.detect(videoRef.current);
          const value = results?.[0]?.rawValue;
          if (value && handleScannedCode(value)) return;
        } catch {
          // keep retrying quietly
        }

        scanLoopRef.current = window.setTimeout(scan, 600);
      };

      scan();
    } catch (error) {
      console.error(error);
      setScannerStatus("Could not access camera. Check permissions and try again.");
      stopScanner();
    }
  }

  function stopScanner() {
    if (scanLoopRef.current) {
      window.clearTimeout(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScannerOpen(false);
  }

  function handleManualScanSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualScanCode.trim()) {
      setScannerStatus("Enter an asset tag or serial number first.");
      return;
    }
    handleScannedCode(manualScanCode.trim());
  }

  function fillAssetForm(asset: ITAsset) {
    setEditingAssetId(asset.id);
    setAssetForm({
      assetTag: asset.asset_tag,
      itemName: asset.item_name,
      category: asset.category,
      brand: asset.brand || "",
      model: asset.model || "",
      serialNumber: asset.serial_number || "",
      quantity: String(asset.quantity || 1),
      condition: asset.condition || "Good",
      status: asset.status || "In Store",
      assignedTo: asset.assigned_to || "",
      location: asset.location || "",
      supplier: asset.supplier || "",
      purchaseDate: asset.purchase_date || "",
      warrantyExpiry: asset.warranty_expiry || "",
      notes: asset.notes || "",
      os: asset.os || "",
      ram: asset.ram || "",
      systemType: asset.system_type || "",
      connectionType: asset.connection_type || "",
      msOffice: asset.ms_office || "",
      monitor: asset.monitor || "",
      keyboard: asset.keyboard || "",
      mouse: asset.mouse || "",
      storage: asset.storage || "",
      onlineStatus: asset.online_status || "",
      windowsUpdate: asset.windows_update || "",
      desktopLoadingSpeed: asset.desktop_loading_speed || "",
      bootingSpeed: asset.booting_speed || "",
      performance: asset.performance || "",
    });
    setActiveTab("inventory");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetAssetForm() {
    setEditingAssetId(null);
    setAssetForm(EMPTY_ASSET_FORM);
  }

  async function handleSaveAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!assetForm.assetTag || !assetForm.itemName || !assetForm.category || !assetForm.location) {
      alert("Please fill Asset Tag, Item Name, Category, and Location.");
      return;
    }

    setSavingAsset(true);
    const payload = {
      asset_tag: assetForm.assetTag.trim(),
      item_name: assetForm.itemName.trim(),
      category: assetForm.category.trim(),
      brand: assetForm.brand.trim() || null,
      model: assetForm.model.trim() || null,
      serial_number: assetForm.serialNumber.trim() || null,
      quantity: Math.max(1, safeNumber(assetForm.quantity) || 1),
      condition: assetForm.condition,
      status: assetForm.status,
      assigned_to: assetForm.assignedTo.trim() || null,
      location: assetForm.location.trim(),
      supplier: assetForm.supplier.trim() || null,
      purchase_date: assetForm.purchaseDate || null,
      warranty_expiry: assetForm.warrantyExpiry || null,
      notes: assetForm.notes.trim() || null,
      os: assetForm.os.trim() || null,
      ram: assetForm.ram.trim() || null,
      system_type: assetForm.systemType.trim() || null,
      connection_type: assetForm.connectionType.trim() || null,
      ms_office: assetForm.msOffice.trim() || null,
      monitor: assetForm.monitor.trim() || null,
      keyboard: assetForm.keyboard.trim() || null,
      mouse: assetForm.mouse.trim() || null,
      storage: assetForm.storage.trim() || null,
      online_status: assetForm.onlineStatus.trim() || null,
      windows_update: assetForm.windowsUpdate.trim() || null,
      desktop_loading_speed: assetForm.desktopLoadingSpeed.trim() || null,
      booting_speed: assetForm.bootingSpeed.trim() || null,
      performance: assetForm.performance.trim() || null,
    };

    try {
      const result = editingAssetId
        ? await supabase.from("it_assets").update(payload).eq("id", editingAssetId)
        : await supabase.from("it_assets").insert([payload]);
      if (result.error) throw result.error;
      resetAssetForm();
      await refreshAll(false);
      alert(editingAssetId ? "Asset updated successfully." : "Asset added successfully.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save asset");
    } finally {
      setSavingAsset(false);
    }
  }

  async function handleDeleteAsset(id: number) {
    if (!window.confirm("Delete this asset?")) return;
    try {
      const { error } = await supabase.from("it_assets").delete().eq("id", id);
      if (error) throw error;
      await refreshAll(false);
      if (selectedAssetId === id) setSelectedAssetId(null);
      alert("Asset deleted.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to delete asset");
    }
  }

  function openAuditForAsset(asset: ITAsset) {
    const latest = latestAuditByAssetId.get(asset.id);
    setAuditForm({
      assetId: String(asset.id),
      inspectedBy: "",
      inspectionDate: new Date().toISOString().slice(0, 10),
      division: "",
      department: asset.location || "",
      officeArea: asset.location || "",
      assignedRole: asset.assigned_to || "",
      priorityLevel: latest?.priority_level || "Low",
      finalStatus: latest?.final_status || "Operational",
      healthScore: String(latest?.health_score ?? inferHealthScore(asset)),
      issueDetected: Boolean(latest?.issue_detected),
      remarks: "",
    });
    setSelectedAssetId(asset.id);
    setActiveTab("audit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveAudit(e: React.FormEvent) {
    e.preventDefault();
    if (!auditForm.assetId || !auditForm.inspectedBy) {
      alert("Please select an asset and inspector name.");
      return;
    }

    const asset = assets.find((item) => item.id === Number(auditForm.assetId));
    if (!asset) {
      alert("Selected asset not found.");
      return;
    }

    setSavingAudit(true);
    try {
      const payload = {
        asset_id: asset.id,
        asset_tag: asset.asset_tag,
        item_name: asset.item_name,
        category: asset.category,
        location: asset.location,
        assigned_to: asset.assigned_to,
        inspected_by: auditForm.inspectedBy.trim(),
        inspection_date: auditForm.inspectionDate,
        division: auditForm.division || null,
        department: auditForm.department || null,
        office_area: auditForm.officeArea || null,
        assigned_role: auditForm.assignedRole || null,
        issue_detected: auditForm.issueDetected,
        priority_level: auditForm.priorityLevel,
        final_status: auditForm.finalStatus,
        health_score: safeNumber(auditForm.healthScore),
        remarks: auditForm.remarks.trim() || null,
      };
      const { error } = await supabase.from("device_status_checks").insert([payload]);
      if (error) throw error;
      setAuditForm(EMPTY_AUDIT_FORM);
      await refreshAll(false);
      setActiveTab("history");
      alert("Audit saved successfully.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save audit");
    } finally {
      setSavingAudit(false);
    }
  }

  function openPrintWindow(title: string, html: string) {
    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      alert("Please allow pop-ups to export the PDF.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  function buildPdfShell(title: string, subtitle: string, content: string) {
    return `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 28px; color: #0f172a; }
            h1 { margin: 0; font-size: 26px; }
            h2 { margin: 0 0 10px; font-size: 18px; }
            p { color: #475569; line-height: 1.5; }
            .meta { margin-top: 8px; font-size: 12px; color: #64748b; }
            .hero { border: 1px solid #cbd5e1; border-radius: 18px; padding: 18px 20px; background: linear-gradient(135deg, #f8fafc, #ecfeff); }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 18px 0 22px; }
            .card { border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; background: white; }
            .label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .08em; }
            .value { margin-top: 8px; font-size: 24px; font-weight: 700; color: #0f172a; }
            .section { margin-top: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; vertical-align: top; }
            th { background: #f8fafc; }
            .pill { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
            .good { background: #dcfce7; color: #166534; }
            .watch { background: #fef3c7; color: #92400e; }
            .upgrade { background: #fed7aa; color: #9a3412; }
            .critical { background: #fee2e2; color: #991b1b; }
          </style>
        </head>
        <body>
          <div class="hero">
            <h1>${title}</h1>
            <p>${subtitle}</p>
            <div class="meta">KOPKOP College ICT Asset, Device Health & Audit System • Generated ${new Date().toLocaleString()}</div>
          </div>
          ${content}
        </body>
      </html>
    `;
  }

  function healthPillClassForPdf(label: string) {
    if (label === "Healthy") return "pill good";
    if (label === "Watch") return "pill watch";
    if (label === "Needs Upgrade") return "pill upgrade";
    return "pill critical";
  }

  function exportSummaryPdf() {
    const departmentRows = departmentGraphData
      .map((item) => `<tr><td>${item.label}</td><td>${item.value}</td></tr>`)
      .join("");

    const content = `
      <div class="grid">
        <div class="card"><div class="label">Total Assets</div><div class="value">${stats.total}</div></div>
        <div class="card"><div class="label">Average Health</div><div class="value">${stats.avgScore}%</div></div>
        <div class="card"><div class="label">Needs Upgrade</div><div class="value">${stats.needsUpgrade}</div></div>
        <div class="card"><div class="label">Critical</div><div class="value">${stats.critical}</div></div>
      </div>
      <div class="section">
        <h2>Health Overview</h2>
        <table>
          <thead><tr><th>Indicator</th><th>Total</th></tr></thead>
          <tbody>
            <tr><td>Healthy Devices</td><td>${healthBreakdown.healthy}</td></tr>
            <tr><td>Watch Devices</td><td>${healthBreakdown.watch}</td></tr>
            <tr><td>Needs Upgrade</td><td>${healthBreakdown.upgrade}</td></tr>
            <tr><td>Critical Devices</td><td>${healthBreakdown.critical}</td></tr>
            <tr><td>Slow Devices</td><td>${stats.slowDevices}</td></tr>
            <tr><td>Needs Windows Updates</td><td>${stats.outdated}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="section">
        <h2>Assets by Department / Location</h2>
        <table>
          <thead><tr><th>Department / Location</th><th>Assets</th></tr></thead>
          <tbody>${departmentRows || '<tr><td colspan="2">No data</td></tr>'}</tbody>
        </table>
      </div>
    `;
    openPrintWindow(
      "KOPKOP College ICT Summary Report",
      buildPdfShell(
        "KOPKOP College ICT Summary Report",
        "Use your browser's Save as PDF option in the print dialog to export this report as a PDF file.",
        content
      )
    );
  }

  function exportInventoryPdf() {
    const rows = filteredAssets
      .map((asset) => {
        const health = computeAssetHealth(asset, latestAuditByAssetId.get(asset.id));
        return `
          <tr>
            <td>${asset.asset_tag}</td>
            <td>${asset.item_name}</td>
            <td>${asset.category || "-"}</td>
            <td>${asset.location || "-"}</td>
            <td>${asset.assigned_to || "-"}</td>
            <td>${asset.os || "-"}</td>
            <td>${asset.ram || "-"}</td>
            <td>${asset.storage || "-"}</td>
            <td><span class="${healthPillClassForPdf(health.label)}">${health.label}</span></td>
            <td>${health.score}%</td>
          </tr>
        `;
      })
      .join("");

    const content = `
      <div class="grid">
        <div class="card"><div class="label">Rows Exported</div><div class="value">${filteredAssets.length}</div></div>
        <div class="card"><div class="label">In Use</div><div class="value">${stats.inUse}</div></div>
        <div class="card"><div class="label">Slow Devices</div><div class="value">${stats.slowDevices}</div></div>
        <div class="card"><div class="label">Critical</div><div class="value">${stats.critical}</div></div>
      </div>
      <div class="section">
        <h2>Inventory Export</h2>
        <table>
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Computer Name</th>
              <th>Category</th>
              <th>Department / Location</th>
              <th>Assigned To</th>
              <th>OS</th>
              <th>RAM</th>
              <th>Storage</th>
              <th>Health</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="10">No assets to export</td></tr>'}</tbody>
        </table>
      </div>
    `;
    openPrintWindow(
      "KOPKOP College ICT Inventory Export",
      buildPdfShell(
        "KOPKOP College ICT Inventory Export",
        "Use your browser's Save as PDF option in the print dialog to export this inventory report.",
        content
      )
    );
  }

  function exportAlertsPdf() {
    const flaggedAssets = filteredAssets
      .map((asset) => ({ asset, health: computeAssetHealth(asset, latestAuditByAssetId.get(asset.id)) }))
      .filter(({ health }) => health.label === "Needs Upgrade" || health.label === "Critical" || health.alerts.length > 0);

    const rows = flaggedAssets
      .map(({ asset, health }) => `
        <tr>
          <td>${asset.asset_tag}</td>
          <td>${asset.item_name}</td>
          <td>${asset.location || "-"}</td>
          <td><span class="${healthPillClassForPdf(health.label)}">${health.label}</span></td>
          <td>${health.score}%</td>
          <td>${health.alerts.join(", ") || "-"}</td>
        </tr>
      `)
      .join("");

    const content = `
      <div class="grid">
        <div class="card"><div class="label">Flagged Devices</div><div class="value">${flaggedAssets.length}</div></div>
        <div class="card"><div class="label">Needs Upgrade</div><div class="value">${stats.needsUpgrade}</div></div>
        <div class="card"><div class="label">Critical</div><div class="value">${stats.critical}</div></div>
        <div class="card"><div class="label">Windows Updates Needed</div><div class="value">${stats.outdated}</div></div>
      </div>
      <div class="section">
        <h2>Priority Alert Export</h2>
        <table>
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Computer Name</th>
              <th>Department / Location</th>
              <th>Health</th>
              <th>Score</th>
              <th>Recommended Attention</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6">No flagged devices found</td></tr>'}</tbody>
        </table>
      </div>
    `;
    openPrintWindow(
      "KOPKOP College ICT Priority Alerts",
      buildPdfShell(
        "KOPKOP College ICT Priority Alerts",
        "Use your browser's Save as PDF option in the print dialog to export this alerts report.",
        content
      )
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="rounded-3xl bg-white px-8 py-6 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Loading KOPKOP ICT system...</p>
          <p className="mt-2 text-sm text-slate-500">Fetching inventory, specs, scan tools, and audit records.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="rounded-[28px] bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">KOPKOP College</p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">ICT Asset, Device Health & Audit System</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-200 sm:text-base">
                Centralized inventory for desktops, laptops, device specifications, dashboard graphs, barcode and QR scanning, audit results, and PDF reporting.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={exportSummaryPdf} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900">
                Export Summary PDF
              </button>
              <button type="button" onClick={exportInventoryPdf} className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white">
                Export Inventory PDF
              </button>
              <button type="button" onClick={exportAlertsPdf} className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white">
                Export Alerts PDF
              </button>
              <button type="button" onClick={() => refreshAll(true)} className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white">
                {refreshing ? "Refreshing..." : "Refresh Data"}
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200">
            <Badge text={`Last sync: ${lastSyncedAt || "Not synced yet"}`} className="bg-white/10 text-white" />
            <Badge text={`Assets: ${stats.total}`} className="bg-white/10 text-white" />
            <Badge text={`Average score: ${stats.avgScore}%`} className="bg-white/10 text-white" />
            <Badge text={scannerSupported ? "Camera scanner supported" : "Manual scan available"} className="bg-white/10 text-white" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-8">
          <StatCard label="Total Assets" value={stats.total} hint="All records in it_assets" />
          <StatCard label="In Use" value={stats.inUse} hint="Currently assigned or active" />
          <StatCard label="Average Health" value={`${stats.avgScore}%`} hint="Based on specs and latest audits" />
          <StatCard label="Slow Devices" value={stats.slowDevices} hint="Boot speed flagged as slow" />
          <StatCard label="Needs Updates" value={stats.outdated} hint="Windows update not current" />
          <StatCard label="Poor Performance" value={stats.poorPerformance} hint="Performance field marked poor" />
          <StatCard label="Needs Upgrade" value={stats.needsUpgrade} hint="Health score between 40% and 64%" />
          <StatCard label="Critical" value={stats.critical} hint="Health score below 40%" />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <SectionTitle title="Dashboard graphs" subtitle="Quick visual view of device health, locations, and category distribution." />
            <div className="grid gap-4 lg:grid-cols-2">
              <DonutRing value={healthBreakdown.healthy} total={stats.total} label="Healthy devices" tone="emerald" />
              <DonutRing value={healthBreakdown.critical} total={stats.total} label="Critical devices" tone="red" />
              <DonutRing value={stats.outdated} total={stats.total} label="Needs Windows updates" tone="amber" />
              <DonutRing value={stats.slowDevices} total={stats.total} label="Slow boot devices" tone="orange" />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <SectionTitle title="Performance distribution" subtitle="How devices are currently rated from your imported performance field." />
            <div className="space-y-4">
              <MiniBar label="Good" value={performanceGraphData.good} max={stats.total} tone="emerald" />
              <MiniBar label="Fair" value={performanceGraphData.fair} max={stats.total} tone="amber" />
              <MiniBar label="Poor" value={performanceGraphData.poor} max={stats.total} tone="red" />
              <MiniBar label="No rating yet" value={performanceGraphData.unknown} max={stats.total} tone="slate" />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <SectionTitle title="Assets by department / location" subtitle="Top locations with the highest number of registered devices." />
            <div className="space-y-4">
              {departmentGraphData.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No department data yet.</div>
              ) : (
                departmentGraphData.map((item) => (
                  <MiniBar key={item.label} label={item.label} value={item.value} max={graphMaxDepartment} tone="blue" />
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <SectionTitle title="Assets by category" subtitle="Quick count of desktops, laptops, printers, and other device types." />
            <div className="space-y-4">
              {categoryGraphData.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No category data yet.</div>
              ) : (
                categoryGraphData.map((item) => (
                  <MiniBar key={item.label} label={item.label} value={item.value} max={graphMaxCategory} tone="emerald" />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <SectionTitle title="Health indicators" subtitle="Automatic device health labels based on performance, speed, updates, and condition." />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Healthy</p>
                <p className="mt-2 text-2xl font-bold text-emerald-900">{healthBreakdown.healthy}</p>
                <p className="mt-1 text-xs text-emerald-700">Ready for normal use</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Watch</p>
                <p className="mt-2 text-2xl font-bold text-amber-900">{healthBreakdown.watch}</p>
                <p className="mt-1 text-xs text-amber-700">Monitor these devices</p>
              </div>
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Needs Upgrade</p>
                <p className="mt-2 text-2xl font-bold text-orange-900">{healthBreakdown.upgrade}</p>
                <p className="mt-1 text-xs text-orange-700">Likely RAM or storage upgrade</p>
              </div>
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Critical</p>
                <p className="mt-2 text-2xl font-bold text-red-900">{healthBreakdown.critical}</p>
                <p className="mt-1 text-xs text-red-700">Needs urgent IT attention</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <SectionTitle title="Priority alerts" subtitle="Top devices that need follow-up first." />
            <div className="space-y-3">
              {enrichedAssets
                .filter((asset) => asset.displayScore < 65 || asset.alerts.length > 0)
                .sort((a, b) => a.displayScore - b.displayScore)
                .slice(0, 5)
                .map((asset) => (
                  <div key={asset.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{asset.asset_tag} · {asset.item_name}</p>
                        <p className="mt-1 text-xs text-slate-500">{asset.location || "No location"} · {asset.assigned_to || "Unassigned"}</p>
                      </div>
                      <HealthIndicator score={asset.displayScore} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(asset.alerts.length ? asset.alerts : [asset.recommendation]).slice(0, 3).map((alert) => (
                        <Badge key={alert} text={alert} className="bg-slate-100 text-slate-700" />
                      ))}
                    </div>
                  </div>
                ))}
              {enrichedAssets.filter((asset) => asset.displayScore < 65 || asset.alerts.length > 0).length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No major health alerts right now.</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 rounded-3xl bg-white p-3 shadow-sm">
          {[
            ["dashboard", "Dashboard"],
            ["inventory", "Inventory"],
            ["scan", "Scan Device"],
            ["audit", "Quick Audit"],
            ["history", "Audit History"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                activeTab === key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "scan" && (
          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
            <SectionTitle
              title="Barcode / QR scanning"
              subtitle="Scan an asset tag or serial number to open the correct device record instantly."
            />
            <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <div className="rounded-3xl border border-slate-200 p-5">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={startScanner}
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Open Camera Scanner
                  </button>
                  <button
                    type="button"
                    onClick={stopScanner}
                    className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    Stop Scanner
                  </button>
                </div>

                <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-slate-950">
                  {scannerOpen ? (
                    <video ref={videoRef} className="h-[320px] w-full object-cover" muted playsInline />
                  ) : (
                    <div className="grid h-[320px] place-items-center text-center text-slate-300">
                      <div>
                        <p className="text-lg font-semibold">Scanner preview</p>
                        <p className="mt-2 text-sm text-slate-400">
                          {scannerSupported ? "Press Open Camera Scanner to begin." : "Camera scanner is not supported on this browser."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{scannerStatus}</p>
              </div>

              <div className="rounded-3xl border border-slate-200 p-5">
                <h3 className="text-lg font-bold text-slate-900">Manual scan / typed lookup</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Paste or type the asset tag or serial number. This is useful if a scanner returns the code as text.
                </p>

                <form onSubmit={handleManualScanSubmit} className="mt-4 space-y-3">
                  <input
                    value={manualScanCode}
                    onChange={(e) => setManualScanCode(e.target.value)}
                    placeholder="Example: KC-LT5QS or serial number"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Scan & Open Device
                  </button>
                </form>

                <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Best practice</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    <li>• Print labels using the asset tag as the barcode or QR value.</li>
                    <li>• Keep the same asset tag in the system and on the physical device.</li>
                    <li>• You can also scan the serial number if it is saved in the system.</li>
                  </ul>
                </div>

                {selectedAsset ? (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Last matched asset</p>
                    <p className="mt-2 font-semibold text-emerald-900">{selectedAsset.asset_tag} · {selectedAsset.item_name}</p>
                    <p className="mt-1 text-sm text-emerald-800">{selectedAsset.location || "No location"} · {selectedAsset.assigned_to || "Unassigned"}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <SectionTitle
                title="Search, filter, and review assets"
                subtitle="Find a device quickly and inspect its technical profile, performance, and current usage."
              />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search asset tag, name, brand, user..."
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0"
                />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  <option>All</option>
                  <option>In Use</option>
                  <option>In Store</option>
                  <option>Under Repair</option>
                  <option>Damaged</option>
                  <option>Lost</option>
                  <option>Retired</option>
                </select>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select value={performanceFilter} onChange={(e) => setPerformanceFilter(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                  <option>All</option>
                  <option>Good</option>
                  <option>Fair</option>
                  <option>Poor</option>
                </select>
              </div>
            </div>

            {(activeTab === "dashboard" || activeTab === "inventory" || activeTab === "scan") && (
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <SectionTitle
                  title="Inventory overview"
                  subtitle="Select a device to review its specs, condition, update status, and recommendation."
                />
                <div className="overflow-hidden rounded-3xl border border-slate-200">
                  <div className="max-h-[620px] overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead className="sticky top-0 bg-slate-50 text-left text-slate-600">
                        <tr>
                          <th className="px-4 py-3">Asset Tag</th>
                          <th className="px-4 py-3">Device</th>
                          <th className="px-4 py-3">Assigned To</th>
                          <th className="px-4 py-3">Location</th>
                          <th className="px-4 py-3">OS / RAM</th>
                          <th className="px-4 py-3">Health</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssets.map((asset) => (
                          <tr key={asset.id} className={`border-t border-slate-100 ${selectedAsset?.id === asset.id ? "bg-cyan-50/60" : "bg-white"}`}>
                            <td className="px-4 py-3 font-semibold text-slate-900">{asset.asset_tag}</td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900">{asset.item_name}</p>
                              <p className="text-xs text-slate-500">{asset.brand || "-"} {asset.model || ""}</p>
                            </td>
                            <td className="px-4 py-3 text-slate-700">{asset.assigned_to || "-"}</td>
                            <td className="px-4 py-3 text-slate-700">{asset.location || "-"}</td>
                            <td className="px-4 py-3">
                              <p className="text-slate-900">{asset.os || "-"}</p>
                              <p className="text-xs text-slate-500">{asset.ram || "-"}</p>
                            </td>
                            <td className="px-4 py-3">
                              <HealthIndicator score={asset.displayScore} />
                            </td>
                            <td className="px-4 py-3">
                              <Badge text={asset.status || "-"} className={statusPillClass(asset.status)} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => setSelectedAssetId(asset.id)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                                  View
                                </button>
                                <button type="button" onClick={() => fillAssetForm(asset)} className="rounded-xl bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700">
                                  Edit
                                </button>
                                <button type="button" onClick={() => openAuditForAsset(asset)} className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">
                                  Audit
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredAssets.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                              No assets matched your filters.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <SectionTitle title="Recent audit history" subtitle="Latest compliance and condition checks captured from device audits." />
                <div className="space-y-3">
                  {deviceChecks.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No audit records yet.</div>
                  ) : (
                    deviceChecks.map((check) => (
                      <div key={check.id} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{check.asset_tag || "Unknown asset"} · {check.item_name || "Unknown item"}</p>
                            <p className="mt-1 text-sm text-slate-500">{check.inspected_by} · {formatDate(check.inspection_date)}</p>
                            <p className="mt-2 text-sm text-slate-600">{check.remarks || "No remarks recorded."}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge text={check.final_status} className={statusPillClass(check.final_status)} />
                            <Badge text={check.priority_level || "Low"} className={statusPillClass(check.priority_level)} />
                            <Badge text={`${check.health_score ?? 0}%`} className={scoreTone(check.health_score ?? 0)} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {selectedAsset && (activeTab === "dashboard" || activeTab === "inventory" || activeTab === "scan") ? (
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <SectionTitle title="Selected device profile" subtitle="Detailed asset record with technical data and management recommendation." />
                <div className="space-y-4">
                  <div className="rounded-3xl bg-slate-950 p-5 text-white">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">{selectedAsset.asset_tag}</p>
                        <h3 className="mt-2 text-2xl font-bold">{selectedAsset.item_name}</h3>
                        <p className="mt-1 text-sm text-slate-300">{selectedAsset.brand || "-"} {selectedAsset.model || ""}</p>
                      </div>
                      <HealthIndicator score={selectedAsset.displayScore} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User / Location</p>
                      <p className="mt-2 font-semibold text-slate-900">{selectedAsset.assigned_to || "Unassigned"}</p>
                      <p className="mt-1 text-sm text-slate-600">{selectedAsset.location || "No location"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">System</p>
                      <p className="mt-2 font-semibold text-slate-900">{selectedAsset.os || "Not recorded"}</p>
                      <p className="mt-1 text-sm text-slate-600">{selectedAsset.ram || "No RAM"} · {selectedAsset.storage || "No storage"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Update & Connectivity</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge text={selectedAsset.windows_update || "Unknown"} className={statusPillClass(selectedAsset.windows_update)} />
                        <Badge text={selectedAsset.online_status || "Unknown"} className={statusPillClass(selectedAsset.online_status)} />
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Speed & Performance</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge text={selectedAsset.desktop_loading_speed || "Unknown"} className={statusPillClass(selectedAsset.desktop_loading_speed)} />
                        <Badge text={selectedAsset.booting_speed || "Unknown"} className={statusPillClass(selectedAsset.booting_speed)} />
                        <Badge text={selectedAsset.performance || "Unknown"} className={statusPillClass(selectedAsset.performance)} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommendation</p>
                        <p className="mt-2 text-sm font-medium text-slate-800">{selectedAsset.recommendation}</p>
                      </div>
                      <HealthIndicator score={selectedAsset.displayScore} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedAsset.alerts.length > 0 ? (
                        selectedAsset.alerts.map((alert) => <Badge key={alert} text={alert} className="bg-slate-100 text-slate-700" />)
                      ) : (
                        <Badge text="No active alert" className="bg-emerald-100 text-emerald-700" />
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Peripherals</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        <p>Monitor: {selectedAsset.monitor || "-"}</p>
                        <p>Keyboard: {selectedAsset.keyboard || "-"}</p>
                        <p>Mouse: {selectedAsset.mouse || "-"}</p>
                        <p>MS Office: {selectedAsset.ms_office || "-"}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Other Details</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        <p>Condition: {selectedAsset.condition || "-"}</p>
                        <p>Status: {selectedAsset.status || "-"}</p>
                        <p>Purchase: {formatDate(selectedAsset.purchase_date)}</p>
                        <p>Warranty: {formatDate(selectedAsset.warranty_expiry)}</p>
                        <p>Last Audit: {formatDateTime(selectedAsset.lastAudit?.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => fillAssetForm(selectedAsset)} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                      Edit Asset
                    </button>
                    <button type="button" onClick={() => openAuditForAsset(selectedAsset)} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">
                      New Audit
                    </button>
                    <button type="button" onClick={() => handleDeleteAsset(selectedAsset.id)} className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white">
                      Delete Asset
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {(activeTab === "inventory" || editingAssetId !== null) && (
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <SectionTitle
                  title={editingAssetId ? "Edit asset record" : "Add new asset"}
                  subtitle="This form captures both inventory details and technical device information from your Excel sheet."
                />
                <form onSubmit={handleSaveAsset} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Asset Tag" value={assetForm.assetTag} onChange={(e) => setAssetForm({ ...assetForm, assetTag: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Computer Name / Item Name" value={assetForm.itemName} onChange={(e) => setAssetForm({ ...assetForm, itemName: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Device Type" value={assetForm.category} onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Assigned To" value={assetForm.assignedTo} onChange={(e) => setAssetForm({ ...assetForm, assignedTo: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Brand" value={assetForm.brand} onChange={(e) => setAssetForm({ ...assetForm, brand: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Model" value={assetForm.model} onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Serial Number" value={assetForm.serialNumber} onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Location / Department" value={assetForm.location} onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Quantity" value={assetForm.quantity} onChange={(e) => setAssetForm({ ...assetForm, quantity: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Supplier" value={assetForm.supplier} onChange={(e) => setAssetForm({ ...assetForm, supplier: e.target.value })} />
                    <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={assetForm.condition} onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value as AssetCondition })}>
                      <option>Good</option><option>Fair</option><option>Damaged</option>
                    </select>
                    <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={assetForm.status} onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value as AssetStatus })}>
                      <option>In Store</option><option>In Use</option><option>Under Repair</option><option>Damaged</option><option>Lost</option><option>Retired</option>
                    </select>
                    <input type="date" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={assetForm.purchaseDate} onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })} />
                    <input type="date" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={assetForm.warrantyExpiry} onChange={(e) => setAssetForm({ ...assetForm, warrantyExpiry: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="OS" value={assetForm.os} onChange={(e) => setAssetForm({ ...assetForm, os: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="RAM" value={assetForm.ram} onChange={(e) => setAssetForm({ ...assetForm, ram: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="System Type" value={assetForm.systemType} onChange={(e) => setAssetForm({ ...assetForm, systemType: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Connection Type" value={assetForm.connectionType} onChange={(e) => setAssetForm({ ...assetForm, connectionType: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="MS Office" value={assetForm.msOffice} onChange={(e) => setAssetForm({ ...assetForm, msOffice: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Monitor" value={assetForm.monitor} onChange={(e) => setAssetForm({ ...assetForm, monitor: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Keyboard" value={assetForm.keyboard} onChange={(e) => setAssetForm({ ...assetForm, keyboard: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Mouse" value={assetForm.mouse} onChange={(e) => setAssetForm({ ...assetForm, mouse: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Storage" value={assetForm.storage} onChange={(e) => setAssetForm({ ...assetForm, storage: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Online Status" value={assetForm.onlineStatus} onChange={(e) => setAssetForm({ ...assetForm, onlineStatus: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Windows Update" value={assetForm.windowsUpdate} onChange={(e) => setAssetForm({ ...assetForm, windowsUpdate: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Desktop Loading Speed" value={assetForm.desktopLoadingSpeed} onChange={(e) => setAssetForm({ ...assetForm, desktopLoadingSpeed: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Booting Speed" value={assetForm.bootingSpeed} onChange={(e) => setAssetForm({ ...assetForm, bootingSpeed: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Performance" value={assetForm.performance} onChange={(e) => setAssetForm({ ...assetForm, performance: e.target.value })} />
                  </div>
                  <textarea className="min-h-[100px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Notes" value={assetForm.notes} onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })} />
                  <div className="flex flex-wrap gap-3">
                    <button type="submit" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                      {savingAsset ? "Saving..." : editingAssetId ? "Update Asset" : "Save Asset"}
                    </button>
                    {editingAssetId ? (
                      <button type="button" onClick={resetAssetForm} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                        Cancel Edit
                      </button>
                    ) : null}
                  </div>
                </form>
              </div>
            )}

            {activeTab === "audit" && (
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <SectionTitle title="Quick audit form" subtitle="Save an audit result for the selected asset." />
                <form onSubmit={handleSaveAudit} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={auditForm.assetId} onChange={(e) => setAuditForm({ ...auditForm, assetId: e.target.value })}>
                      <option value="">Select Asset</option>
                      {assets.map((asset) => (
                        <option key={asset.id} value={asset.id}>{asset.asset_tag} - {asset.item_name}</option>
                      ))}
                    </select>
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Inspected By" value={auditForm.inspectedBy} onChange={(e) => setAuditForm({ ...auditForm, inspectedBy: e.target.value })} />
                    <input type="date" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={auditForm.inspectionDate} onChange={(e) => setAuditForm({ ...auditForm, inspectionDate: e.target.value })} />
                    <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={auditForm.division} onChange={(e) => setAuditForm({ ...auditForm, division: e.target.value, department: "" })}>
                      <option value="">Select Division</option>
                      {DIVISIONS.map((division) => <option key={division} value={division}>{division}</option>)}
                    </select>
                    <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={auditForm.department} onChange={(e) => setAuditForm({ ...auditForm, department: e.target.value })}>
                      <option value="">Select Department</option>
                      {(DEPARTMENTS_BY_DIVISION[auditForm.division] || []).map((department) => (
                        <option key={department} value={department}>{department}</option>
                      ))}
                    </select>
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Office / Area" value={auditForm.officeArea} onChange={(e) => setAuditForm({ ...auditForm, officeArea: e.target.value })} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Assigned Role" value={auditForm.assignedRole} onChange={(e) => setAuditForm({ ...auditForm, assignedRole: e.target.value })} />
                    <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={auditForm.priorityLevel} onChange={(e) => setAuditForm({ ...auditForm, priorityLevel: e.target.value as PriorityLevel })}>
                      <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                    </select>
                    <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={auditForm.finalStatus} onChange={(e) => setAuditForm({ ...auditForm, finalStatus: e.target.value as FinalStatus })}>
                      <option>Operational</option><option>Needs Minor Repair</option><option>Needs Major Repair</option><option>Out of Service</option>
                    </select>
                    <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Health Score" value={auditForm.healthScore} onChange={(e) => setAuditForm({ ...auditForm, healthScore: e.target.value })} />
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                      <input type="checkbox" checked={auditForm.issueDetected} onChange={(e) => setAuditForm({ ...auditForm, issueDetected: e.target.checked })} />
                      Issue detected
                    </label>
                  </div>
                  <textarea className="min-h-[100px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Audit remarks" value={auditForm.remarks} onChange={(e) => setAuditForm({ ...auditForm, remarks: e.target.value })} />
                  <button type="submit" className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">
                    {savingAudit ? "Saving..." : "Save Audit"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
