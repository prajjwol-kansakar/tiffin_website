import "./globals.css";

export const metadata = {
  title: "A Fresh Home Made — Order Online",
  description:
    "Home-style taste delivered fresh to your door. Browse the menu, build your order and check out online.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
