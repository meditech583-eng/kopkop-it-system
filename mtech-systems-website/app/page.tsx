export default function MTechSystemsWebsite() {
  const packages = [
    {
      name: "Basic",
      price: "K2,500",
      desc: "For small schools and offices starting with digital asset tracking.",
      features: ["Asset inventory", "QR code labels", "Assigned user tracking", "Simple dashboard"],
      highlight: false,
    },
    {
      name: "Professional",
      price: "K5,000",
      desc: "Best for schools that need monitoring, audits, and maintenance control.",
      features: ["Everything in Basic", "Device health scoring", "Audit system", "Maintenance tracking", "PDF reports"],
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "K8,000 – K12,000",
      desc: "For larger organisations needing scale, branding, and tighter control.",
      features: ["Everything in Professional", "Multi-branch support", "User roles", "Custom branding", "Priority support"],
      highlight: false,
    },
  ];

  const features = [
    {
      title: "Smart Asset Tracking",
      text: "Track desktops, laptops, printers, and equipment with clean digital records and QR labels.",
    },
    {
      title: "Device Health Monitoring",
      text: "See which devices are healthy, slow, outdated, or critical before they become bigger problems.",
    },
    {
      title: "Audit & Compliance",
      text: "Run structured IT inspections and keep a proper record of device checks and findings.",
    },
    {
      title: "Maintenance Automation",
      text: "Automatically flag critical devices and manage repairs from one central dashboard.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-white/5 px-4 py-2 text-sm text-cyan-300 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/15 font-bold text-cyan-300">M</div>
                <span>MTECH Systems</span>
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                From Inventory to Intelligence.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                MTECH Systems helps schools and organisations track IT assets, monitor device health, and automate maintenance with one clean digital platform.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#packages"
                  className="rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02]"
                >
                  View Packages
                </a>
                <a
                  href="#contact"
                  className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Contact MTECH
                </a>
              </div>
              <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold text-cyan-300">QR</div>
                  <p className="mt-1 text-sm text-slate-300">Label & scan assets fast</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold text-cyan-300">Live</div>
                  <p className="mt-1 text-sm text-slate-300">Cloud-based monitoring</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold text-cyan-300">Auto</div>
                  <p className="mt-1 text-sm text-slate-300">Maintenance triggers</p>
                </div>
              </div>
            </div>

            <div className="lg:pl-8">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
                <div className="rounded-[24px] bg-slate-900 p-5 shadow-inner shadow-black/20">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Dashboard Preview</p>
                      <h3 className="mt-2 text-xl font-bold">MTECH IT Asset System</h3>
                    </div>
                    <div className="rounded-2xl bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300">System Online</div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-800/70 p-4">
                      <p className="text-sm text-slate-400">Total Assets</p>
                      <p className="mt-2 text-3xl font-black">248</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-800/70 p-4">
                      <p className="text-sm text-slate-400">Average Health</p>
                      <p className="mt-2 text-3xl font-black">82%</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-800/70 p-4">
                      <p className="text-sm text-slate-400">Open Maintenance</p>
                      <p className="mt-2 text-3xl font-black">09</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-800/70 p-4">
                      <p className="text-sm text-slate-400">Critical Devices</p>
                      <p className="mt-2 text-3xl font-black text-red-400">04</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-slate-800/70 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">KC-LT-014</p>
                        <p className="text-xs text-slate-400">Lenovo Laptop • SOLI Office</p>
                      </div>
                      <div className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">Needs Upgrade</div>
                    </div>
                    <div className="mt-4 h-3 rounded-full bg-slate-700">
                      <div className="h-3 w-[62%] rounded-full bg-cyan-400" />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Health score 62% • Maintenance recommended</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Why MTECH</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Built for real schools and organisations</h2>
          <p className="mt-4 text-slate-300">
            MTECH Systems gives you visibility over your IT equipment, reduces manual tracking, and helps your team respond faster to device issues.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-[24px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-lg font-bold text-cyan-300">
                M
              </div>
              <h3 className="mt-5 text-xl font-bold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="packages" className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Packages</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Simple pricing for PNG clients</h2>
            <p className="mt-4 text-slate-300">Choose a setup that matches the size and needs of the organisation.</p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`rounded-[28px] border p-7 shadow-xl ${
                  pkg.highlight
                    ? "border-cyan-400/40 bg-cyan-500/10 shadow-cyan-500/10"
                    : "border-white/10 bg-slate-900/70"
                }`}
              >
                {pkg.highlight && (
                  <div className="mb-4 inline-flex rounded-full bg-cyan-400 px-3 py-1 text-xs font-bold text-slate-950">
                    BEST VALUE
                  </div>
                )}
                <h3 className="text-2xl font-black">{pkg.name}</h3>
                <p className="mt-3 text-4xl font-black text-cyan-300">{pkg.price}</p>
                <p className="mt-4 text-sm leading-7 text-slate-300">{pkg.desc}</p>
                <div className="mt-6 space-y-3">
                  {pkg.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 text-sm text-slate-200">
                      <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/15 text-xs text-cyan-300">✓</div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[24px] border border-white/10 bg-slate-900/60 p-6 text-center">
            <p className="text-sm text-slate-300">Monthly hosting and support available</p>
            <p className="mt-2 text-2xl font-black text-white">K150 – K300 / month</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Who it is for</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">A strong fit for schools, SMEs, clinics, and growing organisations</h2>
            <p className="mt-5 text-slate-300">
              Whether you are managing classrooms, office devices, pharmacy computers, or branch equipment, MTECH helps you keep better control and make faster decisions.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Schools & colleges",
              "SMEs & offices",
              "Clinics & health centres",
              "Multi-site organisations",
            ].map((item) => (
              <div key={item} className="rounded-[24px] border border-white/10 bg-white/5 p-6 text-lg font-semibold text-slate-100">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-white/10 bg-gradient-to-r from-cyan-500/10 via-slate-950 to-blue-500/10">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur lg:p-10">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Get started</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Modernize your IT operations with MTECH Systems</h2>
                <p className="mt-4 max-w-xl text-slate-300">
                  Ready to track your assets, reduce equipment loss, and improve device management? Contact MTECH Systems for a demo and setup.
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6">
                <div className="space-y-4 text-sm text-slate-200">
                  <div>
                    <p className="text-slate-400">Business Name</p>
                    <p className="mt-1 text-base font-semibold text-white">MTECH Systems</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Service</p>
                    <p className="mt-1 text-base font-semibold text-white">IT Asset & Automation Solutions</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Call to Action</p>
                    <p className="mt-1 text-base font-semibold text-white">Book a demo or request a custom setup</p>
                  </div>
                  <a
                    href="#"
                    className="mt-2 inline-flex rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.02]"
                  >
                    Contact on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
