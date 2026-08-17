
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import MobileAssetCard from "./components/MobileAssetCard";
import ComponentManager from "./components/ComponentManager";
declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats?: string[] }): {
        detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
      };
      getSupportedFormats?: () => Promise<string[]>;
    };
    jsQR?: (
      data: Uint8ClampedArray,
      width: number,
      height: number,
      options?: { inversionAttempts?: "dontInvert" | "onlyInvert" | "attemptBoth" | "invertFirst" }
    ) => { data: string } | null;
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
  // Electrical / solar load register fields (nameplate information, not measured demand)
  power_rating_w: number | null;
  voltage_v: number | null;
  electrical_phase: string | null;
  estimated_hours_per_day: number | null;
  solar_load_relevant: boolean | null;
  electrical_notes: string | null;
  os: string | null;
  ram: string | null;
  system_type: string | null;
  connection_type: string | null;
  ms_office: string | null;
  monitor: string | null;
  keyboard: string | null;
  mouse: string | null;
  charger: string | null;
  headset: string | null;
  storage: string | null;
  processor: string | null;
  gpu: string | null;
  motherboard: string | null;
  bios_version: string | null;
  bios_date: string | null;
  tpm_status: string | null;
  hostname: string | null;
  ip_address: string | null;
  mac_address: string | null;
  photo_front_url: string | null;
  photo_back_url: string | null;
  photo_label_url: string | null;
  online_status: string | null;
  windows_update: string | null;
  desktop_loading_speed: string | null;
  booting_speed: string | null;
  performance: string | null;
  last_seen_at?: string | null;
  last_scan_id?: number | null;
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


type ComponentStatus =
  | "Installed"
  | "In Store"
  | "Removed"
  | "Faulty"
  | "Replaced"
  | "Disposed";

type ComponentCondition =
  | "Good"
  | "Fair"
  | "Faulty"
  | "Damaged";

type ComponentHistoryAction =
  | "Added"
  | "Installed"
  | "Removed"
  | "Replaced"
  | "Marked Faulty"
  | "Returned to Store"
  | "Disposed"
  | "Updated";

type AssetComponent = {
  id: number;
  asset_id: number;
  asset_tag: string | null;

  component_type: string;
  component_name: string;

  brand: string | null;
  model: string | null;
  serial_number: string | null;
  specification: string | null;

  quantity: number;
  status: ComponentStatus;
  condition: ComponentCondition | null;

  installed_date: string | null;
  removed_date: string | null;

  supplier: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;

  location: string | null;

  installed_by: string | null;
  removed_by: string | null;

  notes: string | null;

  created_at: string;
  updated_at: string;
};

type AssetComponentHistory = {
  id: number;
  component_id: number | null;
  asset_id: number | null;
  asset_tag: string | null;

  component_type: string | null;
  component_name: string | null;

  action: ComponentHistoryAction;

  previous_status: string | null;
  new_status: string | null;

  performed_by: string | null;
  action_date: string;

  reason: string | null;
  notes: string | null;

  created_at: string;
};

type ComponentFormState = {
  id: number | null;
  assetId: string;
  assetTag: string;

  componentType: string;
  componentName: string;

  brand: string;
  model: string;
  serialNumber: string;
  specification: string;

  quantity: string;
  status: ComponentStatus;
  condition: ComponentCondition;

  installedDate: string;
  removedDate: string;

  supplier: string;
  purchaseDate: string;
  warrantyExpiry: string;

  location: string;

  installedBy: string;
  removedBy: string;

  notes: string;
};
type MaintenanceStatus = "Open" | "In Progress" | "Waiting for Parts" | "Completed" | "Cancelled";
type MaintenancePriority = "Low" | "Medium" | "High" | "Critical";
type MaintenanceEvidenceSlot = "before" | "work" | "completed";

type MaintenanceEvidencePhoto = {
  slot: MaintenanceEvidenceSlot;
  label: string;
  url: string;
  path: string;
};

type MaintenanceRecord = {
  id: number;
  asset_id: number | null;
  asset_tag: string | null;
  item_name: string | null;
  issue: string | null;
  priority: MaintenancePriority | null;
  status: MaintenanceStatus | null;
  assigned_to: string | null;
  reported_by: string | null;
  technician: string | null;
  notes: string | null;
  action_taken: string | null;
  resolution_notes: string | null;
  date_reported: string | null;
  repair_date: string | null;
  closed_date: string | null;
  last_status_change: string | null;
  previous_asset_status: AssetStatus | null;
  created_at: string;
  updated_at: string | null;
};

type MaintenanceFormState = {
  id: number | null;
  assetId: string;
  assetTag: string;
  itemName: string;
  issue: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedTo: string;
  reportedBy: string;
  technician: string;
  notes: string;
  actionTaken: string;
  resolutionNotes: string;
  dateReported: string;
  repairDate: string;
  previousAssetStatus: AssetStatus;
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
  powerRatingW: string;
  voltageV: string;
  electricalPhase: string;
  estimatedHoursPerDay: string;
  solarLoadRelevant: boolean;
  electricalNotes: string;
  os: string;
  ram: string;
  systemType: string;
  connectionType: string;
  msOffice: string;
  monitor: string;
  keyboard: string;
  mouse: string;
  charger: string;
  headset: string;
  storage: string;
  processor: string;
  gpu: string;
  motherboard: string;
  biosVersion: string;
  biosDate: string;
  tpmStatus: string;
  hostname: string;
  ipAddress: string;
  macAddress: string;
  photoFrontUrl: string;
  photoBackUrl: string;
  photoLabelUrl: string;
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
  operationalStatus: "Operational" | "Limited Service" | "Unavailable" | "Out of Service";
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
  powerRatingW: "",
  voltageV: "",
  electricalPhase: "",
  estimatedHoursPerDay: "",
  solarLoadRelevant: false,
  electricalNotes: "",
  os: "",
  ram: "",
  systemType: "",
  connectionType: "",
  msOffice: "",
  monitor: "",
  keyboard: "",
  mouse: "",
  charger: "",
  headset: "",
  storage: "",
  processor: "",
  gpu: "",
  motherboard: "",
  biosVersion: "",
  biosDate: "",
  tpmStatus: "",
  hostname: "",
  ipAddress: "",
  macAddress: "",
  photoFrontUrl: "",
  photoBackUrl: "",
  photoLabelUrl: "",
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

const EMPTY_MAINTENANCE_FORM: MaintenanceFormState = {
  id: null,
  assetId: "",
  assetTag: "",
  itemName: "",
  issue: "",
  priority: "Medium",
  status: "Open",
  assignedTo: "",
  reportedBy: "IT Staff",
  technician: "",
  notes: "",
  actionTaken: "",
  resolutionNotes: "",
  dateReported: new Date().toISOString().slice(0, 10),
  repairDate: "",
  previousAssetStatus: "In Use",
};

const EMPTY_COMPONENT_FORM: ComponentFormState = {
  id: null,
  assetId: "",
  assetTag: "",

  componentType: "RAM",
  componentName: "",

  brand: "",
  model: "",
  serialNumber: "",
  specification: "",

  quantity: "1",
  status: "Installed",
  condition: "Good",

  installedDate: new Date().toISOString().slice(0, 10),
  removedDate: "",

  supplier: "",
  purchaseDate: "",
  warrantyExpiry: "",

  location: "",

  installedBy: "",
  removedBy: "",

  notes: "",
};




const DEVICE_CATEGORIES = [
  "Desktop",
  "Laptop",
  "Server",
  "Monitor",
  "Projector",
  "Printer",
  "Scanner",
  "UPS",
  "Router",
  "Network Switch",
  "Wireless Access Point",
  "NVR / DVR",
  "CCTV Camera",
  "IP Phone",
  "Tablet",
  "External Storage",
  "Keyboard",
  "Mouse",
  // Electrical equipment categories used for Admin Building / solar load documentation
  "Air Conditioner",
  "Fluorescent Light",
  "LED Light",
  "Refrigerator",
  "Electric Kettle",
  "Urn / Hot Water Dispenser",
  "Microwave",
  "Water Dispenser / Cooler",
  "Photocopier",
  "Electrical Appliance",
  "Other",
] as const;

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

function calculateDeviceAge(value?: string | null) {
  if (!value) return "Not available";
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return "Not available";
  const today = new Date();
  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  if (today.getDate() < start.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years < 0) return "Not available";
  const parts = [];
  if (years) parts.push(`${years} year${years === 1 ? "" : "s"}`);
  if (months || !years) parts.push(`${months} month${months === 1 ? "" : "s"}`);
  return parts.join(" ");
}

function getWarrantyStatus(value?: string | null) {
  if (!value) return "Not recorded";
  const expiry = new Date(value);
  if (Number.isNaN(expiry.getTime())) return "Not recorded";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  if (days === 0) return "Expires today";
  return `Active - ${days} day${days === 1 ? "" : "s"} remaining`;
}

function liveOnlineStatus(asset: ITAsset) {
  if (!asset.last_seen_at) {
    return asset.online_status || "Unknown";
  }

  const lastSeenTime = new Date(asset.last_seen_at).getTime();

  if (!Number.isFinite(lastSeenTime)) {
    return asset.online_status || "Unknown";
  }

  const ageMinutes = (Date.now() - lastSeenTime) / (1000 * 60);

  if (ageMinutes <= 15) return "Online";
  if (ageMinutes <= 24 * 60) return "Recently Seen";
  return "Offline";
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
    case "active repair ticket":
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

function maintenanceIssueText(record?: MaintenanceRecord | null) {
  if (!record) return "";

  return [
    record.issue,
    record.notes,
    record.action_taken,
    record.resolution_notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isExternalDependencyIssue(record?: MaintenanceRecord | null) {
  const text = maintenanceIssueText(record);

  const externalDependencyWords = [
    "classroom hdmi",
    "installed hdmi cable",
    "hdmi cable",
    "vga cable",
    "display cable",
    "network cable",
    "ethernet cable",
    "patch cable",
    "faulty cable",
    "damaged cable",
    "wall outlet",
    "power outlet",
    "wall socket",
    "network port",
    "wall port",
    "power point",
  ];

  const deviceConfirmedWorkingWords = [
    "projector powers on",
    "projector is working",
    "projector working",
    "device powers on",
    "device is working",
    "device working",
    "no fault with the projector",
    "no fault with the device",
    "functions correctly",
    "functions normally",
    "all functions operate normally",
    "known working hdmi cable",
  ];

  return (
    externalDependencyWords.some((word) => text.includes(word)) &&
    deviceConfirmedWorkingWords.some((word) => text.includes(word))
  );
}

function hasCriticalDeviceFailure(record?: MaintenanceRecord | null) {
  const text = maintenanceIssueText(record);

  const criticalIssueWords = [
    "will not power",
    "won't power",
    "wont power",
    "no power",
    "does not power",
    "not powering",
    "does not post",
    "no post",
    "not boot",
    "won't boot",
    "wont boot",
    "out of service",
    "dead",
    "amber light",
    "firmware loop",
    "motherboard failure",
    "power supply failure",
  ];

  return criticalIssueWords.some((word) => text.includes(word));
}

function hasWorkingTemporarySolution(record?: MaintenanceRecord | null) {
  const text = maintenanceIssueText(record);

  const workaroundWords = [
    "external monitor",
    "temporary monitor",
    "backup monitor",
    "spare monitor",
    "loan monitor",
    "using an external screen",
    "using external screen",
    "currently in use",
    "still in use",
    "user is using",
    "operating using",
    "operating with",
    "temporary solution",
    "temporary workaround",
    "workaround provided",
    "replacement provided",
    "loan device provided",
    "backup device provided",
    "can still be used",
    "device remains usable",
    "service restored temporarily",
  ];

  return workaroundWords.some((word) => text.includes(word));
}

function getOperationalStatus(
  asset: ITAsset,
  record?: MaintenanceRecord | null
): EnrichedAsset["operationalStatus"] {
  if (!record || record.status === "Completed" || record.status === "Cancelled") {
    if (asset.status === "Damaged" || asset.status === "Lost" || asset.status === "Retired") {
      return "Out of Service";
    }

    if (asset.status === "Under Repair") return "Unavailable";
    return "Operational";
  }

  // A temporary workaround means the user can still work, but not at full normal service.
  if (hasWorkingTemporarySolution(record)) {
    return "Limited Service";
  }

  if (isExternalDependencyIssue(record)) {
    return record.status === "Open" ? "Limited Service" : "Unavailable";
  }

  if (hasCriticalDeviceFailure(record)) return "Out of Service";
  if (record.status === "Waiting for Parts") return "Unavailable";
  return "Limited Service";
}

function maintenanceHealthScore(record?: MaintenanceRecord | null) {
  if (!record || record.status === "Completed" || record.status === "Cancelled") {
    return null;
  }

  // External infrastructure faults affect availability, not the device's hardware health.
  if (isExternalDependencyIssue(record)) {
    return null;
  }

  let score =
    record.status === "Waiting for Parts"
      ? 20
      : record.status === "In Progress"
        ? 30
        : 45;

  if (record.priority === "Critical") score = Math.min(score, 10);
  if (record.priority === "High") score = Math.min(score, 25);

  if (hasCriticalDeviceFailure(record)) {
    score = Math.min(score, 15);
  }

  return score;
}

function computeAssetHealth(
  asset: ITAsset,
  audit?: DeviceStatusCheck | null,
  activeMaintenance?: MaintenanceRecord | null
) {
  const normalScore = audit?.health_score ?? inferHealthScore(asset);
  const repairScore = maintenanceHealthScore(activeMaintenance);
  const score = repairScore === null ? normalScore : Math.min(normalScore, repairScore);
  const label = getHealthLabel(score);
  const alerts = getHealthAlerts(asset);

  if (activeMaintenance) {
    if (hasWorkingTemporarySolution(activeMaintenance)) {
      alerts.unshift("Temporary workaround in use");
    } else if (isExternalDependencyIssue(activeMaintenance)) {
      alerts.unshift("External connection fault");
    } else {
      alerts.unshift(
        activeMaintenance.status === "Waiting for Parts"
          ? "Waiting for repair parts"
          : "Active repair ticket"
      );
    }
  }

  return { score, label, alerts };
}

const PUBLIC_APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://kopkop-it-system.vercel.app").replace(/\/+$/, "");

function buildPublicAssetUrl(assetTag: string) {
  const safeTag = (assetTag || "").trim();
  return `${PUBLIC_APP_URL}/device/${encodeURIComponent(safeTag)}`;
}

function buildQrUrl(value: string, size = 1000) {
  const safeValue = (value || "").trim();
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=20&ecc=H&data=${encodeURIComponent(safeValue)}`;
}

function safeHtml(value?: string | number | null) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeFileName(value: string) {
  return (value || "asset")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function maintenanceEvidenceLabel(slot: MaintenanceEvidenceSlot) {
  switch (slot) {
    case "before":
      return "Before / Fault Evidence";
    case "work":
      return "Work Performed";
    case "completed":
      return "Completed / Tested";
    default:
      return "Maintenance Evidence";
  }
}

function maintenanceEvidenceFolder(ticketId: number) {
  return `maintenance/${ticketId}`;
}

function buildPrintScript() {
  return `
    <script>
      function printWhenReady() {
        const images = Array.from(document.images || []);
        const waitForImage = (img) => new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) return resolve(true);
          img.onload = () => resolve(true);
          img.onerror = () => resolve(true);
          setTimeout(() => resolve(true), 4000);
        });

        Promise.all(images.map(waitForImage)).then(() => {
          setTimeout(() => {
            window.focus();
            window.print();
          }, 350);
        });
      }

      if (document.readyState === "complete") {
        printWhenReady();
      } else {
        window.addEventListener("load", printWhenReady);
      }
    </script>
  `;
}

function lifecycleIcon(type: string) {
  switch (type) {
    case "Current Status":
      return "✓";
    case "Maintenance":
      return "🔧";
    case "Audit":
      return "📋";
    case "Asset Record":
      return "📦";
    case "Purchase":
      return "🧾";
    default:
      return "•";
  }
}

function lifecycleMarkerClass(type: string) {
  switch (type) {
    case "Current Status":
      return "bg-emerald-600";
    case "Maintenance":
      return "bg-orange-500";
    case "Audit":
      return "bg-blue-600";
    case "Asset Record":
      return "bg-violet-600";
    case "Purchase":
      return "bg-slate-600";
    default:
      return "bg-teal-600";
  }
}

function lifecycleAccent(type: string) {
  switch (type) {
    case "Current Status":
      return "#059669";
    case "Maintenance":
      return "#f97316";
    case "Audit":
      return "#2563eb";
    case "Asset Record":
      return "#7c3aed";
    case "Purchase":
      return "#475569";
    default:
      return "#0f766e";
  }
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
  tone?: "emerald" | "amber" | "orange" | "red" | "blue" | "violet" | "slate";
}) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0;
  const toneMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    violet: "bg-violet-500",
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

function OperationalIndicator({
  status,
}: {
  status: EnrichedAsset["operationalStatus"];
}) {
  const className =
    status === "Operational"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "Limited Service"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : status === "Unavailable"
          ? "border-orange-200 bg-orange-50 text-orange-700"
          : "border-red-200 bg-red-50 text-red-700";

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${className}`}>
      <span className="h-2.5 w-2.5 rounded-full bg-current opacity-70" />
      <span>{status}</span>
    </div>
  );
}

function QRLabelCard({ asset }: { asset: ITAsset }) {
  const qrValue = buildPublicAssetUrl(asset.asset_tag);
  const qrUrl = buildQrUrl(qrValue, 1000);
  const subtitle = `${asset.item_name} • ${asset.location || "No location"}`;

  async function handleDownloadQr() {
    try {
      const response = await fetch(qrUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("QR download failed");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${safeFileName(asset.asset_tag)}_qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(qrUrl, "_blank");
    }
  }

  function handlePrintSingle() {
    const safeTag = safeHtml(asset.asset_tag);
    const safeTitle = safeHtml(`${asset.asset_tag} QR Label`);
    const safeSubtitle = safeHtml(subtitle);
    const safeQrUrl = safeHtml(qrUrl);

    const html = `
      <html>
        <head>
          <title>${safeTitle}</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              text-align: center;
              color: #111827;
              background: #ffffff;
            }

            .page {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 12mm;
            }

            .label {
              width: 90mm;
              min-height: 65mm;
              border: 2px solid #0f172a;
              border-radius: 10px;
              padding: 8mm;
              margin: 0 auto;
              background: #ffffff;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .brand {
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: #0f172a;
              margin-bottom: 4px;
            }

            .title {
              font-size: 20px;
              font-weight: 800;
              margin-bottom: 5px;
              color: #0f172a;
              line-height: 1.15;
              word-break: break-word;
            }

            .subtitle {
              font-size: 11px;
              color: #334155;
              margin-bottom: 6px;
              line-height: 1.25;
              min-height: 26px;
            }

            .qr {
              width: 42mm;
              height: 42mm;
              object-fit: contain;
              margin: 4px auto 6px;
              display: block;
              background: #ffffff;
            }

            .value {
              font-size: 14px;
              font-weight: 800;
              color: #111827;
              margin-top: 4px;
              word-break: break-word;
            }

            .meta {
              font-size: 9px;
              color: #475569;
              margin-top: 3px;
            }

            @media print {
              body {
                padding: 0;
              }

              .page {
                min-height: auto;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="label">
              <div class="brand">KOPKOP College ICT</div>
              <div class="title">${safeTag}</div>
              <div class="subtitle">${safeSubtitle}</div>
              <img class="qr" src="${safeQrUrl}" alt="QR Code" />
              <div class="value">${safeTag}</div>
              <div class="meta">Scan with any phone camera to open the public device passport</div>
            </div>
          </div>
          ${buildPrintScript()}
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=700,height=900");
    if (!printWindow) {
      alert("Please allow pop-ups so the QR label can print.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <img
          src={qrUrl}
          alt={`QR code for ${asset.asset_tag}`}
          className="h-56 w-56 rounded-2xl border border-slate-200 bg-white p-2"
        />
        <h3 className="mt-4 text-lg font-bold text-slate-900">{asset.asset_tag}</h3>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        <p className="mt-1 break-all text-xs text-slate-500">Public passport: {qrValue}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={handleDownloadQr} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Download QR
          </button>
          <button type="button" onClick={handlePrintSingle} className="rounded-2xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">
            Print Label
          </button>
        </div>
      </div>
    </div>
  );
}

type DeviceScanHistory = {
  id: number;
  asset_id: number | null;
  discovery_id: number | null;
  hostname: string | null;
  serial_number: string | null;
  ip_address: string | null;
  mac_address: string | null;
  scanned_at: string;
  scan_source: string | null;
  snapshot: any;
};

type HardwareChangeRecord = {
  id: number;
  asset_id: number;
  discovery_id: number | null;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
};

type DeviceDiscoveryRecord = {
  id: number;
  collector_version?: string | null;
  hostname?: string | null;
  serial_number?: string | null;
  mac_address?: string | null;
  payload: any;
  status: "pending" | "imported" | "ignored" | "superseded" | string;
  discovery_type?: "existing_asset" | "new_asset" | null;
  matched_asset_id?: number | null;
  received_at?: string | null;
  imported_at?: string | null;
};

export default function KopkopCollegeICTAssetAuditComplianceSystem() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [assets, setAssets] = useState<ITAsset[]>([]);
  const [deviceChecks, setDeviceChecks] = useState<DeviceStatusCheck[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [assetComponents, setAssetComponents] = useState<AssetComponent[]>([]);
const [componentHistory, setComponentHistory] =
  useState<AssetComponentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingAsset, setSavingAsset] = useState(false);
  const [savingAudit, setSavingAudit] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [savingComponent, setSavingComponent] = useState(false);
const [deletingComponentId, setDeletingComponentId] =
  useState<number | null>(null);
  const [uploadingPhotoSlot, setUploadingPhotoSlot] = useState<"front" | "back" | "label" | null>(null);
  const [maintenanceEvidence, setMaintenanceEvidence] = useState<MaintenanceEvidencePhoto[]>([]);
  const [uploadingMaintenanceEvidenceSlot, setUploadingMaintenanceEvidenceSlot] =
    useState<MaintenanceEvidenceSlot | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<number | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<number | null>(null);
  const [assetForm, setAssetForm] = useState<AssetFormState>(EMPTY_ASSET_FORM);
  const [importingDeviceInfo, setImportingDeviceInfo] = useState(false);
  const [checkingLiveDevice, setCheckingLiveDevice] = useState(false);
  const [pendingLiveDevices, setPendingLiveDevices] = useState(0);
  const [deviceDiscoveries, setDeviceDiscoveries] = useState<DeviceDiscoveryRecord[]>([]);
  const [loadingDiscoveries, setLoadingDiscoveries] = useState(false);
  const [processingDiscoveryId, setProcessingDiscoveryId] = useState<number | null>(null);
  const [activeDiscoveryId, setActiveDiscoveryId] = useState<number | null>(null);
  const [activeDiscoveryMode, setActiveDiscoveryMode] = useState<"create" | "update" | null>(null);
  const [scanHistory, setScanHistory] = useState<DeviceScanHistory[]>([]);
  const [hardwareChanges, setHardwareChanges] = useState<HardwareChangeRecord[]>([]);
  const [autoUpdatingDiscoveryId, setAutoUpdatingDiscoveryId] = useState<number | null>(null);
  const autoProcessedDiscoveryIds = useRef<Set<number>>(new Set());
  const [lastImportedDevice, setLastImportedDevice] = useState<string | null>(null);
  const [auditForm, setAuditForm] = useState<AuditFormState>(EMPTY_AUDIT_FORM);
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceFormState>(EMPTY_MAINTENANCE_FORM);
  const [componentForm, setComponentForm] =
    useState<ComponentFormState>(EMPTY_COMPONENT_FORM);
  const [showComponentForm, setShowComponentForm] = useState(false);
  const [componentBeingReplaced, setComponentBeingReplaced] =
    useState<AssetComponent | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [performanceFilter, setPerformanceFilter] = useState("All");
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "inventory" | "profile" | "scan" | "discovery" | "labels" | "maintenance" | "audit" | "history">("dashboard");
  const [printMode, setPrintMode] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [scannerSupported, setScannerSupported] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerStatus, setScannerStatus] = useState("Ready to scan asset tags or serial numbers.");
  const [manualScanCode, setManualScanCode] = useState("");
  const [labelSearch, setLabelSearch] = useState("");
  const [maintenanceSearch, setMaintenanceSearch] = useState("");
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState("All");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const profileSectionRef = useRef<HTMLDivElement | null>(null);
  const activeContentRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = role === "admin";

  const normalizedAssetCategory = assetForm.category.trim().toLowerCase();

  const isComputerAsset = [
    "desktop",
    "laptop",
    "server",
  ].includes(normalizedAssetCategory);

  const isNetworkAsset = [
    "desktop",
    "laptop",
    "server",
    "printer",
    "router",
    "network switch",
    "wireless access point",
    "nvr / dvr",
    "nvr",
    "dvr",
    "cctv camera",
    "ip phone",
  ].includes(normalizedAssetCategory);

  const showsComputerAccessories = [
    "desktop",
    "laptop",
    "server",
  ].includes(normalizedAssetCategory);

  const showsPerformanceChecks = isComputerAsset;


  useEffect(() => {
    void checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (!session?.user) {
        setRole(null);
        setAuthLoading(false);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check scanner browser support on mount
  useEffect(() => {
    checkScannerSupport();
  }, []);

  async function refreshLiveIntelligence() {
    try {
      const [{ data: scans, error: scanError }, { data: changes, error: changeError }] =
        await Promise.all([
          supabase
            .from("device_scan_history")
            .select("*")
            .order("scanned_at", { ascending: false })
            .limit(100),
          supabase
            .from("asset_hardware_changes")
            .select("*")
            .order("changed_at", { ascending: false })
            .limit(100),
        ]);

      if (scanError) throw scanError;
      if (changeError) throw changeError;

      setScanHistory((scans || []) as DeviceScanHistory[]);
      setHardwareChanges((changes || []) as HardwareChangeRecord[]);
    } catch (error) {
      console.error("Could not load live asset intelligence:", error);
    }
  }

  function friendlyStorageFromDiscovery(payload: any) {
    const disks = payload?.hardware?.storage?.physical_disks;
    if (!Array.isArray(disks) || disks.length === 0) return "";

    return disks
      .map((disk: any) => {
        const size = Number(disk?.size_gb);
        const sizeText = Number.isFinite(size) ? `${Math.round(size)} GB` : "";
        const search = `${disk?.model || ""} ${disk?.media_type || ""}`.toLowerCase();
        const type =
          search.includes("ssd") ||
          search.includes("nvme") ||
          search.includes("solid state") ||
          search.includes("kbg")
            ? "SSD"
            : search.includes("hdd") ||
                search.includes("hard disk") ||
                search.includes("seagate") ||
                search.includes("western digital")
              ? "HDD"
              : "Storage";
        return [sizeText, type].filter(Boolean).join(" ");
      })
      .filter(Boolean)
      .join("; ");
  }

  function isPlaceholderHardwareValue(value?: string | null) {
    const normalized = String(value || "").trim().toLowerCase();

    if (!normalized) return true;

    const placeholders = [
      "system serial number",
      "default string",
      "to be filled by o.e.m.",
      "to be filled by oem",
      "none",
      "unknown",
      "not specified",
      "not applicable",
      "n/a",
      "na",
      "system manufacturer",
      "system product name",
    ];

    return placeholders.includes(normalized);
  }

  function cleanCollectorIdentityValue(value?: string | null) {
    const cleaned = String(value || "").trim();
    return isPlaceholderHardwareValue(cleaned) ? "" : cleaned;
  }

  function normalizeDeviceName(value?: string | null) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/_/g, "-");
  }

  function normalizeSerial(value?: string | null) {
    const cleaned = cleanCollectorIdentityValue(value);
    return cleaned.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function normalizeMac(value?: string | null) {
    return String(value || "")
      .replace(/[^a-f0-9]/gi, "")
      .toLowerCase();
  }

  function collectedTechnicalValues(payload: any) {
    const device = payload?.device || {};
    const os = payload?.operating_system || {};
    const hardware = payload?.hardware || {};
    const memory = hardware?.memory || {};
    const processor = hardware?.processor || {};
    const motherboard = hardware?.motherboard || {};
    const bios = hardware?.bios || {};
    const network = payload?.network || {};
    const security = payload?.security || {};

    return {
      // Ignore generic BIOS placeholders so they do not overwrite good inventory data.
      brand: cleanCollectorIdentityValue(device.manufacturer),
      model: cleanCollectorIdentityValue(device.model),
      serial_number: cleanCollectorIdentityValue(device.serial_number),
      os: [os.caption, os.architecture, os.build_number ? `Build ${os.build_number}` : ""]
        .filter(Boolean)
        .join(" - "),
      ram: memory.total_ram_gb != null ? `${memory.total_ram_gb} GB` : "",
      system_type: String(device.system_type || os.architecture || "").trim(),
      connection_type: String(network.interface || network.adapter_name || "").trim(),
      storage: friendlyStorageFromDiscovery(payload),
      processor: String(processor.name || "").trim(),
      motherboard: [motherboard.manufacturer, motherboard.product, motherboard.version]
        .filter(Boolean)
        .join(" "),
      bios_version: String(bios.version || "").trim(),
      bios_date: String(bios.release_date || "").trim(),
      tpm_status:
        security.tpm_present === false
          ? "TPM not present"
          : [
              security.tpm_present === true ? "TPM present" : "",
              security.tpm_ready === true ? "Ready" : "",
              security.tpm_enabled === true ? "Enabled" : "",
              security.tpm_version ? `Version ${security.tpm_version}` : "",
            ]
              .filter(Boolean)
              .join(" - "),
      hostname: String(device.computer_name || "").trim(),
      ip_address: String(network.ipv4_address || "").trim(),
      mac_address: String(network.mac_address || "").trim(),
    };
  }

  function findAssetForDiscovery(record: DeviceDiscoveryRecord) {
    // If the discovery has already been linked to an asset, use that first.
    if (record.matched_asset_id) {
      const direct = assets.find((asset) => asset.id === record.matched_asset_id);
      if (direct) return direct;
    }

    const payload = record.payload || {};

    const serial = normalizeSerial(
      record.serial_number || payload?.device?.serial_number || ""
    );
    const hostname = normalizeDeviceName(
      record.hostname || payload?.device?.computer_name || ""
    );
    const mac = normalizeMac(
      record.mac_address || payload?.network?.mac_address || ""
    );

    return assets.find((asset) => {
      const assetSerial = normalizeSerial(asset.serial_number);
      const assetHostname = normalizeDeviceName(asset.hostname);

      // Older/manual inventory records may have the Windows computer name
      // stored in item_name instead of hostname, so check both.
      const assetItemName = normalizeDeviceName(asset.item_name);

      const assetMac = normalizeMac(asset.mac_address);

      const serialMatches =
        !!serial && !!assetSerial && serial === assetSerial;

      const hostnameMatches =
        !!hostname &&
        (
          (!!assetHostname && hostname === assetHostname) ||
          (!!assetItemName && hostname === assetItemName)
        );

      const macMatches =
        !!mac && !!assetMac && mac === assetMac;

      return serialMatches || hostnameMatches || macMatches;
    });
  }

  async function automaticallyUpdateExistingDiscovery(
    record: DeviceDiscoveryRecord,
    asset: ITAsset
  ) {
    if (autoProcessedDiscoveryIds.current.has(record.id)) return;

    autoProcessedDiscoveryIds.current.add(record.id);
    setAutoUpdatingDiscoveryId(record.id);

    try {
      const collected = collectedTechnicalValues(record.payload);
      const now = new Date().toISOString();

      const monitoredFields: Array<{
        key: keyof typeof collected;
        assetKey: keyof ITAsset;
        label: string;
      }> = [
        { key: "ram", assetKey: "ram", label: "RAM" },
        { key: "storage", assetKey: "storage", label: "Storage" },
        { key: "bios_version", assetKey: "bios_version", label: "BIOS Version" },
        { key: "os", assetKey: "os", label: "Windows / OS" },
        { key: "processor", assetKey: "processor", label: "Processor" },
        { key: "motherboard", assetKey: "motherboard", label: "Motherboard" },
      ];

      // Compare monitored hardware values semantically, not only as raw text.
      // This prevents false Storage changes such as:
      // "59 GB Storage; 238 GB SSD" -> "238 GB SSD" when the physical SSD is unchanged.
      function normalizeHardwareComparisonValue(label: string, value?: string | null) {
        const raw = String(value || "").trim().toLowerCase();
        if (!raw) return "";

        if (label === "Storage") {
          // Keep only physical-drive capacity/type tokens. Ignore free-space / generic
          // "Storage" fragments because free space changes during normal use.
          const physicalDrives = Array.from(
            raw.matchAll(/(\d+(?:\.\d+)?)\s*(tb|gb)\s*(ssd|hdd)/gi)
          ).map((match) => {
            const size = Number(match[1]);
            const unit = match[2].toLowerCase();
            const type = match[3].toLowerCase();
            const sizeGb = unit === "tb" ? Math.round(size * 1024) : Math.round(size);
            return `${sizeGb}gb-${type}`;
          });

          if (physicalDrives.length > 0) {
            return physicalDrives.sort().join("|");
          }
        }

        return raw.replace(/\s+/g, " " );
      }

      const changes = monitoredFields
        .map(({ key, assetKey, label }) => {
          const oldValue = String(asset[assetKey] || "").trim();
          const newValue = String(collected[key] || "").trim();
          const oldComparable = normalizeHardwareComparisonValue(label, oldValue);
          const newComparable = normalizeHardwareComparisonValue(label, newValue);

          return { label, oldValue, newValue, oldComparable, newComparable };
        })
        .filter(
          (change) =>
            change.newValue &&
            change.oldComparable !== change.newComparable
        );

      const updatePayload = Object.fromEntries(
        Object.entries(collected).filter(([, value]) => String(value || "").trim())
      );

      const { error: updateError } = await supabase
        .from("it_assets")
        .update({
          ...updatePayload,
          online_status: "Online",
          last_seen_at: now,
        })
        .eq("id", asset.id);

      if (updateError) throw updateError;

      const { data: scanRow, error: scanError } = await supabase
        .from("device_scan_history")
        .insert({
          asset_id: asset.id,
          discovery_id: record.id,
          hostname: collected.hostname || record.hostname || null,
          serial_number: collected.serial_number || record.serial_number || null,
          ip_address: collected.ip_address || null,
          mac_address: collected.mac_address || record.mac_address || null,
          scanned_at: now,
          scan_source: "KOPKOP PowerShell Collector",
          snapshot: record.payload,
        })
        .select("id")
        .single();

      if (scanError) throw scanError;

      if (changes.length > 0) {
        const { error: changeError } = await supabase
          .from("asset_hardware_changes")
          .insert(
            changes.map((change) => ({
              asset_id: asset.id,
              discovery_id: record.id,
              field_name: change.label,
              old_value: change.oldValue || null,
              new_value: change.newValue || null,
              changed_at: now,
            }))
          );

        if (changeError) throw changeError;
      }

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      const { error: queueError } = await supabase
        .from("device_discovery_queue")
        .update({
          status: "imported",
          discovery_type: "existing_asset",
          matched_asset_id: asset.id,
          imported_at: now,
          imported_by: currentUser?.id || null,
        })
        .eq("id", record.id);

      if (queueError) throw queueError;

      await Promise.all([
        refreshAll(false),
        refreshDeviceDiscoveries(false),
        refreshLiveIntelligence(),
      ]);
    } catch (error) {
      autoProcessedDiscoveryIds.current.delete(record.id);
      console.error("Automatic asset update failed:", error);
    } finally {
      setAutoUpdatingDiscoveryId(null);
    }
  }

  async function refreshDeviceDiscoveries(showLoading = true) {
    if (showLoading) setLoadingDiscoveries(true);

    try {
      const { data, error } = await supabase
        .from("device_discovery_queue")
        .select("*")
        .order("received_at", { ascending: false });

      if (error) throw error;

      const records = (data || []) as DeviceDiscoveryRecord[];
      setDeviceDiscoveries(records);
      setPendingLiveDevices(
        records.filter((record) => record.status === "pending").length
      );
    } catch (error) {
      console.error("Could not load device discoveries:", error);
    } finally {
      if (showLoading) setLoadingDiscoveries(false);
    }
  }

  // Listen for live device collector submissions.
  useEffect(() => {
    if (!user) {
      setPendingLiveDevices(0);
      return;
    }

    let active = true;

    async function refreshDiscoveryData() {
      if (!active) return;
      await refreshDeviceDiscoveries(false);
    }

    void refreshDiscoveryData();
    void refreshLiveIntelligence();

    const channel = supabase
      .channel("device-discovery-queue")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "device_discovery_queue",
        },
        () => {
          void refreshDiscoveryData();
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!isAdmin || assets.length === 0 || deviceDiscoveries.length === 0) return;

    const existingPending = deviceDiscoveries.filter(
      (record) => record.status === "pending"
    );

    for (const record of existingPending) {
      const matchedAsset = findAssetForDiscovery(record);
      if (matchedAsset) {
        void automaticallyUpdateExistingDiscovery(record, matchedAsset);
      }
    }
  }, [isAdmin, assets, deviceDiscoveries]);

  function checkScannerSupport() {
    try {
      // Check HTTPS requirement (camera APIs require secure context)
      const isSecure = window.location.protocol === "https:" || window.location.hostname === "localhost";
      if (!isSecure && window.location.hostname !== "127.0.0.1") {
        setScannerSupported(false);
        setScannerStatus("Camera scanner requires HTTPS. Please access this site over a secure connection.");
        return;
      }

      // Check getUserMedia availability
      const hasGetUserMedia =
        navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function";

      if (!hasGetUserMedia) {
        setScannerSupported(false);
        setScannerStatus("Your browser does not support camera access. Please use Chrome, Firefox, Safari, or Edge on iOS/Android.");
        return;
      }

      const hasBarcodeDetector = window.BarcodeDetector && typeof window.BarcodeDetector === "function";

      setScannerSupported(true);
      setScannerStatus(
        hasBarcodeDetector
          ? "Ready to scan. Press Open Camera Scanner to begin."
          : "Ready to scan. This phone will use the mobile QR fallback scanner."
      );
    } catch (error) {
      console.error("Scanner support check error:", error);
      setScannerSupported(false);
      setScannerStatus("Could not check camera support. Please try again or use manual scan.");
    }
  }

  async function checkUser() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setUser(null);
      setRole(null);
      setAuthLoading(false);
      setLoading(false);
      return;
    }

    setUser(data.user);

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (roleError) {
      console.error(roleError);
    }

    setRole(roleData?.role || "staff");
    setAuthLoading(false);
    await refreshAll(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("Please enter your email and password.");
      return;
    }

    setAuthLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setAuthLoading(false);
      alert(error.message);
      return;
    }

    await checkUser();
  }

  async function handleCreateStaffAccount() {
    if (!email.trim() || !password.trim()) {
      alert("Enter the staff email and password first.");
      return;
    }

    const confirmCreate = window.confirm(`Create a new staff login account for ${email.trim()}?`);
    if (!confirmCreate) return;

    setAuthLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setAuthLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    const createdUserId = data.user?.id;
    if (createdUserId) {
      alert(`Staff account created. Now assign this user as staff in Supabase. User ID: ${createdUserId}`);
      return;
    }

    alert("Staff account request created. Check Supabase Authentication > Users.");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setEmail("");
    setPassword("");
    setLoading(false);
  }

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


  async function loadMaintenance() {
    const { data, error } = await supabase
      .from("maintenance_records")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    setMaintenanceRecords((data || []) as MaintenanceRecord[]);
  }
async function loadAssetComponents() {
  const { data, error } = await supabase
    .from("asset_components")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  setAssetComponents((data || []) as AssetComponent[]);
}

async function loadComponentHistory() {
  const { data, error } = await supabase
    .from("asset_component_history")
    .select("*")
    .order("action_date", { ascending: false });

  if (error) throw error;

  setComponentHistory((data || []) as AssetComponentHistory[]);
}

  async function refreshAll(showBusy = true) {
    try {
      if (showBusy) setRefreshing(true);
      setLoading(true);
      // Small delay to ensure database has fully processed changes
      await new Promise((resolve) => setTimeout(resolve, 300));
      await Promise.all([
  loadAssets(),
  loadDeviceChecks(),
  loadMaintenance(),
  loadAssetComponents(),
  loadComponentHistory(),
]);
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

  const activeMaintenanceByAssetId = useMemo(() => {
    const map = new Map<number, MaintenanceRecord>();

    for (const record of maintenanceRecords) {
      if (!record.asset_id) continue;
      if (record.status === "Completed" || record.status === "Cancelled") continue;

      const existing = map.get(record.asset_id);
      const recordDate = new Date(
        record.updated_at ||
          record.last_status_change ||
          record.created_at ||
          record.date_reported ||
          0
      ).getTime();
      const existingDate = existing
        ? new Date(
            existing.updated_at ||
              existing.last_status_change ||
              existing.created_at ||
              existing.date_reported ||
              0
          ).getTime()
        : 0;

      if (!existing || recordDate >= existingDate) {
        map.set(record.asset_id, record);
      }
    }

    return map;
  }, [maintenanceRecords]);

  const enrichedAssets = useMemo<EnrichedAsset[]>(() => {
    return assets.map((asset) => {
      const lastAudit = latestAuditByAssetId.get(asset.id) || null;
      const activeMaintenance = activeMaintenanceByAssetId.get(asset.id) || null;
      const health = computeAssetHealth(asset, lastAudit, activeMaintenance);

      return {
        ...asset,
        lastAudit,
        displayScore: health.score,
        alerts: health.alerts,
        healthLabel: health.label,
        operationalStatus: getOperationalStatus(asset, activeMaintenance),
        recommendation: activeMaintenance
          ? hasWorkingTemporarySolution(activeMaintenance)
            ? "Temporary workaround is in place; permanent repair is still required"
            : isExternalDependencyIssue(activeMaintenance)
              ? "Device is healthy, but an external connection fault is affecting service"
              : activeMaintenance.status === "Waiting for Parts"
                ? "Repair is waiting for parts"
                : "Active repair requires IT attention"
          : inferRecommendation(asset, health.score),
      };
    });
  }, [assets, latestAuditByAssetId, activeMaintenanceByAssetId]);

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

  const labelAssets = useMemo(() => {
    const term = labelSearch.trim().toLowerCase();
    return enrichedAssets.filter((asset) => {
      if (!term) return true;
      return (
        asset.asset_tag.toLowerCase().includes(term) ||
        asset.item_name.toLowerCase().includes(term) ||
        (asset.location || "").toLowerCase().includes(term) ||
        (asset.assigned_to || "").toLowerCase().includes(term)
      );
    });
  }, [enrichedAssets, labelSearch]);

  const selectedAsset = useMemo(
    () => filteredAssets.find((asset) => asset.id === selectedAssetId) || filteredAssets[0] || null,
    [filteredAssets, selectedAssetId]
  );

  useEffect(() => {
    if (selectedAsset && selectedAssetId !== selectedAsset.id) setSelectedAssetId(selectedAsset.id);
  }, [selectedAsset, selectedAssetId]);

  const maintenanceAssetsById = useMemo(() => {
    const map = new Map<number, EnrichedAsset>();
    for (const asset of enrichedAssets) map.set(asset.id, asset);
    return map;
  }, [enrichedAssets]);

  const selectedAssetAudits = useMemo(() => {
    if (!selectedAsset) return [];
    return deviceChecks.filter((check) => check.asset_id === selectedAsset.id);
  }, [deviceChecks, selectedAsset]);

  const selectedAssetScans = useMemo(() => {
    if (!selectedAsset) return [];
    return scanHistory
      .filter((scan) => scan.asset_id === selectedAsset.id)
      .sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime());
  }, [scanHistory, selectedAsset]);

  const selectedAssetChanges = useMemo(() => {
    if (!selectedAsset) return [];
    return hardwareChanges
      .filter((change) => change.asset_id === selectedAsset.id)
      .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
  }, [hardwareChanges, selectedAsset]);

  const selectedAssetMaintenance = useMemo(() => {
    if (!selectedAsset) return [];
    return maintenanceRecords.filter((record) => record.asset_id === selectedAsset.id);
  }, [maintenanceRecords, selectedAsset]);

  const selectedAssetComponents = useMemo(() => {
    if (!selectedAsset) return [];

    return assetComponents
      .filter((component) => component.asset_id === selectedAsset.id)
      .sort((a, b) => {
        if (a.status === "Installed" && b.status !== "Installed") return -1;
        if (a.status !== "Installed" && b.status === "Installed") return 1;
        return a.component_type.localeCompare(b.component_type);
      });
  }, [assetComponents, selectedAsset]);

  const selectedAssetTimeline = useMemo(() => {
    if (!selectedAsset) return [];

    const assetCreatedItem = {
      id: `asset-created-${selectedAsset.id}`,
      type: "Asset Record" as const,
      date: selectedAsset.created_at,
      title: "Asset registered in the ICT system",
      subtitle: `${selectedAsset.asset_tag} · ${selectedAsset.category || "ICT Asset"}`,
      notes: `Initial record created for ${selectedAsset.item_name}. Current location: ${selectedAsset.location || "Not assigned"}.`,
      toneClass: "bg-blue-100 text-blue-700",
    };

    const purchaseItem = selectedAsset.purchase_date
      ? {
          id: `purchase-${selectedAsset.id}`,
          type: "Purchase" as const,
          date: selectedAsset.purchase_date,
          title: "Device purchased",
          subtitle: `${selectedAsset.supplier || "Supplier not recorded"} · ${selectedAsset.brand || "Brand not recorded"} ${selectedAsset.model || ""}`.trim(),
          notes: `Serial number: ${selectedAsset.serial_number || "Not recorded"}. Warranty expiry: ${formatDate(selectedAsset.warranty_expiry)}.`,
          toneClass: "bg-indigo-100 text-indigo-700",
        }
      : null;

    const auditItems = selectedAssetAudits.map((check) => ({
      id: `audit-${check.id}`,
      type: "Audit" as const,
      date: check.created_at || check.inspection_date,
      title: `${check.final_status} audit`,
      subtitle: `${check.inspected_by} · Score ${check.health_score ?? 0}% · ${check.priority_level || "Low"} priority`,
      notes: check.remarks || "No remarks recorded.",
      toneClass: statusPillClass(check.final_status),
    }));

    const maintenanceItems = selectedAssetMaintenance.map((record) => ({
      id: `maintenance-${record.id}`,
      type: "Maintenance" as const,
      date: record.updated_at || record.created_at || record.date_reported,
      title: record.issue || "Maintenance ticket",
      subtitle: `${record.status || "Open"} · ${record.priority || "Medium"} priority · ${record.technician || record.reported_by || "No technician"}`,
      notes:
        record.resolution_notes ||
        record.action_taken ||
        record.notes ||
        "No maintenance notes recorded.",
      toneClass: statusPillClass(record.status || "Open"),
    }));

    const currentStateItem = {
      id: `current-state-${selectedAsset.id}`,
      type: "Current Status" as const,
      date: new Date().toISOString(),
      title: selectedAsset.status || "Status not recorded",
      subtitle: `${selectedAsset.condition || "Condition not recorded"} condition · ${selectedAsset.healthLabel} ${selectedAsset.displayScore}%`,
      notes: `Assigned to ${selectedAsset.assigned_to || "No user"} at ${selectedAsset.location || "No location"}. Recommendation: ${selectedAsset.recommendation}.`,
      toneClass: statusPillClass(selectedAsset.status || selectedAsset.healthLabel),
    };

    return [currentStateItem, ...auditItems, ...maintenanceItems, ...(purchaseItem ? [purchaseItem] : []), assetCreatedItem].sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );
  }, [selectedAsset, selectedAssetAudits, selectedAssetMaintenance]);

  const filteredMaintenanceRecords = useMemo(() => {
    const term = maintenanceSearch.trim().toLowerCase();
    return maintenanceRecords.filter((record) => {
      const matchesSearch =
        !term ||
        (record.asset_tag || "").toLowerCase().includes(term) ||
        (record.item_name || "").toLowerCase().includes(term) ||
        (record.issue || "").toLowerCase().includes(term) ||
        (record.technician || "").toLowerCase().includes(term) ||
        (record.assigned_to || "").toLowerCase().includes(term);

      const matchesStatus = maintenanceStatusFilter === "All" || (record.status || "Open") === maintenanceStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [maintenanceRecords, maintenanceSearch, maintenanceStatusFilter]);

  const maintenanceStats = useMemo(() => {
    const open = maintenanceRecords.filter((m) => m.status === "Open").length;
    const inProgress = maintenanceRecords.filter((m) => m.status === "In Progress").length;
    const waiting = maintenanceRecords.filter((m) => m.status === "Waiting for Parts").length;
    const completed = maintenanceRecords.filter((m) => m.status === "Completed").length;
    const cancelled = maintenanceRecords.filter((m) => m.status === "Cancelled").length;
    const critical = maintenanceRecords.filter((m) => m.priority === "Critical" && m.status !== "Completed" && m.status !== "Cancelled").length;
    return { open, inProgress, waiting, completed, cancelled, critical };
  }, [maintenanceRecords]);

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
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const seenToday = enrichedAssets.filter((asset) => {
      if (!asset.last_seen_at) return false;
      return new Date(asset.last_seen_at).getTime() >= startOfToday.getTime();
    }).length;

    const changesToday = hardwareChanges.filter(
      (change) => new Date(change.changed_at).getTime() >= startOfToday.getTime()
    ).length;

    return {
      total,
      inUse,
      slowDevices,
      outdated,
      poorPerformance,
      avgScore,
      critical,
      needsUpgrade,
      seenToday,
      changesToday,
    };
  }, [enrichedAssets, hardwareChanges]);

  const fleetIntelligence = useMemo(() => {
    const now = Date.now();

    const computerAssets = enrichedAssets.filter((asset) => {
      const category = String(asset.category || "").trim().toLowerCase();
      return (
        category.includes("desktop") ||
        category.includes("laptop") ||
        category.includes("server") ||
        category.includes("workstation") ||
        category.includes("computer")
      );
    });

    const otherAssets = enrichedAssets.filter(
      (asset) => !computerAssets.some((computer) => computer.id === asset.id)
    );

    let onlineNow = 0;
    let recentlySeen = 0;
    let offline = 0;
    let scannedComputers = 0;
    let windows11 = 0;
    let windows10 = 0;
    let windowsOther = 0;
    let ssd = 0;
    let hdd = 0;
    let storageUnknown = 0;
    let lowRam = 0;
    let tpmReady = 0;
    let tpmAttention = 0;
    let tpmUnknown = 0;

    computerAssets.forEach((asset) => {
      if (asset.last_seen_at) {
        scannedComputers += 1;

        const ageMinutes =
          (now - new Date(asset.last_seen_at).getTime()) / (1000 * 60);

        if (ageMinutes <= 15) onlineNow += 1;
        else if (ageMinutes <= 24 * 60) recentlySeen += 1;
        else offline += 1;
      }

      const os = String(asset.os || "").toLowerCase();
      if (os.includes("windows 11")) windows11 += 1;
      else if (os.includes("windows 10")) windows10 += 1;
      else windowsOther += 1;

      const storage = String(asset.storage || "").toLowerCase();
      if (storage.includes("ssd") || storage.includes("nvme")) ssd += 1;
      else if (storage.includes("hdd") || storage.includes("hard disk")) hdd += 1;
      else storageUnknown += 1;

      const ramMatch = String(asset.ram || "").match(/([0-9]+(?:\.[0-9]+)?)/);
      const ramGb = ramMatch ? Number(ramMatch[1]) : null;
      if (ramGb !== null && ramGb < 8) lowRam += 1;

      const tpm = String(asset.tpm_status || "").toLowerCase();
      if (tpm.includes("ready") || tpm.includes("enabled")) tpmReady += 1;
      else if (tpm && !tpm.includes("not detected")) tpmAttention += 1;
      else tpmUnknown += 1;
    });

    const unscannedComputers = Math.max(
      computerAssets.length - scannedComputers,
      0
    );

    const coveragePercent =
      computerAssets.length > 0
        ? Math.round((scannedComputers / computerAssets.length) * 100)
        : 0;

    const recommendations = [
      {
        label: "Computers not yet scanned",
        value: unscannedComputers,
        message:
          "Run the collector on these Windows computers to complete live fleet coverage.",
      },
      {
        label: "Offline over 24 hours",
        value: offline,
        message:
          "Confirm whether these computers are powered off, moved or unavailable.",
      },
      {
        label: "RAM below 8 GB",
        value: lowRam,
        message:
          "Review these computers for memory upgrade planning.",
      },
      {
        label: "HDD storage detected",
        value: hdd,
        message:
          "Consider SSD upgrades where performance is slow.",
      },
    ].filter((item) => item.value > 0);

    const recentComputerScans = scanHistory
      .filter((scan) =>
        computerAssets.some((asset) => asset.id === scan.asset_id)
      )
      .slice(0, 6);

    return {
      totalAssets: enrichedAssets.length,
      computerAssets: computerAssets.length,
      otherAssets: otherAssets.length,
      scannedComputers,
      unscannedComputers,
      coveragePercent,
      onlineNow,
      recentlySeen,
      offline,
      windows11,
      windows10,
      windowsOther,
      ssd,
      hdd,
      storageUnknown,
      lowRam,
      tpmReady,
      tpmAttention,
      tpmUnknown,
      recommendations,
      recentComputerScans,
    };
  }, [enrichedAssets, scanHistory]);

  const healthBreakdown = useMemo(() => {
    return {
      healthy: enrichedAssets.filter((asset) => asset.displayScore >= 85).length,
      watch: enrichedAssets.filter((asset) => asset.displayScore >= 65 && asset.displayScore < 85).length,
      upgrade: enrichedAssets.filter((asset) => asset.displayScore >= 40 && asset.displayScore < 65).length,
      critical: enrichedAssets.filter((asset) => asset.displayScore < 40).length,
    };
  }, [enrichedAssets]);

  const departmentGraphData = useMemo(() => {
    const locationLabels = new Map<string, string>();

    const totals = enrichedAssets.reduce((acc, asset) => {
      const rawLocation = (asset.location || "Unassigned")
        .trim()
        .replace(/\s+/g, " ");

      const normalizedLocation = rawLocation
  .toLowerCase()
  .replace(/['"`’“”]/g, "")
  .replace(/[^a-z0-9\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

      if (!locationLabels.has(normalizedLocation)) {
        const displayLocation =
  normalizedLocation === "it office"
    ? "IT Office"
    : normalizedLocation === "it department"
      ? "IT Department"
      : normalizedLocation === "hr department"
        ? "HR Department"
        : normalizedLocation === "admin office"
          ? "Admin Office"
          : normalizedLocation === "finance department"
            ? "Finance Department"
            : rawLocation === "Unassigned"
              ? "Unassigned"
              : normalizedLocation
                  .split(" ")
                  .map((word) =>
                    word.length > 0
                      ? word.charAt(0).toUpperCase() + word.slice(1)
                      : word
                  )
                  .join(" ");

locationLabels.set(normalizedLocation, displayLocation);
      }

      acc[normalizedLocation] = (acc[normalizedLocation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(totals)
      .map(([normalizedLocation, value]) => ({
        label: locationLabels.get(normalizedLocation) || "Unassigned",
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
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
  const assetCategoryOptions = useMemo(() => {
    const databaseCategories = assets
      .map((asset) => String(asset.category || "").trim())
      .filter(Boolean);

    return Array.from(new Set([...DEVICE_CATEGORIES, ...databaseCategories])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [assets]);

  const categoryOptions = useMemo(
    () => ["All", ...assetCategoryOptions],
    [assetCategoryOptions]
  );

  const executiveActivity = useMemo(() => {
    const maintenance = maintenanceRecords.map((record) => ({
      id: `maintenance-${record.id}`,
      type: "Maintenance",
      title: record.issue || "Maintenance ticket updated",
      meta: `${record.asset_tag || "Unassigned asset"} · ${record.status || "Open"}`,
      date: record.updated_at || record.created_at || record.date_reported || "",
      tone: "bg-orange-100 text-orange-700",
      icon: "🔧",
    }));

    const audits = deviceChecks.map((check) => ({
      id: `audit-${check.id}`,
      type: "Audit",
      title: `${check.final_status} audit`,
      meta: `${check.asset_tag || "Unassigned asset"} · ${check.inspected_by || "ICT Staff"}`,
      date: check.created_at || check.inspection_date || "",
      tone: "bg-blue-100 text-blue-700",
      icon: "📋",
    }));

    const registrations = assets.map((asset) => ({
      id: `asset-${asset.id}`,
      type: "Asset",
      title: "Asset registered",
      meta: `${asset.asset_tag} · ${asset.item_name}`,
      date: asset.created_at || "",
      tone: "bg-violet-100 text-violet-700",
      icon: "📦",
    }));

    return [...maintenance, ...audits, ...registrations]
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);
  }, [maintenanceRecords, deviceChecks, assets]);

  const unresolvedTickets =
    maintenanceStats.open + maintenanceStats.inProgress + maintenanceStats.waiting;

  const attentionDevices = healthBreakdown.watch + healthBreakdown.upgrade + healthBreakdown.critical;

  function scrollToActiveContent(tab: typeof activeTab) {
    window.setTimeout(() => {
      const target =
        tab === "dashboard"
          ? document.getElementById("tab-dashboard")
          : activeContentRef.current;

      target?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 180);
  }

  function openMobileTab(tab: typeof activeTab) {
    setActiveTab(tab);
    scrollToActiveContent(tab);

    if (tab === "scan") {
      window.setTimeout(() => {
        startScanner();
      }, 350);
    }
  }

  function openDeviceProfile(assetId: number) {
    setSelectedAssetId(assetId);
    setActiveTab("profile");
    window.setTimeout(() => {
      profileSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function scannerLookupCandidates(code: string) {
    const raw = String(code || "").trim();
    const candidates = new Set<string>();

    const addCandidate = (value?: string | null) => {
      const cleaned = String(value || "").trim();
      if (!cleaned) return;

      candidates.add(cleaned);

      // Some QR readers return URL-encoded text.
      try {
        const decoded = decodeURIComponent(cleaned);
        if (decoded && decoded !== cleaned) candidates.add(decoded);
      } catch {
        // Ignore malformed URI sequences and keep the original value.
      }
    };

    addCandidate(raw);

    // Kopkop QR labels currently store a public device URL such as:
    // https://kopkop-it-system.vercel.app/device/KC-LT5QS
    // Extract the asset tag from that URL so the logged-in scanner can
    // match the same QR code directly against the internal inventory.
    try {
      const parsed = new URL(raw, window.location.origin);

      const queryKeys = [
        "asset_tag",
        "assetTag",
        "tag",
        "code",
        "serial",
        "serial_number",
      ];

      queryKeys.forEach((key) => addCandidate(parsed.searchParams.get(key)));

      const pathParts = parsed.pathname
        .split("/")
        .filter(Boolean)
        .map((part) => {
          try {
            return decodeURIComponent(part);
          } catch {
            return part;
          }
        });

      const deviceIndex = pathParts.findIndex(
        (part) => part.toLowerCase() === "device"
      );

      if (deviceIndex >= 0 && pathParts[deviceIndex + 1]) {
        addCandidate(pathParts[deviceIndex + 1]);
      }

      // Also keep the final URL segment as a useful fallback.
      if (pathParts.length > 0) {
        addCandidate(pathParts[pathParts.length - 1]);
      }
    } catch {
      // The scanned value is not a URL. Raw asset tags / serials are still valid.
    }

    // Support common scanner prefixes if a label is ever printed as:
    // ASSET:KC-LT5QS, TAG:KC-LT5QS, SERIAL:12345, etc.
    const prefixMatch = raw.match(
      /^(?:asset(?:_tag)?|tag|serial(?:_number)?|code)\s*[:=#-]\s*(.+)$/i
    );
    if (prefixMatch?.[1]) addCandidate(prefixMatch[1]);

    return Array.from(candidates);
  }

  function findAssetByCode(code: string) {
    const normalizedCandidates = scannerLookupCandidates(code)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    return enrichedAssets.find((asset) => {
      const assetTag = String(asset.asset_tag || "").trim().toLowerCase();
      const serialNumber = String(asset.serial_number || "").trim().toLowerCase();

      return normalizedCandidates.some(
        (candidate) =>
          (!!assetTag && candidate === assetTag) ||
          (!!serialNumber && candidate === serialNumber)
      );
    });
  }

  function handleScannedCode(code: string) {
    const cleanedCode = String(code || "").trim();
    if (!cleanedCode) return false;

    const matched = findAssetByCode(cleanedCode);

    if (!matched) {
      const candidates = scannerLookupCandidates(cleanedCode);
      const extracted =
        candidates.find(
          (candidate) =>
            candidate.trim().toLowerCase() !== cleanedCode.toLowerCase()
        ) || cleanedCode;

      setScannerStatus(
        `QR detected, but no matching asset was found for: ${extracted}`
      );
      return false;
    }

    setManualScanCode(matched.asset_tag);
    setScannerStatus(`Matched ${matched.asset_tag} - ${matched.item_name}`);
    stopScanner();
    openDeviceProfile(matched.id);
    return true;
  }

  function loadJsQrFallback() {
    return new Promise<boolean>((resolve) => {
      if (window.jsQR) {
        resolve(true);
        return;
      }

      const existingScript = document.querySelector<HTMLScriptElement>(
        "script[data-kopkop-jsqr='true']"
      );

      if (existingScript) {
        if (window.jsQR) {
          resolve(true);
          return;
        }

        existingScript.addEventListener(
          "load",
          () => resolve(Boolean(window.jsQR)),
          { once: true }
        );
        existingScript.addEventListener("error", () => resolve(false), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
      script.async = true;
      script.defer = true;
      script.dataset.kopkopJsqr = "true";
      script.onload = () => resolve(Boolean(window.jsQR));
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  function startJsQrFallbackScan() {
    setScannerStatus(
      "QR scanner active. Hold the QR code steady inside the camera view."
    );

    const scan = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const jsQR = window.jsQR;

      if (!mediaStreamRef.current) return;

      if (!video || !canvas || !jsQR) {
        scanLoopRef.current = window.setTimeout(scan, 200);
        return;
      }

      if (
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        scanLoopRef.current = window.setTimeout(scan, 200);
        return;
      }

      // Limit the working canvas size on high-resolution phone cameras.
      // This makes repeated QR decoding faster and more reliable.
      const maxWidth = 1280;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      const width = Math.max(1, Math.round(video.videoWidth * scale));
      const height = Math.max(1, Math.round(video.videoHeight * scale));

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        setScannerStatus("Could not read the camera image. Try manual lookup.");
        return;
      }

      try {
        context.drawImage(video, 0, 0, width, height);
        const imageData = context.getImageData(0, 0, width, height);
        const result = jsQR(
          imageData.data,
          imageData.width,
          imageData.height,
          { inversionAttempts: "attemptBoth" }
        );

        if (result?.data && handleScannedCode(result.data)) return;
      } catch (scanError) {
        console.debug("jsQR frame scan error:", scanError);
      }

      scanLoopRef.current = window.setTimeout(scan, 200);
    };

    scan();
  }

  async function waitForScannerVideoElement() {
    // setScannerOpen(true) causes React to mount <video>. On phones that
    // render slowly, the old fixed 100 ms delay can finish before videoRef exists.
    for (let attempt = 0; attempt < 40; attempt += 1) {
      if (videoRef.current) return videoRef.current;
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }

    throw new Error("Scanner video element did not become ready.");
  }

  async function startScanner() {
    try {
      stopScanner();

      if (
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        setScannerSupported(false);
        setScannerStatus(
          "This browser does not support camera scanning. Use Chrome/Safari on your phone or use manual lookup."
        );
        return;
      }

      setScannerSupported(true);
      setScannerStatus("Requesting rear camera access...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      setScannerOpen(true);

      const video = await waitForScannerVideoElement();

      // The stream may have been stopped while React was mounting the video.
      if (!mediaStreamRef.current) return;

      video.srcObject = stream;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");

      await video.play();

      // Give autofocus/exposure a short moment before decoding frames.
      await new Promise((resolve) => window.setTimeout(resolve, 250));

      const BarcodeDetectorCtor = window.BarcodeDetector;

      if (BarcodeDetectorCtor && typeof BarcodeDetectorCtor === "function") {
        try {
          const desiredFormats = [
            "qr_code",
            "code_128",
            "code_39",
            "ean_13",
            "ean_8",
            "upc_a",
            "upc_e",
          ];

          let formats = desiredFormats;

          if (typeof BarcodeDetectorCtor.getSupportedFormats === "function") {
            const supportedFormats =
              await BarcodeDetectorCtor.getSupportedFormats();

            const supportedSet = new Set(supportedFormats);
            formats = desiredFormats.filter((format) =>
              supportedSet.has(format)
            );
          }

          // If the browser's native detector does not support QR, use jsQR.
          if (!formats.includes("qr_code")) {
            throw new Error("Native BarcodeDetector does not support QR codes.");
          }

          const detector = new BarcodeDetectorCtor({ formats });

          setScannerStatus(
            "Camera scanner active. Hold the QR label steady in the centre."
          );

          const scan = async () => {
            const currentVideo = videoRef.current;

            if (!mediaStreamRef.current) return;

            if (
              !currentVideo ||
              currentVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
              currentVideo.videoWidth === 0 ||
              currentVideo.videoHeight === 0
            ) {
              scanLoopRef.current = window.setTimeout(scan, 200);
              return;
            }

            try {
              const results = await detector.detect(currentVideo);
              const value = results?.[0]?.rawValue?.trim();

              if (value && handleScannedCode(value)) return;
            } catch (detectError) {
              console.debug(
                "Native BarcodeDetector scan failed; switching to jsQR:",
                detectError
              );

              const fallbackLoaded = await loadJsQrFallback();
              if (fallbackLoaded) {
                startJsQrFallbackScan();
                return;
              }

              setScannerStatus(
                "Camera is open, but automatic QR detection could not start. Use manual lookup below."
              );
              return;
            }

            scanLoopRef.current = window.setTimeout(scan, 200);
          };

          scan();
          return;
        } catch (detectorError) {
          console.debug(
            "Native BarcodeDetector unavailable; using jsQR fallback:",
            detectorError
          );
        }
      }

      const fallbackLoaded = await loadJsQrFallback();

      if (fallbackLoaded) {
        startJsQrFallbackScan();
      } else {
        setScannerStatus(
          "Camera opened, but the QR decoder could not load. Check internet access or use manual lookup below."
        );
      }
    } catch (error) {
      console.error("Camera access error:", error);
      stopScanner();

      if (error instanceof DOMException) {
        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          setScannerStatus(
            "Camera permission was denied. Allow camera access for this website in your phone browser settings, then try again."
          );
        } else if (
          error.name === "NotFoundError" ||
          error.name === "DevicesNotFoundError"
        ) {
          setScannerStatus("No phone camera was found.");
        } else if (
          error.name === "NotReadableError" ||
          error.name === "TrackStartError"
        ) {
          setScannerStatus(
            "The camera is busy. Close Camera, WhatsApp, TikTok or another app using it, then try again."
          );
        } else if (error.name === "SecurityError") {
          setScannerStatus(
            "Camera access requires HTTPS. Open the secure Vercel HTTPS address."
          );
        } else if (error.name === "OverconstrainedError") {
          setScannerStatus(
            "The requested camera settings are not supported by this phone. Please try again."
          );
        } else {
          setScannerStatus(`Camera error: ${error.message}`);
        }
      } else {
        const message =
          error instanceof Error ? error.message : "Unknown camera error";
        setScannerStatus(`Could not start QR scanner: ${message}`);
      }
    }
  }

  function stopScanner() {
    if (scanLoopRef.current !== null) {
      window.clearTimeout(scanLoopRef.current);
      scanLoopRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
        // Ignore pause errors while unmounting.
      }
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


  function printSelectedAssetReport() {
    if (!selectedAsset) {
      alert("Please select a device first.");
      return;
    }

    const reportAsset = selectedAsset;
    const latestAudit = selectedAssetAudits[0] || null;
    const latestMaintenance = selectedAssetMaintenance[0] || null;
    const generatedAt = new Date();
    const logoUrl = `${window.location.origin}/kopkop-logo.png`;
    const qrUrl = buildQrUrl(buildPublicAssetUrl(reportAsset.asset_tag), 900);
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&scale=4&height=16&includetext&textsize=13&text=${encodeURIComponent(reportAsset.asset_tag.trim())}`;
    const healthScore = Math.max(0, Math.min(100, reportAsset.displayScore));
    const healthTone =
      healthScore >= 85
        ? { accent: "#15803d", soft: "#dcfce7", label: healthScore >= 95 ? "Excellent" : "Healthy", risk: "Low" }
        : healthScore >= 65
          ? { accent: "#a16207", soft: "#fef3c7", label: "Watch", risk: "Moderate" }
          : healthScore >= 40
            ? { accent: "#c2410c", soft: "#ffedd5", label: "Needs Upgrade", risk: "High" }
            : { accent: "#b91c1c", soft: "#fee2e2", label: "Critical", risk: "Critical" };
    const rawWarrantyStatus = getWarrantyStatus(reportAsset.warranty_expiry);
    const warrantyStatus = rawWarrantyStatus === "Not recorded" ? "Warranty unknown" : rawWarrantyStatus;
    const expectedRefreshDate = (() => {
      if (!reportAsset.purchase_date) return "Not available";
      const purchaseDate = new Date(reportAsset.purchase_date);
      if (Number.isNaN(purchaseDate.getTime())) return "Not available";
      purchaseDate.setFullYear(purchaseDate.getFullYear() + 5);
      return purchaseDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    })();
    const assetStatusTone = (() => {
      switch ((reportAsset.status || "").toLowerCase()) {
        case "in use": return { background: "#dcfce7", color: "#166534", dot: "#16a34a" };
        case "under repair": return { background: "#fef3c7", color: "#92400e", dot: "#f59e0b" };
        case "damaged":
        case "lost": return { background: "#fee2e2", color: "#991b1b", dot: "#dc2626" };
        case "in store": return { background: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6" };
        case "retired": return { background: "#e2e8f0", color: "#334155", dot: "#64748b" };
        default: return { background: "#e2e8f0", color: "#334155", dot: "#64748b" };
      }
    })();
    const recordedHealthChecks = [
      { label: "Physical Condition", value: reportAsset.condition || "Not recorded", good: (reportAsset.condition || "").toLowerCase() === "good" },
      { label: "Performance", value: reportAsset.performance || "Not recorded", good: (reportAsset.performance || "").toLowerCase() === "good" },
      { label: "Boot Speed", value: reportAsset.booting_speed || "Not recorded", good: (reportAsset.booting_speed || "").toLowerCase() === "good" },
      { label: "Windows Update", value: reportAsset.windows_update || "Not recorded", good: (reportAsset.windows_update || "").toLowerCase().includes("updated") },
      { label: "Online Status", value: reportAsset.online_status || "Not recorded", good: (reportAsset.online_status || "").toLowerCase() === "online" },
      { label: "TPM", value: reportAsset.tpm_status || "Not recorded", good: (reportAsset.tpm_status || "").toLowerCase().includes("enabled") },
    ];

    const photoItems = [
      { label: "Overall Device", url: reportAsset.photo_front_url },
      { label: "Additional Photo", url: reportAsset.photo_back_url },
      { label: "Asset / Serial Label", url: reportAsset.photo_label_url },
    ].filter((item) => Boolean(item.url));
    const mainPhoto = photoItems[0]?.url || "";

    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${safeHtml(reportAsset.asset_tag)} - Digital Device Passport</title>
          <style>
            @page { size: A4 portrait; margin: 8mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            html, body { margin: 0; padding: 0; background: #fff; color: #0f172a; font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 1.28; }
            body { position: relative; }
            .watermark { position: fixed; inset: 0; z-index: -1; display: grid; place-items: center; pointer-events: none; }
            .watermark img { width: 125mm; height: 125mm; object-fit: contain; opacity: .09; filter: grayscale(1); }
            .report { width: 100%; max-width: 194mm; margin: 0 auto; }
            .header { display: grid; grid-template-columns: 21mm 1fr 45mm; align-items: center; gap: 4mm; padding: 2mm 0 3mm; border-bottom: 2.5px solid #0f172a; }
            .logo { width: 19mm; height: 19mm; object-fit: contain; }
            .school { font-size: 20px; line-height: 1; font-weight: 900; letter-spacing: .08em; }
            .system { margin-top: 2px; font-size: 8px; font-weight: 700; color: #334155; letter-spacing: .04em; }
            .official { margin-top: 2px; font-size: 6.8px; color: #64748b; letter-spacing: .14em; text-transform: uppercase; }
            .meta { text-align: right; color: #475569; font-size: 7px; }
            .meta strong { display: block; color: #0f172a; font-size: 9px; }
            .hero { margin-top: 3mm; display: grid; grid-template-columns: 1fr 33mm 30mm; gap: 4mm; align-items: center; min-height: 30mm; border-radius: 3mm; padding: 4mm; background: #0f172a; color: #fff; }
            .device-title { font-size: 19px; font-weight: 900; line-height: 1; }
            .tag-line { margin-top: 2mm; display: flex; flex-wrap: wrap; gap: 1.5mm; align-items: center; font-size: 7.8px; color: #e2e8f0; }
            .chip { border: 1px solid rgba(255,255,255,.45); border-radius: 99px; padding: 1mm 2mm; color: #fff; }
            .health-ring { width: 28mm; height: 28mm; border-radius: 50%; display: grid; place-items: center; text-align: center; border: 2.5mm solid ${healthTone.accent}; background: #fff; color: #0f172a; }
            .health-ring strong { display: block; font-size: 17px; line-height: 1; }
            .health-ring span { display: block; margin-top: 1.2px; font-size: 7px; font-weight: 800; color: ${healthTone.accent}; text-transform: uppercase; }
            .qr { width: 28mm; height: 28mm; padding: 1.5mm; border-radius: 2mm; background: #fff; object-fit: contain; }
            .overview { margin-top: 2.5mm; display: grid; grid-template-columns: 56mm 1fr; gap: 2.5mm; }
            .photo-main { height: 48mm; box-shadow: 0 2px 8px rgba(15,23,42,.14); overflow: hidden; border: 1px solid #cbd5e1; border-radius: 2.5mm; background: #f8fafc; }
            .photo-main img { width: 100%; height: 100%; object-fit: contain; object-position: center; background: #f8fafc; padding: 2mm; }
            .photo-placeholder { height: 100%; display: grid; place-items: center; text-align: center; color: #94a3b8; font-size: 8px; padding: 4mm; }
            .classification { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2mm; }
            .class-card { min-height: 20mm; padding: 2.5mm; border: 1px solid #cbd5e1; border-radius: 2.5mm; background: #fff; }
            .class-label { color: #64748b; font-size: 6.8px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
            .class-value { margin-top: 2mm; font-size: 10.5px; font-weight: 900; color: #0f172a; overflow-wrap: anywhere; }
            .grid { margin-top: 2.5mm; display: grid; grid-template-columns: 1fr 1fr; gap: 2.5mm; }
            .section { border: 1px solid #cbd5e1; border-radius: 2.5mm; padding: 2.7mm 3mm; break-inside: avoid; page-break-inside: avoid; background: rgba(255,255,255,.96); }
            .full { grid-column: 1 / -1; }
            .section-title { margin: 0 0 2mm; padding-bottom: 1.4mm; border-bottom: 1px solid #e2e8f0; font-size: 8.2px; font-weight: 900; letter-spacing: .11em; text-transform: uppercase; }
            .section-title:before { content: ""; display: inline-block; width: 1.2mm; height: 3mm; margin-right: 1.6mm; border-radius: 99px; background: #0f172a; vertical-align: -0.5mm; }
            .rows { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2mm 3mm; }
            .row { min-width: 0; overflow-wrap: anywhere; }
            .label { font-weight: 800; color: #334155; }
            .value { color: #0f172a; }
            .status-pill { display: inline-block; border-radius: 99px; padding: .5mm 1.5mm; background: ${healthTone.soft}; color: ${healthTone.accent}; font-weight: 900; }
            .asset-status-pill { display: inline-flex; align-items: center; gap: 1.2mm; border-radius: 99px; padding: 1mm 2mm; background: ${assetStatusTone.background}; color: ${assetStatusTone.color}; font-weight: 900; font-size: 9px; }
            .asset-status-pill::before { content: ""; width: 2.2mm; height: 2.2mm; border-radius: 50%; background: ${assetStatusTone.dot}; }
            .risk-pill { display: inline-flex; align-items: center; gap: 1.2mm; border-radius: 99px; padding: 1mm 2mm; background: ${healthTone.soft}; color: ${healthTone.accent}; font-weight: 900; font-size: 9px; }
            .risk-pill::before { content: ""; width: 2.2mm; height: 2.2mm; border-radius: 50%; background: ${healthTone.accent}; }
            .qr-wrap { text-align: center; }
            .qr-caption { margin-top: 1mm; color: #cbd5e1; font-size: 5.8px; line-height: 1.15; }
            .health-checks { margin-top: 2mm; display: grid; grid-template-columns: repeat(3,1fr); gap: 1.5mm; }
            .health-check { border: 1px solid #dbe4ef; border-radius: 1.8mm; padding: 1.5mm; background: #f8fafc; }
            .health-check small { display: block; color: #64748b; font-size: 6.2px; }
            .health-check strong { display: block; margin-top: .6mm; font-size: 7.5px; }
            .health-check.good strong { color: #15803d; }
            .barcode-id { margin-top: .5mm; text-align: center; font-size: 11px; font-weight: 900; letter-spacing: .18em; color: #0f172a; }
            .summary-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 2mm; }
            .summary { border: 1px solid #dbe4ef; border-radius: 2mm; padding: 2mm; text-align: center; background: #f8fafc; }
            .summary small { display: block; color: #64748b; font-size: 6.5px; }
            .summary strong { display: block; margin-top: .8mm; font-size: 9px; }
            .photos { display: grid; grid-template-columns: repeat(3,1fr); gap: 2.5mm; }
            .evidence { border: 1px solid #cbd5e1; border-radius: 2mm; overflow: hidden; background: #f8fafc; }
            .evidence img { display: block; width: 100%; height: 35mm; object-fit: contain; object-position: center; background: #f8fafc; padding: 1mm; }
            .evidence-label { padding: 1.5mm; text-align: center; font-size: 7px; font-weight: 800; color: #334155; }
            .barcode-wrap { display: flex; align-items: center; justify-content: space-between; gap: 4mm; }
            .barcode { max-width: 88mm; height: 21mm; object-fit: contain; }
            .signatures { margin-top: 5mm; display: grid; grid-template-columns: repeat(3,1fr); gap: 8mm; }
            .signature { border-top: 1.2px solid #334155; padding-top: 2.5mm; min-height: 22mm; color: #475569; font-size: 7px; }
            .signature strong { display: block; color: #0f172a; font-size: 8px; }
            .footer { margin-top: 3mm; padding-top: 1.5mm; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; color: #64748b; font-size: 6.5px; }
            @media print { body { padding: 0; } .report { max-width: none; } }
          </style>
        </head>
        <body>
          <div class="watermark"><img src="${safeHtml(logoUrl)}" alt="" /></div>
          <main class="report">
            <header class="header">
              <img class="logo" src="${safeHtml(logoUrl)}" alt="Kopkop College Logo" />
              <div>
                <div class="school">KOPKOP COLLEGE</div>
                <div class="system">ICT Asset, Device Health & Audit System</div>
                <div class="official">Official Digital Device Passport</div>
              </div>
              <div class="meta">
                <strong>Asset Passport</strong>
                Generated: ${safeHtml(formatDateTime(generatedAt.toISOString()))}<br />
                Prepared by: ${safeHtml(user?.email || "ICT Department")}<br />
                Document: ${safeHtml(reportAsset.asset_tag)}-DP-01
              </div>
            </header>

            <section class="hero">
              <div>
                <div class="device-title">${safeHtml(reportAsset.item_name)}</div>
                <div class="tag-line">
                  <span class="chip">${safeHtml(reportAsset.asset_tag)}</span>
                  <span>${safeHtml(reportAsset.category || "Device")}</span><span>•</span>
                  <span>${safeHtml([reportAsset.brand, reportAsset.model].filter(Boolean).join(" ") || "Model not recorded")}</span><span>•</span>
                  <span>${safeHtml(reportAsset.location || "Location not recorded")}</span>
                </div>
              </div>
              <div class="health-ring"><div><strong>${healthScore}%</strong><span>${safeHtml(healthTone.label)}</span></div></div>
              <img class="qr" src="${safeHtml(qrUrl)}" alt="Asset QR Code" />
            </section>

            <section class="overview">
              <div class="photo-main">
                ${mainPhoto ? `<img src="${safeHtml(mainPhoto)}" alt="Primary device photo" />` : `<div class="photo-placeholder">No device photo uploaded</div>`}
              </div>
              <div class="classification">
                <div class="class-card"><div class="class-label">Asset Status</div><div class="class-value"><span class="asset-status-pill">${safeHtml(reportAsset.status || "Not recorded")}</span></div></div>
                <div class="class-card"><div class="class-label">Asset Type</div><div class="class-value">${safeHtml(reportAsset.category || "Not recorded")}</div></div>
                <div class="class-card"><div class="class-label">Risk Level</div><div class="class-value"><span class="risk-pill">${safeHtml(healthTone.risk)}</span></div></div>
                <div class="class-card"><div class="class-label">Department / Location</div><div class="class-value">${safeHtml(reportAsset.location || "Not recorded")}</div></div>
              </div>
            </section>

            <div class="grid">
              <section class="section">
                <h2 class="section-title">General Information</h2>
                <div class="rows">
                  <div class="row"><span class="label">Device Type:</span> <span class="value">${safeHtml(reportAsset.category || "-")}</span></div>
                  <div class="row"><span class="label">Status:</span> <span class="asset-status-pill">${safeHtml(reportAsset.status || "-")}</span></div>
                  <div class="row"><span class="label">Brand:</span> <span class="value">${safeHtml(reportAsset.brand || "-")}</span></div>
                  <div class="row"><span class="label">Model:</span> <span class="value">${safeHtml(reportAsset.model || "-")}</span></div>
                  <div class="row"><span class="label">Serial Number:</span> <span class="value">${safeHtml(reportAsset.serial_number || "-")}</span></div>
                  <div class="row"><span class="label">Condition:</span> <span class="value">${safeHtml(reportAsset.condition || "-")}</span></div>
                  <div class="row"><span class="label">Assigned User:</span> <span class="value">${safeHtml(reportAsset.assigned_to || "-")}</span></div>
                  <div class="row"><span class="label">Location:</span> <span class="value">${safeHtml(reportAsset.location || "-")}</span></div>
                </div>
              </section>

              <section class="section">
                <h2 class="section-title">Technical Specifications</h2>
                <div class="rows">
                  <div class="row"><span class="label">Operating System:</span> <span class="value">${safeHtml(reportAsset.os || "-")}</span></div>
                  <div class="row"><span class="label">System Type:</span> <span class="value">${safeHtml(reportAsset.system_type || "-")}</span></div>
                  <div class="row"><span class="label">Processor:</span> <span class="value">${safeHtml(reportAsset.processor || "-")}</span></div>
                  <div class="row"><span class="label">RAM:</span> <span class="value">${safeHtml(reportAsset.ram || "-")}</span></div>
                  <div class="row"><span class="label">Storage:</span> <span class="value">${safeHtml(reportAsset.storage || "-")}</span></div>
                  <div class="row"><span class="label">GPU:</span> <span class="value">${safeHtml(reportAsset.gpu || "-")}</span></div>
                  <div class="row"><span class="label">Motherboard:</span> <span class="value">${safeHtml(reportAsset.motherboard || "-")}</span></div>
                  <div class="row"><span class="label">BIOS Version:</span> <span class="value">${safeHtml(reportAsset.bios_version || "-")}</span></div>
                  <div class="row"><span class="label">BIOS Date:</span> <span class="value">${safeHtml(formatDate(reportAsset.bios_date))}</span></div>
                  <div class="row"><span class="label">TPM:</span> <span class="value">${safeHtml(reportAsset.tpm_status || "-")}</span></div>
                  <div class="row"><span class="label">Hostname:</span> <span class="value">${safeHtml(reportAsset.hostname || "-")}</span></div>
                  <div class="row"><span class="label">IP Address:</span> <span class="value">${safeHtml(reportAsset.ip_address || "-")}</span></div>
                  <div class="row"><span class="label">MAC Address:</span> <span class="value">${safeHtml(reportAsset.mac_address || "-")}</span></div>
                  <div class="row"><span class="label">Connection:</span> <span class="value">${safeHtml(reportAsset.connection_type || "-")}</span></div>
                  <div class="row"><span class="label">MS Office:</span> <span class="value">${safeHtml(reportAsset.ms_office || "-")}</span></div>
                  <div class="row"><span class="label">Monitor:</span> <span class="value">${safeHtml(reportAsset.monitor || "-")}</span></div>
                  <div class="row"><span class="label">Keyboard / Mouse:</span> <span class="value">${safeHtml([reportAsset.keyboard, reportAsset.mouse].filter(Boolean).join(" / ") || "-")}</span></div>
                  <div class="row"><span class="label">Charger:</span> <span class="value">${safeHtml(reportAsset.charger || "-")}</span></div>
                  <div class="row"><span class="label">Headset:</span> <span class="value">${safeHtml(reportAsset.headset || "-")}</span></div>
                </div>
              </section>

              <section class="section">
                <h2 class="section-title">Purchase & Warranty</h2>
                <div class="rows">
                  <div class="row"><span class="label">Supplier:</span> <span class="value">${safeHtml(reportAsset.supplier || "-")}</span></div>
                  <div class="row"><span class="label">Quantity:</span> <span class="value">${safeHtml(reportAsset.quantity)}</span></div>
                  <div class="row"><span class="label">Purchase Date:</span> <span class="value">${safeHtml(formatDate(reportAsset.purchase_date))}</span></div>
                  <div class="row"><span class="label">Device Age:</span> <span class="value">${safeHtml(calculateDeviceAge(reportAsset.purchase_date))}</span></div>
                  <div class="row"><span class="label">Expected Refresh:</span> <span class="value">${safeHtml(expectedRefreshDate)}</span></div>
                  <div class="row"><span class="label">Warranty Expiry:</span> <span class="value">${safeHtml(formatDate(reportAsset.warranty_expiry))}</span></div>
                  <div class="row"><span class="label">Warranty Status:</span> <span class="status-pill">${safeHtml(warrantyStatus)}</span></div>
                </div>
              </section>

              <section class="section">
                <h2 class="section-title">Performance & Health</h2>
                <div class="rows">
                  <div class="row"><span class="label">Performance:</span> <span class="value">${safeHtml(reportAsset.performance || "-")}</span></div>
                  <div class="row"><span class="label">Boot Speed:</span> <span class="value">${safeHtml(reportAsset.booting_speed || "-")}</span></div>
                  <div class="row"><span class="label">Desktop Loading:</span> <span class="value">${safeHtml(reportAsset.desktop_loading_speed || "-")}</span></div>
                  <div class="row"><span class="label">Online Status:</span> <span class="value">${safeHtml(reportAsset.online_status || "-")}</span></div>
                  <div class="row"><span class="label">Windows Update:</span> <span class="value">${safeHtml(reportAsset.windows_update || "-")}</span></div>
                  <div class="row"><span class="label">Recommendation:</span> <span class="value">${safeHtml(reportAsset.recommendation)}</span></div>
                </div>
                <div class="health-checks">${recordedHealthChecks.map((check) => `<div class="health-check ${check.good ? "good" : ""}"><small>${safeHtml(check.label)}</small><strong>${safeHtml(check.value)}</strong></div>`).join("")}</div>
              </section>

              <section class="section full">
                <h2 class="section-title">Current Device Status</h2>
                <div class="summary-grid">
                  <div class="summary"><small>Health</small><strong style="color:${healthTone.accent}">${healthScore}%</strong></div>
                  <div class="summary"><small>Classification</small><strong>${safeHtml(healthTone.label)}</strong></div>
                  <div class="summary"><small>Latest Audit</small><strong>${safeHtml(latestAudit ? formatDate(latestAudit.inspection_date) : "None")}</strong></div>
                  <div class="summary"><small>Maintenance</small><strong>${safeHtml(latestMaintenance?.status || "No record")}</strong></div>
                </div>
              </section>

              <section class="section">
                <h2 class="section-title">Latest Audit</h2>
                ${latestAudit ? `<div><strong>${safeHtml(latestAudit.final_status)}</strong> — Score ${safeHtml(latestAudit.health_score ?? 0)}%<br />Inspected by ${safeHtml(latestAudit.inspected_by)} on ${safeHtml(formatDate(latestAudit.inspection_date))}<br />${safeHtml(latestAudit.remarks || "No remarks recorded.")}</div>` : `<div>No audit records found for this device.</div>`}
              </section>

              <section class="section">
                <h2 class="section-title">Latest Maintenance</h2>
                ${latestMaintenance ? `<div><strong>${safeHtml(latestMaintenance.issue || "Maintenance ticket")}</strong><br />${safeHtml(latestMaintenance.status || "Open")} — ${safeHtml(latestMaintenance.priority || "Medium")} priority<br />Technician: ${safeHtml(latestMaintenance.technician || "Not assigned")}<br />${safeHtml(latestMaintenance.resolution_notes || latestMaintenance.action_taken || latestMaintenance.notes || "No details recorded.")}</div>` : `<div>No maintenance records found for this device.</div>`}
              </section>

              <section class="section full">
                <h2 class="section-title">Notes & Alerts</h2>
                <div><span class="label">Alerts:</span> ${safeHtml(reportAsset.alerts.length ? reportAsset.alerts.join(", ") : "None")}</div>
                <div style="margin-top:1.5mm"><span class="label">Device Notes:</span> ${safeHtml(reportAsset.notes || "No notes recorded.")}</div>
              </section>

              ${photoItems.length ? `<section class="section full"><h2 class="section-title">Photographic Asset Evidence</h2><div class="photos">${photoItems.map((item) => `<div class="evidence"><img src="${safeHtml(item.url)}" alt="${safeHtml(item.label)}" /><div class="evidence-label">${safeHtml(item.label)}</div></div>`).join("")}</div></section>` : ""}

              <section class="section full">
                <div class="barcode-wrap">
                  <div><h2 class="section-title" style="border:0;margin:0">Asset Identification</h2><div>Scan the QR code or Code 128 barcode to identify this asset.</div></div>
                  <div><img class="barcode" src="${safeHtml(barcodeUrl)}" alt="Asset barcode" /><div class="barcode-id">${safeHtml(reportAsset.asset_tag)}</div></div>
                </div>
              </section>
            </div>

            <div class="signatures">
              <div class="signature"><strong>Prepared by</strong>${safeHtml(user?.email || "ICT Department")}<br />ICT Department<br />Date: ${safeHtml(formatDate(generatedAt.toISOString()))}</div>
              <div class="signature"><strong>Verified by</strong>IT Manager<br />Name / Signature / Date</div>
              <div class="signature"><strong>Approved by</strong>Executive Director / Delegate<br />Name / Signature / Date</div>
            </div>

            <footer class="footer">
              <span><strong>KOPKOP COLLEGE • ICT ASSET MANAGEMENT SYSTEM</strong><br />CONFIDENTIAL – INTERNAL ICT ASSET RECORD • Document Version 2.4</span>
              <span>${safeHtml(reportAsset.asset_tag)} • Controlled Document • ${safeHtml(formatDate(generatedAt.toISOString()))}</span>
            </footer>
          </main>
          ${buildPrintScript()}
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=1100,height=1200");
    if (!printWindow) {
      alert("Please allow pop-ups so the device report can print.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
  }


  function printAssetLifecycleReport() {
    if (!selectedAsset) {
      alert("Please select a device first.");
      return;
    }

    const asset = selectedAsset;
    const logoUrl = `${window.location.origin}/kopkop-logo.png`;
    const qrUrl = buildQrUrl(buildPublicAssetUrl(asset.asset_tag), 700);
    const generatedAt = new Date();
    const events = selectedAssetTimeline;
    const reportNumber = `LC-${generatedAt.getFullYear()}-${String(asset.id).padStart(4, "0")}`;

    const eventRows = events
      .map((item) => {
        const accent = lifecycleAccent(item.type);
        return `
          <div class="event">
            <div class="marker" style="background:${accent}">${safeHtml(lifecycleIcon(item.type))}</div>
            <div class="event-body" style="border-left:4px solid ${accent}">
              <div class="event-top">
                <div>
                  <div class="event-type" style="color:${accent}">${safeHtml(item.type)}</div>
                  <div class="event-title">${safeHtml(item.title)}</div>
                </div>
                <div class="event-date">${safeHtml(formatDateTime(item.date))}</div>
              </div>
              <div class="event-subtitle">${safeHtml(item.subtitle)}</div>
              <div class="event-notes">${safeHtml(item.notes)}</div>
            </div>
          </div>`;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${safeHtml(asset.asset_tag)} - Asset Lifecycle Report</title>
          <style>
            @page { size: A4; margin: 12mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; background: #fff; }
            .page { position: relative; min-height: 270mm; }
            .watermark { position: fixed; inset: 28% 20%; opacity: .035; object-fit: contain; width: 60%; z-index: 0; }
            .content { position: relative; z-index: 1; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #0f766e; padding-bottom: 8px; }
            .brand { display: flex; align-items: center; gap: 12px; }
            .logo { width: 58px; height: 58px; object-fit: contain; }
            .school { font-size: 18px; font-weight: 800; letter-spacing: .04em; }
            .system { margin-top: 2px; color: #475569; font-size: 10px; text-transform: uppercase; letter-spacing: .12em; }
            .qr { width: 62px; height: 62px; padding: 3px; border: 1px solid #cbd5e1; border-radius: 8px; }
            .titlebar { margin-top: 12px; background: #0f172a; color: white; border-radius: 12px; padding: 14px 16px; display: flex; justify-content: space-between; gap: 18px; }
            .title { font-size: 20px; font-weight: 800; }
            .subtitle { margin-top: 4px; font-size: 11px; color: #cbd5e1; }
            .report-meta { text-align: right; font-size: 10px; line-height: 1.55; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 10px; }
            .card { border: 1px solid #dbe3ec; border-radius: 9px; padding: 9px; background: #f8fafc; }
            .label { font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .08em; }
            .value { margin-top: 4px; font-size: 11px; font-weight: 700; word-break: break-word; }
            .section-title { margin: 16px 0 9px; font-size: 11px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: .12em; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
            .timeline { position: relative; padding-left: 18px; }
            .timeline:before { content: ""; position: absolute; left: 12px; top: 7px; bottom: 7px; width: 2px; background: #99f6e4; }
            .event { position: relative; display: grid; grid-template-columns: 26px 1fr; gap: 10px; margin-bottom: 10px; break-inside: avoid; }
            .marker { position: relative; z-index: 2; width: 24px; height: 24px; border-radius: 999px; background: #0f766e; color: white; display: grid; place-items: center; font-size: 8px; font-weight: 800; }
            .event-body { border: 1px solid #dbe3ec; border-radius: 9px; padding: 9px 11px; background: white; }
            .event-top { display: flex; justify-content: space-between; gap: 12px; }
            .event-type { color: #0f766e; font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: .09em; }
            .event-title { margin-top: 2px; font-size: 11px; font-weight: 800; }
            .event-date { color: #64748b; font-size: 9px; white-space: nowrap; }
            .event-subtitle { margin-top: 5px; font-size: 9px; font-weight: 700; color: #334155; }
            .event-notes { margin-top: 4px; font-size: 9px; line-height: 1.45; color: #475569; white-space: pre-wrap; }
            .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 20px; break-inside: avoid; }
            .signature { padding-top: 28px; border-top: 1px solid #64748b; font-size: 9px; color: #475569; }
            .footer { margin-top: 14px; border-top: 1px solid #cbd5e1; padding-top: 6px; display: flex; justify-content: space-between; font-size: 8px; color: #64748b; }
          </style>
        </head>
        <body>
          <img class="watermark" src="${safeHtml(logoUrl)}" alt="" />
          <div class="page content">
            <div class="header">
              <div class="brand">
                <img class="logo" src="${safeHtml(logoUrl)}" alt="Kopkop College" />
                <div>
                  <div class="school">KOPKOP COLLEGE</div>
                  <div class="system">ICT Asset Management System</div>
                </div>
              </div>
              <img class="qr" src="${safeHtml(qrUrl)}" alt="Asset QR Code" />
            </div>

            <div class="titlebar">
              <div>
                <div class="title">Asset Lifecycle Report</div>
                <div class="subtitle">Complete chronological history for ${safeHtml(asset.asset_tag)} · ${safeHtml(asset.item_name)}</div>
              </div>
              <div class="report-meta">
                <div><strong>Report:</strong> ${safeHtml(reportNumber)}</div>
                <div><strong>Generated:</strong> ${safeHtml(formatDateTime(generatedAt.toISOString()))}</div>
                <div><strong>Prepared by:</strong> ${safeHtml(user?.email || "ICT Department")}</div>
              </div>
            </div>

            <div class="summary">
              <div class="card"><div class="label">Asset Tag</div><div class="value">${safeHtml(asset.asset_tag)}</div></div>
              <div class="card"><div class="label">Device</div><div class="value">${safeHtml(`${asset.brand || "-"} ${asset.model || ""}`.trim())}</div></div>
              <div class="card"><div class="label">Current Status</div><div class="value">${safeHtml(asset.status || "-")}</div></div>
              <div class="card"><div class="label">Health</div><div class="value">${safeHtml(`${asset.displayScore}% · ${asset.healthLabel}`)}</div></div>
              <div class="card"><div class="label">Serial Number</div><div class="value">${safeHtml(asset.serial_number || "-")}</div></div>
              <div class="card"><div class="label">Assigned To</div><div class="value">${safeHtml(asset.assigned_to || "-")}</div></div>
              <div class="card"><div class="label">Location</div><div class="value">${safeHtml(asset.location || "-")}</div></div>
              <div class="card"><div class="label">Recorded Events</div><div class="value">${events.length}</div></div>
            </div>

            <div class="section-title">Lifecycle Timeline</div>
            <div class="timeline">${eventRows}</div>

            <div class="signatures">
              <div class="signature">Prepared by · ICT Technician</div>
              <div class="signature">Verified by · IT Manager</div>
              <div class="signature">Approved by · Management</div>
            </div>

            <div class="footer">
              <span>CONFIDENTIAL · INTERNAL ICT ASSET RECORD · Version 3.0</span>
              <span>${safeHtml(asset.asset_tag)} · ${events.length} lifecycle events</span>
            </div>
          </div>
          ${buildPrintScript()}
        </body>
      </html>`;

    const printWindow = window.open("", "_blank", "width=960,height=1000");
    if (!printWindow) {
      alert("Please allow pop-ups so the lifecycle report can print.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
  }

  async function printMaintenanceReport(record: MaintenanceRecord) {
    const relatedAsset = record.asset_id ? maintenanceAssetsById.get(record.asset_id) || null : null;
    const generatedAt = new Date();
    const reportYear = new Date(record.date_reported || record.created_at || Date.now()).getFullYear();
    const ticketNumber = `MT-${reportYear}-${String(record.id).padStart(4, "0")}`;
    const logoUrl = `${window.location.origin}/kopkop-logo.png`;
    const assetTagForQr = (record.asset_tag || relatedAsset?.asset_tag || "").trim();
    const qrValue = assetTagForQr ? buildPublicAssetUrl(assetTagForQr) : ticketNumber;
    const qrUrl = buildQrUrl(qrValue, 700);

    const status = record.status || "Open";
    const statusTone =
      status === "Completed"
        ? { accent: "#15803d", soft: "#dcfce7" }
        : status === "Cancelled"
          ? { accent: "#b91c1c", soft: "#fee2e2" }
          : status === "Waiting for Parts"
            ? { accent: "#c2410c", soft: "#ffedd5" }
            : status === "In Progress"
              ? { accent: "#a16207", soft: "#fef3c7" }
              : { accent: "#0369a1", soft: "#e0f2fe" };

    // Maintenance reports use ticket-specific job evidence, not asset passport photos.
    const photoUrls = await getMaintenanceEvidence(record.id);

    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${safeHtml(ticketNumber)} - Maintenance Report</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 10px;
              line-height: 1.35;
            }
            body { position: relative; }
            .watermark {
              position: fixed;
              inset: 23% 20% auto 20%;
              width: 60%;
              opacity: 0.045;
              z-index: 0;
              pointer-events: none;
            }
            .report { position: relative; z-index: 1; max-width: 190mm; margin: 0 auto; }
            .header {
              display: grid;
              grid-template-columns: 28mm 1fr 38mm;
              gap: 5mm;
              align-items: center;
              border-bottom: 3px solid #0f3b63;
              padding-bottom: 4mm;
            }
            .logo { width: 25mm; height: 25mm; object-fit: contain; }
            .school { font-size: 21px; font-weight: 900; color: #0f3b63; letter-spacing: .02em; }
            .system { margin-top: 1mm; font-size: 10px; font-weight: 700; color: #475569; }
            .document-title { margin-top: 2mm; font-size: 13px; font-weight: 900; letter-spacing: .12em; color: #0f172a; }
            .header-meta { text-align: right; color: #475569; font-size: 8.5px; }
            .ticket-banner {
              margin-top: 4mm;
              padding: 4mm;
              border-radius: 4mm;
              background: #0f3b63;
              color: #ffffff;
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 6mm;
              align-items: center;
            }
            .ticket-title { font-size: 18px; font-weight: 900; }
            .ticket-subtitle { margin-top: 1mm; color: #dbeafe; font-size: 9px; }
            .status-pill {
              display: inline-block;
              border-radius: 999px;
              padding: 2.5mm 4mm;
              background: ${statusTone.soft};
              color: ${statusTone.accent};
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: .08em;
            }
            .summary-grid {
              margin-top: 4mm;
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 2mm;
            }
            .summary-card {
              border: 1px solid #cbd5e1;
              border-radius: 3mm;
              padding: 3mm;
              min-height: 17mm;
              background: #f8fafc;
            }
            .label { color: #64748b; font-size: 7.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
            .value { margin-top: 1mm; font-size: 10px; font-weight: 800; color: #0f172a; overflow-wrap: anywhere; }
            .section {
              margin-top: 4mm;
              border: 1px solid #cbd5e1;
              border-radius: 3mm;
              overflow: hidden;
              break-inside: avoid;
            }
            .section-title {
              padding: 2.5mm 3mm;
              background: #eaf1f7;
              border-bottom: 1px solid #cbd5e1;
              color: #0f3b63;
              font-size: 9px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: .08em;
            }
            .section-body {
              min-height: 13mm;
              padding: 3mm;
              white-space: pre-wrap;
              overflow-wrap: anywhere;
              font-size: 9.5px;
            }
            .asset-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 2mm 5mm;
            }
            .asset-row { display: grid; grid-template-columns: 34mm 1fr; gap: 2mm; }
            .asset-row strong { color: #475569; }
            .photos {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 3mm;
            }
            .photo-card { text-align: center; }
            .photo-card img {
              width: 100%;
              height: 35mm;
              object-fit: contain;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 2mm;
              padding: 1mm;
            }
            .photo-label { margin-top: 1mm; color: #475569; font-size: 8px; font-weight: 700; }
            .signatures {
              margin-top: 8mm;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 7mm;
              break-inside: avoid;
            }
            .signature-line { margin-top: 12mm; border-top: 1px solid #334155; padding-top: 1.5mm; text-align: center; }
            .signature-role { font-weight: 900; }
            .signature-help { margin-top: 1mm; color: #64748b; font-size: 7.5px; }
            .footer {
              margin-top: 6mm;
              padding-top: 2mm;
              border-top: 1px solid #94a3b8;
              display: flex;
              justify-content: space-between;
              gap: 4mm;
              color: #64748b;
              font-size: 7.5px;
            }
            .qr { width: 23mm; height: 23mm; object-fit: contain; background: #ffffff; padding: 1mm; border-radius: 2mm; }
          </style>
        </head>
        <body>
          <img class="watermark" src="${safeHtml(logoUrl)}" alt="" />
          <main class="report">
            <header class="header">
              <img class="logo" src="${safeHtml(logoUrl)}" alt="Kopkop College Logo" />
              <div>
                <div class="school">KOPKOP COLLEGE</div>
                <div class="system">ICT Asset, Device Health & Audit System</div>
                <div class="document-title">ICT MAINTENANCE REPORT</div>
              </div>
              <div class="header-meta">
                <div><strong>Generated:</strong> ${safeHtml(generatedAt.toLocaleString())}</div>
                <div><strong>Document:</strong> ${safeHtml(ticketNumber)}</div>
                <div><strong>Version:</strong> 2.1</div>
              </div>
            </header>

            <section class="ticket-banner">
              <div>
                <div class="ticket-title">${safeHtml(ticketNumber)}</div>
                <div class="ticket-subtitle">${safeHtml(record.asset_tag || relatedAsset?.asset_tag || "Unlinked asset")} · ${safeHtml(record.item_name || relatedAsset?.item_name || "Maintenance ticket")}</div>
              </div>
              <div style="display:flex;align-items:center;gap:4mm;">
                <div class="status-pill">${safeHtml(status)}</div>
                <img class="qr" src="${safeHtml(qrUrl)}" alt="Asset QR Code" />
              </div>
            </section>

            <section class="summary-grid">
              <div class="summary-card"><div class="label">Priority</div><div class="value">${safeHtml(record.priority || "Medium")}</div></div>
              <div class="summary-card"><div class="label">Date Reported</div><div class="value">${safeHtml(formatDate(record.date_reported || record.created_at))}</div></div>
              <div class="summary-card"><div class="label">Repair Date</div><div class="value">${safeHtml(formatDate(record.repair_date))}</div></div>
              <div class="summary-card"><div class="label">Closed Date</div><div class="value">${safeHtml(formatDateTime(record.closed_date))}</div></div>
            </section>

            <section class="section">
              <div class="section-title">Asset & Assignment Information</div>
              <div class="section-body asset-grid">
                <div class="asset-row"><strong>Asset Tag:</strong><span>${safeHtml(record.asset_tag || relatedAsset?.asset_tag || "-")}</span></div>
                <div class="asset-row"><strong>Computer / Item:</strong><span>${safeHtml(record.item_name || relatedAsset?.item_name || "-")}</span></div>
                <div class="asset-row"><strong>Category:</strong><span>${safeHtml(relatedAsset?.category || "-")}</span></div>
                <div class="asset-row"><strong>Brand / Model:</strong><span>${safeHtml([relatedAsset?.brand, relatedAsset?.model].filter(Boolean).join(" ") || "-")}</span></div>
                <div class="asset-row"><strong>Serial Number:</strong><span>${safeHtml(relatedAsset?.serial_number || "-")}</span></div>
                <div class="asset-row"><strong>Location:</strong><span>${safeHtml(relatedAsset?.location || "-")}</span></div>
                <div class="asset-row"><strong>Assigned User:</strong><span>${safeHtml(record.assigned_to || relatedAsset?.assigned_to || "-")}</span></div>
                <div class="asset-row"><strong>Reported By:</strong><span>${safeHtml(record.reported_by || "-")}</span></div>
                <div class="asset-row"><strong>Technician:</strong><span>${safeHtml(record.technician || "-")}</span></div>
                <div class="asset-row"><strong>Previous Asset Status:</strong><span>${safeHtml(record.previous_asset_status || "-")}</span></div>
              </div>
            </section>

            <section class="section">
              <div class="section-title">Problem Reported</div>
              <div class="section-body">${safeHtml(record.issue || "No issue description recorded.")}</div>
            </section>

            <section class="section">
              <div class="section-title">Initial Diagnosis / Notes</div>
              <div class="section-body">${safeHtml(record.notes || "No initial notes recorded.")}</div>
            </section>

            <section class="section">
              <div class="section-title">Action Taken / Work Performed</div>
              <div class="section-body">${safeHtml(record.action_taken || "No action taken recorded.")}</div>
            </section>

            <section class="section">
              <div class="section-title">Resolution / Current Outcome</div>
              <div class="section-body">${safeHtml(record.resolution_notes || "No resolution recorded.")}</div>
            </section>

            <section class="section">
              <div class="section-title">Photographic Maintenance Evidence</div>
              <div class="section-body">
                ${
                  photoUrls.length
                    ? `<div class="photos">
                        ${photoUrls
                          .map(
                            (photo) => `<div class="photo-card">
                              <img src="${safeHtml(photo.url)}" alt="${safeHtml(photo.label)}" />
                              <div class="photo-label">${safeHtml(photo.label)}</div>
                            </div>`
                          )
                          .join("")}
                      </div>`
                    : `<div style="color:#64748b;">No maintenance job evidence was uploaded for this ticket.</div>`
                }
              </div>
            </section>

            <section class="signatures">
              <div><div class="signature-line"><div class="signature-role">${safeHtml(record.technician || "ICT Technician")}</div><div class="signature-help">Technician Signature / Date</div></div></div>
              <div><div class="signature-line"><div class="signature-role">IT Manager</div><div class="signature-help">Verified By / Signature / Date</div></div></div>
              <div><div class="signature-line"><div class="signature-role">Assigned User / Department</div><div class="signature-help">Device Received / Signature / Date</div></div></div>
            </section>

            <footer class="footer">
              <span>CONFIDENTIAL – INTERNAL ICT MAINTENANCE RECORD</span>
              <span>${safeHtml(ticketNumber)} · ${safeHtml(record.asset_tag || relatedAsset?.asset_tag || "-")}</span>
            </footer>
          </main>
          ${buildPrintScript()}
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=1000,height=900");
    if (!printWindow) {
      alert("Please allow pop-ups so the maintenance report can print.");
      return;
    }
    printWindow.document.write(reportHtml);
    printWindow.document.close();
  }

  function printAuditReport(check: DeviceStatusCheck) {
    const relatedAsset = check.asset_id ? maintenanceAssetsById.get(check.asset_id) || null : null;
    const generatedAt = new Date();
    const reportYear = new Date(check.inspection_date || check.created_at || Date.now()).getFullYear();
    const auditNumber = `AUD-${reportYear}-${String(check.id).padStart(4, "0")}`;
    const logoUrl = `${window.location.origin}/kopkop-logo.png`;
    const assetTagForQr = (check.asset_tag || relatedAsset?.asset_tag || "").trim();
    const qrValue = assetTagForQr ? buildPublicAssetUrl(assetTagForQr) : auditNumber;
    const qrUrl = buildQrUrl(qrValue, 700);
    const score = Math.max(0, Math.min(100, check.health_score ?? 0));
    const scoreTone =
      score >= 85
        ? { accent: "#15803d", soft: "#dcfce7", label: "Healthy" }
        : score >= 65
          ? { accent: "#a16207", soft: "#fef3c7", label: "Watch" }
          : score >= 40
            ? { accent: "#c2410c", soft: "#ffedd5", label: "Needs Upgrade" }
            : { accent: "#b91c1c", soft: "#fee2e2", label: "Critical" };

    const photoUrls = [
      { label: "Overall Device", url: relatedAsset?.photo_front_url },
      { label: "Additional Photo", url: relatedAsset?.photo_back_url },
      { label: "Asset / Serial Label", url: relatedAsset?.photo_label_url },
    ].filter((photo) => Boolean(photo.url));

    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${safeHtml(auditNumber)} - Audit Report</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 10px;
              line-height: 1.35;
            }
            .watermark {
              position: fixed;
              inset: 23% 20% auto 20%;
              width: 60%;
              opacity: 0.045;
              z-index: 0;
              pointer-events: none;
            }
            .report { position: relative; z-index: 1; max-width: 190mm; margin: 0 auto; }
            .header {
              display: grid;
              grid-template-columns: 28mm 1fr 38mm;
              gap: 5mm;
              align-items: center;
              border-bottom: 3px solid #0f3b63;
              padding-bottom: 4mm;
            }
            .logo { width: 25mm; height: 25mm; object-fit: contain; }
            .school { font-size: 21px; font-weight: 900; color: #0f3b63; letter-spacing: .02em; }
            .system { margin-top: 1mm; font-size: 10px; font-weight: 700; color: #475569; }
            .document-title { margin-top: 2mm; font-size: 13px; font-weight: 900; letter-spacing: .12em; color: #0f172a; }
            .header-meta { text-align: right; color: #475569; font-size: 8.5px; }
            .audit-banner {
              margin-top: 4mm;
              padding: 4mm;
              border-radius: 4mm;
              background: #0f3b63;
              color: #ffffff;
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 6mm;
              align-items: center;
            }
            .audit-title { font-size: 18px; font-weight: 900; }
            .audit-subtitle { margin-top: 1mm; color: #dbeafe; font-size: 9px; }
            .score-block { display: flex; align-items: center; gap: 4mm; }
            .score-pill {
              display: grid;
              place-items: center;
              width: 25mm;
              height: 25mm;
              border-radius: 50%;
              background: ${scoreTone.soft};
              color: ${scoreTone.accent};
              border: 2px solid ${scoreTone.accent};
              font-weight: 900;
              font-size: 13px;
            }
            .summary-grid {
              margin-top: 4mm;
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 2mm;
            }
            .summary-card {
              border: 1px solid #cbd5e1;
              border-radius: 3mm;
              padding: 3mm;
              min-height: 17mm;
              background: #f8fafc;
            }
            .label { color: #64748b; font-size: 7.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
            .value { margin-top: 1mm; font-size: 10px; font-weight: 800; color: #0f172a; overflow-wrap: anywhere; }
            .section {
              margin-top: 4mm;
              border: 1px solid #cbd5e1;
              border-radius: 3mm;
              overflow: hidden;
              break-inside: avoid;
            }
            .section-title {
              padding: 2.5mm 3mm;
              background: #eaf1f7;
              border-bottom: 1px solid #cbd5e1;
              color: #0f3b63;
              font-size: 9px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: .08em;
            }
            .section-body { padding: 3mm; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 9.5px; }
            .asset-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2mm 5mm; }
            .asset-row { display: grid; grid-template-columns: 34mm 1fr; gap: 2mm; }
            .asset-row strong { color: #475569; }
            .photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
            .photo-card { text-align: center; }
            .photo-card img {
              width: 100%;
              height: 35mm;
              object-fit: contain;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 2mm;
              padding: 1mm;
            }
            .photo-label { margin-top: 1mm; color: #475569; font-size: 8px; font-weight: 700; }
            .signatures {
              margin-top: 8mm;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 7mm;
              break-inside: avoid;
            }
            .signature-line { margin-top: 12mm; border-top: 1px solid #334155; padding-top: 1.5mm; text-align: center; }
            .signature-role { font-weight: 900; }
            .signature-help { margin-top: 1mm; color: #64748b; font-size: 7.5px; }
            .footer {
              margin-top: 6mm;
              padding-top: 2mm;
              border-top: 1px solid #94a3b8;
              display: flex;
              justify-content: space-between;
              gap: 4mm;
              color: #64748b;
              font-size: 7.5px;
            }
            .qr { width: 23mm; height: 23mm; object-fit: contain; background: #ffffff; padding: 1mm; border-radius: 2mm; }
          </style>
        </head>
        <body>
          <img class="watermark" src="${safeHtml(logoUrl)}" alt="" />
          <main class="report">
            <header class="header">
              <img class="logo" src="${safeHtml(logoUrl)}" alt="Kopkop College Logo" />
              <div>
                <div class="school">KOPKOP COLLEGE</div>
                <div class="system">ICT Asset, Device Health & Audit System</div>
                <div class="document-title">ICT DEVICE AUDIT REPORT</div>
              </div>
              <div class="header-meta">
                <div><strong>Generated:</strong> ${safeHtml(generatedAt.toLocaleString())}</div>
                <div><strong>Document:</strong> ${safeHtml(auditNumber)}</div>
                <div><strong>Version:</strong> 2.1</div>
              </div>
            </header>

            <section class="audit-banner">
              <div>
                <div class="audit-title">${safeHtml(auditNumber)}</div>
                <div class="audit-subtitle">${safeHtml(check.asset_tag || relatedAsset?.asset_tag || "Unlinked asset")} · ${safeHtml(check.item_name || relatedAsset?.item_name || "Device audit")}</div>
              </div>
              <div class="score-block">
                <div class="score-pill">${safeHtml(score)}%</div>
                <img class="qr" src="${safeHtml(qrUrl)}" alt="Asset QR Code" />
              </div>
            </section>

            <section class="summary-grid">
              <div class="summary-card"><div class="label">Final Status</div><div class="value">${safeHtml(check.final_status)}</div></div>
              <div class="summary-card"><div class="label">Priority</div><div class="value">${safeHtml(check.priority_level || "Low")}</div></div>
              <div class="summary-card"><div class="label">Health Classification</div><div class="value">${safeHtml(scoreTone.label)}</div></div>
              <div class="summary-card"><div class="label">Issue Detected</div><div class="value">${safeHtml(check.issue_detected ? "Yes" : "No")}</div></div>
            </section>

            <section class="section">
              <div class="section-title">Asset & Inspection Information</div>
              <div class="section-body asset-grid">
                <div class="asset-row"><strong>Asset Tag:</strong><span>${safeHtml(check.asset_tag || relatedAsset?.asset_tag || "-")}</span></div>
                <div class="asset-row"><strong>Computer / Item:</strong><span>${safeHtml(check.item_name || relatedAsset?.item_name || "-")}</span></div>
                <div class="asset-row"><strong>Category:</strong><span>${safeHtml(check.category || relatedAsset?.category || "-")}</span></div>
                <div class="asset-row"><strong>Brand / Model:</strong><span>${safeHtml([relatedAsset?.brand, relatedAsset?.model].filter(Boolean).join(" ") || "-")}</span></div>
                <div class="asset-row"><strong>Serial Number:</strong><span>${safeHtml(relatedAsset?.serial_number || "-")}</span></div>
                <div class="asset-row"><strong>Inspection Date:</strong><span>${safeHtml(formatDate(check.inspection_date))}</span></div>
                <div class="asset-row"><strong>Inspected By:</strong><span>${safeHtml(check.inspected_by || "-")}</span></div>
                <div class="asset-row"><strong>Assigned User:</strong><span>${safeHtml(check.assigned_to || relatedAsset?.assigned_to || "-")}</span></div>
                <div class="asset-row"><strong>Division:</strong><span>${safeHtml(check.division || "-")}</span></div>
                <div class="asset-row"><strong>Department:</strong><span>${safeHtml(check.department || "-")}</span></div>
                <div class="asset-row"><strong>Office / Area:</strong><span>${safeHtml(check.office_area || check.location || relatedAsset?.location || "-")}</span></div>
                <div class="asset-row"><strong>Assigned Role:</strong><span>${safeHtml(check.assigned_role || "-")}</span></div>
              </div>
            </section>

            <section class="section">
              <div class="section-title">Audit Findings / Remarks</div>
              <div class="section-body">${safeHtml(check.remarks || "No remarks recorded.")}</div>
            </section>

            <section class="section">
              <div class="section-title">Technical Snapshot</div>
              <div class="section-body asset-grid">
                <div class="asset-row"><strong>Operating System:</strong><span>${safeHtml(relatedAsset?.os || "-")}</span></div>
                <div class="asset-row"><strong>Processor:</strong><span>${safeHtml(relatedAsset?.processor || "-")}</span></div>
                <div class="asset-row"><strong>RAM:</strong><span>${safeHtml(relatedAsset?.ram || "-")}</span></div>
                <div class="asset-row"><strong>Storage:</strong><span>${safeHtml(relatedAsset?.storage || "-")}</span></div>
                <div class="asset-row"><strong>TPM:</strong><span>${safeHtml(relatedAsset?.tpm_status || "-")}</span></div>
                <div class="asset-row"><strong>Windows Update:</strong><span>${safeHtml(relatedAsset?.windows_update || "-")}</span></div>
                <div class="asset-row"><strong>Online Status:</strong><span>${safeHtml(relatedAsset?.online_status || "-")}</span></div>
                <div class="asset-row"><strong>Performance:</strong><span>${safeHtml(relatedAsset?.performance || "-")}</span></div>
              </div>
            </section>

            ${
              photoUrls.length
                ? `<section class="section">
                    <div class="section-title">Photographic Asset Evidence</div>
                    <div class="section-body">
                      <div class="photos">
                        ${photoUrls
                          .map(
                            (photo) => `<div class="photo-card">
                              <img src="${safeHtml(photo.url)}" alt="${safeHtml(photo.label)}" />
                              <div class="photo-label">${safeHtml(photo.label)}</div>
                            </div>`
                          )
                          .join("")}
                      </div>
                    </div>
                  </section>`
                : ""
            }

            <section class="signatures">
              <div><div class="signature-line"><div class="signature-role">${safeHtml(check.inspected_by || "ICT Auditor")}</div><div class="signature-help">Inspector Signature / Date</div></div></div>
              <div><div class="signature-line"><div class="signature-role">IT Manager</div><div class="signature-help">Verified By / Signature / Date</div></div></div>
              <div><div class="signature-line"><div class="signature-role">Department Representative</div><div class="signature-help">Acknowledged By / Signature / Date</div></div></div>
            </section>

            <footer class="footer">
              <span>CONFIDENTIAL – INTERNAL ICT AUDIT RECORD</span>
              <span>${safeHtml(auditNumber)} · ${safeHtml(check.asset_tag || relatedAsset?.asset_tag || "-")}</span>
            </footer>
          </main>
          ${buildPrintScript()}
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=1000,height=900");
    if (!printWindow) {
      alert("Please allow pop-ups so the audit report can print.");
      return;
    }
    printWindow.document.write(reportHtml);
    printWindow.document.close();
  }

  function printAllVisibleLabels() {
    const items = labelAssets.slice(0, 24);
    if (items.length === 0) {
      alert("No labels to print.");
      return;
    }

    const labelsHtml = items
      .map((asset) => {
        const qrValue = buildPublicAssetUrl(asset.asset_tag);
        const qrUrl = buildQrUrl(qrValue, 1000);
        return `
          <div class="label">
            <div class="brand">KOPKOP ICT</div>
            <div class="asset-tag">${safeHtml(asset.asset_tag)}</div>
            <div class="asset-name">${safeHtml(asset.item_name)}</div>
            <div class="asset-meta">${safeHtml(asset.location || "No location")}</div>
            <img class="qr" src="${safeHtml(qrUrl)}" alt="QR ${safeHtml(asset.asset_tag)}" />
            <div class="qr-value">${safeHtml(asset.asset_tag)}</div>
          </div>
        `;
      })
      .join("");

    const html = `
      <html>
        <head>
          <title>KOPKOP Asset Labels</title>
          <style>
            @page {
              size: A4;
              margin: 8mm;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #111827;
              background: #ffffff;
            }

            .sheet {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 6mm;
              padding: 0;
            }

            .label {
              height: 35mm;
              border: 1.5px solid #0f172a;
              border-radius: 6px;
              padding: 3mm;
              text-align: center;
              break-inside: avoid;
              page-break-inside: avoid;
              overflow: hidden;
              background: #ffffff;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
            }

            .brand {
              font-size: 7px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: #0f172a;
              line-height: 1;
              margin-bottom: 1mm;
            }

            .asset-tag {
              font-size: 11px;
              font-weight: 800;
              color: #0f172a;
              line-height: 1.1;
              max-width: 100%;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .asset-name {
              font-size: 8px;
              color: #334155;
              line-height: 1.15;
              height: 9mm;
              overflow: hidden;
              max-width: 100%;
            }

            .asset-meta {
              font-size: 7px;
              color: #64748b;
              line-height: 1.1;
              max-width: 100%;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin-bottom: 1mm;
            }

            .qr {
              width: 16mm;
              height: 16mm;
              object-fit: contain;
              display: block;
              margin: 0 auto 1mm;
              background: #ffffff;
            }

            .qr-value {
              font-size: 8px;
              font-weight: 800;
              color: #111827;
              line-height: 1;
              max-width: 100%;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="sheet">${labelsHtml}</div>
          ${buildPrintScript()}
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      alert("Please allow pop-ups so the asset labels can print.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
  }

  function getMaintenancePriority(asset: EnrichedAsset): MaintenancePriority {
    if (asset.displayScore < 40) return "Critical";
    if (asset.displayScore < 65) return "High";
    if (asset.displayScore < 85) return "Medium";
    return "Low";
  }

  function getAssetStatusFromMaintenance(status: MaintenanceStatus, previousStatus?: AssetStatus | null): AssetStatus {
    if (status === "Completed" || status === "Cancelled") return previousStatus || "In Use";
    return "Under Repair";
  }

  async function syncAssetStatusForMaintenance(
    assetId: number | null,
    nextStatus: MaintenanceStatus,
    previousStatus?: AssetStatus | null
  ) {
    if (!assetId) return;
    const assetStatus = getAssetStatusFromMaintenance(nextStatus, previousStatus);
    const { error } = await supabase
      .from("it_assets")
      .update({ status: assetStatus })
      .eq("id", assetId);
    if (error) throw error;
  }

  function resetComponentForm() {
    setComponentForm(EMPTY_COMPONENT_FORM);
    setComponentBeingReplaced(null);
    setShowComponentForm(false);
  }

  function openAddComponentForm() {
    if (!selectedAsset) return;

    setComponentBeingReplaced(null);
    setComponentForm({
      ...EMPTY_COMPONENT_FORM,
      assetId: String(selectedAsset.id),
      assetTag: selectedAsset.asset_tag,
      location: selectedAsset.location || "",
      installedBy: user?.email || "",
    });
    setShowComponentForm(true);
  }

  function openEditComponentForm(component: AssetComponent) {
    setComponentBeingReplaced(null);
    setComponentForm({
      id: component.id,
      assetId: String(component.asset_id),
      assetTag: component.asset_tag || "",
      componentType: component.component_type,
      componentName: component.component_name,
      brand: component.brand || "",
      model: component.model || "",
      serialNumber: component.serial_number || "",
      specification: component.specification || "",
      quantity: String(component.quantity || 1),
      status: component.status,
      condition: component.condition || "Good",
      installedDate: component.installed_date || "",
      removedDate: component.removed_date || "",
      supplier: component.supplier || "",
      purchaseDate: component.purchase_date || "",
      warrantyExpiry: component.warranty_expiry || "",
      location: component.location || "",
      installedBy: component.installed_by || "",
      removedBy: component.removed_by || "",
      notes: component.notes || "",
    });
    setShowComponentForm(true);
  }

  function openReplaceComponentForm(component: AssetComponent) {
    const today = new Date().toISOString().slice(0, 10);

    setComponentBeingReplaced(component);
    setComponentForm({
      ...EMPTY_COMPONENT_FORM,
      id: null,
      assetId: String(component.asset_id),
      assetTag: component.asset_tag || "",
      componentType: component.component_type,
      componentName: "",
      brand: component.brand || "",
      model: "",
      serialNumber: "",
      specification: component.specification || "",
      quantity: String(component.quantity || 1),
      status: "Installed",
      condition: "Good",
      installedDate: today,
      removedDate: "",
      supplier: component.supplier || "",
      purchaseDate: "",
      warrantyExpiry: "",
      location: component.location || selectedAsset?.location || "",
      installedBy: user?.email || "",
      removedBy: "",
      notes: `Replacement for ${component.component_name}`,
    });
    setShowComponentForm(true);
  }

  async function handleSaveComponent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAdmin) {
      alert("Only admin users can save components.");
      return;
    }

    if (!componentForm.assetId || !componentForm.componentType.trim() || !componentForm.componentName.trim()) {
      alert("Please select an asset and enter the component type and name.");
      return;
    }

    setSavingComponent(true);

    const payload = {
      asset_id: Number(componentForm.assetId),
      asset_tag: componentForm.assetTag.trim() || null,
      component_type: componentForm.componentType.trim(),
      component_name: componentForm.componentName.trim(),
      brand: componentForm.brand.trim() || null,
      model: componentForm.model.trim() || null,
      serial_number: componentForm.serialNumber.trim() || null,
      specification: componentForm.specification.trim() || null,
      quantity: Math.max(1, Number(componentForm.quantity) || 1),
      status: componentForm.status,
      condition: componentForm.condition,
      installed_date: componentForm.installedDate || null,
      removed_date: componentForm.removedDate || null,
      supplier: componentForm.supplier.trim() || null,
      purchase_date: componentForm.purchaseDate || null,
      warranty_expiry: componentForm.warrantyExpiry || null,
      location: componentForm.location.trim() || null,
      installed_by: componentForm.installedBy.trim() || null,
      removed_by: componentForm.removedBy.trim() || null,
      notes: componentForm.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (componentBeingReplaced) {
        const today = new Date().toISOString().slice(0, 10);
        const performedBy =
          user?.email ||
          componentForm.installedBy.trim() ||
          "ICT Staff";

        const { error: oldComponentError } = await supabase
          .from("asset_components")
          .update({
            status: "Replaced",
            removed_date: today,
            removed_by: performedBy,
            updated_at: new Date().toISOString(),
          })
          .eq("id", componentBeingReplaced.id);

        if (oldComponentError) throw oldComponentError;

        const { error: oldHistoryError } = await supabase
          .from("asset_component_history")
          .insert({
            component_id: componentBeingReplaced.id,
            asset_id: componentBeingReplaced.asset_id,
            asset_tag: componentBeingReplaced.asset_tag,
            component_type: componentBeingReplaced.component_type,
            component_name: componentBeingReplaced.component_name,
            action: "Replaced",
            previous_status: componentBeingReplaced.status,
            new_status: "Replaced",
            performed_by: performedBy,
            reason: `Replaced by ${componentForm.componentName.trim()}`,
            notes: componentBeingReplaced.notes,
          });

        if (oldHistoryError) throw oldHistoryError;

        const replacementPayload = {
          ...payload,
          status: "Installed" as ComponentStatus,
          removed_date: null,
          removed_by: null,
          created_at: new Date().toISOString(),
        };

        const { data: newComponent, error: newComponentError } = await supabase
          .from("asset_components")
          .insert(replacementPayload)
          .select("id")
          .single();

        if (newComponentError) throw newComponentError;

        const { error: newHistoryError } = await supabase
          .from("asset_component_history")
          .insert({
            component_id: newComponent.id,
            asset_id: Number(componentForm.assetId),
            asset_tag: componentForm.assetTag.trim() || null,
            component_type: componentForm.componentType.trim(),
            component_name: componentForm.componentName.trim(),
            action: "Installed",
            previous_status: null,
            new_status: "Installed",
            performed_by: performedBy,
            reason: `Replacement for ${componentBeingReplaced.component_name}`,
            notes: componentForm.notes.trim() || null,
          });

        if (newHistoryError) throw newHistoryError;
      } else if (componentForm.id) {
        const existing = assetComponents.find((item) => item.id === componentForm.id);
        const { error } = await supabase
          .from("asset_components")
          .update(payload)
          .eq("id", componentForm.id);

        if (error) throw error;

        const { error: historyError } = await supabase
          .from("asset_component_history")
          .insert({
            component_id: componentForm.id,
            asset_id: Number(componentForm.assetId),
            asset_tag: componentForm.assetTag.trim() || null,
            component_type: componentForm.componentType.trim(),
            component_name: componentForm.componentName.trim(),
            action: "Updated",
            previous_status: existing?.status || null,
            new_status: componentForm.status,
            performed_by: user?.email || componentForm.installedBy.trim() || "ICT Staff",
            reason: "Component record edited",
            notes: componentForm.notes.trim() || null,
          });

        if (historyError) throw historyError;
      } else {
        const { data, error } = await supabase
          .from("asset_components")
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select("id")
          .single();

        if (error) throw error;

        const { error: historyError } = await supabase
          .from("asset_component_history")
          .insert({
            component_id: data.id,
            asset_id: Number(componentForm.assetId),
            asset_tag: componentForm.assetTag.trim() || null,
            component_type: componentForm.componentType.trim(),
            component_name: componentForm.componentName.trim(),
            action: componentForm.status === "Installed" ? "Installed" : "Added",
            previous_status: null,
            new_status: componentForm.status,
            performed_by: user?.email || componentForm.installedBy.trim() || "ICT Staff",
            reason: "Component added to asset",
            notes: componentForm.notes.trim() || null,
          });

        if (historyError) throw historyError;
      }

      const successMessage = componentBeingReplaced
        ? "Component replaced successfully."
        : componentForm.id
          ? "Component updated."
          : "Component added.";

      resetComponentForm();
      await refreshAll(false);
      alert(successMessage);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save component");
    } finally {
      setSavingComponent(false);
    }
  }

  async function handleDeleteComponent(component: AssetComponent) {
    if (!isAdmin) {
      alert("Only admin users can delete components.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${component.component_name} from ${component.asset_tag || "this asset"}?`
    );
    if (!confirmed) return;

    setDeletingComponentId(component.id);

    try {
      const { error: historyError } = await supabase
        .from("asset_component_history")
        .insert({
          component_id: component.id,
          asset_id: component.asset_id,
          asset_tag: component.asset_tag,
          component_type: component.component_type,
          component_name: component.component_name,
          action: "Removed",
          previous_status: component.status,
          new_status: "Removed",
          performed_by: user?.email || "ICT Staff",
          reason: "Component record deleted",
          notes: component.notes,
        });

      if (historyError) throw historyError;

      const { error } = await supabase
        .from("asset_components")
        .delete()
        .eq("id", component.id);

      if (error) throw error;

      await refreshAll(false);
      alert("Component deleted.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to delete component");
    } finally {
      setDeletingComponentId(null);
    }
  }

  async function getMaintenanceEvidence(ticketId: number): Promise<MaintenanceEvidencePhoto[]> {
    const folder = maintenanceEvidenceFolder(ticketId);
    const { data, error } = await supabase.storage
      .from("asset-photos")
      .list(folder, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      console.error("Could not load maintenance evidence:", error);
      return [];
    }

    const slots: MaintenanceEvidenceSlot[] = ["before", "work", "completed"];
    const photos: MaintenanceEvidencePhoto[] = [];

    for (const slot of slots) {
      const file = (data || []).find((item) => item.name.startsWith(`${slot}-`));
      if (!file) continue;

      const path = `${folder}/${file.name}`;
      const { data: publicData } = supabase.storage.from("asset-photos").getPublicUrl(path);

      photos.push({
        slot,
        label: maintenanceEvidenceLabel(slot),
        url: publicData.publicUrl,
        path,
      });
    }

    return photos;
  }

  async function loadMaintenanceEvidence(ticketId: number) {
    const photos = await getMaintenanceEvidence(ticketId);
    setMaintenanceEvidence(photos);
  }

  async function handleMaintenanceEvidenceUpload(
    file: File,
    slot: MaintenanceEvidenceSlot
  ) {
    if (!isAdmin) {
      alert("Only admin users can upload maintenance evidence.");
      return;
    }

    if (!maintenanceForm.id) {
      alert("Save the maintenance ticket first, then edit it to upload job evidence.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("Please use an image smaller than 8 MB.");
      return;
    }

    setUploadingMaintenanceEvidenceSlot(slot);

    try {
      const ticketId = maintenanceForm.id;
      const folder = maintenanceEvidenceFolder(ticketId);

      // Keep one current image per evidence slot so the printed report stays clear.
      const { data: existingFiles, error: listError } = await supabase.storage
        .from("asset-photos")
        .list(folder, { limit: 100 });

      if (listError) throw listError;

      const oldPaths = (existingFiles || [])
        .filter((item) => item.name.startsWith(`${slot}-`))
        .map((item) => `${folder}/${item.name}`);

      if (oldPaths.length > 0) {
        const { error: removeError } = await supabase.storage
          .from("asset-photos")
          .remove(oldPaths);
        if (removeError) throw removeError;
      }

      const extension = (file.name.split(".").pop() || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const path = `${folder}/${slot}-${Date.now()}.${extension || "jpg"}`;

      const { error: uploadError } = await supabase.storage
        .from("asset-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      await loadMaintenanceEvidence(ticketId);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Maintenance evidence upload failed.");
    } finally {
      setUploadingMaintenanceEvidenceSlot(null);
    }
  }

  async function clearMaintenanceEvidence(slot: MaintenanceEvidenceSlot) {
    if (!isAdmin || !maintenanceForm.id) return;

    const photo = maintenanceEvidence.find((item) => item.slot === slot);
    if (!photo) return;

    if (!window.confirm(`Remove ${maintenanceEvidenceLabel(slot)} photo?`)) return;

    setUploadingMaintenanceEvidenceSlot(slot);

    try {
      const { error } = await supabase.storage.from("asset-photos").remove([photo.path]);
      if (error) throw error;
      await loadMaintenanceEvidence(maintenanceForm.id);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Could not remove maintenance evidence.");
    } finally {
      setUploadingMaintenanceEvidenceSlot(null);
    }
  }

  function resetMaintenanceForm() {
    setMaintenanceEvidence([]);
    setMaintenanceForm({
      ...EMPTY_MAINTENANCE_FORM,
      dateReported: new Date().toISOString().slice(0, 10),
    });
  }

  function createMaintenance(asset: EnrichedAsset) {
    if (!isAdmin) {
      alert("Only admin users can create maintenance tickets.");
      return;
    }

    setMaintenanceForm({
      id: null,
      assetId: String(asset.id),
      assetTag: asset.asset_tag,
      itemName: asset.item_name,
      issue: asset.alerts[0] || "",
      priority: getMaintenancePriority(asset),
      status: "Open",
      assignedTo: asset.assigned_to || "",
      reportedBy: "IT Staff",
      technician: "",
      notes: asset.recommendation || "",
      actionTaken: "",
      resolutionNotes: "",
      dateReported: new Date().toISOString().slice(0, 10),
      repairDate: "",
      previousAssetStatus: asset.status || "In Use",
    });
    setMaintenanceEvidence([]);
    setSelectedAssetId(asset.id);
    setActiveTab("maintenance");
    scrollToActiveContent("maintenance");
  }


  async function ensureAutoMaintenanceTicket(
    asset: ITAsset,
    healthScore: number,
    auditRemarks?: string | null
  ) {
    if (healthScore >= 40) return false;

    const autoIssue = "Auto-detected critical device condition";

    const { data: existingOpenTickets, error: existingError } = await supabase
      .from("maintenance_records")
      .select("id")
      .eq("asset_id", asset.id)
      .in("status", ["Open", "In Progress", "Waiting for Parts"])
      .limit(1);

    if (existingError) throw existingError;
    if (existingOpenTickets && existingOpenTickets.length > 0) return false;

    const alerts = getHealthAlerts(asset);
    const recommendation = inferRecommendation(asset, healthScore);
    const notes = [
      `Health score: ${healthScore}%`,
      alerts.length ? `Detected alerts: ${alerts.join(", ")}` : null,
      recommendation ? `Recommendation: ${recommendation}` : null,
      auditRemarks?.trim() ? `Audit remarks: ${auditRemarks.trim()}` : null,
      "This ticket was created automatically because the device was marked Critical.",
    ]
      .filter(Boolean)
      .join(" | ");

    const { error } = await supabase.from("maintenance_records").insert([
      {
        asset_id: asset.id,
        asset_tag: asset.asset_tag,
        item_name: asset.item_name,
        issue: autoIssue,
        priority: "Critical",
        status: "Open",
        assigned_to: asset.assigned_to || "IT Department",
        reported_by: "System Auto Trigger",
        technician: null,
        notes,
        action_taken: null,
        resolution_notes: null,
        date_reported: new Date().toISOString().slice(0, 10),
        repair_date: null,
        previous_asset_status: asset.status || "In Use",
        last_status_change: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    await syncAssetStatusForMaintenance(asset.id, "Open", asset.status || "In Use");
    return true;
  }

  function editMaintenance(record: MaintenanceRecord) {
    if (!isAdmin) {
      alert("Only admin users can edit maintenance tickets.");
      return;
    }

    setMaintenanceForm({
      id: record.id,
      assetId: record.asset_id ? String(record.asset_id) : "",
      assetTag: record.asset_tag || "",
      itemName: record.item_name || "",
      issue: record.issue || "",
      priority: record.priority || "Medium",
      status: record.status || "Open",
      assignedTo: record.assigned_to || "",
      reportedBy: record.reported_by || "IT Staff",
      technician: record.technician || "",
      notes: record.notes || "",
      actionTaken: record.action_taken || "",
      resolutionNotes: record.resolution_notes || "",
      dateReported: record.date_reported || new Date().toISOString().slice(0, 10),
      repairDate: record.repair_date || "",
      previousAssetStatus: record.previous_asset_status || "In Use",
    });
    void loadMaintenanceEvidence(record.id);
    setActiveTab("maintenance");
    scrollToActiveContent("maintenance");
  }

  async function handleSaveMaintenance(e: React.FormEvent) {
    e.preventDefault();

    if (!isAdmin) {
      alert("Only admin users can save maintenance tickets.");
      return;
    }

    if (!maintenanceForm.assetId || !maintenanceForm.issue.trim()) {
      alert("Please select an asset and enter the issue.");
      return;
    }

    setSavingMaintenance(true);

    const isClosedStatus = maintenanceForm.status === "Completed" || maintenanceForm.status === "Cancelled";
    const payload = {
      asset_id: Number(maintenanceForm.assetId),
      asset_tag: maintenanceForm.assetTag.trim() || null,
      item_name: maintenanceForm.itemName.trim() || null,
      issue: maintenanceForm.issue.trim(),
      priority: maintenanceForm.priority,
      status: maintenanceForm.status,
      assigned_to: maintenanceForm.assignedTo.trim() || null,
      reported_by: maintenanceForm.reportedBy.trim() || null,
      technician: maintenanceForm.technician.trim() || null,
      notes: maintenanceForm.notes.trim() || null,
      action_taken: maintenanceForm.actionTaken.trim() || null,
      resolution_notes: maintenanceForm.resolutionNotes.trim() || null,
      date_reported: maintenanceForm.dateReported || null,
      repair_date: maintenanceForm.repairDate || null,
      previous_asset_status: maintenanceForm.previousAssetStatus,
      last_status_change: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      closed_date: isClosedStatus ? new Date().toISOString() : null,
    };

    try {
      const result = maintenanceForm.id
        ? await supabase.from("maintenance_records").update(payload).eq("id", maintenanceForm.id)
        : await supabase.from("maintenance_records").insert([{ ...payload, created_at: new Date().toISOString() }]);

      if (result.error) throw result.error;

      await syncAssetStatusForMaintenance(Number(maintenanceForm.assetId), maintenanceForm.status, maintenanceForm.previousAssetStatus);
      resetMaintenanceForm();
      await refreshAll(false);
      alert(maintenanceForm.id ? "Maintenance ticket updated." : "Maintenance ticket created.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save maintenance ticket");
    } finally {
      setSavingMaintenance(false);
    }
  }

  async function updateMaintenanceStatus(record: MaintenanceRecord, status: MaintenanceStatus) {
    if (!isAdmin) {
      alert("Only admin users can update maintenance status.");
      return;
    }

    try {
      const nowIso = new Date().toISOString();
      const updates: Record<string, string | null> = {
        status,
        updated_at: nowIso,
        last_status_change: nowIso,
      };

      if (status === "Completed") {
        const actionTaken = window.prompt(
          `Enter action taken for ${record.asset_tag || "this asset"}`,
          record.action_taken || ""
        );
        if (!actionTaken || !actionTaken.trim()) {
          alert("Action Taken is required before completing this ticket.");
          return;
        }

        const resolutionNotes = window.prompt(
          `Enter resolution notes for ${record.asset_tag || "this asset"}`,
          record.resolution_notes || ""
        );
        if (!resolutionNotes || !resolutionNotes.trim()) {
          alert("Resolution Notes are required before completing this ticket.");
          return;
        }

        updates.action_taken = actionTaken.trim();
        updates.resolution_notes = resolutionNotes.trim();
        updates.repair_date = record.repair_date || nowIso.slice(0, 10);
        updates.closed_date = nowIso;
      }

      if (status === "Cancelled") {
        updates.closed_date = nowIso;
      }

      const { error } = await supabase
        .from("maintenance_records")
        .update(updates)
        .eq("id", record.id);

      if (error) throw error;

      await syncAssetStatusForMaintenance(record.asset_id, status, record.previous_asset_status);
      await refreshAll(false);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to update maintenance status");
    }
  }

  async function deleteMaintenanceRecord(id: number) {
    if (!isAdmin) {
      alert("Only admin users can delete maintenance tickets.");
      return;
    }

    const record = maintenanceRecords.find((item) => item.id === id);
    if (!record) return;
    if (!window.confirm("Delete this maintenance ticket?")) return;

    try {
      const { error } = await supabase.from("maintenance_records").delete().eq("id", id);
      if (error) throw error;
      await syncAssetStatusForMaintenance(record.asset_id, "Cancelled", record.previous_asset_status);
      await refreshAll(false);
      if (maintenanceForm.id === id) resetMaintenanceForm();
      alert("Maintenance ticket deleted.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to delete maintenance ticket");
    }
  }

  function fillAssetForm(asset: ITAsset) {
    if (!isAdmin) {
      alert("Only admin users can edit inventory assets.");
      return;
    }

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
      powerRatingW: asset.power_rating_w != null ? String(asset.power_rating_w) : "",
      voltageV: asset.voltage_v != null ? String(asset.voltage_v) : "",
      electricalPhase: asset.electrical_phase || "",
      estimatedHoursPerDay: asset.estimated_hours_per_day != null ? String(asset.estimated_hours_per_day) : "",
      solarLoadRelevant: Boolean(asset.solar_load_relevant),
      electricalNotes: asset.electrical_notes || "",
      os: asset.os || "",
      ram: asset.ram || "",
      systemType: asset.system_type || "",
      connectionType: asset.connection_type || "",
      msOffice: asset.ms_office || "",
      monitor: asset.monitor || "",
      keyboard: asset.keyboard || "",
      mouse: asset.mouse || "",
      charger: (asset as any).charger || "",
      headset: (asset as any).headset || "",
      storage: asset.storage || "",
      processor: asset.processor || "",
      gpu: asset.gpu || "",
      motherboard: asset.motherboard || "",
      biosVersion: asset.bios_version || "",
      biosDate: asset.bios_date || "",
      tpmStatus: asset.tpm_status || "",
      hostname: asset.hostname || "",
      ipAddress: asset.ip_address || "",
      macAddress: asset.mac_address || "",
      photoFrontUrl: asset.photo_front_url || "",
      photoBackUrl: asset.photo_back_url || "",
      photoLabelUrl: asset.photo_label_url || "",
      onlineStatus: asset.online_status || "",
      windowsUpdate: asset.windows_update || "",
      desktopLoadingSpeed: asset.desktop_loading_speed || "",
      bootingSpeed: asset.booting_speed || "",
      performance: asset.performance || "",
    });
    setActiveTab("inventory");
    scrollToActiveContent("inventory");
  }

  async function handleAssetPhotoUpload(
    file: File,
    slot: "front" | "back" | "label"
  ) {
    if (!isAdmin) {
      alert("Only admin users can upload asset photos.");
      return;
    }

    if (!assetForm.assetTag.trim()) {
      alert("Enter the Asset Tag before uploading photos.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("Please use an image smaller than 8 MB.");
      return;
    }

    setUploadingPhotoSlot(slot);
    try {
      const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const safeTag = safeFileName(assetForm.assetTag);
      const path = `${safeTag}/${slot}-${Date.now()}.${extension || "jpg"}`;

      const { error: uploadError } = await supabase.storage
        .from("asset-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("asset-photos").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      setAssetForm((current) => ({
        ...current,
        ...(slot === "front" ? { photoFrontUrl: publicUrl } : {}),
        ...(slot === "back" ? { photoBackUrl: publicUrl } : {}),
        ...(slot === "label" ? { photoLabelUrl: publicUrl } : {}),
      }));
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Photo upload failed.");
    } finally {
      setUploadingPhotoSlot(null);
    }
  }

  function clearAssetPhoto(slot: "front" | "back" | "label") {
    setAssetForm((current) => ({
      ...current,
      ...(slot === "front" ? { photoFrontUrl: "" } : {}),
      ...(slot === "back" ? { photoBackUrl: "" } : {}),
      ...(slot === "label" ? { photoLabelUrl: "" } : {}),
    }));
  }

  function formatImportedOfficeStatus(officeProducts: any[]) {
    if (!Array.isArray(officeProducts) || officeProducts.length === 0) {
      return "";
    }

    const product = officeProducts[0] || {};
    const rawName = String(product.Name || product.name || "").toLowerCase();

    let friendlyName = "Microsoft Office";
    if (
      rawName.includes("o365") ||
      rawName.includes("365") ||
      rawName.includes("subscription")
    ) {
      friendlyName = "Microsoft 365 Apps";
    } else if (rawName.includes("office16")) {
      friendlyName = "Microsoft Office 2016";
    } else if (rawName.includes("office19")) {
      friendlyName = "Microsoft Office 2019";
    } else if (rawName.includes("office21")) {
      friendlyName = "Microsoft Office 2021";
    }

    const statusCode = Number(product.LicenseStatus ?? product.license_status);
    const statusMap: Record<number, string> = {
      0: "Not activated",
      1: "Activated",
      2: "Grace period",
      3: "Grace period",
      4: "Licence issue",
      5: "Licence attention required",
      6: "Extended grace period",
    };

    const status = Number.isFinite(statusCode)
      ? statusMap[statusCode] || `Status ${statusCode}`
      : "";

    return [friendlyName, status].filter(Boolean).join(" - ");
  }

  function formatImportedStorage(physicalDisks: any[]) {
    if (!Array.isArray(physicalDisks) || physicalDisks.length === 0) {
      return "";
    }

    return physicalDisks
      .map((disk) => {
        const size = Number(disk?.size_gb);
        const sizeText = Number.isFinite(size) ? `${Math.round(size)} GB` : "";
        const model = String(disk?.model || "").trim();
        const searchText = `${model} ${disk?.media_type || ""}`.toLowerCase();

        const driveType =
          searchText.includes("nvme") ||
          searchText.includes("ssd") ||
          searchText.includes("solid state") ||
          searchText.includes("kbg") ||
          searchText.includes("samsung mz") ||
          searchText.includes("micron")
            ? "SSD"
            : searchText.includes("hdd") ||
                searchText.includes("hard disk") ||
                searchText.includes("wd") ||
                searchText.includes("seagate")
              ? "HDD"
              : "Storage";

        return [sizeText, driveType].filter(Boolean).join(" ");
      })
      .filter(Boolean)
      .join("; ");
  }

  function formatImportedTpmStatus(security: any) {
    if (!security) return "";

    const present = security.tpm_present;
    const ready = security.tpm_ready;
    const enabled = security.tpm_enabled;
    const version = security.tpm_version;

    if (present === false) return "TPM not present";
    if (present == null && ready == null && enabled == null && !version) {
      return "Not detected";
    }

    const parts = [
      present === true ? "TPM present" : "",
      ready === true ? "Ready" : ready === false ? "Not ready" : "",
      enabled === true ? "Enabled" : enabled === false ? "Disabled" : "",
      version ? `Version ${version}` : "",
    ];

    return parts.filter(Boolean).join(" - ");
  }

  function findExistingAssetForImport(imported: any) {
    const serial = String(imported?.device?.serial_number || "").trim().toLowerCase();
    const hostname = String(imported?.device?.computer_name || "").trim().toLowerCase();
    const mac = String(imported?.network?.mac_address || "")
      .replace(/[^a-f0-9]/gi, "")
      .toLowerCase();

    return assets.find((asset) => {
      const assetSerial = String(asset.serial_number || "").trim().toLowerCase();
      const assetHostname = String(asset.hostname || "").trim().toLowerCase();
      const assetMac = String(asset.mac_address || "")
        .replace(/[^a-f0-9]/gi, "")
        .toLowerCase();

      return (
        (!!serial && !!assetSerial && serial === assetSerial) ||
        (!!hostname && !!assetHostname && hostname === assetHostname) ||
        (!!mac && !!assetMac && mac === assetMac)
      );
    });
  }

  async function handleDeviceInfoImport(file: File, preferredAssetId?: number | null) {
    if (!isAdmin) {
      alert("Only admin users can import device information.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      alert("Please select the JSON file created by the KOPKOP Device Collector.");
      return;
    }

    setImportingDeviceInfo(true);

    try {
      const rawText = await file.text();
      const imported = JSON.parse(rawText);

      if (
        imported?.collector?.name !== "KOPKOP Device Information Collector" ||
        !imported?.device
      ) {
        throw new Error("This is not a valid KOPKOP Device Collector file.");
      }

      const device = imported.device || {};
      const operatingSystem = imported.operating_system || {};
      const hardware = imported.hardware || {};
      const processor = hardware.processor || {};
      const memory = hardware.memory || {};
      const motherboard = hardware.motherboard || {};
      const bios = hardware.bios || {};
      const storage = hardware.storage || {};
      const network = imported.network || {};
      const security = imported.security || {};
      const officeProducts = imported.software?.office_products || [];

      const importedName =
        String(device.computer_name || "").trim() ||
        [device.manufacturer, device.model].filter(Boolean).join(" ").trim() ||
        "Imported computer";

      const matchedAsset =
        (preferredAssetId
          ? assets.find((asset) => asset.id === preferredAssetId)
          : null) || findExistingAssetForImport(imported);

      let baseForm: AssetFormState = matchedAsset
        ? assetForm
        : { ...EMPTY_ASSET_FORM };

      if (matchedAsset) {
        const updateExisting = window.confirm(
          `This device already exists in the inventory.\n\n` +
            `Asset Tag: ${matchedAsset.asset_tag}\n` +
            `Device: ${matchedAsset.item_name}\n` +
            `Serial Number: ${matchedAsset.serial_number || "Not recorded"}\n` +
            `Computer Name: ${matchedAsset.hostname || "Not recorded"}\n\n` +
            `Press OK to update the existing asset with the newly collected technical information.\n` +
            `Press Cancel to stop the import.`
        );

        if (!updateExisting) {
          return { loaded: false, matchedAsset: null };
        }

        setEditingAssetId(matchedAsset.id);

        baseForm = {
          assetTag: matchedAsset.asset_tag,
          itemName: matchedAsset.item_name,
          category: matchedAsset.category,
          brand: matchedAsset.brand || "",
          model: matchedAsset.model || "",
          serialNumber: matchedAsset.serial_number || "",
          quantity: String(matchedAsset.quantity || 1),
          condition: matchedAsset.condition || "Good",
          status: matchedAsset.status || "In Store",
          assignedTo: matchedAsset.assigned_to || "",
          location: matchedAsset.location || "",
          supplier: matchedAsset.supplier || "",
          purchaseDate: matchedAsset.purchase_date || "",
          warrantyExpiry: matchedAsset.warranty_expiry || "",
          notes: matchedAsset.notes || "",
          powerRatingW: matchedAsset.power_rating_w != null ? String(matchedAsset.power_rating_w) : "",
          voltageV: matchedAsset.voltage_v != null ? String(matchedAsset.voltage_v) : "",
          electricalPhase: matchedAsset.electrical_phase || "",
          estimatedHoursPerDay: matchedAsset.estimated_hours_per_day != null ? String(matchedAsset.estimated_hours_per_day) : "",
          solarLoadRelevant: Boolean(matchedAsset.solar_load_relevant),
          electricalNotes: matchedAsset.electrical_notes || "",
          os: matchedAsset.os || "",
          ram: matchedAsset.ram || "",
          systemType: matchedAsset.system_type || "",
          connectionType: matchedAsset.connection_type || "",
          msOffice: matchedAsset.ms_office || "",
          monitor: matchedAsset.monitor || "",
          keyboard: matchedAsset.keyboard || "",
          mouse: matchedAsset.mouse || "",
          charger: matchedAsset.charger || "",
          headset: matchedAsset.headset || "",
          storage: matchedAsset.storage || "",
          processor: matchedAsset.processor || "",
          gpu: matchedAsset.gpu || "",
          motherboard: matchedAsset.motherboard || "",
          biosVersion: matchedAsset.bios_version || "",
          biosDate: matchedAsset.bios_date || "",
          tpmStatus: matchedAsset.tpm_status || "",
          hostname: matchedAsset.hostname || "",
          ipAddress: matchedAsset.ip_address || "",
          macAddress: matchedAsset.mac_address || "",
          photoFrontUrl: matchedAsset.photo_front_url || "",
          photoBackUrl: matchedAsset.photo_back_url || "",
          photoLabelUrl: matchedAsset.photo_label_url || "",
          onlineStatus: matchedAsset.online_status || "",
          windowsUpdate: matchedAsset.windows_update || "",
          desktopLoadingSpeed: matchedAsset.desktop_loading_speed || "",
          bootingSpeed: matchedAsset.booting_speed || "",
          performance: matchedAsset.performance || "",
        };
      }

      const importedForm: AssetFormState = {
        ...baseForm,
        assetTag: baseForm.assetTag,
        assignedTo: baseForm.assignedTo,
        location: baseForm.location,
        supplier: baseForm.supplier,
        purchaseDate: baseForm.purchaseDate,
        warrantyExpiry: baseForm.warrantyExpiry,
        condition: baseForm.condition,
        status: baseForm.status,
        quantity: baseForm.quantity || "1",
        category: baseForm.category || "Desktop",
        itemName: matchedAsset
          ? baseForm.itemName
          : baseForm.itemName.trim() || importedName,
        brand: String(device.manufacturer || "").trim(),
        model: String(device.model || "").trim(),
        serialNumber: String(device.serial_number || "").trim(),
        os: [
          operatingSystem.caption,
          operatingSystem.architecture,
          operatingSystem.build_number
            ? `Build ${operatingSystem.build_number}`
            : "",
        ]
          .filter(Boolean)
          .join(" - "),
        ram:
          memory.total_ram_gb != null
            ? `${memory.total_ram_gb} GB`
            : baseForm.ram,
        systemType: String(
          device.system_type || operatingSystem.architecture || ""
        ).trim(),
        connectionType: String(
          network.interface || network.adapter_name || ""
        ).trim(),
        msOffice: formatImportedOfficeStatus(officeProducts),
        storage: formatImportedStorage(storage.physical_disks),
        processor: String(processor.name || "").trim(),
        motherboard: [
          motherboard.manufacturer,
          motherboard.product,
          motherboard.version,
        ]
          .filter(Boolean)
          .join(" "),
        biosVersion: String(bios.version || "").trim(),
        biosDate: String(bios.release_date || "").trim(),
        tpmStatus: formatImportedTpmStatus(security),
        hostname: String(device.computer_name || "").trim(),
        ipAddress: String(network.ipv4_address || "").trim(),
        macAddress: String(network.mac_address || "").trim(),
      };

      setAssetForm(importedForm);
      setLastImportedDevice(importedName);

      alert(
        matchedAsset
          ? `Existing asset ${matchedAsset.asset_tag} is ready to update. Review the imported technical information, then click Update Asset.`
          : `Device information imported successfully for ${importedName}. Enter the Asset Tag, Location and assignment details before saving.`
      );

      return {
        loaded: true,
        matchedAsset: matchedAsset || null,
        importedName,
      };
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "The device information file could not be imported.");
      return { loaded: false, matchedAsset: null };
    } finally {
      setImportingDeviceInfo(false);
    }
  }

  async function openDiscoveryForReview(record: DeviceDiscoveryRecord) {
    if (!isAdmin) {
      alert("Only admin users can review discovered devices.");
      return;
    }

    if (!record.payload) {
      alert("This discovery record does not contain a device payload.");
      return;
    }

    setProcessingDiscoveryId(record.id);

    try {
      const liveFile = new File(
        [JSON.stringify(record.payload)],
        `KOPKOP_Discovery_${record.hostname || "device"}.json`,
        { type: "application/json" }
      );

      const importResult = await handleDeviceInfoImport(
        liveFile,
        record.matched_asset_id || null
      );

      if (!importResult?.loaded) {
        return;
      }

      const matchedAsset =
        importResult.matchedAsset ||
        (record.matched_asset_id
          ? assets.find((asset) => asset.id === record.matched_asset_id)
          : null);

      setActiveDiscoveryId(record.id);
      setActiveDiscoveryMode(matchedAsset ? "update" : "create");
      setActiveTab("inventory");

      window.setTimeout(() => {
        document
          .getElementById("asset-registration-form")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Could not load this discovered device."
      );
    } finally {
      setProcessingDiscoveryId(null);
    }
  }

  async function ignoreDiscovery(record: DeviceDiscoveryRecord) {
    if (!isAdmin) {
      alert("Only admin users can ignore discovered devices.");
      return;
    }

    const confirmed = window.confirm(
      `Ignore ${record.hostname || "this device"}? The record will remain in discovery history.`
    );
    if (!confirmed) return;

    setProcessingDiscoveryId(record.id);

    try {
      const { error } = await supabase
        .from("device_discovery_queue")
        .update({ status: "ignored" })
        .eq("id", record.id);

      if (error) throw error;
      await refreshDeviceDiscoveries(false);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Could not ignore device.");
    } finally {
      setProcessingDiscoveryId(null);
    }
  }

  async function receiveLatestLiveDevice() {
    if (!isAdmin) {
      alert("Only admin users can receive live device information.");
      return;
    }

    setCheckingLiveDevice(true);

    try {
      const { data, error } = await supabase
        .from("device_discovery_queue")
        .select("id, payload, hostname, serial_number, received_at")
        .eq("status", "pending")
        .order("received_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data?.payload) {
        alert(
          "No live device information is waiting. Run the KOPKOP Live Collector on the computer, then try again."
        );
        return;
      }

      const payloadText = JSON.stringify(data.payload);
      const liveFile = new File(
        [payloadText],
        `KOPKOP_Live_${data.hostname || "device"}.json`,
        { type: "application/json" }
      );

      await handleDeviceInfoImport(liveFile);

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from("device_discovery_queue")
        .update({
          status: "imported",
          imported_at: new Date().toISOString(),
          imported_by: currentUser?.id || null,
        })
        .eq("id", data.id);

      if (updateError) {
        console.error("Could not mark live discovery as imported:", updateError);
      }
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Could not receive the live device information."
      );
    } finally {
      setCheckingLiveDevice(false);
    }
  }

  function resetAssetForm() {
    setEditingAssetId(null);
    setAssetForm(EMPTY_ASSET_FORM);
    setLastImportedDevice(null);
    setActiveDiscoveryId(null);
    setActiveDiscoveryMode(null);
  }

  async function handleSaveAsset(e: React.FormEvent) {
    e.preventDefault();

    if (!isAdmin) {
      alert("Only admin users can add or edit inventory assets.");
      return;
    }

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
      power_rating_w: assetForm.powerRatingW.trim() ? safeNumber(assetForm.powerRatingW) : null,
      voltage_v: assetForm.voltageV.trim() ? safeNumber(assetForm.voltageV) : null,
      electrical_phase: assetForm.electricalPhase.trim() || null,
      estimated_hours_per_day: assetForm.estimatedHoursPerDay.trim() ? safeNumber(assetForm.estimatedHoursPerDay) : null,
      solar_load_relevant: assetForm.solarLoadRelevant,
      electrical_notes: assetForm.electricalNotes.trim() || null,
      os: assetForm.os.trim() || null,
      ram: assetForm.ram.trim() || null,
      system_type: assetForm.systemType.trim() || null,
      connection_type: assetForm.connectionType.trim() || null,
      ms_office: assetForm.msOffice.trim() || null,
      monitor: assetForm.monitor.trim() || null,
      keyboard: assetForm.keyboard.trim() || null,
      mouse: assetForm.mouse.trim() || null,
      charger: assetForm.charger.trim() || null,
      headset: assetForm.headset.trim() || null,
      storage: assetForm.storage.trim() || null,
      processor: assetForm.processor.trim() || null,
      gpu: assetForm.gpu.trim() || null,
      motherboard: assetForm.motherboard.trim() || null,
      bios_version: assetForm.biosVersion.trim() || null,
      bios_date: assetForm.biosDate || null,
      tpm_status: assetForm.tpmStatus.trim() || null,
      hostname: assetForm.hostname.trim() || null,
      ip_address: assetForm.ipAddress.trim() || null,
      mac_address: assetForm.macAddress.trim() || null,
      photo_front_url: assetForm.photoFrontUrl.trim() || null,
      photo_back_url: assetForm.photoBackUrl.trim() || null,
      photo_label_url: assetForm.photoLabelUrl.trim() || null,
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

      if (activeDiscoveryId) {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        const { error: discoveryError } = await supabase
          .from("device_discovery_queue")
          .update({
            status: "imported",
            imported_at: new Date().toISOString(),
            imported_by: currentUser?.id || null,
          })
          .eq("id", activeDiscoveryId);

        if (discoveryError) {
          console.error("Asset saved, but discovery status was not updated:", discoveryError);
        }
      }

      const completedFromDiscovery = Boolean(activeDiscoveryId);
      const completedMode = activeDiscoveryMode;
      const wasEditing = Boolean(editingAssetId);

      resetAssetForm();
      await refreshAll(false);
      await refreshDeviceDiscoveries(false);

      alert(
        completedFromDiscovery
          ? completedMode === "update"
            ? "Existing asset updated and discovery completed successfully."
            : "New asset created and discovery completed successfully."
          : wasEditing
            ? "Asset updated successfully."
            : "Asset added successfully."
      );
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save asset");
    } finally {
      setSavingAsset(false);
    }
  }

  async function handleDeleteAsset(id: number) {
    if (!isAdmin) {
      alert("Only admin users can delete inventory assets.");
      return;
    }

    const asset = assets.find((item) => item.id === id);
    if (!asset) {
      alert("Asset not found.");
      return;
    }

    if (!window.confirm(`Delete asset ${asset.asset_tag} - ${asset.item_name}?`)) return;
    
    setDeletingAssetId(id);
    try {
      console.log(`Attempting to delete asset ID: ${id} from it_assets table`);
      
      const { error, data } = await supabase
        .from("it_assets")
        .delete()
        .eq("id", id)
        .select();
      
      if (error) {
        console.error("Supabase delete error:", error);
        throw new Error(`Supabase error: ${error.message} (Code: ${error.code})`);
      }

      console.log("Delete response:", data);
      
      // Clear selected asset if it was the one deleted
      if (selectedAssetId === id) {
        setSelectedAssetId(null);
      }
      
      // Refresh data with a small delay to ensure database sync
      await refreshAll(false);
      
      alert("Asset deleted successfully.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete asset";
      console.error("Delete asset error:", errorMessage);
      alert(errorMessage);
    } finally {
      setDeletingAssetId(null);
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
    scrollToActiveContent("audit");
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

      const autoTriggered = await ensureAutoMaintenanceTicket(
        asset,
        safeNumber(auditForm.healthScore),
        auditForm.remarks
      );

      setAuditForm(EMPTY_AUDIT_FORM);
      await refreshAll(false);
      setActiveTab("history");
      alert(
        autoTriggered
          ? "Audit saved successfully. A critical maintenance ticket was created automatically."
          : "Audit saved successfully."
      );
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
    const generatedAt = new Date();
    const logoUrl = `${window.location.origin}/kopkop-logo.png`;

    const documentTitle = title
      .replace(/^KOPKOP College\s*/i, "")
      .toUpperCase();

    const documentCode = title.toLowerCase().includes("summary")
      ? "SR"
      : title.toLowerCase().includes("inventory")
        ? "IR"
        : title.toLowerCase().includes("priority")
          ? "PA"
          : "RP";

    const documentNumber = `${documentCode}-${generatedAt.getFullYear()}-${String(
      generatedAt.getMonth() + 1
    ).padStart(2, "0")}${String(generatedAt.getDate()).padStart(2, "0")}-${String(
      generatedAt.getHours()
    ).padStart(2, "0")}${String(generatedAt.getMinutes()).padStart(2, "0")}`;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${safeHtml(title)}</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
            }

            body {
              position: relative;
              padding: 28px;
            }

            .watermark {
              position: fixed;
              left: 50%;
              top: 50%;
              width: 42%;
              max-height: 70%;
              object-fit: contain;
              transform: translate(-50%, -50%);
              opacity: 0.035;
              z-index: 0;
              pointer-events: none;
            }

            .report {
              position: relative;
              z-index: 1;
              max-width: 1120px;
              margin: 0 auto;
            }

            .official-header {
              display: grid;
              grid-template-columns: 92px 1fr 220px;
              align-items: center;
              gap: 18px;
              padding-bottom: 14px;
              border-bottom: 4px solid #0f3b63;
            }

            .official-logo {
              width: 82px;
              height: 82px;
              object-fit: contain;
            }

            .school-name {
              margin: 0;
              color: #0f3b63;
              font-size: 27px;
              font-weight: 900;
              letter-spacing: .08em;
              line-height: 1;
            }

            .system-name {
              margin-top: 7px;
              color: #475569;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: .03em;
            }

            .document-title {
              margin-top: 8px;
              color: #0f172a;
              font-size: 17px;
              font-weight: 900;
              letter-spacing: .14em;
            }

            .header-meta {
              text-align: right;
              color: #475569;
              font-size: 10px;
              line-height: 1.55;
            }

            .report-intro {
              margin-top: 15px;
              padding: 12px 16px;
              border: 1px solid #cbd5e1;
              border-radius: 10px;
              background: #f8fafc;
            }

            .report-intro p {
              margin: 0;
              color: #475569;
              font-size: 12px;
              line-height: 1.45;
            }

            h2 {
              margin: 0 0 10px;
              color: #0f172a;
              font-size: 18px;
            }

            p {
              color: #475569;
              line-height: 1.5;
            }

            .grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin: 18px 0 22px;
            }

            .card {
              min-height: 82px;
              padding: 14px;
              border: 1px solid #cbd5e1;
              border-radius: 12px;
              background: #f8fafc;
            }

            .label {
              color: #0f3b63;
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: .09em;
            }

            .value {
              margin-top: 8px;
              color: #0f172a;
              font-size: 25px;
              font-weight: 900;
            }

            .section {
              margin-top: 22px;
              break-inside: avoid;
            }

            .section h2 {
              padding-bottom: 8px;
              border-bottom: 2px solid #0f3b63;
              color: #0f3b63;
              font-size: 16px;
              text-transform: uppercase;
              letter-spacing: .04em;
            }

            table {
              width: 100%;
              margin-top: 10px;
              border-collapse: collapse;
              background: rgba(255, 255, 255, .94);
              font-size: 11px;
            }

            th, td {
              padding: 7px 9px;
              border: 1px solid #cbd5e1;
              text-align: left;
              vertical-align: top;
            }

            th {
              background: #eaf1f7;
              color: #0f3b63;
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: .03em;
            }

            .pill {
              display: inline-block;
              padding: 4px 9px;
              border-radius: 999px;
              font-size: 10px;
              font-weight: 800;
            }

            .good { background: #dcfce7; color: #166534; }
            .watch { background: #fef3c7; color: #92400e; }
            .upgrade { background: #fed7aa; color: #9a3412; }
            .critical { background: #fee2e2; color: #991b1b; }

            .report-note {
              margin: 0 0 10px;
              color: #64748b;
              font-size: 11px;
            }

            .official-footer {
              margin-top: 22px;
              padding-top: 9px;
              border-top: 2px solid #0f3b63;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 20px;
              color: #64748b;
              font-size: 9px;
            }

            .footer-system {
              color: #0f3b63;
              font-weight: 800;
              letter-spacing: .03em;
            }

            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            tr { break-inside: avoid; page-break-inside: avoid; }

            @media print {
              body { padding: 0; }
              .report { max-width: none; }
              .official-header,
              .report-intro,
              .grid,
              .official-footer {
                break-inside: avoid;
                page-break-inside: avoid;
              }
              table { font-size: 8.5px; }
              th, td { padding: 4px 5px; }
              .official-footer {
                position: relative;
              }
            }
          </style>
        </head>
        <body>
          <img class="watermark" src="${safeHtml(logoUrl)}" alt="" />

          <main class="report">
            <header class="official-header">
              <img
                class="official-logo"
                src="${safeHtml(logoUrl)}"
                alt="Kopkop College Logo"
              />

              <div>
                <div class="school-name">KOPKOP COLLEGE</div>
                <div class="system-name">ICT Asset, Device Health & Audit System</div>
                <div class="document-title">${safeHtml(documentTitle)}</div>
              </div>

              <div class="header-meta">
                <div><strong>Generated:</strong> ${safeHtml(generatedAt.toLocaleString())}</div>
                <div><strong>Document:</strong> ${safeHtml(documentNumber)}</div>
                <div><strong>Version:</strong> 2.1</div>
              </div>
            </header>

            <section class="report-intro">
              <p>${safeHtml(subtitle)}</p>
            </section>

            ${content}

            <footer class="official-footer">
              <span class="footer-system">KOPKOP College ICT Asset, Device Health & Audit System</span>
              <span>${safeHtml(documentNumber)}</span>
            </footer>
          </main>
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

  function exportAdminElectricalLoadPdf() {
    // This is an equipment/nameplate register for management and Comlek.
    // It must not be described as an actual measured load assessment.
    const loadAssets = [...enrichedAssets]
      .filter((asset) => asset.solar_load_relevant)
      .sort((a, b) => (a.location || "").localeCompare(b.location || "") || a.item_name.localeCompare(b.item_name));

    const connectedLoadKw = loadAssets.reduce((total, asset) => {
      const watts = Number(asset.power_rating_w || 0);
      const qty = Math.max(1, Number(asset.quantity || 1));
      return total + (watts * qty) / 1000;
    }, 0);

    const estimatedDailyKwh = loadAssets.reduce((total, asset) => {
      const watts = Number(asset.power_rating_w || 0);
      const qty = Math.max(1, Number(asset.quantity || 1));
      const hours = Number(asset.estimated_hours_per_day || 0);
      return total + (watts * qty * hours) / 1000;
    }, 0);

    const rows = loadAssets.map((asset) => `
      <tr>
        <td>${safeHtml(asset.asset_tag)}</td>
        <td>${safeHtml(asset.item_name)}</td>
        <td>${safeHtml(asset.category || "-")}</td>
        <td>${safeHtml(asset.location || "-")}</td>
        <td>${safeHtml(asset.brand || "-")} ${safeHtml(asset.model || "")}</td>
        <td>${safeHtml(asset.quantity || 1)}</td>
        <td>${asset.power_rating_w != null ? safeHtml(asset.power_rating_w) + " W" : "-"}</td>
        <td>${asset.voltage_v != null ? safeHtml(asset.voltage_v) + " V" : "-"}</td>
        <td>${safeHtml(asset.electrical_phase || "-")}</td>
        <td>${asset.estimated_hours_per_day != null ? safeHtml(asset.estimated_hours_per_day) : "-"}</td>
        <td>${safeHtml(asset.electrical_notes || asset.notes || "-")}</td>
      </tr>
    `).join("");

    const content = `
      <div class="grid">
        <div class="card"><div class="label">Equipment Records</div><div class="value">${loadAssets.length}</div></div>
        <div class="card"><div class="label">Connected Nameplate Load</div><div class="value">${connectedLoadKw.toFixed(2)} kW</div></div>
        <div class="card"><div class="label">Simple Usage Estimate</div><div class="value">${estimatedDailyKwh.toFixed(2)} kWh/day</div></div>
      </div>
      <div class="section">
        <h2>Admin Building Electrical Equipment / Solar Load Register</h2>
        <p class="report-note"><strong>Important:</strong> This report is an asset and equipment register based on nameplate ratings and estimated operating hours. It is <strong>not</strong> a measured peak-demand, average-demand or daily-consumption load assessment. Comlek / a qualified electrician should provide the measured load assessment separately.</p>
        <table>
          <thead><tr>
            <th>Asset Tag</th><th>Item</th><th>Category</th><th>Location</th><th>Brand / Model</th><th>Qty</th><th>Power</th><th>Voltage</th><th>Phase</th><th>Est. Hrs/Day</th><th>Notes</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="11">No equipment has been marked for the solar load report.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    openPrintWindow(
      "Admin Building Electrical Equipment / Solar Load Register",
      buildPdfShell(
        "Admin Building Electrical Equipment / Solar Load Register",
        "Equipment register prepared to support the solar project review.",
        content
      )
    );
  }

  function exportInventoryPdf() {
    // Inventory PDF must always include the complete asset register.
    // The on-screen search and filters should not reduce the exported report.
    const inventoryAssets = [...enrichedAssets].sort((a, b) =>
      a.asset_tag.localeCompare(b.asset_tag)
    );

    const rows = inventoryAssets
      .map((asset) => {
        const health = computeAssetHealth(
          asset,
          latestAuditByAssetId.get(asset.id),
          activeMaintenanceByAssetId.get(asset.id)
        );
        return `
          <tr>
            <td>${safeHtml(asset.asset_tag)}</td>
            <td>${safeHtml(asset.item_name)}</td>
            <td>${safeHtml(asset.category || "-")}</td>
            <td>${safeHtml(asset.location || "-")}</td>
            <td>${safeHtml(asset.assigned_to || "-")}</td>
            <td>${safeHtml(asset.os || "-")}</td>
            <td>${safeHtml(asset.ram || "-")}</td>
            <td>${safeHtml(asset.storage || "-")}</td>
            <td><span class="${healthPillClassForPdf(health.label)}">${safeHtml(health.label)}</span></td>
            <td>${health.score}%</td>
          </tr>
        `;
      })
      .join("");

    const content = `
      <div class="grid">
        <div class="card"><div class="label">Rows Exported</div><div class="value">${inventoryAssets.length}</div></div>
        <div class="card"><div class="label">In Use</div><div class="value">${stats.inUse}</div></div>
        <div class="card"><div class="label">Slow Devices</div><div class="value">${stats.slowDevices}</div></div>
        <div class="card"><div class="label">Critical</div><div class="value">${stats.critical}</div></div>
      </div>
      <div class="section">
        <h2>Complete ICT Inventory</h2>
        <p class="report-note">This report contains the full ICT asset register and is not limited by the current on-screen search or filters.</p>
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
        "Complete ICT asset register prepared for printing or saving as PDF.",
        content
      )
    );
  }

  function exportAlertsPdf() {
    // Use the complete enriched asset register so the PDF is not affected by
    // the current inventory search box or on-screen filters.
    const flaggedAssets = enrichedAssets
      .filter(
        (asset) =>
          asset.healthLabel === "Watch" ||
          asset.healthLabel === "Needs Upgrade" ||
          asset.healthLabel === "Critical" ||
          asset.alerts.length > 0
      )
      .sort((a, b) => {
        if (a.displayScore !== b.displayScore) return a.displayScore - b.displayScore;
        return a.asset_tag.localeCompare(b.asset_tag);
      });

    const flaggedNeedsUpgrade = flaggedAssets.filter(
      (asset) => asset.healthLabel === "Needs Upgrade"
    ).length;
    const flaggedCritical = flaggedAssets.filter(
      (asset) => asset.healthLabel === "Critical"
    ).length;
    const flaggedWindowsUpdates = flaggedAssets.filter((asset) => {
      const update = (asset.windows_update || "").toLowerCase();
      return update.includes("not") || update.includes("pending");
    }).length;

    const rows = flaggedAssets
      .map((asset) => {
        const attention =
          asset.alerts.length > 0
            ? asset.alerts.join(", ")
            : asset.recommendation || "Review device condition";

        return `
          <tr>
            <td>${safeHtml(asset.asset_tag)}</td>
            <td>${safeHtml(asset.item_name)}</td>
            <td>${safeHtml(asset.location || "-")}</td>
            <td><span class="${healthPillClassForPdf(asset.healthLabel)}">${safeHtml(asset.healthLabel)}</span></td>
            <td>${safeHtml(asset.displayScore)}%</td>
            <td>${safeHtml(attention)}</td>
          </tr>
        `;
      })
      .join("");

    const content = `
      <div class="grid">
        <div class="card"><div class="label">Flagged Devices</div><div class="value">${flaggedAssets.length}</div></div>
        <div class="card"><div class="label">Needs Upgrade</div><div class="value">${flaggedNeedsUpgrade}</div></div>
        <div class="card"><div class="label">Critical</div><div class="value">${flaggedCritical}</div></div>
        <div class="card"><div class="label">Windows Updates Needed</div><div class="value">${flaggedWindowsUpdates}</div></div>
      </div>
      <div class="section">
        <h2>Priority Alert Export</h2>
        <p style="margin:0 0 12px;color:#475569;font-size:12px;">
          This report includes all Watch, Needs Upgrade and Critical devices and is not limited by the current on-screen search or filters.
        </p>
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
          <tbody>${rows || '<tr><td colspan="6">No priority alerts found. All devices are currently classified as healthy.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    openPrintWindow(
      "KOPKOP College ICT Priority Alerts",
      buildPdfShell(
        "KOPKOP College ICT Priority Alerts",
        "Complete ICT priority alert register prepared for printing or saving as PDF.",
        content
      )
    );
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="rounded-3xl bg-white px-8 py-6 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Checking login...</p>
          <p className="mt-2 text-sm text-slate-500">Please wait while the system verifies your access.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">KOPKOP College</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">ICT System Login</h1>
            <p className="mt-2 text-sm text-slate-500">Authorized users only. Please sign in to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {authLoading ? "Signing in..." : "Login"}
            </button>

            <button
              type="button"
              onClick={handleCreateStaffAccount}
              disabled={authLoading}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Create Staff Account
            </button>

            <p className="text-center text-xs text-slate-500">
              Use this only to create a test staff account, then assign the staff role in Supabase.
            </p>
          </form>

          <p className="mt-5 text-center text-xs text-slate-400">
            Access is controlled from Supabase Authentication Users.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="rounded-3xl bg-white px-8 py-6 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Loading KOPKOP ICT system...</p>
          <p className="mt-2 text-sm text-slate-500">Fetching inventory, specs, labels, scan tools, and audit records.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef3f8] pb-28 text-slate-900 md:pb-0">
      <div className="mx-auto max-w-[1500px] p-3 sm:p-5 lg:p-7">
        <header className="overflow-hidden rounded-[30px] border border-slate-800/40 bg-[#071525] text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
          <div className="grid lg:grid-cols-[1fr_auto]">
            <div className="relative overflow-hidden p-6 sm:p-8">
              <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/10 shadow-inner">
                    <img src="/kopkop-logo.png" alt="Kopkop College" className="h-11 w-11 object-contain" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-300">KOPKOP College</p>
                    <p className="mt-1 text-sm text-slate-400">ICT Operations & Asset Intelligence</p>
                  </div>
                </div>

                <div className="mt-7 max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Production System · Version 3.0
                  </div>
                  <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">
                    Executive ICT Asset
                    <span className="block bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                      Management Dashboard
                    </span>
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                    Live visibility across device health, maintenance, audits, asset distribution, QR operations and management reporting.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 text-xs">
                  <Badge text={`Last sync: ${lastSyncedAt || "Not synced yet"}`} className="border border-white/10 bg-white/10 text-white" />
                  <Badge text={`${stats.total} registered assets`} className="border border-white/10 bg-white/10 text-white" />
                  <Badge text={`${stats.avgScore}% average health`} className="border border-white/10 bg-white/10 text-white" />
                  <Badge text={`Role: ${role || "staff"}`} className="border border-white/10 bg-white/10 text-white" />
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 bg-white/[0.035] p-5 lg:w-[390px] lg:border-l lg:border-t-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Management actions</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button type="button" onClick={exportSummaryPdf} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-left text-sm font-bold text-white transition hover:bg-white/15">
                  <span className="mb-2 block text-xl">📊</span>Summary PDF
                </button>
                <button type="button" onClick={exportInventoryPdf} className="rounded-2xl bg-emerald-500 px-4 py-3 text-left text-sm font-bold text-white transition hover:bg-emerald-400">
                  <span className="mb-2 block text-xl">📦</span>Inventory PDF
                </button>
                <button type="button" onClick={exportAdminElectricalLoadPdf} className="rounded-2xl bg-amber-500 px-4 py-3 text-left text-sm font-bold text-white transition hover:bg-amber-400">
                  <span className="mb-2 block text-xl">⚡</span>Admin Load Register
                </button>
                <button type="button" onClick={exportAlertsPdf} className="rounded-2xl bg-rose-500 px-4 py-3 text-left text-sm font-bold text-white transition hover:bg-rose-400">
                  <span className="mb-2 block text-xl">🚨</span>Alerts PDF
                </button>
                <button type="button" onClick={() => refreshAll(true)} className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-left text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/15">
                  <span className="mb-2 block text-xl">↻</span>{refreshing ? "Refreshing" : "Refresh Data"}
                </button>
              </div>
              <button type="button" onClick={handleLogout} className="mt-3 w-full rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-200 transition hover:bg-rose-400/15">
                Secure Logout
              </button>
            </div>
          </div>
        </header>

        <div className="mt-5 hidden rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-sm backdrop-blur md:flex">
          {[
            ["dashboard", "⌂", "Executive"],
            ["inventory", "▦", "Inventory"],
            ["profile", "◫", "Device Profile"],
            ["scan", "⌁", "Scan Device"],
            ["discovery", "◉", pendingLiveDevices > 0 ? `Discovery (${pendingLiveDevices})` : "Discovery"],
            ["labels", "⌗", "QR Labels"],
            ["maintenance", "⚒", "Maintenance"],
            ["audit", "✓", "Quick Audit"],
            ["history", "≡", "Audit History"],
          ].map(([key, icon, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${
                activeTab === key
                  ? "bg-[#0b1f33] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className="text-base">{icon}</span>
              <span className="hidden xl:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 md:hidden">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Mobile Technician Mode</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Quick field actions</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => openMobileTab("scan")} className="rounded-2xl bg-cyan-700 px-4 py-4 text-left text-sm font-bold text-white">
                <span className="block text-2xl">📷</span>Scan Device
              </button>
              <button type="button" onClick={() => openMobileTab("inventory")} className="rounded-2xl bg-[#0b1f33] px-4 py-4 text-left text-sm font-bold text-white">
                <span className="block text-2xl">📦</span>Assets
              </button>
              <button type="button" onClick={() => openMobileTab("maintenance")} className="rounded-2xl bg-orange-500 px-4 py-4 text-left text-sm font-bold text-white">
                <span className="block text-2xl">🛠️</span>Maintenance
              </button>
              <button type="button" onClick={() => openMobileTab("audit")} className="rounded-2xl bg-emerald-600 px-4 py-4 text-left text-sm font-bold text-white">
                <span className="block text-2xl">📋</span>New Audit
              </button>
              <button type="button" onClick={() => openMobileTab("discovery")} className="col-span-2 rounded-2xl bg-violet-700 px-4 py-4 text-left text-sm font-bold text-white">
                <span className="block text-2xl">📡</span>
                Device Discovery{pendingLiveDevices > 0 ? ` · ${pendingLiveDevices} waiting` : ""}
              </button>
            </div>
          </div>
        </div>

        {activeTab === "dashboard" && (
          <div id="tab-dashboard" className="scroll-mt-24">
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
              {[
                { label: "Total Assets", value: stats.total, hint: "Registered ICT equipment", icon: "▦", tone: "from-blue-500 to-cyan-500" },
                { label: "Average Health", value: `${stats.avgScore}%`, hint: "Across all devices", icon: "◉", tone: "from-emerald-500 to-teal-500" },
                { label: "Open Work", value: unresolvedTickets, hint: "Maintenance requiring action", icon: "⚒", tone: "from-orange-500 to-amber-500" },
                { label: "Needs Attention", value: attentionDevices, hint: "Watch, upgrade or critical", icon: "!", tone: "from-rose-500 to-orange-500" },
                { label: "In Use", value: stats.inUse, hint: "Currently active or assigned", icon: "✓", tone: "from-violet-500 to-indigo-500" },
                { label: "Critical", value: stats.critical, hint: "Health below 40%", icon: "⚠", tone: "from-red-600 to-rose-500" },
                { label: "Seen Today", value: stats.seenToday, hint: "Computers checked in today", icon: "◉", tone: "from-cyan-500 to-blue-500" },
                { label: "Hardware Changes", value: stats.changesToday, hint: "Changes detected today", icon: "↕", tone: "from-fuchsia-500 to-violet-500" },
              ].map((card) => (
                <div key={card.label} className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.tone}`} />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{card.label}</p>
                      <p className="mt-3 text-3xl font-black text-slate-950">{card.value}</p>
                    </div>
                    <div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${card.tone} text-lg font-black text-white shadow-lg`}>
                      {card.icon}
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-slate-500">{card.hint}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
              <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Operations overview</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">Device health command centre</h2>
                    <p className="mt-1 text-sm text-slate-500">Live health classification and performance indicators.</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Fleet readiness</p>
                    <p className="mt-1 text-2xl font-black">{stats.total ? Math.round((healthBreakdown.healthy / stats.total) * 100) : 0}%</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <DonutRing value={healthBreakdown.healthy} total={stats.total} label="Healthy devices" tone="emerald" />
                  <DonutRing value={healthBreakdown.critical} total={stats.total} label="Critical devices" tone="red" />
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                    <p className="text-sm font-black text-slate-900">Performance distribution</p>
                    <div className="mt-5 space-y-4">
                      <MiniBar label="Good" value={performanceGraphData.good} max={stats.total} tone="emerald" />
                      <MiniBar label="Fair" value={performanceGraphData.fair} max={stats.total} tone="amber" />
                      <MiniBar label="Poor" value={performanceGraphData.poor} max={stats.total} tone="red" />
                      <MiniBar label="Not rated" value={performanceGraphData.unknown} max={stats.total} tone="slate" />
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                    <p className="text-sm font-black text-slate-900">Asset categories</p>
                    <div className="mt-5 space-y-4">
                      {categoryGraphData.length ? categoryGraphData.map((item) => (
                        <MiniBar key={item.label} label={item.label} value={item.value} max={graphMaxCategory} tone="blue" />
                      )) : <p className="text-sm text-slate-500">No category data recorded.</p>}
                    </div>
                  </div>
                </div>
              </section>

              <aside className="space-y-6">
                <section className="rounded-[28px] border border-slate-200/80 bg-[#0b1f33] p-5 text-white shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Quick actions</p>
                  <h2 className="mt-1 text-xl font-black">Start ICT work</h2>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setActiveTab("inventory")} className="rounded-2xl bg-white/10 p-4 text-left text-sm font-bold transition hover:bg-white/15">
                      <span className="mb-2 block text-2xl">＋</span>Add / Edit Asset
                    </button>
                    <button type="button" onClick={() => setActiveTab("maintenance")} className="rounded-2xl bg-orange-500 p-4 text-left text-sm font-bold transition hover:bg-orange-400">
                      <span className="mb-2 block text-2xl">⚒</span>New Maintenance
                    </button>
                    <button type="button" onClick={() => setActiveTab("audit")} className="rounded-2xl bg-emerald-500 p-4 text-left text-sm font-bold transition hover:bg-emerald-400">
                      <span className="mb-2 block text-2xl">✓</span>New Audit
                    </button>
                    <button type="button" onClick={() => setActiveTab("labels")} className="rounded-2xl bg-cyan-600 p-4 text-left text-sm font-bold transition hover:bg-cyan-500">
                      <span className="mb-2 block text-2xl">⌗</span>Print Labels
                    </button>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Workload</p>
                      <h2 className="mt-1 text-xl font-black text-slate-950">Maintenance status</h2>
                    </div>
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">{unresolvedTickets} active</span>
                  </div>
                  <div className="mt-5 space-y-4">
                    <MiniBar label="Open" value={maintenanceStats.open} max={Math.max(1, maintenanceRecords.length)} tone="red" />
                    <MiniBar label="In progress" value={maintenanceStats.inProgress} max={Math.max(1, maintenanceRecords.length)} tone="orange" />
                    <MiniBar label="Waiting parts" value={maintenanceStats.waiting} max={Math.max(1, maintenanceRecords.length)} tone="amber" />
                    <MiniBar label="Completed" value={maintenanceStats.completed} max={Math.max(1, maintenanceRecords.length)} tone="emerald" />
                  </div>
                </section>
              </aside>
            </div>

            <div className="mt-6 space-y-6">
              <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Distribution intelligence</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">Assets by department / location</h2>
                  <p className="mt-1 text-sm text-slate-500">Largest device concentrations across the campus.</p>
                </div>
                <div className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
                  {departmentGraphData.length ? departmentGraphData.map((item) => (
                    <MiniBar key={item.label} label={item.label} value={item.value} max={graphMaxDepartment} tone="blue" />
                  )) : <p className="text-sm text-slate-500">No department data recorded.</p>}
                </div>
              </section>

              <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Live operations</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">Recent activity</h2>
                  </div>
                  <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]" />
                </div>
                <div className="mt-5 space-y-3">
                  {executiveActivity.length ? executiveActivity.map((item) => (
                    <div key={item.id} className="flex min-w-0 gap-3 overflow-hidden rounded-2xl border border-slate-100 p-3 transition hover:bg-slate-50 sm:p-4">
                      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.tone}`}>{item.icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <p className="min-w-0 break-words text-sm font-bold leading-5 text-slate-900 [overflow-wrap:anywhere]">{item.title}</p>
                          <span className="shrink-0 whitespace-nowrap text-[10px] font-semibold text-slate-400">{formatDateTime(item.date)}</span>
                        </div>
                        <p className="mt-1 break-words text-xs leading-5 text-slate-500 [overflow-wrap:anywhere]">{item.meta}</p>
                      </div>
                    </div>
                  )) : <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No recent activity recorded.</p>}
                </div>
              </section>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Fleet classification</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Healthy", value: healthBreakdown.healthy, note: "Normal operation", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
                    { label: "Watch", value: healthBreakdown.watch, note: "Monitor condition", cls: "border-amber-200 bg-amber-50 text-amber-800" },
                    { label: "Needs Upgrade", value: healthBreakdown.upgrade, note: "Plan improvement", cls: "border-orange-200 bg-orange-50 text-orange-800" },
                    { label: "Critical", value: healthBreakdown.critical, note: "Urgent attention", cls: "border-rose-200 bg-rose-50 text-rose-800" },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-2xl border p-4 ${item.cls}`}>
                      <p className="text-xs font-black uppercase tracking-wide">{item.label}</p>
                      <p className="mt-2 text-3xl font-black">{item.value}</p>
                      <p className="mt-1 text-xs opacity-80">{item.note}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">Priority queue</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">Devices needing follow-up</h2>
                  </div>
                  <button type="button" onClick={exportAlertsPdf} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">Export</button>
                </div>
                <div className="mt-4 space-y-3">
                  {enrichedAssets
                    .filter((asset) => asset.displayScore < 65 || asset.alerts.length > 0)
                    .sort((a, b) => a.displayScore - b.displayScore)
                    .slice(0, 5)
                    .map((asset) => (
                      <button key={asset.id} type="button" onClick={() => openDeviceProfile(asset.id)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3 text-left transition hover:border-cyan-200 hover:bg-cyan-50/40">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900">{asset.asset_tag} · {asset.item_name}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{asset.location || "No location"} · {asset.recommendation}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <HealthIndicator score={asset.displayScore} />
                          <OperationalIndicator status={asset.operationalStatus} />
                        </div>
                      </button>
                    ))}
                  {attentionDevices === 0 ? (
                    <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">No major health alerts right now.</div>
                  ) : null}
                </div>
              </section>
            </div>

            <div className="mt-6 space-y-6">
              <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">
                        Live Fleet Intelligence V6
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-slate-950">
                        Collector coverage and platform overview
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Computer totals are separated from projectors, printers and other ICT assets.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("discovery")}
                      className="rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black text-white"
                    >
                      Open Discovery Center
                    </button>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      [
                        "Total ICT assets",
                        fleetIntelligence.totalAssets,
                        "All registered equipment",
                        "border-slate-200 bg-slate-50 text-slate-800",
                      ],
                      [
                        "Computers",
                        fleetIntelligence.computerAssets,
                        "Desktops, laptops and servers",
                        "border-blue-200 bg-blue-50 text-blue-800",
                      ],
                      [
                        "Other ICT devices",
                        fleetIntelligence.otherAssets,
                        "Projectors, printers, network and CCTV",
                        "border-cyan-200 bg-cyan-50 text-cyan-800",
                      ],
                      [
                        "Collector coverage",
                        `${fleetIntelligence.coveragePercent}%`,
                        `${fleetIntelligence.scannedComputers} of ${fleetIntelligence.computerAssets} computers scanned`,
                        "border-violet-200 bg-violet-50 text-violet-800",
                      ],
                    ].map(([label, value, hint, className]) => (
                      <div
                        key={String(label)}
                        className={`rounded-3xl border p-5 ${className}`}
                      >
                        <p className="text-xs font-black uppercase tracking-[0.14em]">
                          {label}
                        </p>
                        <p className="mt-3 text-3xl font-black">{value}</p>
                        <p className="mt-2 text-xs opacity-80">{hint}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-3xl border border-violet-200 bg-violet-50 p-5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-violet-950">
                          Collector deployment progress
                        </p>
                        <p className="mt-1 text-xs text-violet-700">
                          {fleetIntelligence.scannedComputers} scanned ·{" "}
                          {fleetIntelligence.unscannedComputers} remaining
                        </p>
                      </div>
                      <p className="text-3xl font-black text-violet-800">
                        {fleetIntelligence.coveragePercent}%
                      </p>
                    </div>
                    <div className="mt-4 h-4 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-violet-600 transition-all"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, fleetIntelligence.coveragePercent)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      [
                        "Online now",
                        fleetIntelligence.onlineNow,
                        "Seen within 15 minutes",
                        "border-emerald-200 bg-emerald-50 text-emerald-800",
                      ],
                      [
                        "Recently seen",
                        fleetIntelligence.recentlySeen,
                        "Seen within 24 hours",
                        "border-cyan-200 bg-cyan-50 text-cyan-800",
                      ],
                      [
                        "Offline",
                        fleetIntelligence.offline,
                        "Last seen over 24 hours ago",
                        "border-red-200 bg-red-50 text-red-800",
                      ],
                      [
                        "Not yet scanned",
                        fleetIntelligence.unscannedComputers,
                        "Computers without collector data",
                        "border-amber-200 bg-amber-50 text-amber-800",
                      ],
                    ].map(([label, value, hint, className]) => (
                      <div
                        key={String(label)}
                        className={`rounded-3xl border p-5 ${className}`}
                      >
                        <p className="text-xs font-black uppercase tracking-[0.14em]">
                          {label}
                        </p>
                        <p className="mt-3 text-3xl font-black">{value}</p>
                        <p className="mt-2 text-xs opacity-80">{hint}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-black text-slate-900">
                        Windows computers
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Total: {fleetIntelligence.computerAssets}
                      </p>
                      <div className="mt-4 space-y-4">
                        <MiniBar
                          label="Windows 11"
                          value={fleetIntelligence.windows11}
                          max={Math.max(fleetIntelligence.computerAssets, 1)}
                          tone="blue"
                        />
                        <MiniBar
                          label="Windows 10"
                          value={fleetIntelligence.windows10}
                          max={Math.max(fleetIntelligence.computerAssets, 1)}
                          tone="amber"
                        />
                        <MiniBar
                          label="Other / OS not recorded"
                          value={fleetIntelligence.windowsOther}
                          max={Math.max(fleetIntelligence.computerAssets, 1)}
                          tone="slate"
                        />
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-black text-slate-900">
                        Storage information
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Collector data will improve these figures.
                      </p>
                      <div className="mt-4 space-y-4">
                        <MiniBar
                          label="SSD / NVMe"
                          value={fleetIntelligence.ssd}
                          max={Math.max(fleetIntelligence.computerAssets, 1)}
                          tone="emerald"
                        />
                        <MiniBar
                          label="HDD"
                          value={fleetIntelligence.hdd}
                          max={Math.max(fleetIntelligence.computerAssets, 1)}
                          tone="red"
                        />
                        <MiniBar
                          label="Not yet recorded"
                          value={fleetIntelligence.storageUnknown}
                          max={Math.max(fleetIntelligence.computerAssets, 1)}
                          tone="slate"
                        />
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-black text-slate-900">
                        Security readiness
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        TPM information from collector scans.
                      </p>
                      <div className="mt-4 space-y-4">
                        <MiniBar
                          label="TPM ready"
                          value={fleetIntelligence.tpmReady}
                          max={Math.max(fleetIntelligence.computerAssets, 1)}
                          tone="violet"
                        />
                        <MiniBar
                          label="TPM attention"
                          value={fleetIntelligence.tpmAttention}
                          max={Math.max(fleetIntelligence.computerAssets, 1)}
                          tone="amber"
                        />
                        <MiniBar
                          label="Not yet recorded"
                          value={fleetIntelligence.tpmUnknown}
                          max={Math.max(fleetIntelligence.computerAssets, 1)}
                          tone="slate"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <aside className="rounded-[28px] border border-slate-200/80 bg-[#0b1f33] p-5 text-white shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                    Intelligence recommendations
                  </p>
                  <h2 className="mt-1 text-xl font-black">Priority follow-up</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Recommendations now apply only to registered computers.
                  </p>

                  <div className="mt-5 space-y-3">
                    {fleetIntelligence.recommendations.length ? (
                      fleetIntelligence.recommendations.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl bg-white/10 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-black">{item.label}</p>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">
                              {item.value}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-slate-300">
                            {item.message}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-emerald-500/20 p-4">
                        <p className="font-black text-emerald-200">
                          No fleet priorities detected
                        </p>
                        <p className="mt-2 text-xs leading-5 text-emerald-100">
                          Current scanned-computer standards do not require
                          immediate follow-up.
                        </p>
                      </div>
                    )}
                  </div>
                </aside>
              </div>

              <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                      Recent collector activity
                    </p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">
                      Latest computer check-ins
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500">
                    These records update whenever the collector runs.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {fleetIntelligence.recentComputerScans.length ? (
                    fleetIntelligence.recentComputerScans.map((scan) => {
                      const asset = enrichedAssets.find(
                        (item) => item.id === scan.asset_id
                      );

                      return (
                        <div
                          key={scan.id}
                          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-black text-slate-950">
                                {asset?.asset_tag ||
                                  scan.hostname ||
                                  "Unknown computer"}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                {scan.hostname ||
                                  asset?.item_name ||
                                  "Computer check-in"}
                              </p>
                            </div>
                            <span className="rounded-full bg-emerald-200 px-3 py-1 text-xs font-black text-emerald-800">
                              Seen
                            </span>
                          </div>
                          <p className="mt-3 text-xs text-slate-500">
                            IP: {scan.ip_address || "-"} · MAC:{" "}
                            {scan.mac_address || "-"}
                          </p>
                          <p className="mt-2 text-xs text-slate-400">
                            {formatDateTime(scan.scanned_at)}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                      No collector check-ins have been recorded yet.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        <div ref={activeContentRef} className="scroll-mt-28" />

        {activeTab === "scan" && (
          <div id="tab-scan" className="scroll-mt-24 mt-6 rounded-3xl bg-white p-5 shadow-sm">
            <SectionTitle title="Barcode / QR scanning" subtitle="Scan a Kopkop QR label, asset tag, or serial number to open the correct internal device record instantly." />
            <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <div className="rounded-3xl border border-slate-200 p-5">
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={startScanner} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                    Open Camera Scanner
                  </button>
                  <button type="button" onClick={stopScanner} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                    Stop Scanner
                  </button>
                </div>

                <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-slate-950">
                  {scannerOpen ? (
                    <>
                      <video ref={videoRef} className="h-[320px] w-full object-cover" muted playsInline autoPlay disablePictureInPicture />
                      <canvas ref={canvasRef} className="hidden" />
                    </>
                  ) : (
                    <div className="grid h-[320px] place-items-center text-center text-slate-300">
                      <div>
                        <p className="text-lg font-semibold">Scanner preview</p>
                        <p className="mt-2 text-sm text-slate-400">
                          Press Open Camera Scanner to begin. If your phone asks for permission, choose Allow.
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
                  <button type="submit" className="w-full rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white">
                    Scan & Open Device
                  </button>
                </form>

                <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Best practice</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    <li>• Your existing public device URL QR labels are supported.</li>
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


        {activeTab === "maintenance" && (
          <div id="tab-maintenance" className="scroll-mt-24 mt-6 space-y-6">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <SectionTitle
                title="Maintenance / repair workflow"
                subtitle="Create, assign, track, and close repair tickets with proper status flow and asset status syncing."
              />

              <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                <StatCard label="Open" value={maintenanceStats.open} hint="New tickets" />
                <StatCard label="In Progress" value={maintenanceStats.inProgress} hint="Being repaired" />
                <StatCard label="Waiting Parts" value={maintenanceStats.waiting} hint="Blocked by parts" />
                <StatCard label="Completed" value={maintenanceStats.completed} hint="Resolved tickets" />
                <StatCard label="Cancelled" value={maintenanceStats.cancelled} hint="Closed without repair" />
                <StatCard label="Critical" value={maintenanceStats.critical} hint="Urgent unresolved tickets" />
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-3xl border border-slate-200 p-5">
                  <h3 className="text-lg font-bold text-slate-900">
                    {maintenanceForm.id ? "Edit maintenance ticket" : "Create maintenance ticket"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Use Create Repair from inventory or fill this form directly to log an issue.
                  </p>

                  <form onSubmit={handleSaveMaintenance} className="mt-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Asset</label>
                        <select
                          value={maintenanceForm.assetId}
                          onChange={(e) => {
                            const asset = enrichedAssets.find((item) => item.id === Number(e.target.value));
                            setMaintenanceForm((prev) => ({
                              ...prev,
                              assetId: e.target.value,
                              assetTag: asset?.asset_tag || "",
                              itemName: asset?.item_name || "",
                              assignedTo: prev.assignedTo || asset?.assigned_to || "",
                              previousAssetStatus: asset?.status || prev.previousAssetStatus,
                              priority: asset ? getMaintenancePriority(asset) : prev.priority,
                              notes: prev.notes || asset?.recommendation || "",
                            }));
                          }}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                        >
                          <option value="">Select asset</option>
                          {enrichedAssets.map((asset) => (
                            <option key={asset.id} value={asset.id}>
                              {asset.asset_tag} - {asset.item_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</label>
                        <select
                          value={maintenanceForm.priority}
                          onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, priority: e.target.value as MaintenancePriority }))}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                        >
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                          <option>Critical</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                        <select
                          value={maintenanceForm.status}
                          onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, status: e.target.value as MaintenanceStatus }))}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                        >
                          <option>Open</option>
                          <option>In Progress</option>
                          <option>Waiting for Parts</option>
                          <option>Completed</option>
                          <option>Cancelled</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Date Reported</label>
                        <input
                          type="date"
                          value={maintenanceForm.dateReported}
                          onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, dateReported: e.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Issue</label>
                      <textarea
                        value={maintenanceForm.issue}
                        onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, issue: e.target.value }))}
                        rows={3}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                        placeholder="Describe the problem with the device"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Reported By</label>
                        <input
                          value={maintenanceForm.reportedBy}
                          onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, reportedBy: e.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned To</label>
                        <input
                          value={maintenanceForm.assignedTo}
                          onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                          placeholder="User, office, or department"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Technician</label>
                        <input
                          value={maintenanceForm.technician}
                          onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, technician: e.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                          placeholder="Assigned technician"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Repair Date</label>
                        <input
                          type="date"
                          value={maintenanceForm.repairDate}
                          onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, repairDate: e.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Initial Notes</label>
                      <textarea
                        value={maintenanceForm.notes}
                        onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, notes: e.target.value }))}
                        rows={2}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                        placeholder="Recommendation or initial notes"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Action Taken</label>
                      <textarea
                        value={maintenanceForm.actionTaken}
                        onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, actionTaken: e.target.value }))}
                        rows={2}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                        placeholder="What work was carried out"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Resolution Notes</label>
                      <textarea
                        value={maintenanceForm.resolutionNotes}
                        onChange={(e) => setMaintenanceForm((prev) => ({ ...prev, resolutionNotes: e.target.value }))}
                        rows={2}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                        placeholder="Final outcome or resolution"
                      />
                    </div>

                    <section className="rounded-2xl border border-cyan-200 bg-cyan-50/40 p-4">
                      <div>
                        <h4 className="font-bold text-slate-900">Maintenance / Job Evidence</h4>
                        <p className="mt-1 text-xs text-slate-500">
                          These photos belong to this maintenance ticket and will appear on the printed Maintenance Report.
                          Asset passport photos will not be used as job-completion evidence.
                        </p>
                      </div>

                      {!maintenanceForm.id ? (
                        <div className="mt-4 rounded-xl border border-dashed border-cyan-300 bg-white p-4 text-sm text-slate-600">
                          Save the ticket first. Then click Edit on the ticket to upload maintenance evidence.
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                          {(["before", "work", "completed"] as MaintenanceEvidenceSlot[]).map((slot) => {
                            const photo = maintenanceEvidence.find((item) => item.slot === slot);
                            const busy = uploadingMaintenanceEvidenceSlot === slot;

                            return (
                              <div key={slot} className="rounded-2xl border border-slate-200 bg-white p-3">
                                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                                  {photo ? (
                                    <img
                                      src={photo.url}
                                      alt={photo.label}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="grid h-full place-items-center px-3 text-center text-xs text-slate-400">
                                      No {maintenanceEvidenceLabel(slot).toLowerCase()} photo
                                    </div>
                                  )}
                                </div>

                                <p className="mt-3 text-sm font-semibold text-slate-800">
                                  {maintenanceEvidenceLabel(slot)}
                                </p>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  <label className="cursor-pointer rounded-xl bg-cyan-700 px-3 py-2 text-xs font-semibold text-white">
                                    {busy ? "Uploading..." : photo ? "Replace" : "Upload"}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      disabled={uploadingMaintenanceEvidenceSlot !== null}
                                      onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        if (file) void handleMaintenanceEvidenceUpload(file, slot);
                                        event.currentTarget.value = "";
                                      }}
                                    />
                                  </label>

                                  {photo ? (
                                    <button
                                      type="button"
                                      disabled={uploadingMaintenanceEvidenceSlot !== null}
                                      onClick={() => void clearMaintenanceEvidence(slot)}
                                      className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                                    >
                                      Remove
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={savingMaintenance || uploadingMaintenanceEvidenceSlot !== null}
                        className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingMaintenance ? "Saving..." : maintenanceForm.id ? "Update Ticket" : "Create Ticket"}
                      </button>
                      <button
                        type="button"
                        onClick={resetMaintenanceForm}
                        className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                      >
                        Clear Form
                      </button>
                    </div>
                  </form>
                </div>

                <div className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Maintenance queue</h3>
                      <p className="mt-1 text-sm text-slate-500">Search, filter, and move tickets through the workflow.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        value={maintenanceSearch}
                        onChange={(e) => setMaintenanceSearch(e.target.value)}
                        placeholder="Search asset, issue, technician..."
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      />
                      <select
                        value={maintenanceStatusFilter}
                        onChange={(e) => setMaintenanceStatusFilter(e.target.value)}
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      >
                        <option>All</option>
                        <option>Open</option>
                        <option>In Progress</option>
                        <option>Waiting for Parts</option>
                        <option>Completed</option>
                        <option>Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {filteredMaintenanceRecords.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                        No maintenance records found. Use Create Repair from the device profile or inventory table.
                      </div>
                    ) : (
                      filteredMaintenanceRecords.map((record) => {
                        const relatedAsset = record.asset_id ? maintenanceAssetsById.get(record.asset_id) : null;
                        return (
                          <div key={record.id} className="rounded-2xl border border-slate-200 p-4">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900">
                                  {record.asset_tag || "Unknown asset"} · {record.item_name || relatedAsset?.item_name || "Unknown item"}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  Reported by {record.reported_by || "Unknown"} · {formatDate(record.date_reported || record.created_at)}
                                </p>
                                <p className="mt-2 text-sm text-slate-700">{record.issue || "No issue details."}</p>
                                <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                                  <p>Assigned to: {record.assigned_to || "Unassigned"}</p>
                                  <p>Technician: {record.technician || "Not assigned"}</p>
                                  <p>Repair date: {record.repair_date ? formatDate(record.repair_date) : "-"}</p>
                                  <p>Closed: {record.closed_date ? formatDateTime(record.closed_date) : "-"}</p>
                                </div>
                                <div className="mt-3 space-y-1 text-sm text-slate-600">
                                  <p><span className="font-semibold text-slate-700">Initial notes:</span> {record.notes || "-"}</p>
                                  <p><span className="font-semibold text-slate-700">Action taken:</span> {record.action_taken || "-"}</p>
                                  <p><span className="font-semibold text-slate-700">Resolution:</span> {record.resolution_notes || "-"}</p>
                                </div>
                              </div>

                              <div className="flex shrink-0 flex-col gap-3 lg:items-end">
                                <div className="flex flex-wrap gap-2">
                                  <Badge text={record.status || "Open"} className={statusPillClass(record.status)} />
                                  <Badge text={record.priority || "Medium"} className={statusPillClass(record.priority)} />
                                  {relatedAsset ? (
                                    <>
                                      <HealthIndicator score={relatedAsset.displayScore} />
                                      <OperationalIndicator status={relatedAsset.operationalStatus} />
                                    </>
                                  ) : null}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {record.status !== "In Progress" && record.status !== "Completed" && record.status !== "Cancelled" ? (
                                    <button
                                      type="button"
                                      onClick={() => updateMaintenanceStatus(record, "In Progress")}
                                      className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700"
                                    >
                                      Start
                                    </button>
                                  ) : null}
                                  {record.status !== "Waiting for Parts" && record.status !== "Completed" && record.status !== "Cancelled" ? (
                                    <button
                                      type="button"
                                      onClick={() => updateMaintenanceStatus(record, "Waiting for Parts")}
                                      className="rounded-xl bg-orange-100 px-3 py-2 text-xs font-semibold text-orange-700"
                                    >
                                      Waiting Parts
                                    </button>
                                  ) : null}
                                  {record.status !== "Completed" ? (
                                    <button
                                      type="button"
                                      onClick={() => updateMaintenanceStatus(record, "Completed")}
                                      className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700"
                                    >
                                      Complete
                                    </button>
                                  ) : null}
                                  {record.status !== "Cancelled" ? (
                                    <button
                                      type="button"
                                      onClick={() => updateMaintenanceStatus(record, "Cancelled")}
                                      className="rounded-xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-700"
                                    >
                                      Cancel
                                    </button>
                                  ) : null}
                                  {record.status !== "Open" ? (
                                    <button
                                      type="button"
                                      onClick={() => updateMaintenanceStatus(record, "Open")}
                                      className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                                    >
                                      Reopen
                                    </button>
                                  ) : null}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => printMaintenanceReport(record)}
                                    className="rounded-xl bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700"
                                  >
                                    Print / Save PDF
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => editMaintenance(record)}
                                    className="rounded-xl bg-cyan-100 px-3 py-2 text-xs font-semibold text-cyan-700"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteMaintenanceRecord(record.id)}
                                    className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "labels" && (
          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
            <SectionTitle title="QR generator + print labels" subtitle="Generate and print clean labels for devices using the asset tag as the QR value." />
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <input
                value={labelSearch}
                onChange={(e) => setLabelSearch(e.target.value)}
                placeholder="Search labels by asset tag, name, location, or user"
                className="w-full max-w-xl rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
              <button
                type="button"
                onClick={printAllVisibleLabels}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                Print Visible Labels
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {labelAssets.slice(0, 12).map((asset) => (
                <QRLabelCard key={asset.id} asset={asset} />
              ))}
            </div>

            {labelAssets.length === 0 ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No assets matched your label search.</div>
            ) : null}

            {labelAssets.length > 12 ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                Showing first 12 labels. Use <span className="font-semibold">Print Visible Labels</span> to print up to 24 matching labels at once.
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <SectionTitle title="Search, filter, and review assets" subtitle="Find a device quickly and inspect its technical profile, performance, and current usage." />
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

            {(activeTab === "dashboard" || activeTab === "inventory" || activeTab === "profile" || activeTab === "scan" || activeTab === "discovery" || activeTab === "labels") && (
              <div id="tab-inventory" className="scroll-mt-24 rounded-3xl bg-white p-5 shadow-sm">
                <SectionTitle title="Inventory overview" subtitle="Select a device to review its specs, condition, update status, and recommendation." />
                <div className="overflow-hidden rounded-3xl border border-slate-200">
                  <div className="grid gap-4 p-4 md:hidden">
                    {filteredAssets.map((asset) => (
                      <MobileAssetCard
                        key={asset.id}
                        asset={asset}
                        loading={loading}
                        savingAudit={savingAudit}
                        savingMaintenance={savingMaintenance}
                        openDeviceProfile={openDeviceProfile}
                        openEditAsset={fillAssetForm}
                        openAuditForAsset={openAuditForAsset}
                        createMaintenance={createMaintenance}
                      />
                    ))}

                    {filteredAssets.length === 0 ? (
                      <div className="rounded-3xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
                        No assets matched your filters.
                      </div>
                    ) : null}
                  </div>

                  <div className="hidden max-h-[620px] overflow-auto md:block">
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
                              <div className="flex flex-wrap gap-2">
                          <HealthIndicator score={asset.displayScore} />
                          <OperationalIndicator status={asset.operationalStatus} />
                        </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge text={asset.status || "-"} className={statusPillClass(asset.status)} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => openDeviceProfile(asset.id)}
                                  className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                                >
                                  View Profile
                                </button>
                                <button
                                  type="button"
                                  onClick={() => fillAssetForm(asset)}
                                  disabled={savingAsset || loading}
                                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                                    savingAsset || loading
                                      ? "bg-blue-200 text-blue-800 cursor-not-allowed opacity-70"
                                      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                  }`}
                                >
                                  {savingAsset ? "Saving..." : "Edit"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openAuditForAsset(asset)}
                                  disabled={savingAudit || loading}
                                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                                    savingAudit || loading
                                      ? "bg-emerald-200 text-emerald-800 cursor-not-allowed opacity-70"
                                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  }`}
                                >
                                  {savingAudit ? "Saving..." : "Audit"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => createMaintenance(asset)}
                                  disabled={savingMaintenance || loading}
                                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                                    savingMaintenance || loading
                                      ? "bg-red-200 text-red-800 cursor-not-allowed opacity-70"
                                      : "bg-red-100 text-red-700 hover:bg-red-200"
                                  }`}
                                >
                                  {savingMaintenance ? "Creating..." : "Create Repair"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAsset(asset.id)}
                                  disabled={deletingAssetId === asset.id || loading}
                                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                                    deletingAssetId === asset.id || loading
                                      ? "bg-red-300 text-red-900 cursor-not-allowed opacity-70"
                                      : "bg-red-200 text-red-800 hover:bg-red-300"
                                  }`}
                                  title={deletingAssetId === asset.id ? "Deleting..." : "Delete this asset"}
                                >
                                  {deletingAssetId === asset.id ? "Deleting..." : "Delete"}
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

            {activeTab === "profile" && selectedAsset && (
              <div ref={profileSectionRef} className="space-y-6">
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <SectionTitle title="Device profile workspace" subtitle="Complete view of one asset with health, audits, maintenance history, and activity timeline." />
                  <div className="grid gap-4 xl:grid-cols-3">
                    <div className="rounded-3xl bg-slate-950 p-5 text-white xl:col-span-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">{selectedAsset.asset_tag}</p>
                          <h3 className="mt-2 text-3xl font-bold">{selectedAsset.item_name}</h3>
                          <p className="mt-2 text-sm text-slate-300">
                            {selectedAsset.brand || "-"} {selectedAsset.model || ""} · Serial: {selectedAsset.serial_number || "Not recorded"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <div className="flex flex-wrap gap-2">
                            <div className="flex flex-wrap gap-2">
                          <HealthIndicator score={selectedAsset.displayScore} />
                          <OperationalIndicator status={selectedAsset.operationalStatus} />
                        </div>
                            <OperationalIndicator status={selectedAsset.operationalStatus} />
                          </div>
                          <Badge text={selectedAsset.status || "-"} className={statusPillClass(selectedAsset.status)} />
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl bg-white/5 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Assigned user</p>
                          <p className="mt-2 font-semibold text-white">{selectedAsset.assigned_to || "Unassigned"}</p>
                          <p className="mt-1 text-sm text-slate-300">{selectedAsset.location || "No location"}</p>
                        </div>
                        <div className="rounded-2xl bg-white/5 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">System details</p>
                          <p className="mt-2 font-semibold text-white">{selectedAsset.os || "Not recorded"}</p>
                          <p className="mt-1 text-sm text-slate-300">{selectedAsset.ram || "No RAM"} · {selectedAsset.storage || "No storage"}</p>
                          <p className="mt-1 text-sm text-slate-300">GPU: {selectedAsset.gpu || "Not recorded"} · BIOS: {selectedAsset.bios_version || "Not recorded"}</p>
                          <p className="mt-1 text-sm text-slate-300">IP: {selectedAsset.ip_address || "Not recorded"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Health summary</p>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-4xl font-bold text-slate-900">{selectedAsset.displayScore}%</p>
                        <div className="flex flex-wrap gap-2">
                          <HealthIndicator score={selectedAsset.displayScore} />
                          <OperationalIndicator status={selectedAsset.operationalStatus} />
                        </div>
                      </div>
                      <p className="mt-4 text-sm font-medium text-slate-800">{selectedAsset.recommendation}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedAsset.alerts.length > 0 ? (
                          selectedAsset.alerts.map((alert) => (
                            <Badge key={alert} text={alert} className="bg-slate-100 text-slate-700" />
                          ))
                        ) : (
                          <Badge text="No active alerts" className="bg-emerald-100 text-emerald-700" />
                        )}
                      </div>
                      <div className="mt-5 grid gap-3">
                        <button type="button" onClick={() => openAuditForAsset(selectedAsset)} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">
                          New Audit
                        </button>
                        <button type="button" onClick={() => createMaintenance(selectedAsset)} className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white">
                          Create Maintenance
                        </button>
                        <button type="button" onClick={() => setActiveTab("labels")} className="rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white">
                          Open QR Label
                        </button>
                        <button type="button" onClick={printSelectedAssetReport} className="rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white">
                          Print Full Specifications
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <ComponentManager
                  assetTag={selectedAsset.asset_tag}
                  components={selectedAssetComponents}
                  isAdmin={isAdmin}
                  deletingComponentId={deletingComponentId}
                  onAddComponent={openAddComponentForm}
                  onEditComponent={openEditComponentForm}
                  onReplaceComponent={openReplaceComponentForm}
                  onDeleteComponent={handleDeleteComponent}
                />

                {showComponentForm ? (
                  <form onSubmit={handleSaveComponent} className="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">
                          {componentBeingReplaced
                            ? "Replace Component"
                            : componentForm.id
                              ? "Edit Component"
                              : "Add Component"}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {selectedAsset.asset_tag} · {selectedAsset.item_name}
                        </p>
                      </div>
                      <button type="button" onClick={resetComponentForm} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                        Close
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <label className="text-sm font-semibold text-slate-700">
                        Component Type *
                        <select value={componentForm.componentType} onChange={(event) => setComponentForm((current) => ({ ...current, componentType: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-cyan-600">
                          <option>RAM</option><option>SSD</option><option>HDD</option><option>Processor</option><option>Motherboard</option><option>Power Supply</option><option>CMOS Battery</option><option>Graphics Card</option><option>Network Card</option><option>Wi-Fi Card</option><option>Keyboard</option><option>Mouse</option><option>Monitor</option><option>Charger</option><option>HDMI Cable</option><option>Other</option>
                        </select>
                      </label>

                      <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                        Component Name *
                        <input value={componentForm.componentName} onChange={(event) => setComponentForm((current) => ({ ...current, componentName: event.target.value }))} placeholder="Example: Kingston 8GB DDR4 RAM" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-cyan-600" />
                      </label>

                      <label className="text-sm font-semibold text-slate-700">Brand<input value={componentForm.brand} onChange={(event) => setComponentForm((current) => ({ ...current, brand: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-normal" /></label>
                      <label className="text-sm font-semibold text-slate-700">Model<input value={componentForm.model} onChange={(event) => setComponentForm((current) => ({ ...current, model: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-normal" /></label>
                      <label className="text-sm font-semibold text-slate-700">Serial Number<input value={componentForm.serialNumber} onChange={(event) => setComponentForm((current) => ({ ...current, serialNumber: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-normal" /></label>

                      <label className="text-sm font-semibold text-slate-700 sm:col-span-2 xl:col-span-3">Specification<textarea rows={3} value={componentForm.specification} onChange={(event) => setComponentForm((current) => ({ ...current, specification: event.target.value }))} placeholder="Example: 8GB DDR4 2666MHz" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-normal" /></label>

                      <label className="text-sm font-semibold text-slate-700">Quantity<input type="number" min="1" value={componentForm.quantity} onChange={(event) => setComponentForm((current) => ({ ...current, quantity: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-normal" /></label>
                      <label className="text-sm font-semibold text-slate-700">Status<select value={componentForm.status} onChange={(event) => setComponentForm((current) => ({ ...current, status: event.target.value as ComponentStatus }))} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-normal"><option>Installed</option><option>In Store</option><option>Removed</option><option>Faulty</option><option>Replaced</option><option>Disposed</option></select></label>
                      <label className="text-sm font-semibold text-slate-700">Condition<select value={componentForm.condition} onChange={(event) => setComponentForm((current) => ({ ...current, condition: event.target.value as ComponentCondition }))} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-normal"><option>Good</option><option>Fair</option><option>Faulty</option><option>Damaged</option></select></label>

                      <label className="text-sm font-semibold text-slate-700">Installed Date<input type="date" value={componentForm.installedDate} onChange={(event) => setComponentForm((current) => ({ ...current, installedDate: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-normal" /></label>
                      <label className="text-sm font-semibold text-slate-700">Installed By<input value={componentForm.installedBy} onChange={(event) => setComponentForm((current) => ({ ...current, installedBy: event.target.value }))} placeholder="Example: Angelo Kimui" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-normal" /></label>
                      <label className="text-sm font-semibold text-slate-700">Location<input value={componentForm.location} onChange={(event) => setComponentForm((current) => ({ ...current, location: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-normal" /></label>

                      <label className="text-sm font-semibold text-slate-700">Supplier<input value={componentForm.supplier} onChange={(event) => setComponentForm((current) => ({ ...current, supplier: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-normal" /></label>
                      <label className="text-sm font-semibold text-slate-700">Purchase Date<input type="date" value={componentForm.purchaseDate} onChange={(event) => setComponentForm((current) => ({ ...current, purchaseDate: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-normal" /></label>
                      <label className="text-sm font-semibold text-slate-700">Warranty Expiry<input type="date" value={componentForm.warrantyExpiry} onChange={(event) => setComponentForm((current) => ({ ...current, warrantyExpiry: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-normal" /></label>

                      <label className="text-sm font-semibold text-slate-700 sm:col-span-2 xl:col-span-3">Notes<textarea rows={4} value={componentForm.notes} onChange={(event) => setComponentForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Record installation, fault, upgrade, or replacement details." className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 font-normal" /></label>
                    </div>

                    <div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                      <button type="button" onClick={resetComponentForm} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Cancel</button>
                      <button type="submit" disabled={savingComponent} className="rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                        {savingComponent
                          ? "Saving Component..."
                          : componentBeingReplaced
                            ? "Replace Component"
                            : componentForm.id
                              ? "Update Component"
                              : "Save Component"}
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <SectionTitle title="Device details" subtitle="Core asset information, technical specs, and management details." />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Asset information</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-700">
                          <p><span className="font-semibold text-slate-900">Asset Tag:</span> {selectedAsset.asset_tag}</p>
                          <p><span className="font-semibold text-slate-900">Computer Name:</span> {selectedAsset.item_name}</p>
                          <p><span className="font-semibold text-slate-900">Category:</span> {selectedAsset.category || "-"}</p>
                          <p><span className="font-semibold text-slate-900">Brand / Model:</span> {selectedAsset.brand || "-"} {selectedAsset.model || ""}</p>
                          <p><span className="font-semibold text-slate-900">Serial Number:</span> {selectedAsset.serial_number || "Not recorded"}</p>
                          <p><span className="font-semibold text-slate-900">Condition:</span> {selectedAsset.condition || "-"}</p>
                          <p><span className="font-semibold text-slate-900">Status:</span> {selectedAsset.status || "-"}</p>
                          <p><span className="font-semibold text-slate-900">Quantity:</span> {selectedAsset.quantity || 1}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ownership and dates</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-700">
                          <p><span className="font-semibold text-slate-900">Assigned To:</span> {selectedAsset.assigned_to || "Unassigned"}</p>
                          <p><span className="font-semibold text-slate-900">Location:</span> {selectedAsset.location || "No location"}</p>
                          <p><span className="font-semibold text-slate-900">Supplier:</span> {selectedAsset.supplier || "-"}</p>
                          <p><span className="font-semibold text-slate-900">Purchase Date:</span> {formatDate(selectedAsset.purchase_date)}</p>
                          <p><span className="font-semibold text-slate-900">Device Age:</span> {calculateDeviceAge(selectedAsset.purchase_date)}</p>
                          <p><span className="font-semibold text-slate-900">Warranty Expiry:</span> {formatDate(selectedAsset.warranty_expiry)}</p>
                          <p><span className="font-semibold text-slate-900">Warranty Status:</span> {getWarrantyStatus(selectedAsset.warranty_expiry)}</p>
                          <p><span className="font-semibold text-slate-900">Created:</span> {formatDateTime(selectedAsset.created_at)}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Technical specs</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-700">
                          <p><span className="font-semibold text-slate-900">OS:</span> {selectedAsset.os || "-"}</p>
                          <p><span className="font-semibold text-slate-900">Processor:</span> {selectedAsset.processor || "-"}</p>
                          <p><span className="font-semibold text-slate-900">RAM:</span> {selectedAsset.ram || "-"}</p>
                          <p><span className="font-semibold text-slate-900">Storage:</span> {selectedAsset.storage || "-"}</p>
                          <p><span className="font-semibold text-slate-900">GPU:</span> {selectedAsset.gpu || "-"}</p>
                          <p><span className="font-semibold text-slate-900">Motherboard:</span> {selectedAsset.motherboard || "-"}</p>
                          <p><span className="font-semibold text-slate-900">BIOS:</span> {selectedAsset.bios_version || "-"}</p>
                          <p><span className="font-semibold text-slate-900">BIOS Date:</span> {formatDate(selectedAsset.bios_date)}</p>
                          <p><span className="font-semibold text-slate-900">TPM:</span> {selectedAsset.tpm_status || "-"}</p>
                          <p><span className="font-semibold text-slate-900">Hostname:</span> {selectedAsset.hostname || selectedAsset.item_name || "-"}</p>
                          <p><span className="font-semibold text-slate-900">IP Address:</span> {selectedAsset.ip_address || "-"}</p>
                          <p><span className="font-semibold text-slate-900">MAC Address:</span> {selectedAsset.mac_address || "-"}</p>
                          <p><span className="font-semibold text-slate-900">System Type:</span> {selectedAsset.system_type || "-"}</p>
                          <p><span className="font-semibold text-slate-900">Connection:</span> {selectedAsset.connection_type || "-"}</p>
                          <p><span className="font-semibold text-slate-900">MS Office:</span> {selectedAsset.ms_office || "-"}</p>
                          <p><span className="font-semibold text-slate-900">Monitor:</span> {selectedAsset.monitor || "-"}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Peripherals and notes</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-700">
                          <p><span className="font-semibold text-slate-900">Keyboard:</span> {selectedAsset.keyboard || "Not recorded"}</p>
                          <p><span className="font-semibold text-slate-900">Mouse:</span> {selectedAsset.mouse || "Not recorded"}</p>
                          <p><span className="font-semibold text-slate-900">Charger:</span> {(selectedAsset as any).charger || "Not recorded"}</p>
                          <p><span className="font-semibold text-slate-900">Headset:</span> {(selectedAsset as any).headset || "Not recorded"}</p>
                          <p><span className="font-semibold text-slate-900">Online Status:</span> {liveOnlineStatus(selectedAsset)}</p>
                          <p><span className="font-semibold text-slate-900">Windows Update:</span> {selectedAsset.windows_update || "-"}</p>
                          <div className="rounded-2xl bg-slate-50 p-3 mt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                            <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{selectedAsset.notes || "No notes recorded for this device."}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <SectionTitle title="Performance snapshot" subtitle="Current operating condition fields captured for this device." />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Boot and desktop</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-700">
                          <p><span className="font-semibold text-slate-900">Booting Speed:</span> {selectedAsset.booting_speed || "-"}</p>
                          <p><span className="font-semibold text-slate-900">Desktop Loading:</span> {selectedAsset.desktop_loading_speed || "-"}</p>
                          <p><span className="font-semibold text-slate-900">Performance:</span> {selectedAsset.performance || "-"}</p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Support guidance</p>
                        <div className="mt-3 space-y-3 text-sm text-slate-700">
                          <p><span className="font-semibold text-slate-900">Recommendation:</span> {selectedAsset.recommendation}</p>
                          <p><span className="font-semibold text-slate-900">Alerts:</span> {selectedAsset.alerts.length ? selectedAsset.alerts.join(", ") : "No active alerts"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <SectionTitle
                    title="Live device intelligence"
                    subtitle="Collector check-ins and technical changes recorded for this computer."
                  />

                  <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            Current connection
                          </p>
                          <p className="mt-2 text-2xl font-black text-slate-950">
                            {liveOnlineStatus(selectedAsset)}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${
                          liveOnlineStatus(selectedAsset) === "Online"
                            ? "bg-emerald-100 text-emerald-700"
                            : liveOnlineStatus(selectedAsset) === "Recently Seen"
                              ? "bg-cyan-100 text-cyan-700"
                              : "bg-slate-200 text-slate-700"
                        }`}>
                          {liveOnlineStatus(selectedAsset)}
                        </span>
                      </div>

                      <div className="mt-5 space-y-3 text-sm text-slate-700">
                        <p><span className="font-black text-slate-950">Last seen:</span> {selectedAsset.last_seen_at ? formatDateTime(selectedAsset.last_seen_at) : "Never scanned"}</p>
                        <p><span className="font-black text-slate-950">Recorded scans:</span> {selectedAssetScans.length}</p>
                        <p><span className="font-black text-slate-950">Hardware changes:</span> {selectedAssetChanges.length}</p>
                        <p><span className="font-black text-slate-950">Latest IP:</span> {selectedAsset.ip_address || "Not recorded"}</p>
                        <p><span className="font-black text-slate-950">Latest MAC:</span> {selectedAsset.mac_address || "Not recorded"}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[...selectedAssetScans.slice(0, 6), ...selectedAssetChanges.slice(0, 6)]
                        .sort((a: any, b: any) => {
                          const aDate = "scanned_at" in a ? a.scanned_at : a.changed_at;
                          const bDate = "scanned_at" in b ? b.scanned_at : b.changed_at;
                          return new Date(bDate).getTime() - new Date(aDate).getTime();
                        })
                        .slice(0, 10)
                        .map((event: any) => {
                          const isScan = "scanned_at" in event;
                          return (
                            <div key={`${isScan ? "scan" : "change"}-${event.id}`} className={`rounded-2xl border p-4 ${
                              isScan ? "border-emerald-200 bg-emerald-50" : "border-violet-200 bg-violet-50"
                            }`}>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-black text-slate-950">
                                    {isScan ? "Device checked in" : `${event.field_name} changed`}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {formatDateTime(isScan ? event.scanned_at : event.changed_at)}
                                  </p>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-xs font-black ${
                                  isScan ? "bg-emerald-200 text-emerald-800" : "bg-violet-200 text-violet-800"
                                }`}>
                                  {isScan ? "Check-in" : "Change"}
                                </span>
                              </div>

                              {isScan ? (
                                <p className="mt-3 text-sm text-slate-700">
                                  IP: {event.ip_address || "-"} · MAC: {event.mac_address || "-"}
                                </p>
                              ) : (
                                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                                  <div className="rounded-xl bg-white p-3">
                                    <p className="font-bold text-slate-400">Previous</p>
                                    <p className="mt-1 break-words text-slate-700">{event.old_value || "Not recorded"}</p>
                                  </div>
                                  <div className="rounded-xl bg-white p-3">
                                    <p className="font-bold text-slate-400">Current</p>
                                    <p className="mt-1 break-words text-slate-700">{event.new_value || "Not recorded"}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                      {selectedAssetScans.length === 0 && selectedAssetChanges.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                          Run the collector on this computer to begin its live activity timeline.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <SectionTitle title="Audit history" subtitle="All audits recorded for this device." />
                    <div className="space-y-3">
                      {selectedAssetAudits.length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No audit records for this device yet.</div>
                      ) : (
                        selectedAssetAudits.map((check) => (
                          <div key={check.id} className="rounded-2xl border border-slate-200 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">{check.final_status}</p>
                                <p className="mt-1 text-sm text-slate-500">{formatDate(check.inspection_date)} · {check.inspected_by}</p>
                                <p className="mt-2 text-sm text-slate-600">{check.remarks || "No remarks recorded."}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge text={check.priority_level || "Low"} className={statusPillClass(check.priority_level)} />
                                <Badge text={`${check.health_score ?? 0}%`} className={scoreTone(check.health_score ?? 0)} />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <SectionTitle title="Maintenance history" subtitle="Repair and maintenance tickets linked to this device." />
                    <div className="space-y-3">
                      {selectedAssetMaintenance.length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No maintenance records for this device yet.</div>
                      ) : (
                        selectedAssetMaintenance.map((record) => (
                          <div key={record.id} className="rounded-2xl border border-slate-200 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">{record.issue || "Maintenance ticket"}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {formatDate(record.date_reported)} · {record.technician || record.reported_by || "No technician"}
                                </p>
                                <p className="mt-2 text-sm text-slate-600">
                                  {record.resolution_notes || record.action_taken || record.notes || "No notes recorded."}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge text={record.status || "Open"} className={statusPillClass(record.status || "Open")} />
                                <Badge text={record.priority || "Medium"} className={statusPillClass(record.priority || "Medium")} />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Asset lifecycle timeline</h2>
                      <p className="mt-1 text-sm text-slate-500">Purchase, registration, audits, maintenance and the device's current state in one history.</p>
                    </div>
                    <button
                      type="button"
                      onClick={printAssetLifecycleReport}
                      className="rounded-2xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                    >
                      Print Lifecycle Report
                    </button>
                  </div>
                  <div className="relative space-y-0 pl-7 before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-0.5 before:bg-teal-100">
                    {selectedAssetTimeline.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No activity yet for this device.</div>
                    ) : (
                      selectedAssetTimeline.map((item) => (
                        <div key={item.id} className="relative pb-4">
                          <span
                            title={item.type}
                            className={`absolute -left-7 top-4 grid h-7 w-7 place-items-center rounded-full border-4 border-white text-[12px] font-bold text-white shadow-sm ${lifecycleMarkerClass(item.type)}`}
                          >
                            {lifecycleIcon(item.type)}
                          </span>
                          <div
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                            style={{ borderLeftWidth: "4px", borderLeftColor: lifecycleAccent(item.type) }}
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <p className="font-semibold text-slate-900">{item.title}</p>
                                <p className="mt-1 text-sm text-slate-500">{formatDateTime(item.date)}</p>
                                <p className="mt-2 text-sm font-medium text-slate-700">{item.subtitle}</p>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{item.notes}</p>
                              </div>
                              <Badge text={item.type} className={item.toneClass} />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "discovery" && (
              <div className="space-y-5">
                <div className="rounded-3xl bg-[#0b1f33] p-5 text-white shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                        Live device discovery
                      </p>
                      <h2 className="mt-1 text-2xl font-black">Discovery Center</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                        Review computers submitted by the KOPKOP collector. Load a pending device
                        into the asset form to create a new record or update an existing asset.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void refreshDeviceDiscoveries(true)}
                      disabled={loadingDiscoveries}
                      className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-60"
                    >
                      {loadingDiscoveries ? "Refreshing…" : "↻ Refresh Discoveries"}
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-300">Pending</p>
                      <p className="mt-1 text-3xl font-black">
                        {deviceDiscoveries.filter((item) => item.status === "pending").length}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-300">Existing</p>
                      <p className="mt-1 text-3xl font-black">
                        {deviceDiscoveries.filter((item) => item.discovery_type === "existing_asset").length}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-300">New Devices</p>
                      <p className="mt-1 text-3xl font-black">
                        {deviceDiscoveries.filter((item) => item.discovery_type === "new_asset").length}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-300">Total History</p>
                      <p className="mt-1 text-3xl font-black">{deviceDiscoveries.length}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <SectionTitle
                    title="Discovered computers"
                    subtitle="Pending devices appear first. Review each record before changing the official inventory."
                  />

                  {loadingDiscoveries ? (
                    <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                      Loading discovered devices…
                    </div>
                  ) : deviceDiscoveries.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                      <p className="text-lg font-black text-slate-800">No devices discovered yet</p>
                      <p className="mt-2 text-sm text-slate-500">
                        Run the PowerShell collector on a Windows computer, then refresh this page.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {deviceDiscoveries.map((record) => {
                        const payload = record.payload || {};
                        const device = payload.device || {};
                        const os = payload.operating_system || {};
                        const hardware = payload.hardware || {};
                        const memory = hardware.memory || {};
                        const processor = hardware.processor || {};
                        const isPending = record.status === "pending";
                        const matchedInventoryAsset = findAssetForDiscovery(record);
                        const isExisting = Boolean(matchedInventoryAsset);
                        const isAutoUpdating = autoUpdatingDiscoveryId === record.id;

                        return (
                          <div
                            key={record.id}
                            className={`rounded-3xl border p-4 ${
                              isPending
                                ? "border-violet-200 bg-violet-50/40"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full px-3 py-1 text-xs font-black ${
                                    isPending
                                      ? "bg-amber-100 text-amber-800"
                                      : record.status === "imported"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-slate-100 text-slate-700"
                                  }`}>
                                    {isAutoUpdating ? "updating" : record.status}
                                  </span>
                                  <span className={`rounded-full px-3 py-1 text-xs font-black ${
                                    isExisting
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-violet-100 text-violet-800"
                                  }`}>
                                    {isExisting ? "Existing Asset" : "New Device"}
                                  </span>
                                </div>

                                <h3 className="mt-3 break-words text-xl font-black text-slate-950">
                                  {record.hostname || device.computer_name || "Unknown computer"}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                  {[device.manufacturer, device.model].filter(Boolean).join(" ") ||
                                    "Manufacturer and model not detected"}
                                </p>

                                <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2 xl:grid-cols-4">
                                  <p><span className="font-bold">Serial:</span> {record.serial_number || device.serial_number || "-"}</p>
                                  <p><span className="font-bold">MAC:</span> {record.mac_address || "-"}</p>
                                  <p><span className="font-bold">RAM:</span> {memory.total_ram_gb != null ? `${memory.total_ram_gb} GB` : "-"}</p>
                                  <p><span className="font-bold">Windows:</span> {os.caption || "-"}</p>
                                </div>

                                <p className="mt-2 truncate text-xs text-slate-500">
                                  {processor.name || "Processor not detected"}
                                </p>
                                <p className="mt-2 text-xs text-slate-400">
                                  Received: {record.received_at ? formatDateTime(record.received_at) : "Date unavailable"}
                                  {matchedInventoryAsset?.last_seen_at
                                    ? ` · Last seen: ${formatDateTime(matchedInventoryAsset.last_seen_at)}`
                                    : ""}
                                </p>
                              </div>

                              <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                                {isAutoUpdating ? (
                                  <span className="rounded-2xl bg-blue-100 px-5 py-3 text-center text-sm font-black text-blue-700">
                                    Automatically updating…
                                  </span>
                                ) : isPending ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => void openDiscoveryForReview(record)}
                                      disabled={processingDiscoveryId === record.id}
                                      className="rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
                                    >
                                      {processingDiscoveryId === record.id
                                        ? "Loading…"
                                        : isExisting
                                          ? "Review & Update"
                                          : "Review & Create"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void ignoreDiscovery(record)}
                                      disabled={processingDiscoveryId === record.id}
                                      className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 disabled:opacity-60"
                                    >
                                      Ignore
                                    </button>
                                  </>
                                ) : (
                                  <span className="rounded-2xl bg-slate-100 px-5 py-3 text-center text-sm font-bold text-slate-600">
                                    {record.status === "imported" ? "Loaded into Inventory" : "No action required"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <SectionTitle
                    title="Device activity timeline"
                    subtitle="Recent collector check-ins and hardware changes across the ICT fleet."
                  />

                  <div className="grid gap-5 xl:grid-cols-2">
                    <div>
                      <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-600">
                        Recent check-ins
                      </h3>
                      <div className="space-y-3">
                        {scanHistory.slice(0, 10).map((scan) => {
                          const asset = assets.find((item) => item.id === scan.asset_id);
                          return (
                            <div key={scan.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-black text-slate-950">
                                    {asset?.asset_tag || scan.hostname || "Unknown device"}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-600">
                                    {scan.hostname || asset?.item_name || "Computer check-in"}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    IP: {scan.ip_address || "-"} · MAC: {scan.mac_address || "-"}
                                  </p>
                                </div>
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                                  Seen
                                </span>
                              </div>
                              <p className="mt-2 text-xs text-slate-400">
                                {formatDateTime(scan.scanned_at)}
                              </p>
                            </div>
                          );
                        })}
                        {scanHistory.length === 0 ? (
                          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                            No scan history recorded yet.
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-600">
                        Hardware changes
                      </h3>
                      <div className="space-y-3">
                        {hardwareChanges.slice(0, 10).map((change) => {
                          const asset = assets.find((item) => item.id === change.asset_id);
                          return (
                            <div key={change.id} className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-black text-slate-950">
                                    {asset?.asset_tag || `Asset ${change.asset_id}`}
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-violet-800">
                                    {change.field_name}
                                  </p>
                                </div>
                                <span className="rounded-full bg-violet-200 px-3 py-1 text-xs font-black text-violet-800">
                                  Changed
                                </span>
                              </div>
                              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                                <div className="rounded-xl bg-white p-3">
                                  <p className="font-bold text-slate-400">Previous</p>
                                  <p className="mt-1 break-words text-slate-700">{change.old_value || "Not recorded"}</p>
                                </div>
                                <div className="rounded-xl bg-white p-3">
                                  <p className="font-bold text-slate-400">Current</p>
                                  <p className="mt-1 break-words text-slate-700">{change.new_value || "Not recorded"}</p>
                                </div>
                              </div>
                              <p className="mt-2 text-xs text-slate-400">
                                {formatDateTime(change.changed_at)}
                              </p>
                            </div>
                          );
                        })}
                        {hardwareChanges.length === 0 ? (
                          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                            No hardware changes detected yet.
                          </p>
                        ) : null}
                      </div>
                    </div>
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
                          <div className="flex shrink-0 flex-col gap-3 lg:items-end">
                            <div className="flex flex-wrap gap-2">
                              <Badge text={check.final_status} className={statusPillClass(check.final_status)} />
                              <Badge text={check.priority_level || "Low"} className={statusPillClass(check.priority_level)} />
                              <Badge text={`${check.health_score ?? 0}%`} className={scoreTone(check.health_score ?? 0)} />
                            </div>
                            <button
                              type="button"
                              onClick={() => printAuditReport(check)}
                              className="rounded-xl bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700"
                            >
                              Print / Save PDF
                            </button>
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

            {(activeTab === "inventory" || editingAssetId !== null) && (
              <div id="asset-registration-form" className="scroll-mt-28 rounded-3xl bg-white p-5 shadow-sm">
                {activeDiscoveryId ? (
                  <div className={`mb-5 rounded-2xl border p-4 ${
                    activeDiscoveryMode === "update"
                      ? "border-blue-200 bg-blue-50"
                      : "border-violet-200 bg-violet-50"
                  }`}>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">
                      Live Asset Intelligence V4
                    </p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">
                      {activeDiscoveryMode === "update"
                        ? "Review existing asset update"
                        : "Complete new asset registration"}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      The technical information has already been loaded. Review it, complete the
                      school-controlled fields, then save to finish this discovery.
                    </p>
                  </div>
                ) : null}

                <SectionTitle
                  title={
                    activeDiscoveryMode === "update"
                      ? "Review discovered asset update"
                      : activeDiscoveryMode === "create"
                        ? "Register discovered device"
                        : editingAssetId
                          ? "Edit asset record"
                          : "Add new asset"
                  }
                  subtitle="Register ICT assets and electrical equipment, including Admin Building items needed for solar load documentation."
                />

                <form onSubmit={handleSaveAsset} className="space-y-5">
                  <section className="overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50">
                    <div className="p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                        Automatic device discovery
                      </p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">
                        Receive computer information
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                        Run the KOPKOP Live Collector on the computer. Its technical information
                        will be sent securely to this system without transferring a JSON file.
                      </p>

                      {lastImportedDevice ? (
                        <p className="mt-2 text-xs font-bold text-emerald-700">
                          ✓ Loaded: {lastImportedDevice}
                        </p>
                      ) : null}

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => void receiveLatestLiveDevice()}
                          disabled={checkingLiveDevice || importingDeviceInfo}
                          className="min-h-14 rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {checkingLiveDevice
                            ? "Receiving…"
                            : pendingLiveDevices > 0
                              ? `📡 Receive Live Device (${pendingLiveDevices})`
                              : "📡 Check for Live Device"}
                        </button>

                        <label
                          className={`inline-flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border px-5 py-3 text-center text-sm font-black shadow-sm transition ${
                            importingDeviceInfo
                              ? "cursor-wait border-slate-300 bg-slate-200 text-slate-500"
                              : "border-cyan-300 bg-white text-cyan-800 hover:bg-cyan-50"
                          }`}
                        >
                          {importingDeviceInfo ? "Importing…" : "📥 Import JSON Backup"}
                          <input
                            type="file"
                            accept=".json,application/json"
                            className="hidden"
                            disabled={importingDeviceInfo}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) void handleDeviceInfoImport(file);
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="border-t border-cyan-200/70 bg-white/60 px-4 py-3 text-xs leading-5 text-slate-600">
                      Existing devices are matched by serial number, computer name or MAC address.
                      The Asset Tag, Location, Assigned To, purchase information and photographs remain under technician control.
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4">
                      <h3 className="font-bold text-slate-900">Basic Asset Information</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Enter the identity, assignment and purchasing details for the asset.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        placeholder="Asset Tag"
                        value={assetForm.assetTag}
                        onChange={(e) => setAssetForm({ ...assetForm, assetTag: e.target.value })}
                        required
                      />

                      <input
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        placeholder="Device / Item Name"
                        value={assetForm.itemName}
                        onChange={(e) => setAssetForm({ ...assetForm, itemName: e.target.value })}
                        required
                      />

                      <div className="space-y-2">
                        <select
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          value={
                            assetCategoryOptions.includes(assetForm.category)
                              ? assetForm.category
                              : "__custom__"
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setAssetForm({
                              ...assetForm,
                              category: value === "__custom__" ? "" : value,
                            });
                          }}
                          required
                        >
                          <option value="" disabled>Select Type of Device</option>
                          {assetCategoryOptions.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                          <option value="__custom__">Other / Type a new device</option>
                        </select>

                        {!assetCategoryOptions.includes(assetForm.category) ? (
                          <input
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                            placeholder="Type new device category"
                            value={assetForm.category}
                            onChange={(e) =>
                              setAssetForm({ ...assetForm, category: e.target.value })
                            }
                            required
                          />
                        ) : null}
                      </div>

                      <input
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        placeholder="Assigned To"
                        value={assetForm.assignedTo}
                        onChange={(e) => setAssetForm({ ...assetForm, assignedTo: e.target.value })}
                      />

                      <input
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        placeholder="Brand"
                        value={assetForm.brand}
                        onChange={(e) => setAssetForm({ ...assetForm, brand: e.target.value })}
                      />

                      <input
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        placeholder="Model"
                        value={assetForm.model}
                        onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })}
                      />

                      <input
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        placeholder="Serial Number"
                        value={assetForm.serialNumber}
                        onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                      />

                      <input
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        placeholder="Location / Department"
                        value={assetForm.location}
                        onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                      />

                      <input
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        placeholder="Quantity"
                        inputMode="numeric"
                        value={assetForm.quantity}
                        onChange={(e) => setAssetForm({ ...assetForm, quantity: e.target.value })}
                      />

                      <input
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        placeholder="Supplier"
                        value={assetForm.supplier}
                        onChange={(e) => setAssetForm({ ...assetForm, supplier: e.target.value })}
                      />

                      <select
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        value={assetForm.condition}
                        onChange={(e) =>
                          setAssetForm({ ...assetForm, condition: e.target.value as AssetCondition })
                        }
                      >
                        <option>Good</option>
                        <option>Fair</option>
                        <option>Damaged</option>
                      </select>

                      <select
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        value={assetForm.status}
                        onChange={(e) =>
                          setAssetForm({ ...assetForm, status: e.target.value as AssetStatus })
                        }
                      >
                        <option>In Store</option>
                        <option>In Use</option>
                        <option>Under Repair</option>
                        <option>Damaged</option>
                        <option>Lost</option>
                        <option>Retired</option>
                      </select>

                      <label className="space-y-1">
                        <span className="text-xs font-medium text-slate-500">Purchase Date</span>
                        <input
                          type="date"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          value={assetForm.purchaseDate}
                          onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-medium text-slate-500">Warranty Expiry</span>
                        <input
                          type="date"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          value={assetForm.warrantyExpiry}
                          onChange={(e) => setAssetForm({ ...assetForm, warrantyExpiry: e.target.value })}
                        />
                      </label>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-4">
                    <div className="mb-4">
                      <h3 className="font-bold text-slate-900">Electrical / Solar Load Information</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Record the equipment nameplate details for the Admin Building solar project.
                        These values help document connected equipment, but they do not replace an electrician's measured load assessment.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-slate-600">Power Rating (W)</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm"
                          placeholder="e.g. 1500"
                          value={assetForm.powerRatingW}
                          onChange={(e) => setAssetForm({ ...assetForm, powerRatingW: e.target.value })}
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-medium text-slate-600">Voltage (V)</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm"
                          placeholder="Read from equipment label"
                          value={assetForm.voltageV}
                          onChange={(e) => setAssetForm({ ...assetForm, voltageV: e.target.value })}
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-medium text-slate-600">Electrical Phase</span>
                        <select
                          className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm"
                          value={assetForm.electricalPhase}
                          onChange={(e) => setAssetForm({ ...assetForm, electricalPhase: e.target.value })}
                        >
                          <option value="">Not recorded</option>
                          <option value="Single Phase">Single Phase</option>
                          <option value="Three Phase">Three Phase</option>
                          <option value="DC">DC</option>
                          <option value="Unknown">Unknown</option>
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-medium text-slate-600">Estimated Hours Used Per Day</span>
                        <input
                          type="number"
                          min="0"
                          max="24"
                          step="0.25"
                          className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm"
                          placeholder="e.g. 8"
                          value={assetForm.estimatedHoursPerDay}
                          onChange={(e) => setAssetForm({ ...assetForm, estimatedHoursPerDay: e.target.value })}
                        />
                      </label>

                      <label className="sm:col-span-2 flex items-start gap-3 rounded-2xl border border-amber-200 bg-white p-4">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          checked={assetForm.solarLoadRelevant}
                          onChange={(e) => setAssetForm({ ...assetForm, solarLoadRelevant: e.target.checked })}
                        />
                        <span>
                          <span className="block text-sm font-bold text-slate-800">Include in Admin Building solar load equipment report</span>
                          <span className="mt-1 block text-xs text-slate-500">Tick this for equipment that should appear in the report prepared for management / Comlek.</span>
                        </span>
                      </label>

                      <textarea
                        className="min-h-24 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm sm:col-span-2"
                        placeholder="Electrical notes — label details, aircon capacity, normal usage, shared outlet, etc."
                        value={assetForm.electricalNotes}
                        onChange={(e) => setAssetForm({ ...assetForm, electricalNotes: e.target.value })}
                      />
                    </div>
                  </section>

                  {isComputerAsset && (
                    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-4">
                        <h3 className="font-bold text-slate-900">Computer Specifications</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          These fields appear only for desktops, laptops and servers.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Operating System" value={assetForm.os} onChange={(e) => setAssetForm({ ...assetForm, os: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="RAM" value={assetForm.ram} onChange={(e) => setAssetForm({ ...assetForm, ram: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="System Type" value={assetForm.systemType} onChange={(e) => setAssetForm({ ...assetForm, systemType: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Microsoft Office" value={assetForm.msOffice} onChange={(e) => setAssetForm({ ...assetForm, msOffice: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Storage" value={assetForm.storage} onChange={(e) => setAssetForm({ ...assetForm, storage: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="CPU / Processor" value={assetForm.processor} onChange={(e) => setAssetForm({ ...assetForm, processor: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="GPU / Graphics" value={assetForm.gpu} onChange={(e) => setAssetForm({ ...assetForm, gpu: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Motherboard" value={assetForm.motherboard} onChange={(e) => setAssetForm({ ...assetForm, motherboard: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="BIOS Version" value={assetForm.biosVersion} onChange={(e) => setAssetForm({ ...assetForm, biosVersion: e.target.value })} />
                        <input type="date" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" value={assetForm.biosDate} onChange={(e) => setAssetForm({ ...assetForm, biosDate: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="TPM Status" value={assetForm.tpmStatus} onChange={(e) => setAssetForm({ ...assetForm, tpmStatus: e.target.value })} />
                      </div>
                    </section>
                  )}

                  {showsComputerAccessories && (
                    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-4">
                        <h3 className="font-bold text-slate-900">Included Accessories</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Record accessories issued with the computer.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Monitor" value={assetForm.monitor} onChange={(e) => setAssetForm({ ...assetForm, monitor: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Keyboard" value={assetForm.keyboard} onChange={(e) => setAssetForm({ ...assetForm, keyboard: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Mouse" value={assetForm.mouse} onChange={(e) => setAssetForm({ ...assetForm, mouse: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Charger / Power Adapter" value={assetForm.charger} onChange={(e) => setAssetForm({ ...assetForm, charger: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm sm:col-span-2" placeholder="Headset or other included accessory" value={assetForm.headset} onChange={(e) => setAssetForm({ ...assetForm, headset: e.target.value })} />
                      </div>
                    </section>
                  )}

                  {isNetworkAsset && (
                    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-4">
                        <h3 className="font-bold text-slate-900">Network Information</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Shown for computers and devices that may connect to the school network.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Connection Type" value={assetForm.connectionType} onChange={(e) => setAssetForm({ ...assetForm, connectionType: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Hostname / Device Name" value={assetForm.hostname} onChange={(e) => setAssetForm({ ...assetForm, hostname: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="IP Address" value={assetForm.ipAddress} onChange={(e) => setAssetForm({ ...assetForm, ipAddress: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="MAC Address" value={assetForm.macAddress} onChange={(e) => setAssetForm({ ...assetForm, macAddress: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm sm:col-span-2" placeholder="Online Status" value={assetForm.onlineStatus} onChange={(e) => setAssetForm({ ...assetForm, onlineStatus: e.target.value })} />
                      </div>
                    </section>
                  )}

                  {showsPerformanceChecks && (
                    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-4">
                        <h3 className="font-bold text-slate-900">Performance Check</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Record the current Windows and performance condition of the computer.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Windows Update Status" value={assetForm.windowsUpdate} onChange={(e) => setAssetForm({ ...assetForm, windowsUpdate: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Desktop Loading Speed" value={assetForm.desktopLoadingSpeed} onChange={(e) => setAssetForm({ ...assetForm, desktopLoadingSpeed: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Booting Speed" value={assetForm.bootingSpeed} onChange={(e) => setAssetForm({ ...assetForm, bootingSpeed: e.target.value })} />
                        <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Overall Performance" value={assetForm.performance} onChange={(e) => setAssetForm({ ...assetForm, performance: e.target.value })} />
                      </div>
                    </section>
                  )}

                  <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4">
                      <h3 className="font-bold text-slate-900">Device Photos</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Upload an overall view, an optional additional view and the asset or serial label. Enter the Asset Tag first.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      {([
                        ["front", "Overall Device", assetForm.photoFrontUrl],
                        ["back", "Additional Photo", assetForm.photoBackUrl],
                        ["label", "Asset / Serial Label", assetForm.photoLabelUrl],
                      ] as const).map(([slot, label, url]) => (
                        <div key={slot} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                            {url ? (
                              <img src={url} alt={label} className="h-full w-full object-cover" />
                            ) : (
                              <div className="grid h-full place-items-center px-3 text-center text-xs text-slate-400">
                                No {label.toLowerCase()} uploaded
                              </div>
                            )}
                          </div>

                          <p className="mt-3 text-sm font-semibold text-slate-800">{label}</p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <label className="cursor-pointer rounded-xl bg-cyan-700 px-3 py-2 text-xs font-semibold text-white">
                              {uploadingPhotoSlot === slot ? "Uploading..." : url ? "Replace" : "Upload"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingPhotoSlot !== null}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) void handleAssetPhotoUpload(file, slot);
                                  event.currentTarget.value = "";
                                }}
                              />
                            </label>

                            {url ? (
                              <button
                                type="button"
                                onClick={() => clearAssetPhoto(slot)}
                                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                              >
                                Remove
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <textarea
                    className="min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    placeholder={
                      isComputerAsset
                        ? "Notes"
                        : "Notes / specifications for this device (for example projector resolution, printer toner model, switch ports, UPS capacity or CCTV details)"
                    }
                    value={assetForm.notes}
                    onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                  />

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={savingAsset || uploadingPhotoSlot !== null}
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingAsset
                        ? "Saving..."
                        : activeDiscoveryMode === "update"
                          ? "Approve & Update Asset"
                          : activeDiscoveryMode === "create"
                            ? "Create Discovered Asset"
                            : editingAssetId
                              ? "Update Asset"
                              : "Save Asset"}
                    </button>

                    {editingAssetId ? (
                      <button
                        type="button"
                        onClick={resetAssetForm}
                        className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                      >
                        Cancel Edit
                      </button>
                    ) : null}
                  </div>
                </form>
              </div>
            )}

            {activeTab === "audit" && (
              <div id="tab-audit" className="scroll-mt-24 rounded-3xl bg-white p-5 shadow-sm">
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

      {printMode && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] max-w-4xl overflow-auto rounded-3xl bg-white p-8 shadow-2xl print:m-0 print:max-h-none print:max-w-none print:overflow-visible print:shadow-none">
            <div className="mb-8 border-b-2 border-slate-200 pb-6 print:mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">KOPKOP College</h1>
                  <p className="text-lg text-slate-600">ICT Asset Management System</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Device Specifications Report</p>
                  <p className="text-sm text-slate-500">Generated: {new Date().toLocaleString()}</p>
                  <p className="text-sm text-slate-500">By: {user?.email || 'System'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="rounded-2xl bg-slate-50 p-6">
                <h2 className="mb-4 text-xl font-bold text-slate-900">GENERAL INFORMATION</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><strong>Device Name:</strong> {selectedAsset.item_name}</div>
                  <div><strong>Asset ID:</strong> {selectedAsset.asset_tag}</div>
                  <div><strong>Device Type:</strong> {selectedAsset.category}</div>
                  <div><strong>Brand:</strong> {selectedAsset.brand || '-'}</div>
                  <div><strong>Model:</strong> {selectedAsset.model || '-'}</div>
                  <div><strong>Serial Number:</strong> {selectedAsset.serial_number || 'Not recorded'}</div>
                  <div><strong>Status:</strong> {selectedAsset.status || '-'}</div>
                  <div><strong>Assigned User:</strong> {selectedAsset.assigned_to || 'Unassigned'}</div>
                  <div><strong>Department:</strong> {selectedAsset.location?.split(' - ')[0] || '-'}</div>
                  <div><strong>Location:</strong> {selectedAsset.location?.split(' - ')[1] || selectedAsset.location || '-'}</div>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-6">
                <h2 className="mb-4 text-xl font-bold text-slate-900">TECHNICAL SPECIFICATIONS</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><strong>CPU / Processor:</strong> {selectedAsset.system_type || '-'}</div>
                  <div><strong>RAM:</strong> {selectedAsset.ram || '-'}</div>
                  <div><strong>Storage:</strong> {selectedAsset.storage || '-'}</div>
                  <div><strong>GPU:</strong> Not recorded</div>
                  <div><strong>Operating System:</strong> {selectedAsset.os || '-'}</div>
                  <div><strong>BIOS Version:</strong> Not recorded</div>
                  <div><strong>MAC Address:</strong> Not recorded</div>
                  <div><strong>IP Address:</strong> Not recorded</div>
                  <div><strong>Screen Size:</strong> {selectedAsset.monitor || '-'}</div>
                  <div><strong>Battery Health:</strong> Not recorded</div>
                  <div><strong>Ports / Connectivity:</strong> {selectedAsset.connection_type || '-'}</div>
                  <div><strong>Installed Software:</strong> {selectedAsset.ms_office || '-'}</div>
                  <div><strong>Peripheral Devices:</strong> {[
                    selectedAsset.keyboard && 'Keyboard',
                    selectedAsset.mouse && 'Mouse',
                    selectedAsset.charger && 'Charger',
                    selectedAsset.headset && 'Headset'
                  ].filter(Boolean).join(', ') || 'None recorded'}</div>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-6">
                <h2 className="mb-4 text-xl font-bold text-slate-900">PURCHASE & WARRANTY</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><strong>Purchase Date:</strong> {formatDate(selectedAsset.purchase_date)}</div>
                  <div><strong>Supplier:</strong> {selectedAsset.supplier || '-'}</div>
                  <div><strong>Warranty Start:</strong> {formatDate(selectedAsset.purchase_date)}</div>
                  <div><strong>Warranty End:</strong> {formatDate(selectedAsset.warranty_expiry)}</div>
                  <div><strong>Cost Price:</strong> Not recorded</div>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-6">
                <h2 className="mb-4 text-xl font-bold text-slate-900">PERFORMANCE & HEALTH</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><strong>Health Score:</strong> {selectedAsset.displayScore}%</div>
                  <div><strong>Performance:</strong> {selectedAsset.performance || '-'}</div>
                  <div><strong>Booting Speed:</strong> {selectedAsset.booting_speed || '-'}</div>
                  <div><strong>Desktop Loading Speed:</strong> {selectedAsset.desktop_loading_speed || '-'}</div>
                  <div><strong>Online Status:</strong> {selectedAsset.online_status || '-'}</div>
                  <div><strong>Windows Update:</strong> {selectedAsset.windows_update || '-'}</div>
                  <div><strong>Recommendation:</strong> {selectedAsset.recommendation}</div>
                  <div><strong>Alerts:</strong> {selectedAsset.alerts.join(', ') || 'None'}</div>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-6">
                <h2 className="mb-4 text-xl font-bold text-slate-900">AUDIT HISTORY</h2>
                {selectedAssetAudits.length === 0 ? (
                  <p className="text-slate-600">No audit records found for this device.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedAssetAudits.map((audit) => (
                      <div key={audit.id} className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="grid gap-2 md:grid-cols-2">
                          <div><strong>Date:</strong> {formatDate(audit.inspection_date)}</div>
                          <div><strong>Auditor:</strong> {audit.inspected_by}</div>
                          <div><strong>Status:</strong> {audit.final_status}</div>
                          <div><strong>Priority:</strong> {audit.priority_level || 'Low'}</div>
                          <div><strong>Health Score:</strong> {audit.health_score}%</div>
                          <div><strong>Issue Detected:</strong> {audit.issue_detected ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="mt-3">
                          <strong>Notes:</strong> {audit.remarks || 'No remarks recorded.'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-slate-50 p-6">
                <h2 className="mb-4 text-xl font-bold text-slate-900">MAINTENANCE HISTORY</h2>
                {selectedAssetMaintenance.length === 0 ? (
                  <p className="text-slate-600">No maintenance records found for this device.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedAssetMaintenance.map((record) => (
                      <div key={record.id} className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="grid gap-2 md:grid-cols-2">
                          <div><strong>Issue:</strong> {record.issue || 'Maintenance ticket'}</div>
                          <div><strong>Priority:</strong> {record.priority || 'Medium'}</div>
                          <div><strong>Status:</strong> {record.status || 'Open'}</div>
                          <div><strong>Technician:</strong> {record.technician || record.reported_by || 'Not assigned'}</div>
                          <div><strong>Date Reported:</strong> {formatDate(record.date_reported)}</div>
                          <div><strong>Repair Date:</strong> {formatDate(record.repair_date)}</div>
                        </div>
                        <div className="mt-3">
                          <strong>Action Taken:</strong> {record.action_taken || record.resolution_notes || record.notes || 'No details recorded.'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-slate-50 p-6">
                <h2 className="mb-4 text-xl font-bold text-slate-900">ADDITIONAL INFORMATION</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><strong>Notes:</strong></div>
                  <div className="md:col-span-2 whitespace-pre-wrap">{selectedAsset.notes || 'No additional notes recorded.'}</div>
                  <div><strong>Attachments:</strong> None</div>
                  <div><strong>QR Code:</strong> {selectedAsset.asset_tag}</div>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t-2 border-slate-200 pt-6 text-center text-sm text-slate-500 print:mt-6">
              <p>KOPKOP College ICT Asset Management System</p>
              <p>Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
              <p>Printed by: {user?.email || 'System User'}</p>
            </div>

            <div className="mt-6 flex justify-center gap-4 print:hidden">
              <button
                onClick={printSelectedAssetReport}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white"
              >
                Print One-Page Report
              </button>
              <button
                onClick={() => setPrintMode(false)}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => openMobileTab("scan")}
        className="fixed bottom-24 right-4 z-40 grid h-16 w-16 place-items-center rounded-full bg-cyan-700 text-2xl text-white shadow-2xl md:hidden print:hidden"
        aria-label="Open scanner"
      >
        📷
      </button>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur md:hidden print:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {[
            ["dashboard", "🏠", "Home"],
            ["scan", "📷", "Scan"],
            ["inventory", "📦", "Assets"],
            ["maintenance", "🛠️", "Repair"],
            ["audit", "✅", "Audit"],
          ].map(([key, icon, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => openMobileTab(key as typeof activeTab)}
              className={`rounded-2xl px-2 py-2 text-center text-[11px] font-bold ${
                activeTab === key ? "bg-slate-900 text-white" : "text-slate-600"
              }`}
            >
              <span className="block text-xl leading-none">{icon}</span>
              <span className="mt-1 block">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
