import "./globals.css";

export const metadata = {
  title: "Random Picture",
  description: "Immersive random picture landing page with a gallery view built in Next.js.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
