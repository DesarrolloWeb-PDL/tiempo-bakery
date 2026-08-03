import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import Footer from "@/components/footer";
import WhatsAppButton from "@/components/whatsapp-button";
import { CartSidebar } from "@/components/cart-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Tiempo Bakery - Panadería Artesanal",
  description: "Micropanadería artesanal por encargo semanal. Panes y dulces elaborados en tandas pequeñas con fermentaciones lentas y producto real.",
  manifest: "/manifest",
  themeColor: "#d89a44",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tiempo",
  },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/api/icon?size=192', sizes: '192x192', type: 'image/png' },
      { url: '/api/icon?size=512', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: ['/favicon.png'],
    apple: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/api/icon?size=180', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteContent = await getSiteContent();

  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>
        <ThemeProvider>
          <div className="flex flex-col min-h-screen">
            <Header siteContent={siteContent} showCart={true} />
            <main className="flex-1">
              {children}
            </main>
            <Footer siteContent={siteContent} />
            <CartSidebar />
            <WhatsAppButton siteContent={siteContent} />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
