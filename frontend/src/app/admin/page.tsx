"use client"

import { useEffect, useMemo, useState } from "react"
import AppShell from "@/components/layout/AppShell"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  ArrowDownUp,
  Banknote,
  CalendarDays,
  DollarSign,
  Edit,
  Package,
  ReceiptText,
  RefreshCcw,
  Save,
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

export default function AdminPage() {
  const today = getTodayDate()

  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)

  const [dashboard, setDashboard] = useState<any>(null)
  const [recharges, setRecharges] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [cashEntries, setCashEntries] = useState<any[]>([])
  const [productSales, setProductSales] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [closings, setClosings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  const [rechargeProfits, setRechargeProfits] = useState<Record<string, string>>({})
  const [withdrawalPayments, setWithdrawalPayments] = useState<Record<string, string>>({})

  async function loadData() {
    try {
      setLoading(true)

      const [
        dashboardRes,
        rechargesRes,
        withdrawalsRes,
        cashRes,
        salesRes,
        productsRes,
        closingsRes,
      ] = await Promise.all([
        api.get("/api/dashboard"),
        api.get("/api/recharges"),
        api.get("/api/withdrawals"),
        api.get("/api/cash"),
        api.get("/api/product-sales"),
        api.get("/api/products"),
        api.get("/api/cash-closings"),
      ])

      const rechargesData = Array.isArray(rechargesRes.data) ? rechargesRes.data : []
      const withdrawalsData = Array.isArray(withdrawalsRes.data)
        ? withdrawalsRes.data
        : []

      setDashboard(dashboardRes.data || null)
      setRecharges(rechargesData)
      setWithdrawals(withdrawalsData)
      setCashEntries(Array.isArray(cashRes.data) ? cashRes.data : [])
      setProductSales(Array.isArray(salesRes.data) ? salesRes.data : [])
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : [])
      setClosings(Array.isArray(closingsRes.data) ? closingsRes.data : [])

      const rechargeProfitValues: Record<string, string> = {}
      for (const item of rechargesData) {
        rechargeProfitValues[item.id] = String(item.adminProfit || "")
      }
      setRechargeProfits(rechargeProfitValues)

      const withdrawalPaymentValues: Record<string, string> = {}
      for (const item of withdrawalsData) {
        withdrawalPaymentValues[item.id] = String(item.housePaidAmount || "")
      }
      setWithdrawalPayments(withdrawalPaymentValues)
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

  const filtered = useMemo(() => {
    const rangeRecharges = recharges.filter((item) =>
      isDateInsideRange(item.createdAt, startDate, endDate)
    )

    const rangeWithdrawals = withdrawals.filter((item) =>
      isDateInsideRange(item.createdAt, startDate, endDate)
    )

    const rangeCashEntries = cashEntries.filter((item) =>
      isDateInsideRange(item.createdAt, startDate, endDate)
    )

    const rangeSales = productSales.filter((item) =>
      isDateInsideRange(item.createdAt, startDate, endDate)
    )

    const rangeClosings = closings.filter((item) =>
      isDateInsideRange(item.closingDate || item.createdAt, startDate, endDate)
    )

    return {
      recharges: rangeRecharges,
      withdrawals: rangeWithdrawals,
      cashEntries: rangeCashEntries,
      sales: rangeSales,
      closings: rangeClosings,
    }
  }, [recharges, withdrawals, cashEntries, productSales, closings, startDate, endDate])

  const totals = useMemo(() => {
    const totalRecharges = filtered.recharges
      .filter((item) => item.status !== "ANULADO")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const totalWithdrawals = filtered.withdrawals
      .filter((item) => item.status !== "ANULADO")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const pendingWithdrawals = filtered.withdrawals.filter(
      (item) => item.status !== "COMPENSADO" && item.status !== "ANULADO"
    )

    const totalCash = filtered.cashEntries.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    )

    const totalProductSales = filtered.sales.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    )

    const totalProductCost = filtered.sales.reduce((sum, item) => {
      const cost = Number(item.product?.purchasePrice || 0)
      const quantity = Number(item.quantity || 0)
      return sum + cost * quantity
    }, 0)

    const productProfit = totalProductSales - totalProductCost

    const rechargeProfit = filtered.recharges.reduce(
      (sum, item) => sum + Number(item.adminProfit || 0),
      0
    )

    const withdrawalProfit = filtered.withdrawals.reduce(
      (sum, item) => sum + Number(item.adminProfit || 0),
      0
    )

    const houseProfit = rechargeProfit + withdrawalProfit
    const netProfit = productProfit + houseProfit

    const totalStock = products.reduce(
      (sum, item) => sum + Number(item.stock || 0),
      0
    )

    const stockCost = products.reduce(
      (sum, item) =>
        sum + Number(item.stock || 0) * Number(item.purchasePrice || 0),
      0
    )

    return {
      totalRecharges,
      totalWithdrawals,
      pendingWithdrawals,
      totalCash,
      totalProductSales,
      totalProductCost,
      productProfit,
      rechargeProfit,
      withdrawalProfit,
      houseProfit,
      netProfit,
      totalStock,
      stockCost,
    }
  }, [filtered, products])

  const rechargesByHouse = useMemo(() => {
    const map = new Map<string, { house: string; total: number; profit: number; count: number }>()

    for (const item of filtered.recharges) {
      if (item.status === "ANULADO") continue

      const house = item.betHouse?.name || "-"
      const current = map.get(house) || {
        house,
        total: 0,
        profit: 0,
        count: 0,
      }

      current.total += Number(item.amount || 0)
      current.profit += Number(item.adminProfit || 0)
      current.count += 1

      map.set(house, current)
    }

    return Array.from(map.values())
  }, [filtered.recharges])

  const withdrawalsByHouse = useMemo(() => {
    const map = new Map<string, { house: string; total: number; paid: number; profit: number; count: number }>()

    for (const item of filtered.withdrawals) {
      if (item.status === "ANULADO") continue

      const house = item.betHouse?.name || "-"
      const current = map.get(house) || {
        house,
        total: 0,
        paid: 0,
        profit: 0,
        count: 0,
      }

      current.total += Number(item.amount || 0)
      current.paid += Number(item.housePaidAmount || 0)
      current.profit += Number(item.adminProfit || 0)
      current.count += 1

      map.set(house, current)
    }

    return Array.from(map.values())
  }, [filtered.withdrawals])

  const profitabilityProducts = useMemo(() => {
    return filtered.sales.map((sale) => {
      const cost = Number(sale.product?.purchasePrice || 0)
      const unitPrice = Number(sale.unitPrice || 0)
      const quantity = Number(sale.quantity || 0)
      const profit = (unitPrice - cost) * quantity

      return {
        id: sale.id,
        product: sale.product?.name || "-",
        cost,
        unitPrice,
        quantity,
        profit,
        date: sale.createdAt,
      }
    })
  }, [filtered.sales])

  const profitabilityHouses = useMemo(() => {
    const rechargeRows = filtered.recharges.map((item) => ({
      id: `REC-${item.id}`,
      type: "RECARGA",
      client: item.client?.name || "-",
      house: item.betHouse?.name || "-",
      amount: Number(item.amount || 0),
      housePaidAmount: null,
      profit: Number(item.adminProfit || 0),
      date: item.createdAt,
    }))

    const withdrawalRows = filtered.withdrawals.map((item) => ({
      id: `RET-${item.id}`,
      type: "RETIRO",
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

  async function saveRechargeProfit(rechargeId: number) {
    try {
      setSavingId(`recharge-${rechargeId}`)

      await api.patch(`/api/recharges/${rechargeId}/profit`, {
        adminProfit: Number(rechargeProfits[rechargeId] || 0),
      })

      await loadData()
      alert("Ganancia de recarga actualizada.")
    } catch (error: any) {
      console.error(error)
      alert(error.response?.data?.error || "Error actualizando ganancia.")
    } finally {
      setSavingId(null)
    }
  }

  async function saveWithdrawalPayment(withdrawalId: number) {
    try {
      setSavingId(`withdrawal-${withdrawalId}`)

      await api.patch(`/api/withdrawals/${withdrawalId}/house-payment`, {
        housePaidAmount: Number(withdrawalPayments[withdrawalId] || 0),
      })

      await loadData()
      alert("Pago de casa actualizado.")
    } catch (error: any) {
      console.error(error)
      alert(error.response?.data?.error || "Error actualizando pago de casa.")
    } finally {
      setSavingId(null)
    }
  }

  function setTodayFilter() {
    const current = getTodayDate()
    setStartDate(current)
    setEndDate(current)
  }

  return (
    <AppShell title="Panel Admin">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#d90416] via-[#8f000c] to-[#050505] p-6 shadow-2xl">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
                Administración
              </p>

              <h1 className="mt-2 text-3xl font-bold text-white">
                Panel del administrador
              </h1>

              <p className="mt-2 text-sm text-white/75">
                Control general de recargas, retiros, caja, ventas, stock y rentabilidad.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[180px_180px_auto_auto]">
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
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <Wallet className="h-5 w-5 text-[#ffd400]" />
              <p className="mt-3 text-sm text-zinc-400">Recargas</p>
              <p className="mt-1 text-3xl font-bold text-[#ffd400]">
                {loading ? "..." : formatMoney(totals.totalRecharges)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <ReceiptText className="h-5 w-5 text-[#ffd400]" />
              <p className="mt-3 text-sm text-zinc-400">Retiros</p>
              <p className="mt-1 text-3xl font-bold">
                {loading ? "..." : formatMoney(totals.totalWithdrawals)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <ArrowDownUp className="h-5 w-5 text-[#ffd400]" />
              <p className="mt-3 text-sm text-zinc-400">Pendientes</p>
              <p className="mt-1 text-3xl font-bold text-[#ffd400]">
                {loading ? "..." : totals.pendingWithdrawals.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <Banknote className="h-5 w-5 text-[#ffd400]" />
              <p className="mt-3 text-sm text-zinc-400">Caja recibida</p>
              <p className="mt-1 text-3xl font-bold">
                {loading ? "..." : formatMoney(totals.totalCash)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <Package className="h-5 w-5 text-[#ffd400]" />
              <p className="mt-3 text-sm text-zinc-400">Ventas productos</p>
              <p className="mt-1 text-3xl font-bold text-[#ffd400]">
                {loading ? "..." : formatMoney(totals.totalProductSales)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Total ventas</p>
              <p className="mt-2 text-2xl font-bold text-[#ffd400]">
                {formatMoney(totals.totalProductSales)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Total costos</p>
              <p className="mt-2 text-2xl font-bold">
                {formatMoney(totals.totalProductCost)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Ganancia productos</p>
              <p className="mt-2 text-2xl font-bold text-emerald-300">
                {formatMoney(totals.productProfit)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Ganancia casas</p>
              <p className="mt-2 text-2xl font-bold text-[#ffd400]">
                {formatMoney(totals.houseProfit)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Utilidad neta</p>
              <p className="mt-2 text-2xl font-bold text-emerald-300">
                {formatMoney(totals.netProfit)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Wallet className="h-5 w-5 text-[#ffd400]" />
              Recargas por fecha
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="mb-5 grid gap-4 md:grid-cols-4">
              {rechargesByHouse.map((item) => (
                <div
                  key={item.house}
                  className="rounded-2xl border border-white/10 bg-black p-4"
                >
                  <p className="text-sm text-zinc-400">{item.house}</p>
                  <p className="mt-1 text-xl font-bold text-[#ffd400]">
                    {formatMoney(item.total)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Ganancia: {formatMoney(item.profit)} · {item.count} ops
                  </p>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-zinc-400">ID</TableHead>
                    <TableHead className="text-zinc-400">Nombre</TableHead>
                    <TableHead className="text-zinc-400">Casa</TableHead>
                    <TableHead className="text-right text-zinc-400">Valor recarga</TableHead>
                    <TableHead className="text-right text-zinc-400">Ganancia</TableHead>
                    <TableHead className="text-zinc-400">Fecha</TableHead>
                    <TableHead className="text-right text-zinc-400">Acción</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.recharges.map((item) => (
                    <TableRow key={item.id} className="border-white/10">
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.client?.name || "-"}</TableCell>
                      <TableCell>{item.betHouse?.name || "-"}</TableCell>
                      <TableCell className="text-right font-bold text-[#ffd400]">
                        {formatMoney(item.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={rechargeProfits[item.id] || ""}
                          onChange={(e) =>
                            setRechargeProfits((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="0.00"
                          className="ml-auto h-9 max-w-[120px] border-white/10 bg-black text-right text-white"
                        />
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          onClick={() => saveRechargeProfit(item.id)}
                          disabled={savingId === `recharge-${item.id}`}
                          className="h-9 bg-[#d90416] font-bold text-white hover:bg-[#ff1024]"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Guardar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <ReceiptText className="h-5 w-5 text-[#ffd400]" />
              Retiros por fecha
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="mb-5 grid gap-4 md:grid-cols-4">
              {withdrawalsByHouse.map((item) => (
                <div
                  key={item.house}
                  className="rounded-2xl border border-white/10 bg-black p-4"
                >
                  <p className="text-sm text-zinc-400">{item.house}</p>
                  <p className="mt-1 text-xl font-bold text-[#ffd400]">
                    {formatMoney(item.total)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Pagó: {formatMoney(item.paid)} · Ganancia:{" "}
                    {formatMoney(item.profit)}
                  </p>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-zinc-400">ID</TableHead>
                    <TableHead className="text-zinc-400">Nombre</TableHead>
                    <TableHead className="text-zinc-400">Casa</TableHead>
                    <TableHead className="text-right text-zinc-400">Valor retiro</TableHead>
                    <TableHead className="text-right text-zinc-400">Pagó casa</TableHead>
                    <TableHead className="text-right text-zinc-400">Ganancia</TableHead>
                    <TableHead className="text-zinc-400">Fecha</TableHead>
                    <TableHead className="text-right text-zinc-400">Acción</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.withdrawals.map((item) => {
                    const paid = Number(withdrawalPayments[item.id] || 0)
                    const profit = paid - Number(item.amount || 0)

                    return (
                      <TableRow key={item.id} className="border-white/10">
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.client?.name || "-"}</TableCell>
                        <TableCell>{item.betHouse?.name || "-"}</TableCell>
                        <TableCell className="text-right font-bold text-[#ffd400]">
                          {formatMoney(item.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={withdrawalPayments[item.id] || ""}
                            onChange={(e) =>
                              setWithdrawalPayments((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            placeholder="0.00"
                            className="ml-auto h-9 max-w-[120px] border-white/10 bg-black text-right text-white"
                          />
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-300">
                          {formatMoney(profit)}
                        </TableCell>
                        <TableCell className="text-zinc-400">
                          {formatDate(item.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            onClick={() => saveWithdrawalPayment(item.id)}
                            disabled={savingId === `withdrawal-${item.id}`}
                            className="h-9 bg-[#d90416] font-bold text-white hover:bg-[#ff1024]"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Guardar
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-xl font-bold">Stock productos</CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black p-4">
                  <p className="text-sm text-zinc-500">Unidades en stock</p>
                  <p className="mt-1 text-2xl font-bold text-[#ffd400]">
                    {totals.totalStock}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black p-4">
                  <p className="text-sm text-zinc-500">Costo inventario</p>
                  <p className="mt-1 text-2xl font-bold">
                    {formatMoney(totals.stockCost)}
                  </p>
                </div>
              </div>

              <div className="max-h-[420px] overflow-auto rounded-2xl border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-zinc-400">Producto</TableHead>
                      <TableHead className="text-right text-zinc-400">Costo</TableHead>
                      <TableHead className="text-right text-zinc-400">Venta</TableHead>
                      <TableHead className="text-right text-zinc-400">Stock</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {products.map((item) => (
                      <TableRow key={item.id} className="border-white/10">
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">
                          {formatMoney(item.purchasePrice)}
                        </TableCell>
                        <TableCell className="text-right text-[#ffd400]">
                          {formatMoney(item.salePrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-white/10 text-zinc-300">
                            {item.stock}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-xl font-bold">Caja y cuadre</CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <div className="mb-4 rounded-2xl border border-white/10 bg-black p-4">
                <p className="text-sm text-zinc-500">Movimientos de caja</p>
                <p className="mt-1 text-2xl font-bold text-[#ffd400]">
                  {formatMoney(totals.totalCash)}
                </p>
              </div>

              <div className="max-h-[420px] overflow-auto rounded-2xl border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-zinc-400">Fecha cierre</TableHead>
                      <TableHead className="text-right text-zinc-400">Esperado</TableHead>
                      <TableHead className="text-right text-zinc-400">Real</TableHead>
                      <TableHead className="text-right text-zinc-400">Diferencia</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filtered.closings.map((item) => (
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <TrendingUp className="h-5 w-5 text-[#ffd400]" />
              Rentabilidad productos detallada
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-zinc-400">Producto</TableHead>
                    <TableHead className="text-right text-zinc-400">Costo</TableHead>
                    <TableHead className="text-right text-zinc-400">Precio venta</TableHead>
                    <TableHead className="text-right text-zinc-400">Cantidad</TableHead>
                    <TableHead className="text-right text-zinc-400">Ganancia</TableHead>
                    <TableHead className="text-zinc-400">Fecha</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {profitabilityProducts.map((item) => (
                    <TableRow key={item.id} className="border-white/10">
                      <TableCell>{item.product}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(item.cost)}
                      </TableCell>
                      <TableCell className="text-right text-[#ffd400]">
                        {formatMoney(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-300">
                        {formatMoney(item.profit)}
                      </TableCell>
                      <TableCell>{formatDate(item.date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <DollarSign className="h-5 w-5 text-[#ffd400]" />
              Rentabilidad casas detallada
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-zinc-400">Tipo</TableHead>
                    <TableHead className="text-zinc-400">ID</TableHead>
                    <TableHead className="text-zinc-400">Nombre</TableHead>
                    <TableHead className="text-zinc-400">Casa</TableHead>
                    <TableHead className="text-right text-zinc-400">Valor operación</TableHead>
                    <TableHead className="text-right text-zinc-400">Valor pagado casa</TableHead>
                    <TableHead className="text-right text-zinc-400">Ganancia</TableHead>
                    <TableHead className="text-zinc-400">Fecha</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {profitabilityHouses.map((item) => (
                    <TableRow key={item.id} className="border-white/10">
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
                      <TableCell>{formatDate(item.date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}