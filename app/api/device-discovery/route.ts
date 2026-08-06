import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server environment variables are missing.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function safeText(value: unknown, maxLength = 500) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeMac(value: unknown) {
  return safeText(value, 100).replace(/[^a-f0-9]/gi, "").toLowerCase();
}

function friendlyStorage(payload: any) {
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
  const officeProducts = payload?.software?.office_products || [];

  const officeProduct = Array.isArray(officeProducts) ? officeProducts[0] : null;
  const officeStatus =
    Number(officeProduct?.LicenseStatus) === 1
      ? "Activated"
      : officeProduct
        ? "Licence attention required"
        : "";

  return {
    brand: safeText(device.manufacturer),
    model: safeText(device.model),
    serial_number: safeText(device.serial_number),
    os: [os.caption, os.architecture, os.build_number ? `Build ${os.build_number}` : ""]
      .filter(Boolean)
      .join(" - "),
    ram: memory.total_ram_gb != null ? `${memory.total_ram_gb} GB` : "",
    system_type: safeText(device.system_type || os.architecture),
    connection_type: safeText(network.interface || network.adapter_name),
    ms_office: officeProduct
      ? ["Microsoft Office", officeStatus].filter(Boolean).join(" - ")
      : "",
    storage: friendlyStorage(payload),
    processor: safeText(processor.name),
    motherboard: [motherboard.manufacturer, motherboard.product, motherboard.version]
      .filter(Boolean)
      .join(" "),
    bios_version: safeText(bios.version),
    bios_date: safeText(bios.release_date),
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
    hostname: safeText(device.computer_name),
    ip_address: safeText(network.ipv4_address),
    mac_address: safeText(network.mac_address),
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    version: "4.0",
    message: "KOPKOP Live Asset Intelligence API is online.",
  });
}

export async function POST(request: NextRequest) {
  try {
    const expectedKey = process.env.COLLECTOR_API_KEY;
    const suppliedKey = request.headers.get("x-collector-key") || "";

    if (!expectedKey) {
      return NextResponse.json(
        { ok: false, error: "Collector API is not configured." },
        { status: 503 }
      );
    }

    if (!suppliedKey || suppliedKey !== expectedKey) {
      return NextResponse.json(
        { ok: false, error: "Collector authentication failed." },
        { status: 401 }
      );
    }

    const payload = await request.json();

    if (
      payload?.collector?.name !== "KOPKOP Device Information Collector" ||
      !payload?.device
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid KOPKOP collector payload." },
        { status: 400 }
      );
    }

    const hostname = safeText(payload.device.computer_name, 200);
    const serialNumber = safeText(payload.device.serial_number, 200);
    const macAddress = safeText(payload.network?.mac_address, 100);
    const normalizedMac = normalizeMac(macAddress);
    const collectorVersion = safeText(payload.collector?.version, 50);
    const now = new Date().toISOString();

    if (!hostname && !serialNumber && !macAddress) {
      return NextResponse.json(
        { ok: false, error: "The device has no usable identity information." },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    let matchedAsset: any = null;

    if (serialNumber) {
      const { data } = await supabase
        .from("it_assets")
        .select("*")
        .ilike("serial_number", serialNumber)
        .limit(1)
        .maybeSingle();

      matchedAsset = data;
    }

    if (!matchedAsset && hostname) {
      const { data } = await supabase
        .from("it_assets")
        .select("*")
        .ilike("hostname", hostname)
        .limit(1)
        .maybeSingle();

      matchedAsset = data;
    }

    if (!matchedAsset && normalizedMac) {
      const { data: candidates } = await supabase
        .from("it_assets")
        .select("*")
        .not("mac_address", "is", null);

      matchedAsset =
        (candidates || []).find(
          (asset) => normalizeMac(asset.mac_address) === normalizedMac
        ) || null;
    }

    // Supersede older pending entries for the same device.
    let pendingQuery = supabase
      .from("device_discovery_queue")
      .update({ status: "superseded" })
      .eq("status", "pending");

    if (serialNumber) {
      pendingQuery = pendingQuery.ilike("serial_number", serialNumber);
    } else if (hostname) {
      pendingQuery = pendingQuery.ilike("hostname", hostname);
    } else {
      pendingQuery = pendingQuery.eq("mac_address", macAddress);
    }

    await pendingQuery;

    if (!matchedAsset) {
      const { data: discovery, error } = await supabase
        .from("device_discovery_queue")
        .insert({
          collector_version: collectorVersion || null,
          hostname: hostname || null,
          serial_number: serialNumber || null,
          mac_address: macAddress || null,
          payload,
          status: "pending",
          discovery_type: "new_asset",
          matched_asset_id: null,
        })
        .select("*")
        .single();

      if (error) throw error;

      return NextResponse.json({
        ok: true,
        auto_updated: false,
        message: "New device detected. Registration is waiting in Discovery Center.",
        discovery,
        match: { found: false },
      });
    }

    const collected = collectedTechnicalValues(payload);

    const monitoredFields = [
      ["RAM", matchedAsset.ram, collected.ram],
      ["Storage", matchedAsset.storage, collected.storage],
      ["BIOS Version", matchedAsset.bios_version, collected.bios_version],
      ["Windows / OS", matchedAsset.os, collected.os],
      ["Processor", matchedAsset.processor, collected.processor],
      ["Motherboard", matchedAsset.motherboard, collected.motherboard],
      ["IP Address", matchedAsset.ip_address, collected.ip_address],
    ];

    const changes = monitoredFields
      .map(([fieldName, oldValue, newValue]) => ({
        field_name: String(fieldName),
        old_value: safeText(oldValue),
        new_value: safeText(newValue),
      }))
      .filter(
        (change) =>
          change.new_value &&
          change.old_value.toLowerCase() !== change.new_value.toLowerCase()
      );

    const updatePayload = Object.fromEntries(
      Object.entries(collected).filter(([, value]) => safeText(value))
    );

    const { error: assetUpdateError } = await supabase
      .from("it_assets")
      .update({
        ...updatePayload,
        online_status: "Online",
        last_seen_at: now,
      })
      .eq("id", matchedAsset.id);

    if (assetUpdateError) throw assetUpdateError;

    const { data: discovery, error: discoveryError } = await supabase
      .from("device_discovery_queue")
      .insert({
        collector_version: collectorVersion || null,
        hostname: hostname || null,
        serial_number: serialNumber || null,
        mac_address: macAddress || null,
        payload,
        status: "imported",
        discovery_type: "existing_asset",
        matched_asset_id: matchedAsset.id,
        imported_at: now,
      })
      .select("*")
      .single();

    if (discoveryError) throw discoveryError;

    const { data: scan, error: scanError } = await supabase
      .from("device_scan_history")
      .insert({
        asset_id: matchedAsset.id,
        discovery_id: discovery.id,
        hostname: collected.hostname || hostname || null,
        serial_number: collected.serial_number || serialNumber || null,
        ip_address: collected.ip_address || null,
        mac_address: collected.mac_address || macAddress || null,
        scanned_at: now,
        scan_source: "KOPKOP PowerShell Collector",
        snapshot: payload,
      })
      .select("id")
      .single();

    if (scanError) throw scanError;

    await supabase
      .from("it_assets")
      .update({ last_scan_id: scan.id })
      .eq("id", matchedAsset.id);

    if (changes.length > 0) {
      const { error: changeError } = await supabase
        .from("asset_hardware_changes")
        .insert(
          changes.map((change) => ({
            asset_id: matchedAsset.id,
            discovery_id: discovery.id,
            field_name: change.field_name,
            old_value: change.old_value || null,
            new_value: change.new_value || null,
            changed_at: now,
          }))
        );

      if (changeError) throw changeError;
    }

    return NextResponse.json({
      ok: true,
      auto_updated: true,
      message:
        changes.length > 0
          ? `Existing asset updated automatically. ${changes.length} change(s) recorded.`
          : "Existing asset checked in successfully. No technical changes detected.",
      discovery,
      match: {
        found: true,
        asset_id: matchedAsset.id,
        asset_tag: matchedAsset.asset_tag,
        item_name: matchedAsset.item_name,
      },
      changes,
    });
  } catch (error) {
    console.error("Live Asset Intelligence API error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected live asset intelligence error.",
      },
      { status: 500 }
    );
  }
}
