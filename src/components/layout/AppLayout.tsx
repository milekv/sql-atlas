import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => (
  <div className="min-h-screen bg-atlas-bg text-atlas-text">
    <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="min-w-0">
        <Topbar />
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  </div>
);
