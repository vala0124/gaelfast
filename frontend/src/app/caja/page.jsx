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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  CreditCard,
  Landmark,
  ReceiptText,
  Search,
  WalletCards,
} from "lucide-react"

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

function isDateInsideRange(dateValue, startDate, endDate) {
  if (!dateValue) return false

  const itemDate = new Date(dateValue)
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T23:59:59`)

  return itemDate >= start && itemDate <= end
}

export default function CajaPage() {
  const today = getTodayDate()

  const [cashEntries, setCashEntries] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [banks, setBanks] = useState([])
  const [betHouses, setBetHouses] = useState([])
  const [houseBalances, setHouseBalances] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)

  const [form, setForm] = useState({
    withdrawalId: "",
    amount: "",
    paymentMethod: "TRANSFERENCIA",
    bankName: "",
    receiptNumber: "",
    notes: "",
  })

  const [balanceForm, setBalanceForm] = useState({
    betHouseId: "",
    date: today,
    amount: "",
    notes: "",
  })

  async function loadData() {
    try {
      setLoading(true)

      const [cashRes, withdrawalsRes, banksRes, housesRes, balancesRes] =
        await Promise.all([
          api.get("/api/cash"),
          api.get("/api/withdrawals"),
          api.get("/api/banks"),
          api.get("/api/bet-houses"),
          api.get("/api/house-balances"),
        ])

      setCashEntries(Array.isArray(cashRes.data) ? cashRes.data : [])
      setWithdrawals(Array.isArray(withdrawalsRes.data) ? withdrawalsRes.data : [])
      setBanks(Array.isArray(banksRes.data) ? banksRes.data : [])
      setBetHouses(Array.isArray(housesRes.data) ? housesRes.data : [])
      setHouseBalances(Array.isArray(balancesRes.data) ? balancesRes.data : [])
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

  const selectableWithdrawals = useMemo(() => {
    return withdrawals.filter((item) => {
      return item.status !== "COMPENSADO" && item.status !== "ANULADO"
    })
  }, [withdrawals])

  const selectedWithdrawal = useMemo(() => {
    return withdrawals.find((item) => String(item.id) === String(form.withdrawalId))
  }, [withdrawals, form.withdrawalId])

  const remainingDifference = selectedWithdrawal
    ? Number(selectedWithdrawal.difference || 0)
    : 0

  const projectedDifference = selectedWithdrawal
    ? Number(selectedWithdrawal.difference || 0) - Number(form.amount || 0)
    : 0

  function resetForm() {
    setForm({
      withdrawalId: "",
      amount: "",
      paymentMethod: "TRANSFERENCIA",
      bankName: "",
      receiptNumber: "",
      notes: "",
    })
  }

  function resetBalanceForm() {
    setBalanceForm({
      betHouseId: "",
      date: today,
      amount: "",
      notes: "",
    })
  }

  async function saveHouseBalance() {
    try {
      if (!balanceForm.betHouseId) {
        alert("Selecciona la casa de apuestas.")
        return
      }

      if (!balanceForm.date) {
        alert("Selecciona la fecha.")
        return
      }

      if (balanceForm.amount === "" || Number(balanceForm.amount) < 0) {
        alert("Ingresa un saldo inicial válido.")
        return
      }

      setSaving(true)

      await api.post("/api/house-balances", {
        betHouseId: Number(balanceForm.betHouseId),
        date: balanceForm.date,
        amount: Number(balanceForm.amount),
        notes: balanceForm.notes,
      })

      resetBalanceForm()
      await loadData()

      alert("Saldo inicial guardado correctamente.")
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.error || "Error guardando saldo inicial.")
    } finally {
      setSaving(false)
    }
  }

  function validateCashForm() {
    if (!form.withdrawalId) {
      alert("Selecciona el retiro que se va a compensar.")
      return false
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Ingresa un monto válido.")
      return false
    }

    if (Number(form.amount) > Number(remainingDifference)) {
      const confirmExtra = confirm(
        "El valor pagado por la casa es mayor a la diferencia pendiente. ¿Deseas continuar?"
      )

      if (!confirmExtra) return false
    }

    if (!form.paymentMethod) {
      alert("Selecciona el método de pago.")
      return false
    }

    if (form.paymentMethod === "TRANSFERENCIA" && !form.bankName) {
      alert("Selecciona el banco.")
      return false
    }

    if (!form.receiptNumber.trim()) {
      alert("Ingresa el número de comprobante.")
      return false
    }

    return true
  }

  function openConfirmCash() {
    if (!validateCashForm()) return

    setConfirmOpen(true)
  }

  async function createCashEntry() {
    try {
      if (!validateCashForm()) return

      setSaving(true)

      const notes =
        form.paymentMethod === "TRANSFERENCIA"
          ? `Banco: ${form.bankName}${form.notes ? ` | ${form.notes}` : ""}`
          : form.notes || "Pago en efectivo"

      await api.post("/api/cash", {
        type: "INGRESO",
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
        receiptNumber: form.receiptNumber,
        notes,
        betHouseId: selectedWithdrawal?.betHouseId || null,
        withdrawalId: Number(form.withdrawalId),
      })

      setConfirmOpen(false)
      resetForm()

      await loadData()
      alert("Pago de casa registrado correctamente.")
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.error || "Error registrando movimiento de caja.")
    } finally {
      setSaving(false)
    }
  }

  function setTodayFilter() {
    const current = getTodayDate()
    setStartDate(current)
    setEndDate(current)
  }

  function clearFilters() {
    setSearch("")
    setTodayFilter()
  }

  const filteredCashEntries = useMemo(() => {
    const text = search.toLowerCase().trim()

    return cashEntries.filter((item) => {
      const matchesDate = isDateInsideRange(item.createdAt, startDate, endDate)

      const matchesSearch =
        !text ||
        item.withdrawal?.client?.name?.toLowerCase().includes(text) ||
        item.withdrawal?.client?.cedula?.toLowerCase().includes(text) ||
        item.withdrawal?.client?.phone?.toLowerCase().includes(text) ||
        item.withdrawal?.betHouse?.name?.toLowerCase().includes(text) ||
        item.withdrawal?.withdrawalCode?.toLowerCase().includes(text) ||
        item.receiptNumber?.toLowerCase().includes(text) ||
        item.paymentMethod?.toLowerCase().includes(text) ||
        item.notes?.toLowerCase().includes(text)

      return matchesDate && matchesSearch
    })
  }, [cashEntries, search, startDate, endDate])

  const filteredHouseBalances = useMemo(() => {
    return houseBalances.filter((item) =>
      isDateInsideRange(item.date, startDate, endDate)
    )
  }, [houseBalances, startDate, endDate])

  const totalInitialBalance = filteredHouseBalances.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  )

  const totalReceived = filteredCashEntries.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  )

  const pendingWithdrawals = withdrawals.filter(
    (item) => item.status !== "COMPENSADO" && item.status !== "ANULADO"
  )

  const pendingAmount = pendingWithdrawals.reduce(
    (sum, item) => sum + Number(item.difference || 0),
    0
  )

  const registeredPayments = filteredCashEntries.filter(
    (item) => item.withdrawalId
  ).length

  return (
    <AppShell title="Caja">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#d90416] via-[#8f000c] to-[#050505] p-6 shadow-2xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
                Cuenta de retiros
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Caja y compensaciones
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-white/75">
                Registra el saldo inicial por casa y los pagos que las casas de
                apuestas realizan a la tienda para compensar retiros pendientes.
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffd400] text-black">
              <WalletCards className="h-7 w-7" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Saldo inicial casas</p>
              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {formatMoney(totalInitialBalance)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Pagado por casas</p>
              <p className="mt-2 text-3xl font-bold">
                {formatMoney(totalReceived)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Pendiente por compensar</p>
              <p className="mt-2 text-3xl font-bold">
                {formatMoney(pendingAmount)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Pagos registrados</p>
              <p className="mt-2 text-3xl font-bold">{registeredPayments}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Landmark className="h-5 w-5 text-[#ffd400]" />
              Saldo inicial por casa
            </CardTitle>

            <p className="text-sm text-zinc-400">
              Registra el saldo inicial con el que empieza cada casa de apuestas
              en el día.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Casa de apuestas</Label>
                <Select
                  value={balanceForm.betHouseId}
                  onValueChange={(value) =>
                    setBalanceForm({ ...balanceForm, betHouseId: value })
                  }
                >
                  <SelectTrigger className="h-11 border-white/10 bg-black text-white">
                    <SelectValue placeholder="Selecciona casa" />
                  </SelectTrigger>

                  <SelectContent className="border-white/10 bg-[#0b0b0d] text-white">
                    {betHouses.length === 0 ? (
                      <SelectItem value="SIN_CASAS" disabled>
                        Sin casas registradas
                      </SelectItem>
                    ) : (
                      betHouses.map((house) => (
                        <SelectItem key={house.id} value={String(house.id)}>
                          {house.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Fecha</Label>
                <Input
                  type="date"
                  value={balanceForm.date}
                  onChange={(e) =>
                    setBalanceForm({ ...balanceForm, date: e.target.value })
                  }
                  className="h-11 border-white/10 bg-black text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Saldo inicial</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={balanceForm.amount}
                  onChange={(e) =>
                    setBalanceForm({ ...balanceForm, amount: e.target.value })
                  }
                  placeholder="0.00"
                  className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Observación</Label>
                <Input
                  value={balanceForm.notes}
                  onChange={(e) =>
                    setBalanceForm({ ...balanceForm, notes: e.target.value })
                  }
                  placeholder="Opcional"
                  className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end border-t border-white/10 pt-5">
              <Button
                type="button"
                onClick={saveHouseBalance}
                disabled={saving}
                className="h-11 w-full bg-[#d90416] px-8 font-semibold text-white hover:bg-[#ff1024] md:w-auto"
              >
                Guardar saldo inicial
              </Button>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/[0.03] hover:bg-white/[0.03]">
                    <TableHead className="text-zinc-400">Fecha</TableHead>
                    <TableHead className="text-zinc-400">Casa</TableHead>
                    <TableHead className="text-zinc-400">Observación</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Saldo
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredHouseBalances.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-zinc-400"
                      >
                        No hay saldos iniciales registrados para este filtro.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHouseBalances.map((item) => (
                      <TableRow
                        key={item.id}
                        className="border-white/10 hover:bg-white/[0.03]"
                      >
                        <TableCell className="text-zinc-400">
                          {formatDate(item.date)}
                        </TableCell>

                        <TableCell className="font-medium text-white">
                          {item.betHouse?.name || "-"}
                        </TableCell>

                        <TableCell className="text-zinc-400">
                          {item.notes || "-"}
                        </TableCell>

                        <TableCell className="text-right font-bold text-[#ffd400]">
                          {formatMoney(item.amount)}
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
              <ReceiptText className="h-5 w-5 text-[#ffd400]" />
              Pago de casa / compensar retiro
            </CardTitle>
            <p className="text-sm text-zinc-400">
              Selecciona el retiro a compensar e ingresa el valor que la casa de
              apuestas pagó a la tienda.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Retiro a compensar</Label>
                  <Select
                    value={form.withdrawalId}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        withdrawalId: value,
                        amount:
                          withdrawals.find(
                            (item) => String(item.id) === String(value)
                          )?.difference || "",
                      })
                    }
                  >
                    <SelectTrigger className="h-11 border-white/10 bg-black text-white">
                      <SelectValue placeholder="Selecciona retiro" />
                    </SelectTrigger>

                    <SelectContent className="border-white/10 bg-[#0b0b0d] text-white">
                      {selectableWithdrawals.length === 0 ? (
                        <SelectItem value="SIN_RETIROS" disabled>
                          Sin retiros pendientes
                        </SelectItem>
                      ) : (
                        selectableWithdrawals.map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.client?.name || "-"} ·{" "}
                            {item.betHouse?.name || "-"} · #
                            {item.withdrawalCode || "-"} ·{" "}
                            {formatMoney(item.difference)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">
                    Valor pagado por la casa
                  </Label>
                  <Input
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Método</Label>
                  <Select
                    value={form.paymentMethod}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        paymentMethod: value,
                        bankName: value === "EFECTIVO" ? "" : form.bankName,
                      })
                    }
                  >
                    <SelectTrigger className="h-11 border-white/10 bg-black text-white">
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>

                    <SelectContent className="border-white/10 bg-[#0b0b0d] text-white">
                      <SelectItem value="TRANSFERENCIA">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-[#ffd400]" />
                          Transferencia
                        </div>
                      </SelectItem>

                      <SelectItem value="EFECTIVO">
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-[#ffd400]" />
                          Efectivo
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedWithdrawal && (
                <div className="rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4">
                  <div className="grid gap-3 text-sm md:grid-cols-4">
                    <div>
                      <p className="text-[#ffd400]/80">Cliente</p>
                      <p className="mt-1 font-bold text-white">
                        {selectedWithdrawal.client?.name || "-"}
                      </p>
                      <p className="text-xs text-white/50">
                        {selectedWithdrawal.client?.cedula || "-"} ·{" "}
                        {selectedWithdrawal.client?.phone || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[#ffd400]/80">Casa</p>
                      <p className="mt-1 font-bold text-white">
                        {selectedWithdrawal.betHouse?.name || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[#ffd400]/80"># retiro</p>
                      <p className="mt-1 font-bold text-white">
                        {selectedWithdrawal.withdrawalCode || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[#ffd400]/80">Diferencia actual</p>
                      <p className="mt-1 font-bold text-white">
                        {formatMoney(selectedWithdrawal.difference)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                {form.paymentMethod === "TRANSFERENCIA" && (
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Banco</Label>
                    <Select
                      value={form.bankName}
                      onValueChange={(value) =>
                        setForm({ ...form, bankName: value })
                      }
                    >
                      <SelectTrigger className="h-11 border-white/10 bg-black text-white">
                        <SelectValue placeholder="Selecciona banco" />
                      </SelectTrigger>

                      <SelectContent className="border-white/10 bg-[#0b0b0d] text-white">
                        {banks.length === 0 ? (
                          <SelectItem value="SIN_BANCOS" disabled>
                            Sin bancos registrados
                          </SelectItem>
                        ) : (
                          banks.map((bank) => (
                            <SelectItem key={bank.id} value={bank.name}>
                              {bank.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-zinc-300"># comprobante</Label>
                  <Input
                    value={form.receiptNumber}
                    onChange={(e) =>
                      setForm({ ...form, receiptNumber: e.target.value })
                    }
                    placeholder="Ej: 001234567"
                    className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Nota opcional</Label>
                  <Input
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    placeholder="Observación"
                    className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {selectedWithdrawal && (
                <div className="rounded-2xl border border-white/10 bg-black p-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-zinc-500">Diferencia actual</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {formatMoney(remainingDifference)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-500">
                        Valor pagado por la casa
                      </p>
                      <p className="mt-1 text-2xl font-bold text-[#ffd400]">
                        {formatMoney(form.amount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-500">Diferencia final</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {formatMoney(projectedDifference)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end border-t border-white/10 pt-5">
                <Button
                  type="button"
                  onClick={openConfirmCash}
                  disabled={saving}
                  className="h-11 w-full bg-[#d90416] px-8 font-semibold text-white hover:bg-[#ff1024] md:w-auto"
                >
                  Registrar pago de casa
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl font-bold">
                  Movimientos de caja
                </CardTitle>
                <p className="mt-1 text-sm text-zinc-400">
                  Historial de pagos que las casas de apuestas realizaron a la
                  tienda.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black px-4 py-2 text-sm text-zinc-400">
                Registros filtrados:{" "}
                <span className="font-bold text-[#ffd400]">
                  {filteredCashEntries.length}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto_auto]">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar movimiento..."
                  className="h-11 border-white/10 bg-black pl-10 text-white placeholder:text-zinc-600"
                />
              </div>

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
                className="h-11 bg-[#ffd400] font-semibold text-black hover:bg-[#ffe766]"
              >
                Hoy
              </Button>

              <Button
                type="button"
                onClick={clearFilters}
                className="h-11 border border-white/10 bg-black font-semibold text-white hover:bg-white/10"
              >
                Limpiar
              </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/[0.03] hover:bg-white/[0.03]">
                    <TableHead className="text-zinc-400">Fecha</TableHead>
                    <TableHead className="text-zinc-400">Retiro</TableHead>
                    <TableHead className="text-zinc-400">Casa</TableHead>
                    <TableHead className="text-zinc-400">Método</TableHead>
                    <TableHead className="text-zinc-400">Comprobante</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Monto
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-zinc-400"
                      >
                        Cargando movimientos...
                      </TableCell>
                    </TableRow>
                  ) : filteredCashEntries.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-zinc-400"
                      >
                        No hay movimientos registrados para este filtro.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCashEntries.map((item) => (
                      <TableRow
                        key={item.id}
                        className="border-white/10 hover:bg-white/[0.03]"
                      >
                        <TableCell className="text-zinc-400">
                          {formatDate(item.createdAt)}
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="font-medium text-white">
                              {item.withdrawal?.client?.name ||
                                "Movimiento general"}
                            </p>
                            <p className="text-xs text-zinc-500">
                              #{item.withdrawal?.withdrawalCode || "-"} ·{" "}
                              {item.withdrawal?.client?.cedula || "-"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          {item.withdrawal?.betHouse?.name ||
                            item.betHouse?.name ||
                            "-"}
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={
                              item.paymentMethod === "EFECTIVO"
                                ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15"
                                : "bg-[#ffd400]/15 text-[#ffd400] hover:bg-[#ffd400]/15"
                            }
                          >
                            {item.paymentMethod || "-"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-zinc-400">
                          {item.receiptNumber || "-"}
                        </TableCell>

                        <TableCell className="text-right font-bold text-[#ffd400]">
                          {formatMoney(item.amount)}
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="border-white/10 bg-[#0b0b0d] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Confirmar pago de casa
            </DialogTitle>
            <p className="text-sm text-zinc-400">
              Revisa los datos antes de registrar el movimiento de caja.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4">
              <p className="text-sm text-[#ffd400]">
                Este pago representa el valor que la casa transfirió a la tienda
                y quedará vinculado al retiro seleccionado.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black p-4">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Cliente</span>
                  <span className="font-semibold text-white">
                    {selectedWithdrawal?.client?.name || "-"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Casa</span>
                  <span className="font-semibold text-white">
                    {selectedWithdrawal?.betHouse?.name || "-"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500"># retiro</span>
                  <span className="font-semibold text-white">
                    {selectedWithdrawal?.withdrawalCode || "-"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Método</span>
                  <span className="font-semibold text-white">
                    {form.paymentMethod}
                  </span>
                </div>

                {form.paymentMethod === "TRANSFERENCIA" && (
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">Banco</span>
                    <span className="font-semibold text-white">
                      {form.bankName || "-"}
                    </span>
                  </div>
                )}

                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Comprobante</span>
                  <span className="font-semibold text-white">
                    {form.receiptNumber || "-"}
                  </span>
                </div>

                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">
                      Valor pagado por la casa
                    </span>
                    <span className="text-2xl font-bold text-[#ffd400]">
                      {formatMoney(form.amount)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Diferencia final</span>
                  <span className="font-semibold text-white">
                    {formatMoney(projectedDifference)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={saving}
                className="border border-white/10 bg-black font-semibold text-white hover:bg-white/10"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={createCashEntry}
                disabled={saving}
                className="bg-[#d90416] font-semibold text-white hover:bg-[#ff1024]"
              >
                {saving ? "Guardando..." : "Confirmar pago de casa"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}