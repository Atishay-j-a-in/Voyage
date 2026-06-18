import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark, neobrutalism } from "@clerk/ui/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voyage",
  description: "Ai powered workspace for professionals",
  icons: {
    icon: "favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* ClerkProvider must live inside <body> per the Clerk docs.
            `cssLayerName: "clerk"` pairs with the `@layer` declaration
            in globals.css so Tailwind v4 utilities can override Clerk
            styles cleanly. */}
        <ClerkProvider
          afterSignOutUrl="/sign-in"
          appearance={{
            cssLayerName: "clerk",
            theme: [dark, neobrutalism],
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
