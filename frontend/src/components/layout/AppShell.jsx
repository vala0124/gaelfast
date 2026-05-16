"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import Header from "./Header"

export default function AppShell({ children, title = "Dashboard" }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 bg-[radial-gradient(circle_at_top_right,rgba(217,4,22,0.16),transparent_35%),#050505]">
          <Header title={title} />

          <section className="p-6">
            {children}
          </section>
        </main>
      </div>
    </div>
  )
}
