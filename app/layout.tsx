import type { Metadata } from "next";
import { Geist } from "next/font/google";
import VisualEffects from "@/components/visual-effects";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Marcon | Gestão de materiais",
  description: "Portal de requisições e operações de almoxarifado Marcon.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`h-full antialiased ${geist.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const saved=localStorage.getItem("cellarium-theme");const dark=saved==="dark"||(saved!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);document.documentElement.classList.toggle("light",saved==="light");document.documentElement.style.colorScheme=dark?"dark":"light"}catch{}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <VisualEffects />
        {children}
      </body>
    </html>
  );
}
