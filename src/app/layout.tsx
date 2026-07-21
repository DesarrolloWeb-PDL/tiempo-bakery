import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import Footer from "@/components/footer";
import { CartSidebar } from "@/components/cart-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Tiempo Bakery - Panadería Artesanal",
  description: "Micropanadería artesanal por encargo semanal. Panes y dulces elaborados en tandas pequeñas con fermentaciones lentas y producto real.",
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: ['/favicon.png'],
    apple: [
      { url: '/favicon.png', type: 'image/png' },
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
      <body>
        <ThemeProvider>
          <div className="flex flex-col min-h-screen">
            <Header siteContent={siteContent} showCart={true} />
            <main className="flex-1">
              {children}
            </main>
            <Footer siteContent={siteContent} />
            <CartSidebar />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
