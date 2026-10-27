import type { Metadata } from "next";
import "./globals.css";
import { WorkspaceProvider } from "@/context/WorkspaceContext";

export const metadata: Metadata = {
  title: "Orbit Workspace",
  description: "All-in-one workspace application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#18191b] text-white">
        <WorkspaceProvider>
          {children}
        </WorkspaceProvider>
      </body>
    </html>
  );
}