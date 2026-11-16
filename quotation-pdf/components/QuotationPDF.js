import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

/*
  The X imaging letterhead is a background image (public/invoice-bg.jpg).
  Everything the user types is placed on top of it at fixed positions (in points, A4 = 595 x 842).
*/

const TABLE_TOP = 295; // first row starts here
const TABLE_BOTTOM = 532; // last row must end above this
const ROW_PAD = 4;
const LINE_H = 12.6;
const CHARS_PER_LINE = 80;

const s = StyleSheet.create({
  page: { fontFamily: "Times-Roman", fontSize: 11, color: "#111" },
  bg: { position: "absolute", top: 0, left: 0, width: 595.28, height: 841.89 },
  abs: { position: "absolute" },
  desc: { fontSize: 10.5, lineHeight: 1.2 },
});

export function formatMoney(n) {
  return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

function lineCount(text) {
  return Math.max(
    1,
    String(text || "")
      .split("\n")
      .reduce((n, p) => n + Math.max(1, Math.ceil(p.length / CHARS_PER_LINE)), 0)
  );
}

// Split rows into pages so they never run past the table
function paginate(rows) {
  const avail = TABLE_BOTTOM - TABLE_TOP;
  const pages = [];
  let cur = [];
  let used = 0;
  rows.forEach((r) => {
    const h = lineCount(r.description) * LINE_H + ROW_PAD * 2;
    if (used + h > avail && cur.length) {
      pages.push(cur);
      cur = [];
      used = 0;
    }
    cur.push({ ...r, h });
    used += h;
  });
  pages.push(cur);
  return pages;
}

const Txt = ({ x, y, w, children, style, align }) => (
  <Text style={[s.abs, { left: x, top: y, width: w, textAlign: align || "left" }, style]}>{children}</Text>
);

export default function InvoicePDF({ data, bg }) {
  const items = data.rows.filter((r) => r.description.trim() || Number(r.amount));
  const total = items.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const cur = data.currency ? data.currency.trim() + " " : "";
  const pages = paginate(items);
  const last = pages.length - 1;
  let counter = 0;

  return (
    <Document title={`Invoice ${data.number || ""}`.trim()}>
      {pages.map((rows, pi) => (
        <Page key={pi} size="A4" style={s.page}>
          <Image src={bg} style={s.bg} fixed />

          {/* header fields (repeated on every page) */}
          <Txt x={466} y={81} w={90} style={{ fontFamily: "Times-Bold" }}>{data.number}</Txt>
          <Txt x={470} y={153} w={90} style={{ fontFamily: "Times-Bold" }}>{formatDate(data.date)}</Txt>
          <Txt x={48} y={153} w={200} style={{ fontFamily: "Times-Bold" }}>{data.billTo}</Txt>

          <Txt x={78} y={183} w={480}>{data.customer}</Txt>
          <Txt x={78} y={203.5} w={480}>{data.address1}</Txt>
          <Txt x={78} y={221.5} w={480}>{data.address2}</Txt>
          <Txt x={78} y={241} w={480}>{data.project}</Txt>

          {/* rows */}
          {(() => {
            let y = TABLE_TOP;
            return rows.map((r) => {
              const top = y + ROW_PAD;
              y += r.h;
              counter += 1;
              return (
                <View key={counter}>
                  <Txt x={0} y={top} w={54} align="center">{counter}</Txt>
                  <Txt x={60} y={top} w={405} style={s.desc}>{r.description}</Txt>
                  <Txt x={473} y={top} w={82} align="right">
                    {Number(r.amount) ? `${cur}${formatMoney(r.amount)}` : ""}
                  </Txt>
                </View>
              );
            });
          })()}

          {/* total */}
          {pi === last ? (
            <Txt x={473} y={540} w={82} align="right" style={{ fontFamily: "Times-Bold" }}>
              {cur}{formatMoney(total)}
            </Txt>
          ) : (
            <Txt x={300} y={542} w={100} align="right" style={{ fontSize: 9 }}>continued…</Txt>
          )}

          {pages.length > 1 && (
            <Txt x={0} y={546} w={300} style={{ fontSize: 9, left: 4 }}>
              Page {pi + 1} of {pages.length}
            </Txt>
          )}

          {/* payment (optional, all pages show it only on the last) */}
          {pi === last && (
            <>
              <Txt x={84} y={653} w={170}>{data.payDetails}</Txt>
              <Txt x={84} y={674} w={170}>{formatDate(data.paidDate)}</Txt>
              <Txt x={84} y={698} w={170}>
                {Number(data.paidAmount) ? `${cur}${formatMoney(data.paidAmount)}` : ""}
              </Txt>
            </>
          )}
        </Page>
      ))}
    </Document>
  );
}
