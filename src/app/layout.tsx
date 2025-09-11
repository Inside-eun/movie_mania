import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "씨케쥴",
  description: "서울 예술영화관 상영시간표",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
