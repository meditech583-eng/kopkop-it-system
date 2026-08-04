"use client";

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

type ComponentRecord = {
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

type ComponentManagerProps = {
  assetTag: string;
  components: ComponentRecord[];
  isAdmin: boolean;

  onAddComponent: () => void;
  onEditComponent: (component: ComponentRecord) => void;
  onReplaceComponent: (component: ComponentRecord) => void;
  onDeleteComponent: (component: ComponentRecord) => void;

  deletingComponentId?: number | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return date.toLocaleDateString();
}

function statusClass(status?: string | null) {
  switch ((status || "").toLowerCase()) {
    case "installed":
      return "bg-emerald-100 text-emerald-700";

    case "in store":
      return "bg-blue-100 text-blue-700";

    case "removed":
    case "replaced":
      return "bg-slate-100 text-slate-700";

    case "faulty":
    case "damaged":
    case "disposed":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function ComponentManager({
  assetTag,
  components,
  isAdmin,
  onAddComponent,
  onEditComponent,
  onReplaceComponent,
  onDeleteComponent,
  deletingComponentId = null,
}: ComponentManagerProps) {
  const installedComponents = components.filter(
    (component) => component.status === "Installed"
  );

  const inactiveComponents = components.filter(
    (component) => component.status !== "Installed"
  );

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Device Components
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Hardware components installed in {assetTag}, including replacement
            and removal status.
          </p>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={onAddComponent}
            className="rounded-2xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-800"
          >
            + Add Component
          </button>
        ) : null}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total Components
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {components.length}
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Installed
          </p>

          <p className="mt-2 text-2xl font-bold text-emerald-800">
            {installedComponents.length}
          </p>
        </div>

        <div className="rounded-2xl bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Removed or Inactive
          </p>

          <p className="mt-2 text-2xl font-bold text-amber-800">
            {inactiveComponents.length}
          </p>
        </div>
      </div>

      {components.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="font-semibold text-slate-800">
            No components recorded
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Add RAM, storage, processors, power supplies, batteries, network
            cards or other internal hardware.
          </p>

          {isAdmin ? (
            <button
              type="button"
              onClick={onAddComponent}
              className="mt-4 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Add First Component
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {components.map((component) => (
            <article
              key={component.id}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900">
                      {component.component_type}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        component.status
                      )}`}
                    >
                      {component.status}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        component.condition
                      )}`}
                    >
                      {component.condition || "Condition not recorded"}
                    </span>
                  </div>

                  <p className="mt-2 text-lg font-semibold text-slate-800">
                    {component.component_name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {[component.brand, component.model]
                      .filter(Boolean)
                      .join(" ") || "Brand and model not recorded"}
                  </p>

                  {component.specification ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                      {component.specification}
                    </p>
                  ) : null}

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Serial Number
                      </p>

                      <p className="mt-1 text-slate-700">
                        {component.serial_number || "Not recorded"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Quantity
                      </p>

                      <p className="mt-1 text-slate-700">
                        {component.quantity}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Installed Date
                      </p>

                      <p className="mt-1 text-slate-700">
                        {formatDate(component.installed_date)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Installed By
                      </p>

                      <p className="mt-1 text-slate-700">
                        {component.installed_by || "Not recorded"}
                      </p>
                    </div>
                  </div>

                  {component.notes ? (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Notes
                      </p>

                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                        {component.notes}
                      </p>
                    </div>
                  ) : null}
                </div>

                {isAdmin ? (
                  <div className="flex flex-wrap gap-2 lg:w-44 lg:flex-col">
                    <button
                      type="button"
                      onClick={() => onEditComponent(component)}
                      className="rounded-xl bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                    >
                      Edit
                    </button>

                    {component.status === "Installed" ? (
                      <button
                        type="button"
                        onClick={() => onReplaceComponent(component)}
                        className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                      >
                        Replace
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => onDeleteComponent(component)}
                      disabled={deletingComponentId === component.id}
                      className="rounded-xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingComponentId === component.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export type { ComponentRecord };