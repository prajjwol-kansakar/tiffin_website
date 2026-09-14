import "./globals.css";

export const metadata = {
  title: "A Fresh Home Made Tiffin — Order Online",
  description:
    "Home-style tiffin delivered fresh to your door. Browse the menu, build your order and check out online.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
