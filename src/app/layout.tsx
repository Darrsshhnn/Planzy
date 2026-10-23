import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { INTRO_SEEN_SCRIPT } from "@/components/brand/intro-script";
import { AppFrame } from "@/components/layout/app-frame";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Planzy - Plan outings together",
  description: "Discover, vote and book group outings in Ahmedabad with your friends.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* Hide the opening animation before first paint if it already played this session. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SEEN_SCRIPT }} />
      </head>
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
