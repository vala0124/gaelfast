"use client"

import { useEffect, useMemo, useState } from "react"
import AppShell from "@/components/layout/AppShell"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CalendarDays, ReceiptText, RefreshCcw, Save } from "lucide-react"

function formatMoney(value: number | string | null | undefined) {
  const number = Number(value || 0)
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(number)
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function isDateInsideRange(dateValue: string, startDate: string, endDate: string) {
  if (!dateValue) return false
  const itemDate = new Date(dateValue)
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T23:59:59`)
  return itemDate >= start && itemDate <= end
}

export default function AdminRetirosPage() {
  const today = getTodayDate()

  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [housePayments, setHousePayments] = useState<Record<string, string>>({})
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)

  async function loadData() {
    try {
      setLoading(true)

      const res = await api.get("/api/withdrawals")
      const data = Array.isArray(res.data) ? res.data : []

      setWithdrawals(data)

      const values: Record<string, string> = {}
      for (const item of data) {
        values[item.id] = String(item.housePaidAmount || "")
      }

      setHousePayments(values)
    } catch (error) {
      console.error(error)
      alert("No se pudieron cargar los retiros.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((item) =>
      isDateInsideRange(item.createdAt, startDate, endDate)
    )
  }, [withdrawals, startDate, endDate])

  const summary = useMemo(() => {
    const active = filteredWithdrawals.filter((item) => item.status !== "ANULADO")

    const totalWithdrawn = active.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    )

    const totalPaidByHouse = active.reduce(
      (sum, item) => sum + Number(item.housePaidAmount || 0),
      0
    )

    const totalProfit = active.reduce(
      (sum, item) => sum + Number(item.adminProfit || 0),
      0
    )

    const pending = active.filter((item) => {
      const paid = Number(item.housePaidAmount || 0)
      return paid <= 0
    })

    const byHouse = new Map<
      string,
      { house: string; withdrawn: number; paid: number; profit: number; count: number }
    >()

    for (const item of active) {
      const house = item.betHouse?.name || "-"
      const current = byHouse.get(house) || {
        house,
        withdrawn: 0,
        paid: 0,
        profit: 0,
        count: 0,
      }

      current.withdrawn += Number(item.amount || 0)
      current.paid += Number(item.housePaidAmount || 0)
      current.profit += Number(item.adminProfit || 0)
      current.count += 1

      byHouse.set(house, current)
    }

    return {
      totalWithdrawn,
      totalPaidByHouse,
      totalProfit,
      pending: pending.length,
      count: active.length,
      byHouse: Array.from(byHouse.values()),
    }
  }, [filteredWithdrawals])

  function setTodayFilter() {
    const current = getTodayDate()
    setStartDate(current)
    setEndDate(current)
  }

  async function saveHousePayment(withdrawalId: number) {
    try {
      setSavingId(withdrawalId)

      await api.patch(`/api/withdrawals/${withdrawalId}/house-payment`, {
        housePaidAmount: Number(housePayments[withdrawalId] || 0),
      })

      await loadData()
      alert("Pago de casa guardado correctamente.")
    } catch (error: any) {
      console.error(error)
      alert(error.response?.data?.error || "Error guardando pago de casa.")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <AppShell title="Admin · Retiros">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#d90416] via-[#8f000c] to-[#050505] p-6 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
            Administración
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Retiros y pagos de casas
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-white/75">
            Registra cuánto pagó la casa por cada retiro. El sistema calcula la
            ganancia automáticamente.
          </p>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardContent className="p-6">
            <div className="grid gap-3 lg:grid-cols-[180px_180px_auto_auto]">
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-11 border-white/10 bg-black pl-10 text-white"
                />
              </div>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-11 border-white/10 bg-black pl-10 text-white"
                />
              </div>

              <Button
                type="button"
                onClick={setTodayFilter}
                className="h-11 bg-[#ffd400] font-bold text-black hover:bg-[#ffe766]"
              >
                Hoy
              </Button>

              <Button
                type="button"
                onClick={loadData}
                className="h-11 border border-white/10 bg-black font-bold text-white hover:bg-white/10"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Total retiros</p>
              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {formatMoney(summary.totalWithdrawn)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Pagado por casas</p>
              <p className="mt-2 text-3xl font-bold">
                {formatMoney(summary.totalPaidByHouse)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Ganancia retiros</p>
              <p className="mt-2 text-3xl font-bold text-emerald-300">
                {formatMoney(summary.totalProfit)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Pendientes de pago</p>
              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {summary.pending}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary.byHouse.map((item) => (
            <Card
              key={item.house}
              className="border-white/10 bg-[#0b0b0d] text-white"
            >
              <CardContent className="p-5">
                <p className="text-sm text-zinc-400">{item.house}</p>
                <p className="mt-2 text-2xl font-bold text-[#ffd400]">
                  {formatMoney(item.withdrawn)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Pagó: {formatMoney(item.paid)} · Ganancia:{" "}
                  {formatMoney(item.profit)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <ReceiptText className="h-5 w-5 text-[#ffd400]" />
              Detalle de retiros
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/[0.03]">
                    <TableHead className="text-zinc-400">ID</TableHead>
                    <TableHead className="text-zinc-400">Cliente</TableHead>
                    <TableHead className="text-zinc-400">Casa</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Valor retiro
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Pagó casa
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Ganancia
                    </TableHead>
                    <TableHead className="text-zinc-400">Estado</TableHead>
                    <TableHead className="text-zinc-400">Fecha</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Acción
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={9}
                        className="py-8 text-center text-zinc-400"
                      >
                        Cargando retiros...
                      </TableCell>
                    </TableRow>
                  ) : filteredWithdrawals.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={9}
                        className="py-10 text-center text-zinc-400"
                      >
                        No hay retiros en este rango.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWithdrawals.map((item) => {
                      const paid = Number(housePayments[item.id] || 0)
                      const profit = paid - Number(item.amount || 0)

                      return (
                        <TableRow key={item.id} className="border-white/10">
                          <TableCell className="font-bold">{item.id}</TableCell>

                          <TableCell>
                            <p className="font-medium text-white">
                              {item.client?.name || "-"}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {item.client?.cedula || "-"}
                            </p>
                          </TableCell>

                          <TableCell>{item.betHouse?.name || "-"}</TableCell>

                          <TableCell className="text-right font-bold text-[#ffd400]">
                            {formatMoney(item.amount)}
                          </TableCell>

                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={housePayments[item.id] || ""}
                              onChange={(e) =>
                                setHousePayments((current) => ({
                                  ...current,
                                  [item.id]: e.target.value,
                                }))
                              }
                              placeholder="0.00"
                              className="ml-auto h-9 max-w-[130px] border-white/10 bg-black text-right text-white"
                            />
                          </TableCell>

                          <TableCell className="text-right font-bold text-emerald-300">
                            {formatMoney(profit)}
                          </TableCell>

                          <TableCell>
                            <Badge className="bg-[#ffd400]/15 text-[#ffd400]">
                              {item.status}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-zinc-400">
                            {formatDate(item.createdAt)}
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              type="button"
                              onClick={() => saveHousePayment(item.id)}
                              disabled={savingId === item.id}
                              className="h-9 bg-[#d90416] font-bold text-white hover:bg-[#ff1024]"
                            >
                              <Save className="mr-2 h-4 w-4" />
                              Guardar
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}