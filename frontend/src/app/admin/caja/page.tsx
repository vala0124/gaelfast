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
import {
  Banknote,
  CalendarDays,
  Landmark,
  RefreshCcw,
  Store,
} from "lucide-react"

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
    dateStyle: "medium",
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

export default function AdminCajaPage() {
  const today = getTodayDate()

  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [cashBoxes, setCashBoxes] = useState<any[]>([])
  const [closings, setClosings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    try {
      setLoading(true)

      const cashBoxesRes = await api.get("/api/daily-cash-box/history")
      const closingsRes = await api.get("/api/cash-closings")

      setCashBoxes(Array.isArray(cashBoxesRes.data) ? cashBoxesRes.data : [])
      setClosings(Array.isArray(closingsRes.data) ? closingsRes.data : [])
    } catch (error) {
      console.error(error)
      alert("No se pudo cargar caja admin.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredCashBoxes = useMemo(() => {
    return cashBoxes.filter((item) =>
      isDateInsideRange(item.date, startDate, endDate)
    )
  }, [cashBoxes, startDate, endDate])

  const filteredClosings = useMemo(() => {
    return closings.filter((item) =>
      isDateInsideRange(item.closingDate || item.createdAt, startDate, endDate)
    )
  }, [closings, startDate, endDate])

  const totals = useMemo(() => {
    const totalSalesInitialCash = filteredCashBoxes.reduce(
      (sum, item) => sum + Number(item.salesInitialCash || 0),
      0
    )

    const totalBankInitialBalance = filteredCashBoxes.reduce(
      (sum, item) => sum + Number(item.totalBankInitialBalance || 0),
      0
    )

    const totalHouseInitialBalance = filteredCashBoxes.reduce(
      (sum, item) => sum + Number(item.totalHouseInitialBalance || 0),
      0
    )

    const totalOpening =
      totalSalesInitialCash + totalBankInitialBalance + totalHouseInitialBalance

    const totalExpectedClosing = filteredClosings.reduce(
      (sum, item) => sum + Number(item.expectedTotal || 0),
      0
    )

    const totalRealClosing = filteredClosings.reduce(
      (sum, item) => sum + Number(item.realTotal || 0),
      0
    )

    const totalDifference = filteredClosings.reduce(
      (sum, item) => sum + Number(item.differenceTotal || 0),
      0
    )

    return {
      totalSalesInitialCash,
      totalBankInitialBalance,
      totalHouseInitialBalance,
      totalOpening,
      totalExpectedClosing,
      totalRealClosing,
      totalDifference,
    }
  }, [filteredCashBoxes, filteredClosings])

  function setTodayFilter() {
    const current = getTodayDate()
    setStartDate(current)
    setEndDate(current)
  }

  return (
    <AppShell title="Admin · Caja">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#d90416] via-[#8f000c] to-[#050505] p-6 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
            Administración
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Caja y cuadre
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-white/75">
            Consulta el historial de caja inicial, saldos de bancos, saldos de
            casas y cierres diarios.
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
              <Store className="h-5 w-5 text-[#ffd400]" />
              <p className="mt-3 text-sm text-zinc-400">Caja inicial ventas</p>
              <p className="mt-2 text-2xl font-bold text-[#ffd400]">
                {formatMoney(totals.totalSalesInitialCash)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <Banknote className="h-5 w-5 text-[#ffd400]" />
              <p className="mt-3 text-sm text-zinc-400">Saldo bancos</p>
              <p className="mt-2 text-2xl font-bold">
                {formatMoney(totals.totalBankInitialBalance)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <Landmark className="h-5 w-5 text-[#ffd400]" />
              <p className="mt-3 text-sm text-zinc-400">Saldo casas</p>
              <p className="mt-2 text-2xl font-bold">
                {formatMoney(totals.totalHouseInitialBalance)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Total apertura</p>
              <p className="mt-2 text-2xl font-bold text-[#ffd400]">
                {formatMoney(totals.totalOpening)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-xl font-bold">
              Historial de cajas iniciales
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/[0.03]">
                    <TableHead className="text-zinc-400">Fecha</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Caja ventas
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Bancos
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Casas
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Total apertura
                    </TableHead>
                    <TableHead className="text-zinc-400">Observación</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-zinc-400"
                      >
                        Cargando cajas...
                      </TableCell>
                    </TableRow>
                  ) : filteredCashBoxes.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-zinc-400"
                      >
                        No hay cajas registradas en este rango.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCashBoxes.map((item) => {
                      const totalOpening =
                        Number(item.salesInitialCash || 0) +
                        Number(item.totalBankInitialBalance || 0) +
                        Number(item.totalHouseInitialBalance || 0)

                      return (
                        <TableRow key={item.id} className="border-white/10">
                          <TableCell>{formatDate(item.date)}</TableCell>

                          <TableCell className="text-right text-[#ffd400]">
                            {formatMoney(item.salesInitialCash)}
                          </TableCell>

                          <TableCell className="text-right">
                            {formatMoney(item.totalBankInitialBalance)}
                          </TableCell>

                          <TableCell className="text-right">
                            {formatMoney(item.totalHouseInitialBalance)}
                          </TableCell>

                          <TableCell className="text-right font-bold text-[#ffd400]">
                            {formatMoney(totalOpening)}
                          </TableCell>

                          <TableCell className="text-zinc-400">
                            {item.notes || "-"}
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

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Cierre esperado</p>
              <p className="mt-2 text-2xl font-bold text-[#ffd400]">
                {formatMoney(totals.totalExpectedClosing)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Cierre real</p>
              <p className="mt-2 text-2xl font-bold">
                {formatMoney(totals.totalRealClosing)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Diferencia total</p>
              <p
                className={`mt-2 text-2xl font-bold ${
                  Number(totals.totalDifference || 0) === 0
                    ? "text-emerald-300"
                    : "text-[#ffd400]"
                }`}
              >
                {formatMoney(totals.totalDifference)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-xl font-bold">
              Historial de cuadres diarios
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/[0.03]">
                    <TableHead className="text-zinc-400">Fecha cierre</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Esperado
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Real
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Diferencia
                    </TableHead>
                    <TableHead className="text-zinc-400">Observación</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredClosings.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={5}
                        className="py-10 text-center text-zinc-400"
                      >
                        No hay cuadres guardados en este rango.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClosings.map((item) => (
                      <TableRow key={item.id} className="border-white/10">
                        <TableCell>{formatDate(item.closingDate)}</TableCell>

                        <TableCell className="text-right text-[#ffd400]">
                          {formatMoney(item.expectedTotal)}
                        </TableCell>

                        <TableCell className="text-right">
                          {formatMoney(item.realTotal)}
                        </TableCell>

                        <TableCell className="text-right">
                          <Badge
                            className={
                              Number(item.differenceTotal || 0) === 0
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-orange-500/15 text-orange-300"
                            }
                          >
                            {formatMoney(item.differenceTotal)}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-zinc-400">
                          {item.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))
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