import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import Footer from "@/components/footer";
import { CartSidebar } from "@/components/cart-sidebar";
import { getSiteContent } from "@/lib/site-content";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tiempo Bakery - Panadería Artesanal",
  description: "Micropanadería artesanal por encargo semanal. Panes y dulces elaborados en tandas pequeñas con fermentaciones lentas y producto real.",
  icons: {
    icon: [
      { url: '/img/espiga.png', type: 'image/png' },
    ],
    shortcut: ['/img/espiga.png'],
    apple: [
      { url: '/img/espiga.png', type: 'image/png' },
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
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <Header siteContent={siteContent} />
          <main className="flex-1">
            {children}
          </main>
          <Footer siteContent={siteContent} />
          <CartSidebar />
        </div>
      </body>
    </html>
  );
}
