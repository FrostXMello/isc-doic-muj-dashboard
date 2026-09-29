import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import { Footer } from "@/components/footer/footer";
import { Navbar } from "@/components/navbar/navbar";
import { site } from "@/lib/data";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${site.shortName} · ${site.university}`,
    template: `%s · ${site.shortName} MUJ`,
  },
  description:
    "Directorate of International Collaboration at Manipal University Jaipur, managed by the International Student Cell. Discover international opportunities and the university’s global partnerships.",
};

export const viewport: Viewport = {
  themeColor: "#070b14",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
