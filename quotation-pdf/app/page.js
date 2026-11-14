"use client";

import { useEffect, useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);
const emptyRow = () => ({ id: Math.random().toString(36).slice(2), description: "", amount: "" });

const SAVED_KEYS = ["companyName", "companyAddress", "companyContact", "signatory", "currency"];

const initial = {
  companyName: "",
  companyAddress: "",
  companyContact: "",
  signatory: "",
  currency: "Rs.",
  number: "",
  date: today(),
  toName: "",
  toAddress: "",
  subject: "",
  notes: "",
  rows: [emptyRow()],
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

  // Remember company details on this device
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("quotation-company") || "{}");
      setF((p) => ({ ...p, ...saved }));
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      const toSave = {};
      SAVED_KEYS.forEach((k) => (toSave[k] = f[k]));
      localStorage.setItem("quotation-company", JSON.stringify(toSave));
    } catch (e) {}
  }, [f.companyName, f.companyAddress, f.companyContact, f.signatory, f.currency]);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const setRow = (id, k, v) =>
    setF((p) => ({ ...p, rows: p.rows.map((r) => (r.id === id ? { ...r, [k]: v } : r)) }));
  const addRow = () => setF((p) => ({ ...p, rows: [...p.rows, emptyRow()] }));
  const removeRow = (id) =>
    setF((p) => ({ ...p, rows: p.rows.length > 1 ? p.rows.filter((r) => r.id !== id) : p.rows }));

  const total = f.rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const money = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

  async function download() {
    setError("");
    if (!f.toName.trim()) return setError("Enter who the quotation is addressed to.");
    if (!f.rows.some((r) => r.description.trim()))
      return setError("Add at least one work description.");

    setBusy(true);
    try {
      const [{ pdf }, { default: QuotationPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../components/QuotationPDF"),
      ]);
      const blob = await pdf(<QuotationPDF data={f} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Quotation-${(f.number || f.toName).replace(/[^a-z0-9]+/gi, "-")}.pdf`;
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
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Quotation Maker</h1>
        <p className="mt-1 text-slate-600">Fill in the details, then download a ready-to-send PDF.</p>
      </header>

      <div className="space-y-5">
        <Section title="Your company" hint="Saved on this device, so you only type it once.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name">
              <input className={input} value={f.companyName} onChange={set("companyName")} placeholder="Khan Builders" />
            </Field>
            <Field label="Phone / email">
              <input className={input} value={f.companyContact} onChange={set("companyContact")} placeholder="0300 0000000 · info@example.com" />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <input className={input} value={f.companyAddress} onChange={set("companyAddress")} placeholder="Street, city" />
            </Field>
            <Field label="Signed by">
              <input className={input} value={f.signatory} onChange={set("signatory")} placeholder="Name of signatory" />
            </Field>
            <Field label="Currency">
              <input className={input} value={f.currency} onChange={set("currency")} placeholder="Rs." />
            </Field>
          </div>
        </Section>

        <Section title="Quotation details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Quotation no.">
              <input className={input} value={f.number} onChange={set("number")} placeholder="Q-001" />
            </Field>
            <Field label="Date">
              <input type="date" className={input} value={f.date} onChange={set("date")} />
            </Field>
            <Field label="To (name)" className="sm:col-span-2">
              <input className={input} value={f.toName} onChange={set("toName")} placeholder="Client or company name" />
            </Field>
            <Field label="To (address)" className="sm:col-span-2">
              <input className={input} value={f.toAddress} onChange={set("toAddress")} placeholder="Client address" />
            </Field>
            <Field label="Subject" className="sm:col-span-2">
              <input className={input} value={f.subject} onChange={set("subject")} placeholder="Quotation for office renovation" />
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
                  placeholder="Work description"
                  value={r.description}
                  onChange={(e) => setRow(r.id, "description", e.target.value)}
                />
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  className={`${input} col-start-2 sm:col-start-auto`}
                  placeholder="Amount"
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

        <Section title="Terms & notes" hint="Optional. Payment terms, validity, conditions.">
          <textarea
            rows={4}
            className={`${input} resize-y`}
            value={f.notes}
            onChange={set("notes")}
            placeholder="50% advance, balance on completion. Quotation valid for 15 days."
          />
        </Section>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <div className="text-xs text-slate-500">Total</div>
            <div className="text-xl font-bold">
              {f.currency} {money(total)}
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
