"use client"

import { useEffect, useMemo, useState } from "react"
import AppShell from "@/components/layout/AppShell"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownUp, Package, ReceiptText, Wallet } from "lucide-react"

function formatMoney(value) {
  const number = Number(value || 0)

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(number)
}

function formatDate(value) {
  if (!value) return "-"

  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function getStatusClass(status) {
  if (status === "RECARGADO" || status === "COMPENSADO") {
    return "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15"
  }

  if (status === "PENDIENTE") {
    return "bg-[#ffd400]/15 text-[#ffd400] hover:bg-[#ffd400]/15"
  }

  if (status === "DIFERENCIA") {
    return "bg-orange-500/15 text-orange-300 hover:bg-orange-500/15"
  }

  if (status === "ANULADO") {
    return "bg-red-500/15 text-red-300 hover:bg-red-500/15"
  }

  return "bg-white/10 text-zinc-300 hover:bg-white/10"
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadDashboard() {
    try {
      setLoading(true)

      const res = await api.get("/api/dashboard")
      setDashboard(res.data)
    } catch (error) {
      console.error(error)
      alert("No se pudo cargar el dashboard. Revisa que el backend esté encendido.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const totals = dashboard?.totals || {
    recharges: 0,
    withdrawals: 0,
    cash: 0,
    productSales: 0,
    pendingDifference: 0,
  }

  const latestRecharges = dashboard?.latest?.recharges || []
  const latestWithdrawals = dashboard?.latest?.withdrawals || []

  const latestMovements = useMemo(() => {
    const recharges = latestRecharges.map((item) => ({
      id: `recharge-${item.id}`,
      type: "RECARGA",
      date: item.createdAt,
      client: item.client?.name || "-",
      house: item.betHouse?.name || "-",
      amount: item.amount,
      status: item.status || "RECARGADO",
    }))

    const withdrawals = latestWithdrawals.map((item) => ({
      id: `withdrawal-${item.id}`,
      type: "RETIRO",
      date: item.createdAt,
      client: item.client?.name || "-",
      house: item.betHouse?.name || "-",
      amount: item.amount,
      status: item.status || "PENDIENTE",
    }))

    return [...recharges, ...withdrawals]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6)
  }, [latestRecharges, latestWithdrawals])

  const stats = [
    {
      title: "Recargas de hoy",
      value: formatMoney(totals.recharges),
      detail: `${latestRecharges.length} operaciones recientes`,
      icon: Wallet,
    },
    {
      title: "Retiros pendientes",
      value: formatMoney(totals.withdrawals),
      detail: "Pendientes por compensar",
      icon: ReceiptText,
    },
    {
      title: "Caja",
      value: formatMoney(totals.cash),
      detail: "Pagos recibidos y diferencias",
      icon: ArrowDownUp,
    },
    {
      title: "Ventas productos",
      value: formatMoney(totals.productSales),
      detail: "Bebidas y productos",
      icon: Package,
    },
  ]

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
                <p className="text-3xl font-black">
                  {loading ? "..." : item.value}
                </p>
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
            <div className="space-y-3">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-black p-5 text-zinc-400">
                  Cargando movimientos...
                </div>
              ) : latestMovements.length === 0 ? (
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
              ) : (
                latestMovements.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-black p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              item.type === "RECARGA"
                                ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15"
                                : "bg-[#ffd400]/15 text-[#ffd400] hover:bg-[#ffd400]/15"
                            }
                          >
                            {item.type}
                          </Badge>

                          <Badge className={getStatusClass(item.status)}>
                            {item.status}
                          </Badge>
                        </div>

                        <p className="mt-3 font-bold text-white">
                          {item.client}
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          {item.house} · {formatDate(item.date)}
                        </p>
                      </div>

                      <p className="text-2xl font-black text-[#ffd400]">
                        {formatMoney(item.amount)}
                      </p>
                    </div>
                  </div>
                ))
              )}
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
              <span className="font-bold">
                {loading ? "..." : formatMoney(totals.recharges)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Retiros</span>
              <span className="font-bold">
                {loading ? "..." : formatMoney(totals.withdrawals)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Pagos recibidos</span>
              <span className="font-bold">
                {loading ? "..." : formatMoney(totals.cash)}
              </span>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex justify-between">
                <span className="font-bold">Diferencia pendiente</span>
                <span className="font-black text-[#ffd400]">
                  {loading ? "..." : formatMoney(totals.pendingDifference)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}