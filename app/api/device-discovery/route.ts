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
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "KOPKOP Device Discovery API is online.",
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

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "Collector payload is too large." },
        { status: 413 }
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
    const collectorVersion = safeText(payload.collector?.version, 50);

    if (!hostname && !serialNumber && !macAddress) {
      return NextResponse.json(
        { ok: false, error: "The device has no usable identity information." },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    const { data, error } = await supabase
      .from("device_discovery_queue")
      .insert({
        collector_version: collectorVersion || null,
        hostname: hostname || null,
        serial_number: serialNumber || null,
        mac_address: macAddress || null,
        payload,
        status: "pending",
      })
      .select("id, hostname, serial_number, received_at")
      .single();

    if (error) {
      console.error("Device discovery insert failed:", error);
      return NextResponse.json(
        { ok: false, error: "Could not store device information." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Device information received.",
      discovery: data,
    });
  } catch (error) {
    console.error("Device discovery API error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected device discovery error.",
      },
      { status: 500 }
    );
  }
}
