"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Ticket = {
  id: string;
  ticket_number: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  reported_by: string | null;
  department: string | null;
  room: string | null;
  created_at: string;
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);

    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setTickets(data ?? []);
    setLoading(false);
  }

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            IT Help Desk
          </h1>

          <p className="text-gray-500">
            Manage and track IT support tickets.
          </p>
        </div>

        <Link
          href="/"
          className="rounded-lg bg-slate-800 px-4 py-2 text-white"
        >
          Back
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border p-4">
          <p className="text-gray-500">Total Tickets</p>
          <h2 className="text-3xl font-bold">
            {tickets.length}
          </h2>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-gray-500">New</p>
          <h2 className="text-3xl font-bold">
            {tickets.filter(t => t.status === "New").length}
          </h2>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-gray-500">In Progress</p>
          <h2 className="text-3xl font-bold">
            {tickets.filter(t => t.status === "In Progress").length}
          </h2>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-gray-500">Critical</p>
          <h2 className="text-3xl font-bold">
            {tickets.filter(t => t.priority === "Critical").length}
          </h2>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-bold text-lg">
            Ticket Queue
          </h2>

          <button
            onClick={loadTickets}
            className="rounded-lg border px-4 py-2"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            Loading...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="text-xl font-bold">
              No tickets yet
            </h3>

            <p className="text-gray-500 mt-2">
              Your Help Desk is ready.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Ticket</th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Priority</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Reported By</th>
              </tr>
            </thead>

            <tbody>
              {tickets.map(ticket => (
                <tr
                  key={ticket.id}
                  className="border-t"
                >
                  <td className="p-3">
                    {ticket.ticket_number}
                  </td>

                  <td className="p-3">
                    {ticket.title}
                  </td>

                  <td className="p-3">
                    {ticket.category}
                  </td>

                  <td className="p-3">
                    {ticket.priority}
                  </td>

                  <td className="p-3">
                    {ticket.status}
                  </td>

                  <td className="p-3">
                    {ticket.reported_by}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}