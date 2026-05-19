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
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  History,
  PiggyBank,
  ReceiptText,
  RefreshCcw,
  Save,
  Wallet,
} from "lucide-react"

const bankKeys = [
  { key: "cash", label: "Efectivo" },
  { key: "coopmego", label: "Coopmego" },
  { key: "guayaquil", label: "Banco Guayaquil" },
  { key: "pichincha", label: "Pichincha" },
  { key: "jep", label: "JEP" },
  { key: "produbanco", label: "Produbanco" },
]

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

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function isDateInsideRange(dateValue, selectedDate) {
  if (!dateValue) return false

  const itemDate = new Date(dateValue)
  const start = new Date(`${selectedDate}T00:00:00`)
  const end = new Date(`${selectedDate}T23:59:59`)

  return itemDate >= start && itemDate <= end
}

function getBankFromNotes(notes) {
  if (!notes) return ""

  const match = String(notes).match(/Banco:\s*([^|]+)/i)

  if (!match) return ""

  return match[1].trim()
}

function normalizeBankKey(bankName) {
  const text = String(bankName || "").toLowerCase().trim()

  if (!text) return null
  if (text.includes("coopmego")) return "coopmego"
  if (text.includes("guayaquil")) return "guayaquil"
  if (text.includes("pichincha")) return "pichincha"
  if (text.includes("jep")) return "jep"
  if (text.includes("produbanco")) return "produbanco"

  return null
}

function createEmptyValues() {
  return {
    cash: "",
    coopmego: "",
    guayaquil: "",
    pichincha: "",
    jep: "",
    produbanco: "",
  }
}

function createEmptyNumbers() {
  return {
    cash: 0,
    coopmego: 0,
    guayaquil: 0,
    pichincha: 0,
    jep: 0,
    produbanco: 0,
  }
}

export default function CuadrePage() {
  const today = getTodayDate()

  const [selectedDate, setSelectedDate] = useState(today)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [recharges, setRecharges] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [cashEntries, setCashEntries] = useState([])
  const [productSales, setProductSales] = useState([])
  const [closings, setClosings] = useState([])

  const [realValues, setRealValues] = useState(createEmptyValues())
  const [notes, setNotes] = useState("")

  async function loadData() {
    try {
      setLoading(true)

      const [rechargesRes, withdrawalsRes, cashRes, salesRes] =
        await Promise.all([
          api.get("/api/recharges"),
          api.get("/api/withdrawals"),
          api.get("/api/cash"),
          api.get("/api/product-sales"),
        ])

      setRecharges(Array.isArray(rechargesRes.data) ? rechargesRes.data : [])
      setWithdrawals(
        Array.isArray(withdrawalsRes.data) ? withdrawalsRes.data : []
      )
      setCashEntries(Array.isArray(cashRes.data) ? cashRes.data : [])
      setProductSales(Array.isArray(salesRes.data) ? salesRes.data : [])

      try {
        const closingsRes = await api.get("/api/cash-closings")
        setClosings(Array.isArray(closingsRes.data) ? closingsRes.data : [])
      } catch {
        setClosings([])
      }
    } catch (error) {
      console.error(error)
      alert("No se pudieron cargar los datos. Revisa que el backend esté encendido.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const dayData = useMemo(() => {
    const dayRecharges = recharges.filter((item) =>
      isDateInsideRange(item.createdAt, selectedDate)
    )

    const dayWithdrawals = withdrawals.filter((item) =>
      isDateInsideRange(item.createdAt, selectedDate)
    )

    const dayCashEntries = cashEntries.filter((item) =>
      isDateInsideRange(item.createdAt, selectedDate)
    )

    const dayProductSales = productSales.filter((item) =>
      isDateInsideRange(item.createdAt, selectedDate)
    )

    return {
      recharges: dayRecharges,
      withdrawals: dayWithdrawals,
      cashEntries: dayCashEntries,
      productSales: dayProductSales,
    }
  }, [recharges, withdrawals, cashEntries, productSales, selectedDate])

  const expectedByAccount = useMemo(() => {
    const values = createEmptyNumbers()

    for (const recharge of dayData.recharges) {
      if (recharge.status === "ANULADO") continue

      const amount = Number(recharge.amount || 0)

      if (recharge.paymentMethod === "EFECTIVO") {
        values.cash += amount
        continue
      }

      if (recharge.paymentMethod === "TRANSFERENCIA") {
        const bank = normalizeBankKey(getBankFromNotes(recharge.notes))

        if (bank) values[bank] += amount
      }
    }

    for (const entry of dayData.cashEntries) {
      const amount = Number(entry.amount || 0)

      if (entry.paymentMethod === "EFECTIVO") {
        values.cash += amount
        continue
      }

      if (entry.paymentMethod === "TRANSFERENCIA") {
        const bank = normalizeBankKey(getBankFromNotes(entry.notes))

        if (bank) values[bank] += amount
      }
    }

    for (const sale of dayData.productSales) {
      const amount = Number(sale.total || 0)

      if (sale.paymentMethod === "EFECTIVO") {
        values.cash += amount
      }
    }

    return values
  }, [dayData])

  const totals = useMemo(() => {
    const totalRecharges = dayData.recharges
      .filter((item) => item.status !== "ANULADO")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const totalWithdrawals = dayData.withdrawals
      .filter((item) => item.status !== "ANULADO")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const totalHousePayments = dayData.cashEntries.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    )

    const totalProductSales = dayData.productSales.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    )

    const expectedTotal = bankKeys.reduce(
      (sum, item) => sum + Number(expectedByAccount[item.key] || 0),
      0
    )

    const realTotal = bankKeys.reduce(
      (sum, item) => sum + Number(realValues[item.key] || 0),
      0
    )

    const differenceTotal = realTotal - expectedTotal

    return {
      totalRecharges,
      totalWithdrawals,
      totalHousePayments,
      totalProductSales,
      expectedTotal,
      realTotal,
      differenceTotal,
    }
  }, [dayData, expectedByAccount, realValues])

  function updateRealValue(key, value) {
    setRealValues((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function fillExpectedValues() {
    setRealValues({
      cash: String(expectedByAccount.cash || ""),
      coopmego: String(expectedByAccount.coopmego || ""),
      guayaquil: String(expectedByAccount.guayaquil || ""),
      pichincha: String(expectedByAccount.pichincha || ""),
      jep: String(expectedByAccount.jep || ""),
      produbanco: String(expectedByAccount.produbanco || ""),
    })
  }

  function clearRealValues() {
    setRealValues(createEmptyValues())
    setNotes("")
  }

  async function saveClosing() {
    try {
      const confirmSave = confirm(
        "¿Deseas guardar el cierre de caja de este día?"
      )

      if (!confirmSave) return

      setSaving(true)

      await api.post("/api/cash-closings", {
        closingDate: selectedDate,
        expectedValues: expectedByAccount,
        realValues,
        summary: totals,
        notes,
      })

      await loadData()
      alert("Cierre de caja guardado correctamente.")
    } catch (error) {
      console.error(error)
      alert(
        error.response?.data?.error ||
          "No se pudo guardar el cierre de caja."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell title="Cuadre">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#d90416] via-[#8f000c] to-[#050505] p-6 shadow-2xl">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
                Cierre general
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Cuadre diario de caja
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-white/75">
                Aquí se cruzan recargas, pagos de casas, ventas de productos,
                efectivo y cuentas bancarias. El sistema calcula lo esperado y
                tú ingresas lo real para ver diferencias.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-11 border-white/10 bg-black pl-10 text-white"
                />
              </div>

              <Button
                type="button"
                onClick={loadData}
                className="h-11 border border-white/10 bg-black font-semibold text-white hover:bg-white/10"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">Recargas</p>
                <Wallet className="h-5 w-5 text-[#ffd400]" />
              </div>
              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {formatMoney(totals.totalRecharges)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">Pagos de casas</p>
                <PiggyBank className="h-5 w-5 text-[#ffd400]" />
              </div>
              <p className="mt-2 text-3xl font-bold">
                {formatMoney(totals.totalHousePayments)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">Ventas productos</p>
                <ReceiptText className="h-5 w-5 text-[#ffd400]" />
              </div>
              <p className="mt-2 text-3xl font-bold">
                {formatMoney(totals.totalProductSales)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Total esperado</p>
              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {formatMoney(totals.expectedTotal)}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Lo que el sistema calcula según movimientos.
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Total real ingresado</p>
              <p className="mt-2 text-3xl font-bold">
                {formatMoney(totals.realTotal)}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Lo que realmente cuentas en efectivo y bancos.
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Diferencia total</p>
              <p
                className={`mt-2 text-3xl font-bold ${
                  totals.differenceTotal === 0
                    ? "text-emerald-300"
                    : "text-[#ffd400]"
                }`}
              >
                {formatMoney(totals.differenceTotal)}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Real ingresado menos total esperado.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <ClipboardCheck className="h-5 w-5 text-[#ffd400]" />
              Cuadre por efectivo y cuentas
            </CardTitle>
            <p className="text-sm text-zinc-400">
              El sistema calcula lo esperado. Ingresa lo que realmente existe en
              efectivo y en cada cuenta bancaria.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                onClick={fillExpectedValues}
                className="h-11 bg-[#ffd400] font-semibold text-black hover:bg-[#ffe766]"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Llenar con esperado
              </Button>

              <Button
                type="button"
                onClick={clearRealValues}
                className="h-11 border border-white/10 bg-black font-semibold text-white hover:bg-white/10"
              >
                Limpiar real
              </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/[0.03] hover:bg-white/[0.03]">
                    <TableHead className="text-zinc-400">Cuenta</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Esperado sistema
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Real contado/revisado
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Diferencia
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {bankKeys.map((account) => {
                    const expected = Number(expectedByAccount[account.key] || 0)
                    const real = Number(realValues[account.key] || 0)
                    const difference = real - expected

                    return (
                      <TableRow
                        key={account.key}
                        className="border-white/10 hover:bg-white/[0.03]"
                      >
                        <TableCell className="font-medium text-white">
                          {account.label}
                        </TableCell>

                        <TableCell className="text-right font-bold text-[#ffd400]">
                          {formatMoney(expected)}
                        </TableCell>

                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={realValues[account.key]}
                            onChange={(e) =>
                              updateRealValue(account.key, e.target.value)
                            }
                            placeholder="0.00"
                            className="ml-auto h-10 max-w-[160px] border-white/10 bg-black text-right text-white placeholder:text-zinc-600"
                          />
                        </TableCell>

                        <TableCell
                          className={`text-right font-bold ${
                            difference === 0
                              ? "text-emerald-300"
                              : "text-[#ffd400]"
                          }`}
                        >
                          {formatMoney(difference)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label className="text-zinc-300">Observación del cierre</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Cuadre correcto / falta revisar comprobante JEP..."
                  className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={saveClosing}
                  disabled={saving}
                  className="h-11 w-full bg-[#d90416] px-8 font-semibold text-white hover:bg-[#ff1024] md:w-auto"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Guardando..." : "Guardar cierre del día"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <History className="h-5 w-5 text-[#ffd400]" />
              Historial de cierres
            </CardTitle>
            <p className="text-sm text-zinc-400">
              Aquí aparecerán los días en los que se guardó el cierre de caja.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/[0.03] hover:bg-white/[0.03]">
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
                    <TableHead className="text-zinc-400">Guardado</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-zinc-400"
                      >
                        Cargando cierres...
                      </TableCell>
                    </TableRow>
                  ) : closings.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-zinc-400"
                      >
                        Aún no hay cierres guardados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    closings.map((closing) => (
                      <TableRow
                        key={closing.id}
                        className="border-white/10 hover:bg-white/[0.03]"
                      >
                        <TableCell className="font-medium text-white">
                          {closing.closingDate?.slice(0, 10)}
                        </TableCell>

                        <TableCell className="text-right text-[#ffd400]">
                          {formatMoney(closing.expectedTotal)}
                        </TableCell>

                        <TableCell className="text-right">
                          {formatMoney(closing.realTotal)}
                        </TableCell>

                        <TableCell className="text-right">
                          <Badge
                            className={
                              Number(closing.differenceTotal || 0) === 0
                                ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15"
                                : "bg-[#ffd400]/15 text-[#ffd400] hover:bg-[#ffd400]/15"
                            }
                          >
                            {formatMoney(closing.differenceTotal)}
                          </Badge>
                        </TableCell>

                        <TableCell className="max-w-[260px] truncate text-zinc-400">
                          {closing.notes || "-"}
                        </TableCell>

                        <TableCell className="text-zinc-500">
                          {formatDate(closing.createdAt)}
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