"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type TicketForm = {
  title: string;
  description: string;
  category: string;
  priority: string;
  urgency: string;
  building: string;
  department: string;
  room: string;
  location: string;
  reportedBy: string;
  assignedTo: string;
  deviceName: string;
  assetTag: string;
};

const EMPTY_FORM: TicketForm = {
  title: "",
  description: "",
  category: "Projector",
  priority: "Medium",
  urgency: "Normal",
  building: "",
  department: "",
  room: "",
  location: "",
  reportedBy: "",
  assignedTo: "",
  deviceName: "",
  assetTag: "",
};

export default function NewTicketPage() {
  const router = useRouter();

  const [form, setForm] = useState<TicketForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function updateField(field: keyof TicketForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function generateTicketNumber() {
    const year = new Date().getFullYear();

    const { data, error } = await supabase
      .from("tickets")
      .select("ticket_number")
      .like("ticket_number", `INC-${year}-%`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    const latestTicketNumber = data?.[0]?.ticket_number;

    if (!latestTicketNumber) {
      return `INC-${year}-0001`;
    }

    const latestSequence = Number(
      latestTicketNumber.split("-").pop()
    );

    const nextSequence = Number.isFinite(latestSequence)
      ? latestSequence + 1
      : 1;

    return `INC-${year}-${String(nextSequence).padStart(4, "0")}`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      setErrorMessage("Please enter the ticket title.");
      return;
    }

    if (!form.description.trim()) {
      setErrorMessage("Please describe the issue.");
      return;
    }

    if (!form.reportedBy.trim()) {
      setErrorMessage("Please enter the name of the person reporting the issue.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const ticketNumber = await generateTicketNumber();

      const { error } = await supabase.from("tickets").insert({
        ticket_number: ticketNumber,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
        urgency: form.urgency,
        status: "New",
        building: form.building.trim() || null,
        department: form.department.trim() || null,
        room: form.room.trim() || null,
        location: form.location.trim() || null,
        reported_by: form.reportedBy.trim(),
        assigned_to: form.assignedTo.trim() || null,
        device_name: form.deviceName.trim() || null,
        asset_tag: form.assetTag.trim() || null,
      });

      if (error) {
        throw error;
      }

      router.push("/tickets");
      router.refresh();
    } catch (error: unknown) {
      console.error("Supabase Error:", error);

      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message ?? "Failed to create the ticket.")
          : "Failed to create the ticket.";

      setErrorMessage(message);
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/tickets"
            className="text-sm font-semibold text-cyan-700 hover:underline"
          >
            ← Back to Help Desk
          </Link>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Create New Ticket
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Report an IT issue and send it to the Help Desk queue.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          {errorMessage ? (
            <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <section>
            <h2 className="text-lg font-bold text-slate-900">
              Issue Details
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Ticket Title *
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    updateField("title", event.target.value)
                  }
                  placeholder="Example: Projector not displaying"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Category
                </label>

                <select
                  value={form.category}
                  onChange={(event) =>
                    updateField("category", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
                >
                  <option>Projector</option>
                  <option>Desktop</option>
                  <option>Laptop</option>
                  <option>Printer</option>
                  <option>Network</option>
                  <option>Internet</option>
                  <option>Software</option>
                  <option>Email</option>
                  <option>Accounts</option>
                  <option>Phone</option>
                  <option>UPS</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Priority
                </label>

                <select
                  value={form.priority}
                  onChange={(event) =>
                    updateField("priority", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Urgency
                </label>

                <select
                  value={form.urgency}
                  onChange={(event) =>
                    updateField("urgency", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
                >
                  <option>Normal</option>
                  <option>Urgent</option>
                  <option>Immediate</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Reported By *
                </label>

                <input
                  type="text"
                  value={form.reportedBy}
                  onChange={(event) =>
                    updateField("reportedBy", event.target.value)
                  }
                  placeholder="Example: Mr Raka"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description *
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  rows={5}
                  placeholder="Describe the fault, when it started and what has already been checked."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
                />
              </div>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h2 className="text-lg font-bold text-slate-900">
              Location
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Building
                </label>

                <input
                  type="text"
                  value={form.building}
                  onChange={(event) =>
                    updateField("building", event.target.value)
                  }
                  placeholder="Example: Secondary"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Department
                </label>

                <input
                  type="text"
                  value={form.department}
                  onChange={(event) =>
                    updateField("department", event.target.value)
                  }
                  placeholder="Example: LSS"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Room
                </label>

                <input
                  type="text"
                  value={form.room}
                  onChange={(event) =>
                    updateField("room", event.target.value)
                  }
                  placeholder="Example: D22"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Specific Location
                </label>

                <input
                  type="text"
                  value={form.location}
                  onChange={(event) =>
                    updateField("location", event.target.value)
                  }
                  placeholder="Example: Front wall"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
                />
              </div>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h2 className="text-lg font-bold text-slate-900">
              Device and Assignment
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Device Name
                </label>

                <input
                  type="text"
                  value={form.deviceName}
                  onChange={(event) =>
                    updateField("deviceName", event.target.value)
                  }
                  placeholder="Example: Epson Projector"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Asset Tag
                </label>

                <input
                  type="text"
                  value={form.assetTag}
                  onChange={(event) =>
                    updateField("assetTag", event.target.value)
                  }
                  placeholder="Example: KC-SPC-009"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Assign Technician
                </label>

                <input
                  type="text"
                  value={form.assignedTo}
                  onChange={(event) =>
                    updateField("assignedTo", event.target.value)
                  }
                  placeholder="Example: Angelo Kimui"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/tickets"
              className="rounded-2xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating Ticket..." : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}