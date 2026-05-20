"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  Wallet,
  ReceiptText,
  ArrowDownUp,
  Calculator,
  Package,
  ShoppingCart,
  Settings,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
} from "lucide-react"

const sellerMenu = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Recargas", href: "/recargas", icon: Wallet },
  { label: "Retiros", href: "/retiros", icon: ReceiptText },
  { label: "Caja", href: "/caja", icon: ArrowDownUp },
  { label: "Cuadre", href: "/cuadre", icon: Calculator },
  { label: "Productos", href: "/productos", icon: Package },
  { label: "Ventas productos", href: "/ventas-productos", icon: ShoppingCart },
]

const adminMenu = [
  { label: "Panel Admin", href: "/admin", icon: ShieldCheck },
  ...sellerMenu,
]

export default function Sidebar({
  collapsed = false,
  onToggle,
  mobile = false,
  onNavigate,
}) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")

    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const menu = user?.role === "ADMIN" ? adminMenu : sellerMenu

  const asideClass = mobile
    ? "block min-h-screen w-72 border-r border-white/10 bg-[#070707] p-4"
    : `hidden min-h-screen border-r border-white/10 bg-[#070707] p-4 transition-all duration-300 md:block ${
        collapsed ? "w-20" : "w-72"
      }`

  return (
    <aside className={asideClass}>
      <div
        className={`mb-6 overflow-hidden rounded-[1.7rem] border border-[#ffd400]/30 bg-gradient-to-br from-[#d90416] to-[#050505] shadow-xl transition-all ${
          collapsed ? "p-3" : "p-5"
        }`}
      >
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffd400] text-black">
            <Zap className="h-7 w-7 fill-black" />
          </div>

          {!collapsed && !mobile && (
            <button
              type="button"
              onClick={onToggle}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-white transition hover:bg-white/10"
              title="Ocultar menú"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          )}
        </div>

        {!collapsed && (
          <>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.35em] text-white/70">
              Casa de apuestas
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-wide text-white">
              GAEL<span className="text-[#ffd400]">FAST</span>
            </h1>

            <p className="mt-2 text-sm text-white/70">
              Recargas · Retiros · Cuadre
            </p>
          </>
        )}
      </div>

      {collapsed && !mobile && (
        <button
          type="button"
          onClick={onToggle}
          className="mb-4 flex h-11 w-full items-center justify-center rounded-2xl border border-[#ffd400]/30 bg-[#ffd400]/10 text-[#ffd400] transition hover:bg-[#ffd400] hover:text-black"
          title="Mostrar menú"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      )}

      <nav className="space-y-2">
        {menu.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm font-semibold text-zinc-300 transition hover:border-[#d90416]/40 hover:bg-[#d90416]/15 hover:text-white ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#ffd400] transition group-hover:bg-[#d90416] group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>

              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {user?.role === "ADMIN" && (
        <div className="mt-8 border-t border-white/10 pt-4">
          <Link
            href="/configuracion"
            onClick={onNavigate}
            title={collapsed ? "Configuración" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-white ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <Settings className="h-5 w-5 shrink-0 text-[#ffd400]" />

            {!collapsed && <span>Configuración</span>}
          </Link>
        </div>
      )}
    </aside>
  )
}