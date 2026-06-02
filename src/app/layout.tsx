

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";
import PWARegistration from "@/components/PWARegistration";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Script to apply dark mode before page renders
function setInitialColorMode() {
  return {
    __html: `
      (function() {
        try {
          var isDarkMode = localStorage.getItem('isDarkMode');
          if (isDarkMode === 'true') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } catch (e) {
          console.error('Error applying dark mode:', e);
        }
      })()
    `,
  };
}

export const metadata: Metadata = {
  title: "uangku - your finance tracker",
  description: "Track your income, expenses, and financial goals with our simple and intuitive finance tracker.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "uangku",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={setInitialColorMode()} />
      </head>
      <body
        className={`${inter.variable} antialiased min-h-screen bg-gray-50 dark:bg-gray-900`}
      >
        <PWARegistration />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
