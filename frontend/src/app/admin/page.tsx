"use client"

import { useEffect, useMemo, useState } from "react"
import AppShell from "@/components/layout/AppShell"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowDownUp,
  Banknote,
  DollarSign,
  Package,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react"

function formatMoney(value: number | string | null | undefined) {
  const number = Number(value || 0)

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(number)
}

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function isToday(dateValue: string) {
  if (!dateValue) return false

  const itemDate = new Date(dateValue)
  const today = getTodayDate()
  const start = new Date(`${today}T00:00:00`)
  const end = new Date(`${today}T23:59:59`)

  return itemDate >= start && itemDate <= end
}

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<any>(null)
  const [recharges, setRecharges] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [productSales, setProductSales] = useState<any[]>([])
  const [closings, setClosings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    try {
      setLoading(true)

      const [dashboardRes, rechargesRes, withdrawalsRes, salesRes, closingsRes] =
        await Promise.all([
          api.get("/api/dashboard"),
          api.get("/api/recharges"),
          api.get("/api/withdrawals"),
          api.get("/api/product-sales"),
          api.get("/api/cash-closings"),
        ])

      setDashboard(dashboardRes.data || null)
      setRecharges(Array.isArray(rechargesRes.data) ? rechargesRes.data : [])
      setWithdrawals(
        Array.isArray(withdrawalsRes.data) ? withdrawalsRes.data : []
      )
      setProductSales(Array.isArray(salesRes.data) ? salesRes.data : [])
      setClosings(Array.isArray(closingsRes.data) ? closingsRes.data : [])
    } catch (error) {
      console.error(error)
      alert("No se pudo cargar el panel admin.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const todayData = useMemo(() => {
    const todayRecharges = recharges.filter((item) => isToday(item.createdAt))
    const todayWithdrawals = withdrawals.filter((item) => isToday(item.createdAt))
    const todaySales = productSales.filter((item) => isToday(item.createdAt))

    const totalRechargeProfit = todayRecharges.reduce(
      (sum, item) => sum + Number(item.adminProfit || 0),
      0
    )

    const totalWithdrawalProfit = todayWithdrawals.reduce(
      (sum, item) => sum + Number(item.adminProfit || 0),
      0
    )

    const totalProductSales = todaySales.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    )

    const totalProductCost = todaySales.reduce((sum, item) => {
      const cost = Number(item.product?.purchasePrice || 0)
      const quantity = Number(item.quantity || 0)

      return sum + cost * quantity
    }, 0)

    const productProfit = totalProductSales - totalProductCost
    const houseProfit = totalRechargeProfit + totalWithdrawalProfit
    const netProfit = productProfit + houseProfit

    const pendingWithdrawals = todayWithdrawals.filter(
      (item) => item.status !== "COMPENSADO" && item.status !== "ANULADO"
    )

    const todayClosing = closings.find((item) =>
      String(item.closingDate || "").startsWith(getTodayDate())
    )

    return {
      todayRecharges,
      todayWithdrawals,
      todaySales,
      totalRechargeProfit,
      totalWithdrawalProfit,
      totalProductSales,
      totalProductCost,
      productProfit,
      houseProfit,
      netProfit,
      pendingWithdrawals,
      todayClosing,
    }
  }, [recharges, withdrawals, productSales, closings])

  const totals = dashboard?.totals || {
    recharges: 0,
    withdrawals: 0,
    cash: 0,
    productSales: 0,
    pendingDifference: 0,
  }

  const cards = [
    {
      title: "Recargas de hoy",
      value: formatMoney(totals.recharges),
      detail: `${todayData.todayRecharges.length} operaciones`,
      icon: Wallet,
    },
    {
      title: "Retiros de hoy",
      value: formatMoney(totals.withdrawals),
      detail: `${todayData.pendingWithdrawals.length} pendientes`,
      icon: ReceiptText,
    },
    {
      title: "Caja recibida",
      value: formatMoney(totals.cash),
      detail: "Pagos de casas registrados",
      icon: Banknote,
    },
    {
      title: "Ventas productos",
      value: formatMoney(totals.productSales),
      detail: `${todayData.todaySales.length} ventas`,
      icon: Package,
    },
  ]

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

          <p className="mt-2 text-sm text-white/75">
            Resumen general del día: recargas, retiros, caja, ventas y utilidad.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((item) => {
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
                  <p className="text-3xl font-black">
                    {loading ? "..." : item.value}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">{item.detail}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">Ganancia productos</p>
                <TrendingUp className="h-5 w-5 text-[#ffd400]" />
              </div>

              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {loading ? "..." : formatMoney(todayData.productProfit)}
              </p>

              <p className="mt-2 text-xs text-zinc-500">
                Ventas menos costo de productos.
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">Ganancia casas</p>
                <ArrowDownUp className="h-5 w-5 text-[#ffd400]" />
              </div>

              <p className="mt-2 text-3xl font-bold">
                {loading ? "..." : formatMoney(todayData.houseProfit)}
              </p>

              <p className="mt-2 text-xs text-zinc-500">
                Ganancia de recargas y retiros.
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">Utilidad neta</p>
                <DollarSign className="h-5 w-5 text-[#ffd400]" />
              </div>

              <p className="mt-2 text-3xl font-bold text-emerald-300">
                {loading ? "..." : formatMoney(todayData.netProfit)}
              </p>

              <p className="mt-2 text-xs text-zinc-500">
                Productos + casas de apuestas.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle>Estado del cuadre de hoy</CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            {todayData.todayClosing ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black p-4">
                  <p className="text-sm text-zinc-500">Esperado</p>
                  <p className="mt-1 text-2xl font-bold text-[#ffd400]">
                    {formatMoney(todayData.todayClosing.expectedTotal)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black p-4">
                  <p className="text-sm text-zinc-500">Real</p>
                  <p className="mt-1 text-2xl font-bold">
                    {formatMoney(todayData.todayClosing.realTotal)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black p-4">
                  <p className="text-sm text-zinc-500">Diferencia</p>
                  <p
                    className={`mt-1 text-2xl font-bold ${
                      Number(todayData.todayClosing.differenceTotal || 0) === 0
                        ? "text-emerald-300"
                        : "text-[#ffd400]"
                    }`}
                  >
                    {formatMoney(todayData.todayClosing.differenceTotal)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4 text-sm text-[#ffd400]">
                Todavía no se ha guardado el cuadre de hoy.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle>Alertas rápidas</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 p-6">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black p-4">
              <div>
                <p className="font-bold">Retiros pendientes</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Retiros que todavía no están compensados.
                </p>
              </div>

              <Badge className="bg-[#ffd400]/15 text-[#ffd400] hover:bg-[#ffd400]/15">
                {todayData.pendingWithdrawals.length}
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black p-4">
              <div>
                <p className="font-bold">Diferencia pendiente dashboard</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Diferencia entre retiros y pagos de casas.
                </p>
              </div>

              <Badge className="bg-orange-500/15 text-orange-300 hover:bg-orange-500/15">
                {formatMoney(totals.pendingDifference)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}