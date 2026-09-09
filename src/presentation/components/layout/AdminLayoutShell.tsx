"use client";

import { Suspense, useEffect, useState } from "react";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";
import { NavigationProgressBar } from "./NavigationProgressBar";

const STORAGE_KEY = "educore.admin.sidebar.collapsed";

interface AdminLayoutShellProps {
  children: React.ReactNode;
}

export function AdminLayoutShell({ children }: AdminLayoutShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className="bg-white font-body-md text-on-surface min-h-screen">
      <Suspense fallback={null}>
        <NavigationProgressBar />
      </Suspense>
      <AdminSidebar
        collapsed={collapsed}
        onClose={() => setMobileNavOpen(false)}
        onToggleCollapse={toggleCollapse}
        open={mobileNavOpen}
      />
      <div
        className={`transition-[padding] duration-200 ease-out ${
          collapsed ? "lg:pl-16" : "lg:pl-56"
        }`}
      >
        <AdminHeader
          onMenuClick={() => setMobileNavOpen(true)}
          onToggleSidebar={toggleCollapse}
          sidebarCollapsed={collapsed}
        />
        <main className="relative pt-20 ui-admin-canvas min-h-screen min-w-0 overflow-x-clip">
          <div className="max-w-[1400px] mx-auto px-sm sm:px-md lg:px-lg py-md sm:py-lg min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
