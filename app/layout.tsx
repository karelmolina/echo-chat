import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import { SidebarProvider } from "@/hooks/use-sidebar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Echo Chat",
  description: "AI-powered chat application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased">
        <SidebarProvider>
          <div className="flex h-screen bg-background pt-14 lg:pt-0">
            {children}
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
