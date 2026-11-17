import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import { Suspense } from "react"

import type { Metadata, Viewport } from "next";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import CapacitorInit from "@/components/CapacitorInit";
import KakaoInit from "@/components/KakaoInit";
import PageViewTracker from "@/components/PageViewTracker";

export const metadata: Metadata = {
  title: "영화방랑자",
  description: "서울 예술영화관 상영시간표",
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "영화방랑자",
    startupImage: [
      {
        url: "/icon-512.png",
        media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-KMQH37G5';
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-77TJYZ919Q';

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Capacitor 네이티브 브리지는 WebView 문서 시작 시점에 주입되므로, 여기서 바로
            window.Capacitor를 확인해 html에 data-native를 찍을 수 있다. 앱에서만 숨길 요소를
            첫 페인트 전에 감추기 위한 표식(globals.css의 [data-hide-in-app] 규칙). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){try{var c=window.Capacitor;
              var n=!!c&&(typeof c.isNativePlatform==='function'?c.isNativePlatform():c.platform&&c.platform!=='web');
              if(n)document.documentElement.setAttribute('data-native','true');}catch(e){}})();
            `,
          }}
        />
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `,
          }}
        />
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              var isDebug = window.location.search.indexOf('ga_debug=1') !== -1;
              var configOptions = { send_page_view: false };
              if (isDebug) configOptions.debug_mode = true;
              gtag('config', '${GA_ID}', configOptions);
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <CapacitorInit />
        <KakaoInit />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
