import "./globals.css";

export const metadata = {
  title: "X imaging Invoice",
  description: "Fill in the details and download the invoice as PDF.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
