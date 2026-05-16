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
} from "lucide-react"

const menu = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Recargas", href: "/recargas", icon: Wallet },
  { label: "Retiros", href: "/retiros", icon: ReceiptText },
  { label: "Caja", href: "/caja", icon: ArrowDownUp },
  { label: "Cuadre", href: "/cuadre", icon: Calculator },
  { label: "Productos", href: "/productos", icon: Package },
  { label: "Ventas productos", href: "/ventas-productos", icon: ShoppingCart },
]

export default function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 border-r border-white/10 bg-[#070707] p-4 md:block">
      <div className="mb-8 overflow-hidden rounded-[1.7rem] border border-[#ffd400]/30 bg-gradient-to-br from-[#d90416] to-[#050505] p-5 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffd400] text-black">
          <Zap className="h-7 w-7 fill-black" />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/70">
          Casa de apuestas
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-wide text-white">
          GAEL<span className="text-[#ffd400]">FAST</span>
        </h1>

        <p className="mt-2 text-sm text-white/70">
          Recargas · Retiros · Cuadre
        </p>
      </div>

      <nav className="space-y-2">
        {menu.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm font-semibold text-zinc-300 transition hover:border-[#d90416]/40 hover:bg-[#d90416]/15 hover:text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[#ffd400] transition group-hover:bg-[#d90416] group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-8 border-t border-white/10 pt-4">
        <Link
          href="/configuracion"
          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-white"
        >
          <Settings className="h-5 w-5 text-[#ffd400]" />
          Configuración
        </Link>
      </div>
    </aside>
  )
}