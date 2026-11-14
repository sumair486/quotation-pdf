import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const C = { ink: "#1c2b3a", accent: "#1f4e79", line: "#d9dee5", soft: "#eef2f6", muted: "#5b6b7b" };

const s = StyleSheet.create({
  page: { padding: 40, paddingBottom: 60, fontSize: 10, fontFamily: "Helvetica", color: C.ink },
  head: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: C.accent, paddingBottom: 14 },
  company: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.accent },
  small: { fontSize: 9, color: C.muted, marginTop: 3, lineHeight: 1.4 },
  right: { alignItems: "flex-end" },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  meta: { fontSize: 10, marginTop: 4 },
  toBlock: { marginTop: 22 },
  label: { fontSize: 9, color: C.muted, marginBottom: 3 },
  toName: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  subject: { marginTop: 18, flexDirection: "row" },
  subjectLabel: { fontFamily: "Helvetica-Bold", width: 55 },
  subjectText: { flex: 1, fontFamily: "Helvetica-Bold" },
  table: { marginTop: 18, borderWidth: 1, borderColor: C.line },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line },
  th: { backgroundColor: C.accent, color: "#fff", fontFamily: "Helvetica-Bold" },
  cell: { padding: 7 },
  cSn: { width: 40, textAlign: "center" },
  cDesc: { flex: 1, borderLeftWidth: 1, borderLeftColor: C.line },
  cAmt: { width: 110, textAlign: "right", borderLeftWidth: 1, borderLeftColor: C.line },
  totalRow: { flexDirection: "row", backgroundColor: C.soft },
  totalLabel: { flex: 1, padding: 8, textAlign: "right", fontFamily: "Helvetica-Bold" },
  totalAmt: { width: 110, padding: 8, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 11 },
  notes: { marginTop: 22 },
  noteText: { lineHeight: 1.5, fontSize: 9.5 },
  sign: { marginTop: 50, alignItems: "flex-end" },
  signLine: { width: 160, borderTopWidth: 1, borderTopColor: C.ink, paddingTop: 4, textAlign: "center" },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, textAlign: "center", fontSize: 8, color: C.muted },
});

export function formatMoney(n) {
  return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function QuotationPDF({ data }) {
  const rows = data.rows.filter((r) => r.description.trim() || Number(r.amount));
  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const cur = data.currency ? data.currency.trim() + " " : "";
  const fmtDate = data.date
    ? new Date(data.date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : "";

  return (
    <Document title={`Quotation ${data.number}`}>
      <Page size="A4" style={s.page}>
        <View style={s.head}>
          <View style={{ maxWidth: 300 }}>
            <Text style={s.company}>{data.companyName || "Your Company"}</Text>
            {!!data.companyAddress && <Text style={s.small}>{data.companyAddress}</Text>}
            {!!data.companyContact && <Text style={s.small}>{data.companyContact}</Text>}
          </View>
          <View style={s.right}>
            <Text style={s.title}>QUOTATION</Text>
            {!!data.number && <Text style={s.meta}>No: {data.number}</Text>}
            <Text style={s.meta}>Date: {fmtDate}</Text>
          </View>
        </View>

        <View style={s.toBlock}>
          <Text style={s.label}>To</Text>
          <Text style={s.toName}>{data.toName}</Text>
          {!!data.toAddress && <Text style={s.small}>{data.toAddress}</Text>}
        </View>

        {!!data.subject && (
          <View style={s.subject}>
            <Text style={s.subjectLabel}>Subject:</Text>
            <Text style={s.subjectText}>{data.subject}</Text>
          </View>
        )}

        <View style={s.table}>
          <View style={[s.tr, s.th]} fixed>
            <Text style={[s.cell, s.cSn]}>S. No</Text>
            <Text style={[s.cell, s.cDesc]}>Work Description</Text>
            <Text style={[s.cell, s.cAmt]}>Amount</Text>
          </View>
          {rows.map((r, i) => (
            <View key={i} style={s.tr} wrap={false}>
              <Text style={[s.cell, s.cSn]}>{i + 1}</Text>
              <Text style={[s.cell, s.cDesc]}>{r.description}</Text>
              <Text style={[s.cell, s.cAmt]}>{cur}{formatMoney(r.amount)}</Text>
            </View>
          ))}
          <View style={s.totalRow} wrap={false}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalAmt}>{cur}{formatMoney(total)}</Text>
          </View>
        </View>

        {!!data.notes && (
          <View style={s.notes} wrap={false}>
            <Text style={s.label}>Terms & Notes</Text>
            <Text style={s.noteText}>{data.notes}</Text>
          </View>
        )}

        <View style={s.sign} wrap={false}>
          <Text style={s.signLine}>{data.signatory || "Authorized Signature"}</Text>
        </View>

        <Text
          style={s.footer}
          fixed
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </Page>
    </Document>
  );
}
