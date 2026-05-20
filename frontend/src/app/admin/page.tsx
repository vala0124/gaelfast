"use client"

import Link from "next/link"
import AppShell from "@/components/layout/AppShell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowDownUp,
  Banknote,
  ReceiptText,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"

const modules = [
  {
    title: "Recargas Admin",
    href: "/admin/recargas",
    description: "Ver recargas por fecha y editar ganancia recibida.",
    icon: Wallet,
  },
  {
    title: "Retiros Admin",
    href: "/admin/retiros",
    description: "Registrar cuánto pagó la casa y calcular ganancia.",
    icon: ReceiptText,
  },
  {
    title: "Rentabilidad",
    href: "/admin/rentabilidad",
    description: "Utilidad de productos, recargas y retiros.",
    icon: TrendingUp,
  },
  {
    title: "Caja Admin",
    href: "/admin/caja",
    description: "Historial de cajas, bancos, casas y cuadres.",
    icon: Banknote,
  },
  {
    title: "Usuarios",
    href: "/admin/usuarios",
    description: "Crear, activar, desactivar y cambiar claves.",
    icon: Users,
  },
]

export default function AdminPage() {
  return (
    <AppShell title="Panel Admin">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#d90416] via-[#8f000c] to-[#050505] p-6 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
            Administración
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Panel del administrador
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-white/75">
            Controla ganancias, retiros, recargas, caja, usuarios y rentabilidad
            general del negocio.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((item) => {
            const Icon = item.icon

            return (
              <Link key={item.href} href={item.href}>
                <Card className="h-full border-white/10 bg-[#0b0b0d] text-white shadow-2xl transition hover:border-[#ffd400]/40 hover:bg-[#111113]">
                  <CardHeader className="border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold">
                        {item.title}
                      </CardTitle>

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffd400] text-black">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <p className="text-sm text-zinc-400">{item.description}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <ArrowDownUp className="h-5 w-5 text-[#ffd400]" />
              Flujo recomendado
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black p-4">
                <p className="font-bold text-[#ffd400]">1. Operación</p>
                <p className="mt-1 text-sm text-zinc-400">
                  El vendedor registra recargas, retiros y ventas.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-4">
                <p className="font-bold text-[#ffd400]">2. Admin</p>
                <p className="mt-1 text-sm text-zinc-400">
                  El admin revisa ganancias de recargas y pagos de casas.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-4">
                <p className="font-bold text-[#ffd400]">3. Rentabilidad</p>
                <p className="mt-1 text-sm text-zinc-400">
                  El sistema calcula utilidad de productos y casas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}