import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

/*
  The X imaging letterhead is a background image (public/invoice-bg.jpg or quotation-bg.jpg).
  Everything the user types is placed on top at fixed positions.
  Positions below are in the original template's coordinates; S / OX / OY map them onto the
  letterhead as it is placed on the page (scaled slightly to give equal left and right margins).
*/

const S = 0.9374;
const OX = 34;
const OY = 24;

const TABLE_TOP = 295; // first row starts here
const TABLE_BOTTOM = 532; // last row must end above this
const ROW_PAD = 4;
const LINE_H = 12.6;
const CHARS_PER_LINE = 80;
const CUR = "Rs. ";

const s = StyleSheet.create({
  page: { fontFamily: "Times-Roman", color: "#111" },
  bg: { position: "absolute", top: 0, left: 0, width: 595.28, height: 841.89 },
  abs: { position: "absolute" },
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

// Text placed at template coordinates (x, y, width w)
const Txt = ({ x, y, w, children, size = 11, bold, align = "left", lineHeight }) => (
  <Text
    style={[
      s.abs,
      {
        left: OX + S * x,
        top: OY + S * y,
        width: S * w,
        fontSize: size * S,
        textAlign: align,
        fontFamily: bold ? "Times-Bold" : "Times-Roman",
        lineHeight: lineHeight || 1.2,
      },
    ]}
  >
    {children}
  </Text>
);

export default function DocumentPDF({ data, bg }) {
  const isQuote = data.type === "quotation";
  const items = data.rows.filter((r) => r.description.trim() || Number(r.amount));
  const total = items.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const pages = paginate(items);
  const last = pages.length - 1;
  let counter = 0;

  return (
    <Document title={`${isQuote ? "Quotation" : "Invoice"} ${data.number || ""}`.trim()}>
      {pages.map((rows, pi) => (
        <Page key={pi} size="A4" style={s.page}>
          <Image src={bg} style={s.bg} fixed />

          {/* header fields (repeated on every page) */}
          <Txt x={466} y={80} w={90} bold>{data.number}</Txt>
          <Txt x={476} y={153} w={84} bold>{formatDate(data.date)}</Txt>
          <Txt x={50} y={153} w={200} bold>{data.billTo}</Txt>

          <Txt x={78} y={183} w={480}>{data.customer}</Txt>
          {/* address wraps onto the second printed line */}
          <Txt x={78} y={203.5} w={480} lineHeight={18 / 11}>{data.address}</Txt>
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
                  <Txt x={60} y={top} w={405} size={10.5}>{r.description}</Txt>
                  <Txt x={473} y={top} w={82} align="right">
                    {Number(r.amount) ? `${CUR}${formatMoney(r.amount)}` : ""}
                  </Txt>
                </View>
              );
            });
          })()}

          {/* total */}
          {pi === last ? (
            <Txt x={473} y={540} w={82} align="right" bold>
              {CUR}{formatMoney(total)}
            </Txt>
          ) : (
            <Txt x={300} y={542} w={100} align="right" size={9}>continued…</Txt>
          )}

          {pages.length > 1 && (
            <Txt x={4} y={546} w={300} size={9}>
              Page {pi + 1} of {pages.length}
            </Txt>
          )}

          {/* payment (invoice only, last page) */}
          {pi === last && !isQuote && (
            <>
              <Txt x={84} y={652} w={175} size={10}>{data.payDetails}</Txt>
              <Txt x={84} y={674} w={175}>{formatDate(data.paidDate)}</Txt>
              <Txt x={84} y={698} w={175}>
                {Number(data.paidAmount) ? `${CUR}${formatMoney(data.paidAmount)}` : ""}
              </Txt>
            </>
          )}
        </Page>
      ))}
    </Document>
  );
}
