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
  CalendarDays,
  DollarSign,
  Package,
  RefreshCcw,
  TrendingUp,
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

export default function AdminRentabilidadPage() {
  const today = getTodayDate()

  const [productSales, setProductSales] = useState<any[]>([])
  const [recharges, setRecharges] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [loading, setLoading] = useState(true)

  async function loadData() {
    try {
      setLoading(true)

      const salesRes = await api.get("/api/product-sales")
      const rechargesRes = await api.get("/api/recharges")
      const withdrawalsRes = await api.get("/api/withdrawals")

      setProductSales(Array.isArray(salesRes.data) ? salesRes.data : [])
      setRecharges(Array.isArray(rechargesRes.data) ? rechargesRes.data : [])
      setWithdrawals(Array.isArray(withdrawalsRes.data) ? withdrawalsRes.data : [])
    } catch (error) {
      console.error(error)
      alert("No se pudo cargar la rentabilidad.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = useMemo(() => {
    return {
      sales: productSales.filter((item) =>
        isDateInsideRange(item.createdAt, startDate, endDate)
      ),
      recharges: recharges.filter((item) =>
        isDateInsideRange(item.createdAt, startDate, endDate)
      ),
      withdrawals: withdrawals.filter((item) =>
        isDateInsideRange(item.createdAt, startDate, endDate)
      ),
    }
  }, [productSales, recharges, withdrawals, startDate, endDate])

  const productRows = useMemo(() => {
    return filtered.sales.map((sale) => {
      const quantity = Number(sale.quantity || 0)
      const cost = Number(sale.product?.purchasePrice || 0)
      const unitPrice = Number(sale.unitPrice || 0)
      const totalCost = cost * quantity
      const totalSale = Number(sale.total || unitPrice * quantity)
      const profit = totalSale - totalCost

      return {
        id: sale.id,
        product: sale.product?.name || "-",
        quantity,
        cost,
        unitPrice,
        totalCost,
        totalSale,
        profit,
        date: sale.createdAt,
      }
    })
  }, [filtered.sales])

  const houseRows = useMemo(() => {
    const rechargeRows = filtered.recharges
      .filter((item) => item.status !== "ANULADO")
      .map((item) => ({
        key: `recarga-${item.id}`,
        type: "RECARGA",
        id: item.id,
        client: item.client?.name || "-",
        house: item.betHouse?.name || "-",
        amount: Number(item.amount || 0),
        housePaidAmount: null,
        profit: Number(item.adminProfit || 0),
        date: item.createdAt,
      }))

    const withdrawalRows = filtered.withdrawals
      .filter((item) => item.status !== "ANULADO")
      .map((item) => ({
        key: `retiro-${item.id}`,
        type: "RETIRO",
        id: item.id,
        client: item.client?.name || "-",
        house: item.betHouse?.name || "-",
        amount: Number(item.amount || 0),
        housePaidAmount: Number(item.housePaidAmount || 0),
        profit: Number(item.adminProfit || 0),
        date: item.createdAt,
      }))

    return [...rechargeRows, ...withdrawalRows].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [filtered.recharges, filtered.withdrawals])

  const totals = useMemo(() => {
    const totalSales = productRows.reduce(
      (sum, item) => sum + Number(item.totalSale || 0),
      0
    )

    const totalCosts = productRows.reduce(
      (sum, item) => sum + Number(item.totalCost || 0),
      0
    )

    const productProfit = productRows.reduce(
      (sum, item) => sum + Number(item.profit || 0),
      0
    )

    const houseProfit = houseRows.reduce(
      (sum, item) => sum + Number(item.profit || 0),
      0
    )

    const netProfit = productProfit + houseProfit

    return {
      totalSales,
      totalCosts,
      productProfit,
      houseProfit,
      netProfit,
    }
  }, [productRows, houseRows])

  function setTodayFilter() {
    const current = getTodayDate()
    setStartDate(current)
    setEndDate(current)
  }

  return (
    <AppShell title="Admin · Rentabilidad">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#d90416] via-[#8f000c] to-[#050505] p-6 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
            Administración
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Rentabilidad general
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-white/75">
            Consulta ganancias por productos, recargas, retiros y utilidad neta
            acumulada por fecha.
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

        <div className="grid gap-4 md:grid-cols-5">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Total ventas</p>
              <p className="mt-2 text-2xl font-bold text-[#ffd400]">
                {loading ? "..." : formatMoney(totals.totalSales)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Total costos</p>
              <p className="mt-2 text-2xl font-bold">
                {loading ? "..." : formatMoney(totals.totalCosts)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Ganancia productos</p>
              <p className="mt-2 text-2xl font-bold text-emerald-300">
                {loading ? "..." : formatMoney(totals.productProfit)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Ganancia casas</p>
              <p className="mt-2 text-2xl font-bold text-[#ffd400]">
                {loading ? "..." : formatMoney(totals.houseProfit)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <DollarSign className="h-5 w-5 text-[#ffd400]" />
              <p className="mt-3 text-sm text-zinc-400">Utilidad neta</p>
              <p className="mt-2 text-2xl font-bold text-emerald-300">
                {loading ? "..." : formatMoney(totals.netProfit)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Package className="h-5 w-5 text-[#ffd400]" />
              Rentabilidad productos detallada
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/[0.03]">
                    <TableHead className="text-zinc-400">Producto</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Costo
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Precio venta
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Cantidad
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Ganancia
                    </TableHead>
                    <TableHead className="text-zinc-400">Fecha</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {productRows.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-zinc-400"
                      >
                        No hay ventas de productos en este rango.
                      </TableCell>
                    </TableRow>
                  ) : (
                    productRows.map((item) => (
                      <TableRow key={item.id} className="border-white/10">
                        <TableCell>{item.product}</TableCell>
                        <TableCell className="text-right">
                          {formatMoney(item.cost)}
                        </TableCell>
                        <TableCell className="text-right text-[#ffd400]">
                          {formatMoney(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-300">
                          {formatMoney(item.profit)}
                        </TableCell>
                        <TableCell className="text-zinc-400">
                          {formatDate(item.date)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <TrendingUp className="h-5 w-5 text-[#ffd400]" />
              Rentabilidad casas detallada
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/[0.03]">
                    <TableHead className="text-zinc-400">Tipo</TableHead>
                    <TableHead className="text-zinc-400">ID</TableHead>
                    <TableHead className="text-zinc-400">Nombre</TableHead>
                    <TableHead className="text-zinc-400">Casa</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Valor operación
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Valor entregado por casa
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Ganancia
                    </TableHead>
                    <TableHead className="text-zinc-400">Fecha</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {houseRows.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={8}
                        className="py-10 text-center text-zinc-400"
                      >
                        No hay movimientos de casas en este rango.
                      </TableCell>
                    </TableRow>
                  ) : (
                    houseRows.map((item) => (
                      <TableRow key={item.key} className="border-white/10">
                        <TableCell>
                          <Badge
                            className={
                              item.type === "RECARGA"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-[#ffd400]/15 text-[#ffd400]"
                            }
                          >
                            {item.type}
                          </Badge>
                        </TableCell>

                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.client}</TableCell>
                        <TableCell>{item.house}</TableCell>

                        <TableCell className="text-right text-[#ffd400]">
                          {formatMoney(item.amount)}
                        </TableCell>

                        <TableCell className="text-right">
                          {item.housePaidAmount === null
                            ? "-"
                            : formatMoney(item.housePaidAmount)}
                        </TableCell>

                        <TableCell className="text-right font-bold text-emerald-300">
                          {formatMoney(item.profit)}
                        </TableCell>

                        <TableCell className="text-zinc-400">
                          {formatDate(item.date)}
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