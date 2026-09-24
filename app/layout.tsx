import type { Metadata } from "next";
import VisualEffects from "@/components/visual-effects";
import "./globals.css";

export const metadata: Metadata = {
  title: "TI Marcon | Almoxarifado",
  description: "Gestão de requisições e materiais do almoxarifado industrial.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const saved=localStorage.getItem("cellarium-theme");const dark=saved==="dark"||(saved!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);document.documentElement.style.colorScheme=dark?"dark":"light"}catch{}})()`,
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
