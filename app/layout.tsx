import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PYPA Kerala State", template: "%s · PYPA Kerala" },
  description: "Pentecostal Young People’s Association, Kerala State. India’s largest Pentecostal youth organization. Saved to Serve.",
  icons: { icon: "/logo.webp" },
};
export const viewport: Viewport = { themeColor: "#142E37", width: "device-width", initialScale: 1 };

const themeScript = `try{var t=localStorage.getItem('pypa-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&family=Noto+Sans+Malayalam:wght@400;600;700&family=Noto+Serif+Malayalam:wght@600&display=swap" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Toaster position="bottom-right" richColors closeButton toastOptions={{ className: "font-sans" }} />
      </body>
    </html>
  );
}
