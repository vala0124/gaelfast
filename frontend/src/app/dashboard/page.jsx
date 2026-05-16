import AppShell from "../../components/layout/AppShell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownUp, Package, ReceiptText, Wallet } from "lucide-react"

const stats = [
  {
    title: "Recargas de hoy",
    value: "$0.00",
    detail: "0 operaciones registradas",
    icon: Wallet,
  },
  {
    title: "Retiros pendientes",
    value: "$0.00",
    detail: "Pendientes por compensar",
    icon: ReceiptText,
  },
  {
    title: "Caja",
    value: "$0.00",
    detail: "Pagos recibidos y diferencias",
    icon: ArrowDownUp,
  },
  {
    title: "Ventas productos",
    value: "$0.00",
    detail: "Bebidas y productos",
    icon: Package,
  },
]

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <div className="mb-6 overflow-hidden rounded-[2rem] border border-[#ffd400]/20 bg-gradient-to-r from-[#d90416] via-[#9b0010] to-[#050505] p-8 shadow-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.4em] text-[#ffd400]">
          Panel administrativo
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-wide text-white md:text-5xl">
          GAEL<span className="text-[#ffd400]">FAST</span>
        </h1>

        <p className="mt-3 max-w-2xl text-white/75">
          Controla recargas, retiros, comprobantes, compensaciones de casas de
          apuestas y ventas internas desde un solo lugar.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon

          return (
            <Card
              key={item.title}
              className="border-white/10 bg-[#0b0b0d] text-white shadow-xl"
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-zinc-400">
                  {item.title}
                </CardTitle>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d90416]/20 text-[#ffd400]">
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-3xl font-black">{item.value}</p>
                <p className="mt-2 text-sm text-zinc-500">{item.detail}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="border-white/10 bg-[#0b0b0d] text-white xl:col-span-2">
          <CardHeader>
            <CardTitle>Últimos movimientos</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="rounded-2xl border border-white/10 bg-black p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Sin movimientos registrados</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Cuando registres recargas o retiros, aparecerán aquí.
                  </p>
                </div>

                <Badge className="bg-[#ffd400]/15 text-[#ffd400] hover:bg-[#ffd400]/15">
                  Pendiente
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#0b0b0d] text-white">
          <CardHeader>
            <CardTitle>Resumen de caja</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Recargas</span>
              <span className="font-bold">$0.00</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Retiros</span>
              <span className="font-bold">$0.00</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Pagos recibidos</span>
              <span className="font-bold">$0.00</span>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex justify-between">
                <span className="font-bold">Diferencia pendiente</span>
                <span className="font-black text-[#ffd400]">$0.00</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}