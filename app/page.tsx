
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

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

  monitor_ok: boolean;
  keyboard_ok: boolean;
  mouse_ok: boolean;
  cpu_ok: boolean;
  ports_ok: boolean;
  cables_ok: boolean;
  cleanliness_ok: boolean;

  power_on_ok: boolean;
  boot_ok: boolean;
  noise_ok: boolean;
  overheating_ok: boolean;
  performance_ok: boolean;

  os_ok: boolean;
  windows_activated_ok: boolean;
  windows_updated_ok: boolean;
  antivirus_installed_ok: boolean;
  antivirus_updated_ok: boolean;
  virus_free_ok: boolean;

  office_installed_ok: boolean;
  office_activated_ok: boolean;
  browser_ok: boolean;
  pdf_reader_ok: boolean;

  internet_ok: boolean;
  lan_ok: boolean;

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
};

type DeviceCheckFormState = {
  assetId: string;
  inspectedBy: string;
  inspectionDate: string;
  division: string;
  department: string;
  officeArea: string;
  assignedRole: string;

  monitorOk: boolean;
  keyboardOk: boolean;
  mouseOk: boolean;
  cpuOk: boolean;
  portsOk: boolean;
  cablesOk: boolean;
  cleanlinessOk: boolean;

  powerOnOk: boolean;
  bootOk: boolean;
  noiseOk: boolean;
  overheatingOk: boolean;
  performanceOk: boolean;

  osOk: boolean;
  windowsActivatedOk: boolean;
  windowsUpdatedOk: boolean;
  antivirusInstalledOk: boolean;
  antivirusUpdatedOk: boolean;
  virusFreeOk: boolean;

  officeInstalledOk: boolean;
  officeActivatedOk: boolean;
  browserOk: boolean;
  pdfReaderOk: boolean;

  internetOk: boolean;
  lanOk: boolean;

  issueDetected: boolean;
  priorityLevel: PriorityLevel;
  remarks: string;
};

const DIVISIONS = [
  "KOPKOP College Admin Team",
  "Primary School",
  "Secondary School",
  "SOLI (School of Learning & Innovation)",
] as const;

const DEPARTMENTS_BY_DIVISION: Record<string, string[]> = {
  "KOPKOP College Admin Team": [
    "Admin Office",
    "IT Department",
    "Finance Department",
    "Resource Department",
    "HR Department",
  ],
  "Primary School": [
    "Senior School",
    "Middle School",
    "Junior School",
    "ECCE",
    "Primary Staff Room",
    "Primary IT Lab",
  ],
  "Secondary School": ["Academic", "LSS School", "Secondary Staff Room"],
  "SOLI (School of Learning & Innovation)": ["Grade 11", "Grade 12"],
};

const OFFICES_BY_DEPARTMENT: Record<string, string[]> = {
  "Admin Office": [
    "Admin Front Desk",
    "Admin Main Office",
    "Enrollment Desk - Secondary",
    "Enrollment Desk - Primary",
    "ARO Desk 2",
    "ARO Desk 3",
    "Transport Desk",
    "Printing Desk 1",
    "Printing Desk 2",
  ],
  "IT Department": ["IT Office", "IT Manager Desk", "IT Officer Desk"],
  "Finance Department": [
    "Finance Office",
    "Accounts Payable Desk",
    "Finance Manager Desk",
    "Accounts Receivable Desk 1",
    "Admin Office - Receivables Desk 2",
    "Admin Office - Receivables Desk 3",
  ],
  "Resource Department": [
    "Resource Office",
    "Resource Officer Desk 1",
    "Resource Officer Desk 2",
  ],
  "HR Department": ["HR Office", "HR Manager Desk", "HR Assistant Desk 1", "HR Assistant Desk 2"],
  "Senior School": ["Senior School Area"],
  "Middle School": ["Middle School Area"],
  "Junior School": ["Junior School Area"],
  "ECCE": ["ECCE Area"],
  "Primary Staff Room": ["Primary Staff Room"],
  "Primary IT Lab": ["Primary IT Lab"],
  "Academic": ["Academic Office"],
  "LSS School": ["LSS Staff Room"],
  "Secondary Staff Room": ["Secondary Staff Room"],
  "Grade 11": ["Grade 11 Classroom", "Grade 11 Lab"],
  "Grade 12": ["Grade 12 Classroom", "Grade 12 Lab"],
};

const ROLES_BY_DEPARTMENT: Record<string, string[]> = {
  "Admin Office": [
    "Enrollment Officer - Secondary",
    "Enrollment Officer - Primary",
    "ARO 2",
    "ARO 3",
    "Transport Officer",
    "Printing Officer 1",
    "Printing Officer 2",
    "Front Desk Officer",
  ],
  "IT Department": ["IT Manager", "IT Officer"],
  "Finance Department": [
    "Accounts Receivable 1",
    "Accounts Receivable 2",
    "Accounts Receivable 3",
    "Accounts Payable",
    "Finance Manager",
  ],
  "Resource Department": ["Resource Officer 1", "Resource Officer 2"],
  "HR Department": ["HR Manager", "HR Assistant 1", "HR Assistant 2"],
  "Primary Staff Room": ["Teacher Workstation"],
  "Primary IT Lab": ["Shared Lab PC"],
  "Academic": ["Principal", "Deputy Principal"],
  "LSS School": ["Teacher Workstation"],
  "Secondary Staff Room": ["Teacher Workstation"],
  "Grade 11": ["Shared Classroom PC", "Shared Lab PC"],
  "Grade 12": ["Shared Classroom PC", "Shared Lab PC"],
  "Senior School": ["Teacher Workstation"],
  "Middle School": ["Teacher Workstation"],
  "Junior School": ["Teacher Workstation"],
  "ECCE": ["Teacher Workstation"],
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
};

const EMPTY_DEVICE_CHECK_FORM: DeviceCheckFormState = {
  assetId: "",
  inspectedBy: "",
  inspectionDate: new Date().toISOString().slice(0, 10),
  division: "",
  department: "",
  officeArea: "",
  assignedRole: "",

  monitorOk: false,
  keyboardOk: false,
  mouseOk: false,
  cpuOk: false,
  portsOk: false,
  cablesOk: false,
  cleanlinessOk: false,

  powerOnOk: false,
  bootOk: false,
  noiseOk: false,
  overheatingOk: false,
  performanceOk: false,

  osOk: false,
  windowsActivatedOk: false,
  windowsUpdatedOk: false,
  antivirusInstalledOk: false,
  antivirusUpdatedOk: false,
  virusFreeOk: false,

  officeInstalledOk: false,
  officeActivatedOk: false,
  browserOk: false,
  pdfReaderOk: false,

  internetOk: false,
  lanOk: false,

  issueDetected: false,
  priorityLevel: "Low",
  remarks: "",
};

const CHECK_GROUPS: Array<{
  title: string;
  items: Array<{ key: keyof DeviceCheckFormState; label: string }>;
}> = [
  {
    title: "Hardware",
    items: [
      { key: "monitorOk", label: "Monitor OK" },
      { key: "keyboardOk", label: "Keyboard OK" },
      { key: "mouseOk", label: "Mouse OK" },
      { key: "cpuOk", label: "CPU / System Unit OK" },
      { key: "portsOk", label: "Ports OK" },
      { key: "cablesOk", label: "Cables OK" },
      { key: "cleanlinessOk", label: "Cleanliness OK" },
    ],
  },
  {
    title: "System Health",
    items: [
      { key: "powerOnOk", label: "Power ON" },
      { key: "bootOk", label: "Boot Time Normal" },
      { key: "noiseOk", label: "No Strange Noise" },
      { key: "overheatingOk", label: "No Overheating" },
      { key: "performanceOk", label: "Performance OK" },
    ],
  },
  {
    title: "Software & Security",
    items: [
      { key: "osOk", label: "Operating System OK" },
      { key: "windowsActivatedOk", label: "Windows Activated" },
      { key: "windowsUpdatedOk", label: "Windows Updated" },
      { key: "antivirusInstalledOk", label: "Antivirus Installed" },
      { key: "antivirusUpdatedOk", label: "Antivirus Updated" },
      { key: "virusFreeOk", label: "No Virus Detected" },
    ],
  },
  {
    title: "Applications",
    items: [
      { key: "officeInstalledOk", label: "MS Office Installed" },
      { key: "officeActivatedOk", label: "MS Office Activated" },
      { key: "browserOk", label: "Browser Working" },
      { key: "pdfReaderOk", label: "PDF Reader Installed" },
    ],
  },
  {
    title: "Network",
    items: [
      { key: "internetOk", label: "Internet OK" },
      { key: "lanOk", label: "LAN Port Working" },
    ],
  },
];

const CHECK_KEYS: Array<keyof DeviceCheckFormState> = [
  "monitorOk",
  "keyboardOk",
  "mouseOk",
  "cpuOk",
  "portsOk",
  "cablesOk",
  "cleanlinessOk",
  "powerOnOk",
  "bootOk",
  "noiseOk",
  "overheatingOk",
  "performanceOk",
  "osOk",
  "windowsActivatedOk",
  "windowsUpdatedOk",
  "antivirusInstalledOk",
  "antivirusUpdatedOk",
  "virusFreeOk",
  "officeInstalledOk",
  "officeActivatedOk",
  "browserOk",
  "pdfReaderOk",
  "internetOk",
  "lanOk",
];

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function statusBadge(status: string) {
  switch (status) {
    case "Operational":
      return "bg-emerald-100 text-emerald-700";
    case "Needs Minor Repair":
      return "bg-amber-100 text-amber-700";
    case "Needs Major Repair":
      return "bg-orange-100 text-orange-700";
    case "Out of Service":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function priorityBadge(priority: string) {
  switch (priority) {
    case "Low":
      return "bg-slate-100 text-slate-700";
    case "Medium":
      return "bg-blue-100 text-blue-700";
    case "High":
      return "bg-amber-100 text-amber-700";
    case "Critical":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function assetStatusBadge(status: string) {
  switch (status) {
    case "In Use":
      return "bg-emerald-100 text-emerald-700";
    case "In Store":
      return "bg-slate-100 text-slate-700";
    case "Under Repair":
      return "bg-amber-100 text-amber-700";
    case "Damaged":
      return "bg-red-100 text-red-700";
    case "Lost":
      return "bg-rose-100 text-rose-700";
    case "Retired":
      return "bg-zinc-200 text-zinc-700";
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

function calculateHealthScore(form: DeviceCheckFormState) {
  const passed = CHECK_KEYS.filter((key) => Boolean(form[key])).length;
  return Math.round((passed / CHECK_KEYS.length) * 100);
}

function calculateAutoStatus(
  score: number,
  issueDetected: boolean,
  priorityLevel: PriorityLevel
): FinalStatus {
  if (issueDetected && priorityLevel === "Critical") return "Out of Service";
  if (issueDetected && priorityLevel === "High" && score < 70) return "Needs Major Repair";
  if (score >= 90) return "Operational";
  if (score >= 70) return "Needs Minor Repair";
  if (score >= 40) return "Needs Major Repair";
  return "Out of Service";
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function DetailPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
      }`}
    >
      {label}: {ok ? "OK" : "Issue"}
    </span>
  );
}


function MobileQuickButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
        active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}


function SectionToggle({
  title,
  count,
  isOpen,
  onClick,
}: {
  title: string;
  count: number;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left"
    >
      <div className="flex items-center gap-3">
        <span className="text-base font-bold text-slate-900">{title}</span>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          {count}
        </span>
      </div>
      <span className="text-sm font-semibold text-slate-600">{isOpen ? "Hide" : "Show"}</span>
    </button>
  );
}


function QRCodeCard({ value, label, subtitle }: { value: string; label: string; subtitle?: string }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(value)}`;

  async function handleDownloadQr() {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${label.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}_qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(qrUrl, "_blank");
    }
  }

  function handlePrintQr() {
    const printWindow = window.open("", "_blank", "width=500,height=700");
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>${label} QR Label</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              text-align: center;
              color: #111827;
            }
            .label {
              border: 2px solid #cbd5e1;
              border-radius: 18px;
              padding: 24px;
              width: 320px;
              margin: 0 auto;
            }
            .title {
              font-size: 22px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .subtitle {
              font-size: 14px;
              color: #475569;
              margin-bottom: 12px;
            }
            .qr {
              width: 260px;
              height: 260px;
              object-fit: contain;
              margin: 12px auto;
              display: block;
              border: 1px solid #e2e8f0;
              padding: 8px;
              background: white;
            }
            .value {
              font-size: 18px;
              font-weight: 700;
              margin-top: 14px;
            }
            .meta {
              font-size: 12px;
              color: #64748b;
              margin-top: 6px;
              word-break: break-word;
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="title">${label}</div>
            ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
            <img class="qr" src="${qrUrl}" alt="QR Code" />
            <div class="value">${value}</div>
            <div class="meta">KOPKOP College ICT Asset Audit & Compliance System</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <img
          src={qrUrl}
          alt={`QR code for ${label}`}
          className="h-56 w-56 rounded-2xl border border-slate-200 bg-white p-2"
        />
        <h3 className="mt-4 text-lg font-bold text-slate-900">{label}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        <p className="mt-1 text-sm text-slate-500">QR value: {value}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={handleDownloadQr}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Download QR
          </button>
          <button
            type="button"
            onClick={handlePrintQr}
            className="rounded-2xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Print QR
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KopkopCollegeICTAssetAuditComplianceSystem() {
  const [assets, setAssets] = useState<ITAsset[]>([]);
  const [deviceChecks, setDeviceChecks] = useState<DeviceStatusCheck[]>([]);
  const [assetForm, setAssetForm] = useState<AssetFormState>(EMPTY_ASSET_FORM);
  const [editingAssetId, setEditingAssetId] = useState<number | null>(null);
  const [deviceCheckForm, setDeviceCheckForm] = useState<DeviceCheckFormState>(EMPTY_DEVICE_CHECK_FORM);

  const [loading, setLoading] = useState(true);
  const [savingAsset, setSavingAsset] = useState(false);
  const [savingDeviceCheck, setSavingDeviceCheck] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("Live updates active");

  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState("All");
  const [selectedCheckId, setSelectedCheckId] = useState<number | null>(null);
  const [openSection, setOpenSection] = useState<"inventory" | "pending" | "audit">("inventory");
  const [quickAuditMode, setQuickAuditMode] = useState(false);
  const [qrAssetId, setQrAssetId] = useState<number | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerSupported, setScannerSupported] = useState(false);
  const [scannerStatus, setScannerStatus] = useState("");
  const [manualScanCode, setManualScanCode] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const refreshInFlightRef = useRef(false);
  const liveMessageTimerRef = useRef<number | null>(null);

  useEffect(() => {
    refreshAll({ silent: false, showRefreshing: false });

    const channel = supabase
      .channel("kopkop-live-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "it_assets" },
        () => {
          setLiveUpdateMessage("Inventory updated just now");
          refreshAll({ silent: true, showRefreshing: false });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "device_status_checks" },
        () => {
          setLiveUpdateMessage("Audit records updated just now");
          refreshAll({ silent: true, showRefreshing: false });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setLiveUpdateMessage("Live updates connected");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setLiveUpdateMessage("Live connection issue. Auto-sync still running.");
        }
      });

    const intervalId = window.setInterval(() => {
      refreshAll({ silent: true, showRefreshing: false });
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
      if (liveMessageTimerRef.current) {
        window.clearTimeout(liveMessageTimerRef.current);
        liveMessageTimerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setScannerSupported(typeof window !== "undefined" && "BarcodeDetector" in window);
    return () => {
      stopScanner();
    };
  }, []);

  function setLiveUpdateMessage(message: string) {
    setLiveMessage(message);
    if (liveMessageTimerRef.current) {
      window.clearTimeout(liveMessageTimerRef.current);
    }
    liveMessageTimerRef.current = window.setTimeout(() => {
      setLiveMessage("Live updates active");
      liveMessageTimerRef.current = null;
    }, 4000);
  }

  async function loadAssets(options?: { silent?: boolean }) {
    const { data, error } = await supabase
      .from("it_assets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (!options?.silent) alert(error.message);
      throw error;
    }
    setAssets((data || []) as ITAsset[]);
  }

  async function loadDeviceChecks(options?: { silent?: boolean }) {
    const { data, error } = await supabase
      .from("device_status_checks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (!options?.silent) alert(error.message);
      throw error;
    }
    setDeviceChecks((data || []) as DeviceStatusCheck[]);
  }

  async function refreshAll(options?: { silent?: boolean; showRefreshing?: boolean }) {
    const silent = options?.silent ?? false;
    const showRefreshing = options?.showRefreshing ?? false;

    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;

    if (!silent) setLoading(true);
    if (showRefreshing) setRefreshing(true);

    try {
      await Promise.all([loadAssets({ silent }), loadDeviceChecks({ silent })]);
      setLastSyncedAt(new Date().toLocaleTimeString());
      if (!silent) {
        setLiveUpdateMessage("Data synced successfully");
      }
    } catch (error) {
      console.error("Refresh failed", error);
      if (silent) {
        setLiveMessage("Auto-sync retrying...");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      refreshInFlightRef.current = false;
    }
  }

  const liveScore = useMemo(() => calculateHealthScore(deviceCheckForm), [deviceCheckForm]);
  const autoStatus = useMemo(
    () => calculateAutoStatus(liveScore, deviceCheckForm.issueDetected, deviceCheckForm.priorityLevel),
    [liveScore, deviceCheckForm.issueDetected, deviceCheckForm.priorityLevel]
  );

  const departmentOptionsForForm = useMemo(
    () => DEPARTMENTS_BY_DIVISION[deviceCheckForm.division] || [],
    [deviceCheckForm.division]
  );

  const officeOptionsForForm = useMemo(
    () => OFFICES_BY_DEPARTMENT[deviceCheckForm.department] || [],
    [deviceCheckForm.department]
  );

  const roleOptionsForForm = useMemo(
    () => ROLES_BY_DEPARTMENT[deviceCheckForm.department] || [],
    [deviceCheckForm.department]
  );

  const auditableAssets = useMemo(() => {
    return [...assets].sort((a, b) => a.asset_tag.localeCompare(b.asset_tag));
  }, [assets]);

  const desktopAssets = useMemo(() => {
    return assets.filter((asset) => {
      const haystack = `${asset.category || ""} ${asset.item_name || ""} ${asset.asset_tag || ""}`.toLowerCase();
      return haystack.includes("desktop") || haystack.includes("cpu") || haystack.includes("pc");
    });
  }, [assets]);

  const latestAuditByAssetId = useMemo(() => {
    const map = new Map<number, DeviceStatusCheck>();
    for (const check of deviceChecks) {
      if (!check.asset_id) continue;
      const existing = map.get(check.asset_id);
      if (!existing) map.set(check.asset_id, check);
    }
    return map;
  }, [deviceChecks]);

  const pendingAuditAssets = useMemo(() => {
    return auditableAssets.filter((asset) => !latestAuditByAssetId.has(asset.id));
  }, [auditableAssets, latestAuditByAssetId]);

  const filteredInventoryAssets = useMemo(() => {
    return auditableAssets.filter((asset) => {
      if (assetTypeFilter === "All") return true;
      const category = (asset.category || "").toLowerCase();
      const item = (asset.item_name || "").toLowerCase();
      const haystack = `${category} ${item}`;

      if (assetTypeFilter === "Desktop") {
        return haystack.includes("desktop") || haystack.includes("cpu") || haystack.includes("pc");
      }
      if (assetTypeFilter === "Laptop") {
        return haystack.includes("laptop") || haystack.includes("notebook");
      }
      if (assetTypeFilter === "Printer") {
        return haystack.includes("printer");
      }
      return category.includes(assetTypeFilter.toLowerCase()) || item.includes(assetTypeFilter.toLowerCase());
    });
  }, [auditableAssets, assetTypeFilter]);

  const filteredPendingAssets = useMemo(() => {
    return pendingAuditAssets.filter((asset) => {
      if (assetTypeFilter === "All") return true;
      const category = (asset.category || "").toLowerCase();
      const item = (asset.item_name || "").toLowerCase();
      const haystack = `${category} ${item}`;

      if (assetTypeFilter === "Desktop") {
        return haystack.includes("desktop") || haystack.includes("cpu") || haystack.includes("pc");
      }
      if (assetTypeFilter === "Laptop") {
        return haystack.includes("laptop") || haystack.includes("notebook");
      }
      if (assetTypeFilter === "Printer") {
        return haystack.includes("printer");
      }
      return category.includes(assetTypeFilter.toLowerCase()) || item.includes(assetTypeFilter.toLowerCase());
    });
  }, [pendingAuditAssets, assetTypeFilter]);

  const filteredChecks = useMemo(() => {
    return deviceChecks.filter((check) => {
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (check.asset_tag || "").toLowerCase().includes(term) ||
        (check.item_name || "").toLowerCase().includes(term) ||
        (check.inspected_by || "").toLowerCase().includes(term) ||
        (check.division || "").toLowerCase().includes(term) ||
        (check.department || "").toLowerCase().includes(term) ||
        (check.office_area || "").toLowerCase().includes(term) ||
        (check.assigned_role || "").toLowerCase().includes(term) ||
        (check.remarks || "").toLowerCase().includes(term);

      const matchesDivision = divisionFilter === "All" || (check.division || "") === divisionFilter;
      const matchesDepartment = departmentFilter === "All" || (check.department || "") === departmentFilter;
      const matchesStatus = statusFilter === "All" || check.final_status === statusFilter;
      const matchesPriority = priorityFilter === "All" || (check.priority_level || "") === priorityFilter;
      const matchesDate = !dateFilter || check.inspection_date === dateFilter;

      return matchesSearch && matchesDivision && matchesDepartment && matchesStatus && matchesPriority && matchesDate;
    });
  }, [deviceChecks, search, divisionFilter, departmentFilter, statusFilter, priorityFilter, dateFilter]);

  const selectedCheck = useMemo(
    () => filteredChecks.find((check) => check.id === selectedCheckId) || null,
    [filteredChecks, selectedCheckId]
  );

  const selectedQrAsset = useMemo(
    () => auditableAssets.find((asset) => asset.id === qrAssetId) || null,
    [auditableAssets, qrAssetId]
  );

  const departmentFilterOptions = useMemo(() => {
    const values = Array.from(
      new Set(deviceChecks.map((check) => check.department).filter(Boolean))
    ) as string[];
    return ["All", ...values.sort()];
  }, [deviceChecks]);

  const stats = useMemo(() => {
    return {
      totalAssets: assets.length,
      desktops: desktopAssets.length,
      pendingAudits: pendingAuditAssets.length,
      totalChecks: filteredChecks.length,
      operational: filteredChecks.filter((c) => c.final_status === "Operational").length,
      minor: filteredChecks.filter((c) => c.final_status === "Needs Minor Repair").length,
      major: filteredChecks.filter((c) => c.final_status === "Needs Major Repair").length,
      out: filteredChecks.filter((c) => c.final_status === "Out of Service").length,
      critical: filteredChecks.filter((c) => c.priority_level === "Critical").length,
    };
  }, [assets.length, desktopAssets.length, pendingAuditAssets.length, filteredChecks]);

  const alertSummary = useMemo(() => {
    const criticalChecks = deviceChecks.filter((c) => c.priority_level === "Critical");
    const outOfServiceChecks = deviceChecks.filter((c) => c.final_status === "Out of Service");
    return { criticalChecks, outOfServiceChecks };
  }, [deviceChecks]);

  const reportSummary = useMemo(() => {
    const total = filteredChecks.length;
    const operational = filteredChecks.filter((c) => c.final_status === "Operational").length;
    const minor = filteredChecks.filter((c) => c.final_status === "Needs Minor Repair").length;
    const major = filteredChecks.filter((c) => c.final_status === "Needs Major Repair").length;
    const out = filteredChecks.filter((c) => c.final_status === "Out of Service").length;
    const critical = filteredChecks.filter((c) => c.priority_level === "Critical").length;
    const avgScore = total
      ? Math.round(filteredChecks.reduce((sum, item) => sum + (item.health_score || 0), 0) / total)
      : 0;

    const byDepartment = Object.entries(
      filteredChecks.reduce((acc, item) => {
        const key = item.department || "Unassigned";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]);

    return { total, operational, minor, major, out, critical, avgScore, byDepartment };
  }, [filteredChecks]);


  function findAssetByScanCode(code: string) {
    const normalized = code.trim().toLowerCase();
    return auditableAssets.find((asset) => {
      return (
        asset.asset_tag?.toLowerCase() === normalized ||
        asset.serial_number?.toLowerCase() === normalized
      );
    });
  }

  function handleScannedCode(code: string) {
    const asset = findAssetByScanCode(code);
    if (!asset) {
      setScannerStatus(`No asset found for code: ${code}`);
      return false;
    }

    setManualScanCode(code);
    setScannerStatus(`Matched asset: ${asset.asset_tag} - ${asset.item_name}`);
    startAuditForAsset(asset);
    stopScanner();
    return true;
  }

  async function startScanner() {
    if (!scannerSupported) {
      setScannerStatus("Camera scanner is not supported on this browser. Use manual code entry below.");
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

      const detector = new window.BarcodeDetector!({
        formats: ["qr_code", "code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e"],
      });

      const scan = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          scanLoopRef.current = window.setTimeout(scan, 500);
          return;
        }

        try {
          const results = await detector.detect(videoRef.current);
          const value = results?.[0]?.rawValue;
          if (value) {
            const matched = handleScannedCode(value);
            if (matched) return;
          }
        } catch {
          // ignore scan loop errors and continue retrying
        }

        scanLoopRef.current = window.setTimeout(scan, 700);
      };

      scan();
    } catch (error) {
      setScannerStatus("Unable to access camera. Check camera permission and try again.");
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

  function resetFilters() {
    setSearch("");
    setDivisionFilter("All");
    setDepartmentFilter("All");
    setStatusFilter("All");
    setPriorityFilter("All");
    setDateFilter("");
    setAssetTypeFilter("All");
  }

  function setAllChecks(value: boolean) {
    setDeviceCheckForm((prev) => {
      const next = { ...prev };
      for (const key of CHECK_KEYS) next[key] = value as never;
      return next;
    });
  }

  function flagCriticalIssue() {
    setDeviceCheckForm((prev) => ({
      ...prev,
      issueDetected: true,
      priorityLevel: "Critical",
      remarks: prev.remarks || "Critical issue detected during audit. Requires urgent attention.",
    }));
  }

  function startAuditForAsset(asset: ITAsset) {
    setDeviceCheckForm((prev) => ({
      ...prev,
      assetId: String(asset.id),
    }));
    setOpenSection("audit");
    setQuickAuditMode(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function loadAssetForEdit(asset: ITAsset) {
    setEditingAssetId(asset.id);
    setAssetForm({
      assetTag: asset.asset_tag || "",
      itemName: asset.item_name || "",
      category: asset.category || "",
      brand: asset.brand || "",
      model: asset.model || "",
      serialNumber: asset.serial_number || "",
      quantity: String(asset.quantity || 1),
      condition: (asset.condition as AssetCondition) || "Good",
      status: (asset.status as AssetStatus) || "In Store",
      assignedTo: asset.assigned_to || "",
      location: asset.location || "",
      supplier: asset.supplier || "",
      purchaseDate: asset.purchase_date || "",
      warrantyExpiry: asset.warranty_expiry || "",
      notes: asset.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openQrForAsset(asset: ITAsset) {
    setQrAssetId(asset.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingAssetId(null);
    setAssetForm(EMPTY_ASSET_FORM);
  }

  async function handleDeleteAsset(assetId: number) {
    const ok = window.confirm("Delete this inventory item? This cannot be undone.");
    if (!ok) return;

    const { error } = await supabase.from("it_assets").delete().eq("id", assetId);
    if (error) {
      alert(error.message);
      return;
    }

    await refreshAll({ silent: true, showRefreshing: false });
    setLiveUpdateMessage("Inventory item deleted");
    alert("Inventory item deleted.");
  }

  async function handleDeleteAudit(auditId: number) {
    const ok = window.confirm("Delete this audit record? This cannot be undone.");
    if (!ok) return;

    const { error } = await supabase.from("device_status_checks").delete().eq("id", auditId);
    if (error) {
      alert(error.message);
      return;
    }

    if (selectedCheckId === auditId) setSelectedCheckId(null);
    await refreshAll({ silent: true, showRefreshing: false });
    setLiveUpdateMessage("Audit record deleted");
    alert("Audit record deleted.");
  }

  async function handleAddAsset(e: React.FormEvent) {
    e.preventDefault();

    if (!assetForm.assetTag || !assetForm.itemName || !assetForm.category || !assetForm.location) {
      alert("Please fill Asset Tag, Item Name, Category, and Location.");
      return;
    }

    setSavingAsset(true);

    const payload = {
      asset_tag: assetForm.assetTag,
      item_name: assetForm.itemName,
      category: assetForm.category,
      brand: assetForm.brand || null,
      model: assetForm.model || null,
      serial_number: assetForm.serialNumber || null,
      quantity: Number(assetForm.quantity) || 1,
      condition: assetForm.condition,
      status: assetForm.status,
      assigned_to: assetForm.assignedTo || null,
      location: assetForm.location,
      supplier: assetForm.supplier || null,
      purchase_date: assetForm.purchaseDate || null,
      warranty_expiry: assetForm.warrantyExpiry || null,
      notes: assetForm.notes || null,
    };

    const response = editingAssetId
      ? await supabase.from("it_assets").update(payload).eq("id", editingAssetId)
      : await supabase.from("it_assets").insert([payload]);

    if (response.error) {
      setSavingAsset(false);
      alert(response.error.message);
      return;
    }

    setAssetForm(EMPTY_ASSET_FORM);
    setEditingAssetId(null);
    await refreshAll({ silent: true, showRefreshing: false });
    setSavingAsset(false);
    setLiveUpdateMessage(editingAssetId ? "Inventory item updated successfully" : "Inventory item added successfully");
    alert(editingAssetId ? "Inventory item updated successfully." : "Asset added to inventory successfully.");
  }

  async function handleSaveDeviceCheck(e: React.FormEvent) {
    e.preventDefault();

    if (
      !deviceCheckForm.assetId ||
      !deviceCheckForm.inspectedBy ||
      !deviceCheckForm.division ||
      !deviceCheckForm.department ||
      !deviceCheckForm.officeArea
    ) {
      alert("Please select asset, inspector, division, department, and office/area.");
      return;
    }

    const asset = assets.find((item) => item.id === Number(deviceCheckForm.assetId));
    if (!asset) {
      alert("Asset not found.");
      return;
    }

    setSavingDeviceCheck(true);

    const healthScore = calculateHealthScore(deviceCheckForm);
    const finalStatus = calculateAutoStatus(
      healthScore,
      deviceCheckForm.issueDetected,
      deviceCheckForm.priorityLevel
    );

    const payload = {
      asset_id: asset.id,
      asset_tag: asset.asset_tag,
      item_name: asset.item_name,
      category: asset.category,
      location: asset.location,
      assigned_to: asset.assigned_to,
      inspected_by: deviceCheckForm.inspectedBy,
      inspection_date: deviceCheckForm.inspectionDate,
      division: deviceCheckForm.division,
      department: deviceCheckForm.department,
      office_area: deviceCheckForm.officeArea,
      assigned_role: deviceCheckForm.assignedRole || null,

      monitor_ok: deviceCheckForm.monitorOk,
      keyboard_ok: deviceCheckForm.keyboardOk,
      mouse_ok: deviceCheckForm.mouseOk,
      cpu_ok: deviceCheckForm.cpuOk,
      ports_ok: deviceCheckForm.portsOk,
      cables_ok: deviceCheckForm.cablesOk,
      cleanliness_ok: deviceCheckForm.cleanlinessOk,

      power_on_ok: deviceCheckForm.powerOnOk,
      boot_ok: deviceCheckForm.bootOk,
      noise_ok: deviceCheckForm.noiseOk,
      overheating_ok: deviceCheckForm.overheatingOk,
      performance_ok: deviceCheckForm.performanceOk,

      os_ok: deviceCheckForm.osOk,
      windows_activated_ok: deviceCheckForm.windowsActivatedOk,
      windows_updated_ok: deviceCheckForm.windowsUpdatedOk,
      antivirus_installed_ok: deviceCheckForm.antivirusInstalledOk,
      antivirus_updated_ok: deviceCheckForm.antivirusUpdatedOk,
      virus_free_ok: deviceCheckForm.virusFreeOk,

      office_installed_ok: deviceCheckForm.officeInstalledOk,
      office_activated_ok: deviceCheckForm.officeActivatedOk,
      browser_ok: deviceCheckForm.browserOk,
      pdf_reader_ok: deviceCheckForm.pdfReaderOk,

      internet_ok: deviceCheckForm.internetOk,
      lan_ok: deviceCheckForm.lanOk,

      issue_detected: deviceCheckForm.issueDetected,
      priority_level: deviceCheckForm.priorityLevel,
      final_status: finalStatus,
      health_score: healthScore,
      remarks: deviceCheckForm.remarks || null,
    };

    const { error } = await supabase.from("device_status_checks").insert([payload]);
    if (error) {
      setSavingDeviceCheck(false);
      alert(error.message);
      return;
    }

    const currentIndex = auditableAssets.findIndex((item) => item.id === Number(deviceCheckForm.assetId));
    const nextAsset = currentIndex >= 0 ? auditableAssets[currentIndex + 1] : null;

    setDeviceCheckForm({
      ...EMPTY_DEVICE_CHECK_FORM,
      inspectedBy: deviceCheckForm.inspectedBy,
      inspectionDate: deviceCheckForm.inspectionDate,
      division: deviceCheckForm.division,
      department: deviceCheckForm.department,
      officeArea: deviceCheckForm.officeArea,
      assignedRole: deviceCheckForm.assignedRole,
      assetId: nextAsset ? String(nextAsset.id) : "",
    });

    if (!nextAsset) {
      setQuickAuditMode(false);
    }

    await refreshAll({ silent: true, showRefreshing: false });
    setSavingDeviceCheck(false);
    setLiveUpdateMessage(nextAsset ? "Audit saved. Next asset loaded" : "Audit saved successfully");
    alert(nextAsset ? "Audit saved. Moved to next asset." : "Audit saved successfully.");
  }

  function buildPrintHtml(rows: DeviceStatusCheck[]) {
    const tableRows = rows
      .map(
        (check) => `
          <tr>
            <td>${check.inspection_date || "-"}</td>
            <td>${check.asset_tag || "-"}</td>
            <td>${check.item_name || "-"}</td>
            <td>${check.division || "-"}</td>
            <td>${check.department || "-"}</td>
            <td>${check.office_area || "-"}</td>
            <td>${check.assigned_role || "-"}</td>
            <td>${check.inspected_by || "-"}</td>
            <td>${check.priority_level || "-"}</td>
            <td>${check.final_status || "-"}</td>
            <td>${check.health_score ?? "-"}</td>
          </tr>
        `
      )
      .join("");

    return `
      <html>
        <head>
          <title>KOPKOP College ICT Asset Audit Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { margin: 0 0 8px; }
            p { margin: 0 0 18px; color: #444; }
            .summary { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin: 18px 0 24px; }
            .card { border: 1px solid #ddd; border-radius: 12px; padding: 12px; }
            .card h3 { margin: 0; font-size: 12px; color: #666; text-transform: uppercase; }
            .card p { margin: 6px 0 0; font-size: 22px; font-weight: bold; color: #111; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #999; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>KOPKOP College ICT Asset Audit & Compliance System</h1>
          <p>Generated: ${new Date().toLocaleString()}<br />Total Checks: ${rows.length}</p>
          <div class="summary">
            <div class="card"><h3>Total Checks</h3><p>${rows.length}</p></div>
            <div class="card"><h3>Operational</h3><p>${rows.filter((r) => r.final_status === "Operational").length}</p></div>
            <div class="card"><h3>Minor</h3><p>${rows.filter((r) => r.final_status === "Needs Minor Repair").length}</p></div>
            <div class="card"><h3>Major</h3><p>${rows.filter((r) => r.final_status === "Needs Major Repair").length}</p></div>
            <div class="card"><h3>Out</h3><p>${rows.filter((r) => r.final_status === "Out of Service").length}</p></div>
            <div class="card"><h3>Critical</h3><p>${rows.filter((r) => r.priority_level === "Critical").length}</p></div>
            <div class="card"><h3>Average Score</h3><p>${rows.length ? Math.round(rows.reduce((a,b)=>a+(b.health_score||0),0)/rows.length) : 0}%</p></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Asset Tag</th>
                <th>Item</th>
                <th>Division</th>
                <th>Department</th>
                <th>Office / Area</th>
                <th>Assigned Role</th>
                <th>Inspector</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Health Score</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `;
  }

  function printReport() {
    if (filteredChecks.length === 0) {
      alert("No checks available to print.");
      return;
    }
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) {
      alert("Please allow pop-ups to print the report.");
      return;
    }
    printWindow.document.write(buildPrintHtml(filteredChecks));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function printSummaryReport() {
    const rows = reportSummary.byDepartment
      .map(([department, count]) => `<tr><td>${department}</td><td>${count}</td></tr>`)
      .join("");

    const html = `
      <html>
        <head>
          <title>KOPKOP College Summary Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1, h2 { margin: 0 0 10px; }
            p { margin: 0 0 16px; color: #444; }
            .grid { display:grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 18px 0 24px; }
            .card { border: 1px solid #ddd; border-radius: 12px; padding: 12px; }
            .label { font-size: 12px; color: #666; text-transform: uppercase; }
            .value { margin-top: 8px; font-size: 26px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th, td { border: 1px solid #999; padding: 8px; text-align: left; }
            th { background: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>KOPKOP College ICT Asset Audit Summary Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <div class="grid">
            <div class="card"><div class="label">Total Checks</div><div class="value">${reportSummary.total}</div></div>
            <div class="card"><div class="label">Operational</div><div class="value">${reportSummary.operational}</div></div>
            <div class="card"><div class="label">Minor Repair</div><div class="value">${reportSummary.minor}</div></div>
            <div class="card"><div class="label">Major Repair</div><div class="value">${reportSummary.major}</div></div>
            <div class="card"><div class="label">Out of Service</div><div class="value">${reportSummary.out}</div></div>
            <div class="card"><div class="label">Critical</div><div class="value">${reportSummary.critical}</div></div>
            <div class="card"><div class="label">Average Score</div><div class="value">${reportSummary.avgScore}%</div></div>
            <div class="card"><div class="label">Filter Department</div><div class="value" style="font-size:18px">${departmentFilter}</div></div>
          </div>
          <h2>Checks by Department</h2>
          <table>
            <thead><tr><th>Department</th><th>Total Checks</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="2">No data</td></tr>'}</tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) {
      alert("Please allow pop-ups to print the report.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function printFaultReport() {
    const faultRows = filteredChecks.filter(
      (c) =>
        c.final_status === "Needs Major Repair" ||
        c.final_status === "Out of Service" ||
        c.priority_level === "Critical"
    );

    if (faultRows.length === 0) {
      alert("No fault records found for the current filters.");
      return;
    }

    const html = buildPrintHtml(faultRows);
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) {
      alert("Please allow pop-ups to print the report.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold">KOPKOP College ICT Asset Audit & Compliance System</h1>
              <p className="mt-2 text-sm text-slate-200">
                Official school-wide inventory, pending audit, compliance, and reporting platform.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={printReport}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900"
              >
                Full Report
              </button>
              <button
                type="button"
                onClick={printSummaryReport}
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white"
              >
                Summary Report
              </button>
              <button
                type="button"
                onClick={printFaultReport}
                className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Fault Report
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {(alertSummary.criticalChecks.length > 0 || alertSummary.outOfServiceChecks.length > 0) && (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-red-800">Attention Required</h2>
                <p className="text-sm text-red-700">
                  {alertSummary.criticalChecks.length} critical device(s) and {alertSummary.outOfServiceChecks.length} out-of-service device(s) need follow-up.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {alertSummary.criticalChecks.slice(0, 4).map((check) => (
                  <span key={`critical-${check.id}`} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-700">
                    {check.asset_tag || "Unknown"} · Critical
                  </span>
                ))}
                {alertSummary.outOfServiceChecks.slice(0, 4).map((check) => (
                  <span key={`out-${check.id}`} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-700">
                    {check.asset_tag || "Unknown"} · Out
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-800">{liveMessage}</p>
              <p className="text-xs text-emerald-700">
                {lastSyncedAt ? `Last synced at ${lastSyncedAt}` : "Waiting for first sync..."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => refreshAll({ silent: false, showRefreshing: true })}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {refreshing ? "Refreshing..." : "Refresh now"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-9">
          <StatCard label="Inventory Assets" value={stats.totalAssets} hint="All items in it_assets" />
          <StatCard label="Desktop Assets" value={stats.desktops} hint="Assets matching desktop / pc / cpu" />
          <StatCard label="Pending Audits" value={stats.pendingAudits} hint="No saved audit yet" />
          <StatCard label="Total Checks" value={stats.totalChecks} hint="Current filtered result" />
          <StatCard label="Operational" value={stats.operational} hint="Ready for use" />
          <StatCard label="Minor Repair" value={stats.minor} hint="Needs small fixes" />
          <StatCard label="Major Repair" value={stats.major} hint="Needs strong attention" />
          <StatCard label="Out of Service" value={stats.out} hint="Not usable right now" />
          <StatCard label="Critical" value={stats.critical} hint="Urgent follow-up" />
        </div>

        {selectedQrAsset ? (
          <div className="mt-6 rounded-3xl bg-slate-50 p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">QR Generator</h2>
                <p className="text-sm text-slate-500">
                  Print or download this QR code and stick it on the device for faster audits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQrAssetId(null)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Close QR
              </button>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <QRCodeCard
                value={selectedQrAsset.asset_tag}
                label={`${selectedQrAsset.asset_tag} - Asset Tag`}
                subtitle={`${selectedQrAsset.item_name} • ${selectedQrAsset.location || "No location"}`}
              />
              {selectedQrAsset.serial_number ? (
                <QRCodeCard
                  value={selectedQrAsset.serial_number}
                  label={`${selectedQrAsset.asset_tag} - Serial Number`}
                  subtitle={`${selectedQrAsset.item_name} • ${selectedQrAsset.location || "No location"}`}
                />
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
                  No serial number saved for this asset yet. Add one if you want a second QR code.
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Report Average Score</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{reportSummary.avgScore}%</p>
            <p className="mt-2 text-xs text-slate-500">Average for current filtered checks</p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Current Faults</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{reportSummary.major + reportSummary.out}</p>
            <p className="mt-2 text-xs text-slate-500">Major repair plus out of service</p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Critical Devices</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{reportSummary.critical}</p>
            <p className="mt-2 text-xs text-slate-500">Urgent action from current filters</p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Top Department</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{reportSummary.byDepartment[0]?.[0] || "-"}</p>
            <p className="mt-2 text-xs text-slate-500">Most checks in current filtered result</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">Reports Dashboard</h2>
              <p className="text-sm text-slate-500">
                Use the current filters to generate department, summary, and fault reports.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={printSummaryReport}
                className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Print Summary
              </button>
              <button
                type="button"
                onClick={printFaultReport}
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Print Fault Report
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Checks by Department</h3>
              <div className="mt-4 space-y-3">
                {reportSummary.byDepartment.length === 0 ? (
                  <p className="text-sm text-slate-500">No report data for current filters.</p>
                ) : (
                  reportSummary.byDepartment.slice(0, 8).map(([department, count]) => (
                    <div key={department} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="text-sm font-medium text-slate-800">{department}</span>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                        {count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Report Summary</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operational</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{reportSummary.operational}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Minor Repair</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{reportSummary.minor}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Major Repair</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{reportSummary.major}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Out of Service</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{reportSummary.out}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm order-2 xl:order-1">
            <div className="mb-4">
              <h2 className="text-xl font-bold">{editingAssetId ? "Edit Inventory Item" : "Add Asset to Inventory"}</h2>
              <p className="text-sm text-slate-500">
                {editingAssetId ? "Update the selected inventory item and save your changes." : "Add a device here first, then it will appear in the inventory and audit workflow."}
              </p>
            </div>

            <form onSubmit={handleAddAsset} className="grid gap-4 sm:grid-cols-2">
              <input className="rounded-2xl border p-3" placeholder="Asset Tag" value={assetForm.assetTag} onChange={(e) => setAssetForm({ ...assetForm, assetTag: e.target.value })} />
              <input className="rounded-2xl border p-3" placeholder="Item Name" value={assetForm.itemName} onChange={(e) => setAssetForm({ ...assetForm, itemName: e.target.value })} />
              <input className="rounded-2xl border p-3" placeholder="Category" value={assetForm.category} onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })} />
              <input className="rounded-2xl border p-3" placeholder="Location" value={assetForm.location} onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })} />
              <input className="rounded-2xl border p-3" placeholder="Brand" value={assetForm.brand} onChange={(e) => setAssetForm({ ...assetForm, brand: e.target.value })} />
              <input className="rounded-2xl border p-3" placeholder="Model" value={assetForm.model} onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })} />
              <input className="rounded-2xl border p-3" placeholder="Serial Number" value={assetForm.serialNumber} onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })} />
              <input type="number" min="1" className="rounded-2xl border p-3" placeholder="Quantity" value={assetForm.quantity} onChange={(e) => setAssetForm({ ...assetForm, quantity: e.target.value })} />
              <select className="rounded-2xl border p-3" value={assetForm.condition} onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value as AssetCondition })}>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Damaged">Damaged</option>
              </select>
              <select className="rounded-2xl border p-3" value={assetForm.status} onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value as AssetStatus })}>
                <option value="In Store">In Store</option>
                <option value="In Use">In Use</option>
                <option value="Under Repair">Under Repair</option>
                <option value="Damaged">Damaged</option>
                <option value="Lost">Lost</option>
                <option value="Retired">Retired</option>
              </select>
              <input className="rounded-2xl border p-3 sm:col-span-2" placeholder="Notes" value={assetForm.notes} onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })} />
              <div className="sm:col-span-2 flex flex-wrap gap-3">
                {editingAssetId ? (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700"
                  >
                    Cancel Edit
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={savingAsset}
                  className="rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-60"
                >
                  {savingAsset ? (editingAssetId ? "Updating..." : "Adding Asset...") : (editingAssetId ? "Update Inventory Item" : "Add to Inventory")}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm order-1 xl:order-2">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">New Audit Check</h2>
                <p className="text-sm text-slate-500">
                  Audit any inventory asset, not just desktops.
                </p>
              </div>
              <div className={`rounded-2xl px-4 py-3 text-center ${scoreTone(liveScore)}`}>
                <p className="text-xs font-semibold uppercase tracking-wide">Health Score</p>
                <p className="text-2xl font-bold">{liveScore}%</p>
                <p className="text-xs">Auto Status: {autoStatus}</p>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <MobileQuickButton
                label="Standard Audit"
                active={!quickAuditMode}
                onClick={() => setQuickAuditMode(false)}
              />
              <MobileQuickButton
                label="Quick Audit Mode"
                active={quickAuditMode}
                onClick={() => setQuickAuditMode(true)}
              />
            </div>

            <div className="mb-4 rounded-3xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                    Barcode / QR Scanner
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Scan an asset tag with your phone camera to load the device instantly.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={startScanner}
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Open Camera Scanner
                  </button>
                  {scannerOpen ? (
                    <button
                      type="button"
                      onClick={stopScanner}
                      className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Stop Scanner
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
                <div className="rounded-2xl bg-slate-900 p-3">
                  {scannerOpen ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-64 w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/20 text-center text-sm text-slate-300">
                      Camera preview will appear here when the scanner starts.
                    </div>
                  )}
                </div>

                <form onSubmit={handleManualScanSubmit} className="rounded-2xl bg-slate-50 p-4">
                  <label className="text-sm font-semibold text-slate-700">
                    Manual asset tag / serial entry
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border p-3"
                    placeholder="Example: KC-PC-001"
                    value={manualScanCode}
                    onChange={(e) => setManualScanCode(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="mt-3 w-full rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Load Asset
                  </button>
                  <p className="mt-3 text-xs text-slate-500">
                    Use this fallback if camera scan is not supported on the device.
                  </p>
                </form>
              </div>

              {scannerStatus ? (
                <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {scannerStatus}
                </div>
              ) : null}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => setAllChecks(true)} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">
                Mark All OK
              </button>
              <button type="button" onClick={() => setAllChecks(false)} className="rounded-2xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                Mark All Not OK
              </button>
              <button type="button" onClick={flagCriticalIssue} className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white">
                Flag Critical Device
              </button>
            </div>

            <form onSubmit={handleSaveDeviceCheck} className="grid gap-4">
              <select className="rounded-2xl border p-3" value={deviceCheckForm.assetId} onChange={(e) => setDeviceCheckForm({ ...deviceCheckForm, assetId: e.target.value })}>
                <option value="">Select Inventory Asset</option>
                {auditableAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_tag} - {asset.item_name} {asset.location ? `(${asset.location})` : ""}
                  </option>
                ))}
              </select>

              <div className="grid gap-4 sm:grid-cols-2">
                <input className="rounded-2xl border p-3" placeholder="Inspected By" value={deviceCheckForm.inspectedBy} onChange={(e) => setDeviceCheckForm({ ...deviceCheckForm, inspectedBy: e.target.value })} />
                <input type="date" className="rounded-2xl border p-3" value={deviceCheckForm.inspectionDate} onChange={(e) => setDeviceCheckForm({ ...deviceCheckForm, inspectionDate: e.target.value })} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <select className="rounded-2xl border p-3" value={deviceCheckForm.division} onChange={(e) => setDeviceCheckForm({ ...deviceCheckForm, division: e.target.value, department: "", officeArea: "", assignedRole: "" })}>
                  <option value="">Select Division</option>
                  {DIVISIONS.map((division) => (
                    <option key={division} value={division}>{division}</option>
                  ))}
                </select>

                <select className="rounded-2xl border p-3" value={deviceCheckForm.department} onChange={(e) => setDeviceCheckForm({ ...deviceCheckForm, department: e.target.value, officeArea: "", assignedRole: "" })}>
                  <option value="">Select Department</option>
                  {departmentOptionsForForm.map((department) => (
                    <option key={department} value={department}>{department}</option>
                  ))}
                </select>

                <select className="rounded-2xl border p-3" value={deviceCheckForm.officeArea} onChange={(e) => setDeviceCheckForm({ ...deviceCheckForm, officeArea: e.target.value })}>
                  <option value="">Select Office / Area</option>
                  {officeOptionsForForm.map((office) => (
                    <option key={office} value={office}>{office}</option>
                  ))}
                </select>

                <select className="rounded-2xl border p-3" value={deviceCheckForm.assignedRole} onChange={(e) => setDeviceCheckForm({ ...deviceCheckForm, assignedRole: e.target.value })}>
                  <option value="">Select Assigned Role</option>
                  {roleOptionsForForm.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {CHECK_GROUPS.map((group) => (
                <div key={group.title} className="rounded-3xl border border-slate-200 p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">{group.title}</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {group.items.map((field) => (
                      <label key={String(field.key)} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                        <input
                          type="checkbox"
                          checked={Boolean(deviceCheckForm[field.key])}
                          onChange={(e) => setDeviceCheckForm({ ...deviceCheckForm, [field.key]: e.target.checked })}
                        />
                        <span className="text-sm text-slate-800">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                  <input
                    type="checkbox"
                    checked={deviceCheckForm.issueDetected}
                    onChange={(e) => setDeviceCheckForm({ ...deviceCheckForm, issueDetected: e.target.checked })}
                  />
                  <span className="text-sm text-slate-800">Issue Detected</span>
                </label>

                <select className="rounded-2xl border p-3" value={deviceCheckForm.priorityLevel} onChange={(e) => setDeviceCheckForm({ ...deviceCheckForm, priorityLevel: e.target.value as PriorityLevel })}>
                  <option value="Low">Priority: Low</option>
                  <option value="Medium">Priority: Medium</option>
                  <option value="High">Priority: High</option>
                  <option value="Critical">Priority: Critical</option>
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input className="rounded-2xl border p-3 bg-slate-50" value={`Auto Status: ${autoStatus}`} readOnly />
                <input className="rounded-2xl border p-3 bg-slate-50" value={`Health Score: ${liveScore}%`} readOnly />
              </div>

              <textarea className="rounded-2xl border p-3" rows={4} placeholder="Remarks / issues found" value={deviceCheckForm.remarks} onChange={(e) => setDeviceCheckForm({ ...deviceCheckForm, remarks: e.target.value })} />

              <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white px-4 pt-3 sm:-mx-6 sm:px-6">
                <button type="submit" disabled={savingDeviceCheck} className="w-full rounded-2xl bg-cyan-700 px-4 py-4 font-semibold text-white disabled:opacity-60">
                  {savingDeviceCheck ? "Saving Audit..." : (quickAuditMode ? "Save Quick Audit" : "Save Audit")}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <SectionToggle
              title="Inventory Register"
              count={filteredInventoryAssets.length}
              isOpen={openSection === "inventory"}
              onClick={() => setOpenSection(openSection === "inventory" ? "pending" : "inventory")}
            />

            {openSection === "inventory" ? (
              <>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      All inventory items stored in the system, whether audited or not.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAssetTypeFilter("All")}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold ${assetTypeFilter === "All" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                    >
                      All Devices
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssetTypeFilter("Desktop")}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold ${assetTypeFilter === "Desktop" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                    >
                      Desktops
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssetTypeFilter("Laptop")}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold ${assetTypeFilter === "Laptop" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                    >
                      Laptops
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssetTypeFilter("Printer")}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold ${assetTypeFilter === "Printer" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                    >
                      Printers
                    </button>
                  </div>
                </div>

                <div className="max-h-[520px] overflow-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b text-slate-500">
                        <th className="px-3 py-3">Asset Tag</th>
                        <th className="px-3 py-3">Item</th>
                        <th className="px-3 py-3">Category</th>
                        <th className="px-3 py-3">Location</th>
                        <th className="px-3 py-3">Assigned To</th>
                        <th className="px-3 py-3">Inventory Status</th>
                        <th className="px-3 py-3">Last Audit</th>
                        <th className="px-3 py-3">Last Score</th>
                        <th className="px-3 py-3">Last Result</th>
                        <th className="px-3 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={10} className="px-3 py-8 text-center text-slate-500">Loading inventory...</td></tr>
                      ) : filteredInventoryAssets.length === 0 ? (
                        <tr><td colSpan={10} className="px-3 py-8 text-center text-slate-500">No inventory found for this filter.</td></tr>
                      ) : (
                        filteredInventoryAssets.map((asset) => {
                          const latestAudit = latestAuditByAssetId.get(asset.id);
                          const pending = !latestAudit;
                          return (
                            <tr
                              key={asset.id}
                              className={`border-b last:border-b-0 hover:bg-slate-50 ${
                                latestAudit?.priority_level === "Critical" || latestAudit?.final_status === "Out of Service"
                                  ? "bg-red-50"
                                  : ""
                              }`}
                            >
                              <td className="px-3 py-4 font-semibold">{asset.asset_tag}</td>
                              <td className="px-3 py-4">{asset.item_name}</td>
                              <td className="px-3 py-4">{asset.category}</td>
                              <td className="px-3 py-4">{asset.location || "-"}</td>
                              <td className="px-3 py-4">{asset.assigned_to || "-"}</td>
                              <td className="px-3 py-4">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${assetStatusBadge(asset.status || "")}`}>
                                  {asset.status || "-"}
                                </span>
                              </td>
                              <td className="px-3 py-4">{latestAudit ? formatDate(latestAudit.inspection_date) : "-"}</td>
                              <td className="px-3 py-4">{latestAudit?.health_score ?? "-"}</td>
                              <td className="px-3 py-4">
                                {pending ? (
                                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                    Pending Audit
                                  </span>
                                ) : (
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(latestAudit.final_status)}`}>
                                    {latestAudit.final_status}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-4">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startAuditForAsset(asset)}
                                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                                  >
                                    {pending ? "Start Audit" : "Re-Audit"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => loadAssetForEdit(asset)}
                                    className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openQrForAsset(asset)}
                                    className="rounded-xl bg-cyan-700 px-3 py-2 text-xs font-semibold text-white"
                                  >
                                    Generate QR
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAsset(asset.id)}
                                    className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <SectionToggle
              title="Pending Audit List"
              count={filteredPendingAssets.length}
              isOpen={openSection === "pending"}
              onClick={() => setOpenSection(openSection === "pending" ? "audit" : "pending")}
            />

            {openSection === "pending" ? (
              <>
                <p className="text-sm text-slate-500">
                  All inventory items that do not yet have a saved audit record.
                </p>

                <div className="max-h-[420px] overflow-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b text-slate-500">
                        <th className="px-3 py-3">Asset Tag</th>
                        <th className="px-3 py-3">Item</th>
                        <th className="px-3 py-3">Category</th>
                        <th className="px-3 py-3">Location</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">Loading pending audit list...</td></tr>
                      ) : filteredPendingAssets.length === 0 ? (
                        <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">All filtered assets have an audit record.</td></tr>
                      ) : (
                        filteredPendingAssets.map((asset) => (
                          <tr key={asset.id} className="border-b last:border-b-0 hover:bg-slate-50">
                            <td className="px-3 py-4 font-semibold">{asset.asset_tag}</td>
                            <td className="px-3 py-4">{asset.item_name}</td>
                            <td className="px-3 py-4">{asset.category}</td>
                            <td className="px-3 py-4">{asset.location || "-"}</td>
                            <td className="px-3 py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${assetStatusBadge(asset.status || "")}`}>
                                {asset.status || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => startAuditForAsset(asset)}
                                  className="rounded-xl bg-cyan-700 px-3 py-2 text-xs font-semibold text-white"
                                >
                                  Start Audit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAsset(asset.id)}
                                  className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <SectionToggle
              title="Audit Register"
              count={filteredChecks.length}
              isOpen={openSection === "audit"}
              onClick={() => setOpenSection(openSection === "audit" ? "inventory" : "audit")}
            />

            {openSection === "audit" ? (
              <>
                <p className="text-sm text-slate-500">
                  Filter by division, department, status, priority, and date.
                </p>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                  <input className="rounded-2xl border p-3" placeholder="Search asset, office, inspector..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  <select className="rounded-2xl border p-3" value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)}>
                    <option value="All">All Divisions</option>
                    {DIVISIONS.map((division) => (
                      <option key={division} value={division}>{division}</option>
                    ))}
                  </select>
                  <select className="rounded-2xl border p-3" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                    {departmentFilterOptions.map((option) => (
                      <option key={option} value={option}>{option === "All" ? "All Departments" : option}</option>
                    ))}
                  </select>
                  <select className="rounded-2xl border p-3" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="All">All Status</option>
                    <option value="Operational">Operational</option>
                    <option value="Needs Minor Repair">Needs Minor Repair</option>
                    <option value="Needs Major Repair">Needs Major Repair</option>
                    <option value="Out of Service">Out of Service</option>
                  </select>
                  <select className="rounded-2xl border p-3" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                    <option value="All">All Priority</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                  <input type="date" className="rounded-2xl border p-3" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                </div>

                <div className="max-h-[520px] overflow-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b text-slate-500">
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Asset Tag</th>
                        <th className="px-3 py-3">Division</th>
                        <th className="px-3 py-3">Department</th>
                        <th className="px-3 py-3">Office / Area</th>
                        <th className="px-3 py-3">Assigned Role</th>
                        <th className="px-3 py-3">Inspector</th>
                        <th className="px-3 py-3">Priority</th>
                        <th className="px-3 py-3">Score</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={11} className="px-3 py-8 text-center text-slate-500">Loading audit checks...</td></tr>
                      ) : filteredChecks.length === 0 ? (
                        <tr><td colSpan={11} className="px-3 py-8 text-center text-slate-500">No audit checks found.</td></tr>
                      ) : (
                        filteredChecks.map((check) => (
                          <tr
                            key={check.id}
                            className={`border-b last:border-b-0 hover:bg-slate-50 ${
                              check.priority_level === "Critical" ? "bg-red-50" : ""
                            }`}
                          >
                            <td className="px-3 py-4">{formatDate(check.inspection_date)}</td>
                            <td className="px-3 py-4 font-semibold">{check.asset_tag || "-"}</td>
                            <td className="px-3 py-4">{check.division || "-"}</td>
                            <td className="px-3 py-4">{check.department || "-"}</td>
                            <td className="px-3 py-4">{check.office_area || "-"}</td>
                            <td className="px-3 py-4">{check.assigned_role || "-"}</td>
                            <td className="px-3 py-4">{check.inspected_by}</td>
                            <td className="px-3 py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityBadge(check.priority_level || "")}`}>
                                {check.priority_level || "-"}
                              </span>
                            </td>
                            <td className="px-3 py-4">{check.health_score ?? "-"}</td>
                            <td className="px-3 py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(check.final_status)}`}>
                                {check.final_status}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedCheckId(check.id)}
                                  className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAudit(check.id)}
                                  className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {selectedCheck ? (
          <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedCheck.asset_tag || "-"}</h2>
                <p className="text-sm text-slate-500">
                  {selectedCheck.division || "-"} / {selectedCheck.department || "-"} / {selectedCheck.office_area || "-"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCheckId(null)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteAudit(selectedCheck.id)}
                  className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  Delete Audit
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Inspector</p>
                <p className="mt-1 text-sm text-slate-900">{selectedCheck.inspected_by}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned Role</p>
                <p className="mt-1 text-sm text-slate-900">{selectedCheck.assigned_role || "-"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</p>
                <p className="mt-1 text-sm text-slate-900">{selectedCheck.priority_level || "-"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved</p>
                <p className="mt-1 text-sm text-slate-900">{formatDateTime(selectedCheck.created_at)}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-lg font-bold">Hardware</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DetailPill ok={selectedCheck.monitor_ok} label="Monitor" />
                  <DetailPill ok={selectedCheck.keyboard_ok} label="Keyboard" />
                  <DetailPill ok={selectedCheck.mouse_ok} label="Mouse" />
                  <DetailPill ok={selectedCheck.cpu_ok} label="CPU" />
                  <DetailPill ok={selectedCheck.ports_ok} label="Ports" />
                  <DetailPill ok={selectedCheck.cables_ok} label="Cables" />
                  <DetailPill ok={selectedCheck.cleanliness_ok} label="Cleanliness" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold">System Health</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DetailPill ok={selectedCheck.power_on_ok} label="Power" />
                  <DetailPill ok={selectedCheck.boot_ok} label="Boot" />
                  <DetailPill ok={selectedCheck.noise_ok} label="Noise" />
                  <DetailPill ok={selectedCheck.overheating_ok} label="Temperature" />
                  <DetailPill ok={selectedCheck.performance_ok} label="Performance" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold">Software & Security</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DetailPill ok={selectedCheck.os_ok} label="OS" />
                  <DetailPill ok={selectedCheck.windows_activated_ok} label="Windows Activated" />
                  <DetailPill ok={selectedCheck.windows_updated_ok} label="Windows Updated" />
                  <DetailPill ok={selectedCheck.antivirus_installed_ok} label="Antivirus Installed" />
                  <DetailPill ok={selectedCheck.antivirus_updated_ok} label="Antivirus Updated" />
                  <DetailPill ok={selectedCheck.virus_free_ok} label="Virus Free" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold">Applications</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DetailPill ok={selectedCheck.office_installed_ok} label="Office Installed" />
                  <DetailPill ok={selectedCheck.office_activated_ok} label="Office Activated" />
                  <DetailPill ok={selectedCheck.browser_ok} label="Browser" />
                  <DetailPill ok={selectedCheck.pdf_reader_ok} label="PDF Reader" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold">Network</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DetailPill ok={selectedCheck.internet_ok} label="Internet" />
                  <DetailPill ok={selectedCheck.lan_ok} label="LAN" />
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-bold">Remarks</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                {selectedCheck.remarks || "No remarks added."}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
