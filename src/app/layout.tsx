import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Підрахунок очок",
  description: "Мобільний PWA для підрахунку очок у карткових іграх.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Очки",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" }
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1f7a5a"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body>
        <Script id="strip-browser-injected-attrs" strategy="beforeInteractive">
          {`
            (() => {
              const cleanNode = (node) => {
                if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
                for (const attr of Array.from(node.attributes)) {
                  if (attr.name.startsWith("__gcr")) {
                    node.removeAttribute(attr.name);
                  }
                }
                node.querySelectorAll?.("[__gcruniqueid], [__gcrremoteframetoken]").forEach(cleanNode);
              };

              const cleanTree = () => {
                cleanNode(document.documentElement);
                document.querySelectorAll("[__gcruniqueid], [__gcrremoteframetoken]").forEach(cleanNode);
              };

              cleanTree();
              new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                  if (mutation.type === "attributes") {
                    cleanNode(mutation.target);
                  }
                  mutation.addedNodes.forEach(cleanNode);
                }
              }).observe(document.documentElement, {
                attributes: true,
                childList: true,
                subtree: true
              });
            })();
          `}
        </Script>
        <ServiceWorkerRegistration />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
