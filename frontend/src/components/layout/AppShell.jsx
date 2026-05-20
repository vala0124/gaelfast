"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import Header from "./Header"
import { Menu, X } from "lucide-react"

export default function AppShell({ children, title = "Dashboard" }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="h-screen overflow-hidden bg-[#050505] text-white">
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div className="relative z-10 h-full w-72">
              <Sidebar
                mobile
                collapsed={false}
                onToggle={() => setMobileMenuOpen(false)}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black text-white shadow-xl"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <main className="flex h-screen flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(217,4,22,0.16),transparent_35%),#050505]">
          <Header title={title} />

          <div className="border-b border-white/10 bg-black/40 px-5 py-3 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0b0d] px-4 py-2 text-sm font-bold text-white"
            >
              <Menu className="h-5 w-5 text-[#ffd400]" />
              Menú
            </button>
          </div>

          <section className="flex-1 overflow-y-auto p-5 md:p-6">
            {children}
          </section>
        </main>
      </div>
    </div>
  )
}
