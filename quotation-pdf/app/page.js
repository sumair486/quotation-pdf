"use client";

import { useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);
const emptyRow = () => ({ id: Math.random().toString(36).slice(2), description: "", amount: "" });

// Payment details people can pick from. Add or edit entries here.
const PAYMENT_OPTIONS = ["1652820951004262/MCB/umair shah", "Cash", "Cheque"];

const initial = {
  type: "invoice",
  number: "",
  date: today(),
  billTo: "",
  customer: "",
  address: "",
  project: "",
  rows: [emptyRow()],
  payDetails: "",
  paidDate: "",
  paidAmount: "",
};

const input =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-[15px] placeholder:text-slate-400";

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, hint, children }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function Home() {
  const [f, setF] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const setRow = (id, k, v) =>
    setF((p) => ({ ...p, rows: p.rows.map((r) => (r.id === id ? { ...r, [k]: v } : r)) }));
  const addRow = () => setF((p) => ({ ...p, rows: [...p.rows, emptyRow()] }));
  const removeRow = (id) =>
    setF((p) => ({ ...p, rows: p.rows.length > 1 ? p.rows.filter((r) => r.id !== id) : p.rows }));

  const isQuote = f.type === "quotation";
  const total = f.rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const money = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

  async function download() {
    setError("");
    const isQuote = f.type === "quotation";
    if (!f.customer.trim()) return setError("Enter the customer name.");
    if (!f.rows.some((r) => r.description.trim()))
      return setError("Add at least one work description.");

    setBusy(true);
    try {
      const [{ pdf }, { default: InvoicePDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../components/QuotationPDF"),
      ]);
      const bg = `${window.location.origin}/${isQuote ? "quotation" : "invoice"}-bg.jpg`;
      const blob = await pdf(<InvoicePDF data={f} bg={bg} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${isQuote ? "Quotation" : "Invoice"}-${(f.number || f.customer).replace(/[^a-z0-9]+/gi, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      console.error(e);
      setError("Could not create the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-32 pt-8 sm:pt-12">
      <header className="mb-6 flex items-center gap-4">
        <div className="h-12 w-12 shrink-0 bg-[#ffe34d] p-1">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <path d="M8 0h26l16 33L66 0h26L62 50l30 50H66L50 67 34 100H8l30-50z" fill="#1c1a17" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">X imaging</h1>
          <p className="text-slate-600">Choose the type, fill in the details and download the PDF.</p>
        </div>
      </header>

      <div className="space-y-5">
        <Section title="Document details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" className="sm:col-span-2">
              <div className="grid grid-cols-2 gap-2">
                {[["invoice", "Invoice"], ["quotation", "Quotation"]].map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setF((p) => ({ ...p, type: v }))}
                    aria-pressed={f.type === v}
                    className={`rounded-md border px-4 py-2.5 text-[15px] font-semibold ${
                      f.type === v
                        ? "border-accent bg-accent text-white"
                        : "border-line bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={isQuote ? "Quotation number" : "Invoice number"}>
              <input className={input} value={f.number} onChange={set("number")} placeholder="001" />
            </Field>
            <Field label="Date">
              <input type="date" className={input} value={f.date} onChange={set("date")} />
            </Field>
            <Field label="Bill to (optional)" className="sm:col-span-2">
              <input className={input} value={f.billTo} onChange={set("billTo")} placeholder="Department or contact person" />
            </Field>
            <Field label="Customer" className="sm:col-span-2">
              <input className={input} value={f.customer} onChange={set("customer")} placeholder="Hospital or client name" />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <input className={input} maxLength={150} value={f.address} onChange={set("address")} />
            </Field>
            <Field label="Project" className="sm:col-span-2">
              <input className={input} value={f.project} onChange={set("project")} placeholder="e.g. X-ray machine servicing" />
            </Field>
          </div>
        </Section>

        <Section title="Work items">
          <div className="space-y-3">
            {f.rows.map((r, i) => (
              <div key={r.id} className="grid grid-cols-[2rem_1fr_auto] items-start gap-2 sm:grid-cols-[2rem_1fr_9rem_auto]">
                <div className="pt-2.5 text-center text-sm font-medium text-slate-500">{i + 1}</div>
                <textarea
                  rows={2}
                  className={`${input} resize-y`}
                  placeholder="Description"
                  value={r.description}
                  onChange={(e) => setRow(r.id, "description", e.target.value)}
                />
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  className={`${input} col-start-2 sm:col-start-auto`}
                  placeholder="Total"
                  value={r.amount}
                  onChange={(e) => setRow(r.id, "amount", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeRow(r.id)}
                  disabled={f.rows.length === 1}
                  aria-label={`Remove item ${i + 1}`}
                  className="row-start-1 col-start-3 rounded-md border border-line px-2.5 py-2 text-slate-500 hover:bg-slate-50 hover:text-red-600 disabled:opacity-30 sm:row-start-auto sm:col-start-auto"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRow}
            className="mt-4 rounded-md border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent hover:text-white"
          >
            Add item
          </button>
        </Section>

        {!isQuote && (
          <Section title="Payment" hint="Optional. Fill in only if payment is already received.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Details">
                <select className={input} value={f.payDetails} onChange={set("payDetails")}>
                  <option value="">Select…</option>
                  {PAYMENT_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Paid date">
                <input type="date" className={input} value={f.paidDate} onChange={set("paidDate")} />
              </Field>
              <Field label="Amount paid">
                <input type="number" inputMode="decimal" min="0" className={input} value={f.paidAmount} onChange={set("paidAmount")} />
              </Field>
            </div>
          </Section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <div className="text-xs text-slate-500">Total</div>
            <div className="text-xl font-bold">
              Rs. {money(total)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {error && <p className="hidden max-w-[16rem] text-sm text-red-600 sm:block">{error}</p>}
            <button
              type="button"
              onClick={download}
              disabled={busy}
              className="rounded-md bg-accent px-5 py-2.5 font-semibold text-white hover:bg-[#173d5f] disabled:opacity-60"
            >
              {busy ? "Creating PDF…" : "Download PDF"}
            </button>
          </div>
        </div>
        {error && <p className="px-4 pb-3 text-sm text-red-600 sm:hidden">{error}</p>}
      </div>
    </main>
  );
}
