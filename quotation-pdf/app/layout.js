import "./globals.css";

export const metadata = {
  title: "Quotation Maker",
  description: "Fill in the details and download a quotation as PDF.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
