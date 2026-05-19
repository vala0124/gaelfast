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
  RefreshCcw,
  Save,
  Search,
  Store,
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

  const text = String(value)

  if (text.includes("T00:00:00.000Z")) {
    const dateKey = text.slice(0, 10)
    const [year, month, day] = dateKey.split("-")

    return new Intl.DateTimeFormat("es-EC", {
      dateStyle: "medium",
    }).format(new Date(Number(year), Number(month) - 1, Number(day)))
  }

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

function getDateKey(value) {
  if (!value) return ""
  return String(value).slice(0, 10)
}

function isDateInsideRange(dateValue, selectedDate) {
  if (!dateValue) return false

  const itemDate = new Date(dateValue)
  const start = new Date(`${selectedDate}T00:00:00`)
  const end = new Date(`${selectedDate}T23:59:59`)

  return itemDate >= start && itemDate <= end
}

export default function CajaPage() {
  const today = getTodayDate()

  const [betHouses, setBetHouses] = useState([])
  const [banks, setBanks] = useState([])
  const [dailyCashBox, setDailyCashBox] = useState(null)
  const [dailyCashBoxHistory, setDailyCashBoxHistory] = useState([])

  const [withdrawals, setWithdrawals] = useState([])
  const [cashEntries, setCashEntries] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [selectedDate, setSelectedDate] = useState(today)
  const [search, setSearch] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [cashBoxForm, setCashBoxForm] = useState({
    salesInitialCash: "",
    notes: "",
  })

  const [houseForm, setHouseForm] = useState({
    betHouseId: "",
    initialBalance: "",
    notes: "",
  })

  const [paymentForm, setPaymentForm] = useState({
    withdrawalId: "",
    amount: "",
    paymentMethod: "TRANSFERENCIA",
    bankName: "",
    receiptNumber: "",
    notes: "",
  })

  async function loadData(dateValue = selectedDate) {
    try {
      setLoading(true)

      const [
        housesRes,
        banksRes,
        cashBoxRes,
        historyRes,
        withdrawalsRes,
        cashEntriesRes,
      ] = await Promise.all([
        api.get("/api/bet-houses"),
        api.get("/api/banks"),
        api.get(`/api/daily-cash-box?date=${dateValue}`),
        api.get("/api/daily-cash-box/history"),
        api.get("/api/withdrawals"),
        api.get("/api/cash"),
      ])

      const housesData = Array.isArray(housesRes.data) ? housesRes.data : []
      const banksData = Array.isArray(banksRes.data) ? banksRes.data : []
      const cashBoxData = cashBoxRes.data || null
      const historyData = Array.isArray(historyRes.data) ? historyRes.data : []
      const withdrawalsData = Array.isArray(withdrawalsRes.data)
        ? withdrawalsRes.data
        : []
      const cashEntriesData = Array.isArray(cashEntriesRes.data)
        ? cashEntriesRes.data
        : []

      setBetHouses(housesData)
      setBanks(banksData)
      setDailyCashBox(cashBoxData)
      setDailyCashBoxHistory(historyData)
      setWithdrawals(withdrawalsData)
      setCashEntries(cashEntriesData)

      setCashBoxForm({
        salesInitialCash:
          cashBoxData?.salesInitialCash !== undefined &&
          cashBoxData?.salesInitialCash !== null
            ? String(cashBoxData.salesInitialCash)
            : "",
        notes: cashBoxData?.notes || "",
      })
    } catch (error) {
      console.error(error)
      alert("No se pudo cargar la caja. Revisa que el backend esté encendido.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(selectedDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  function scrollToElement(id) {
    setTimeout(() => {
      const element = document.getElementById(id)

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    }, 150)
  }

  function resetHouseForm() {
    setHouseForm({
      betHouseId: "",
      initialBalance: "",
      notes: "",
    })
  }

  function resetPaymentForm() {
    setPaymentForm({
      withdrawalId: "",
      amount: "",
      paymentMethod: "TRANSFERENCIA",
      bankName: "",
      receiptNumber: "",
      notes: "",
    })
  }

  async function saveDailyCashBox() {
    try {
      if (!selectedDate) {
        alert("Selecciona la fecha.")
        return
      }

      if (
        cashBoxForm.salesInitialCash === "" ||
        Number(cashBoxForm.salesInitialCash) < 0
      ) {
        alert("Ingresa un saldo inicial de ventas válido.")
        return
      }

      setSaving(true)

      await api.post("/api/daily-cash-box", {
        date: selectedDate,
        salesInitialCash: Number(cashBoxForm.salesInitialCash),
        notes: cashBoxForm.notes,
      })

      await loadData(selectedDate)
      alert("Caja diaria guardada correctamente.")
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.error || "Error guardando caja diaria.")
    } finally {
      setSaving(false)
    }
  }

  async function saveHouseCashBox() {
    try {
      if (!selectedDate) {
        alert("Selecciona la fecha.")
        return
      }

      if (!houseForm.betHouseId) {
        alert("Selecciona la casa de apuestas.")
        return
      }

      if (
        houseForm.initialBalance === "" ||
        Number(houseForm.initialBalance) < 0
      ) {
        alert("Ingresa un saldo inicial válido.")
        return
      }

      setSaving(true)

      await api.post("/api/daily-cash-box/house", {
        date: selectedDate,
        betHouseId: Number(houseForm.betHouseId),
        initialBalance: Number(houseForm.initialBalance),
        rechargeAmount: 0,
        rechargeProfit: 0,
        withdrawalAmount: 0,
        withdrawalProfit: 0,
        notes: houseForm.notes,
      })

      resetHouseForm()
      await loadData(selectedDate)

      alert("Saldo inicial por casa guardado correctamente.")
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.error || "Error guardando caja por casa.")
    } finally {
      setSaving(false)
    }
  }

  function fillHouseForm(item) {
    setHouseForm({
      betHouseId: String(item.betHouseId),
      initialBalance: String(item.initialBalance || 0),
      notes: item.notes || "",
    })

    scrollToElement("form-saldo-casa")
  }

  function setToday() {
    setSelectedDate(today)
  }

  function openHistoryDate(dateValue) {
    const dateKey = getDateKey(dateValue)

    setSelectedDate(dateKey)
    scrollToElement("fecha-caja")
  }

  const houseCashBoxes = dailyCashBox?.houseCashBoxes || []

  const totalHouseInitialBalance = useMemo(() => {
    return houseCashBoxes.reduce(
      (sum, item) => sum + Number(item.initialBalance || 0),
      0
    )
  }, [houseCashBoxes])

  const selectedHouseName = useMemo(() => {
    const house = betHouses.find(
      (item) => String(item.id) === String(houseForm.betHouseId)
    )

    return house?.name || "-"
  }, [betHouses, houseForm.betHouseId])

  const missingHouses = useMemo(() => {
    const registeredIds = new Set(
      houseCashBoxes.map((item) => String(item.betHouseId))
    )

    return betHouses.filter((house) => !registeredIds.has(String(house.id)))
  }, [betHouses, houseCashBoxes])

  const selectableWithdrawals = useMemo(() => {
    return withdrawals.filter((item) => {
      return item.status !== "COMPENSADO" && item.status !== "ANULADO"
    })
  }, [withdrawals])

  const selectedWithdrawal = useMemo(() => {
    return withdrawals.find(
      (item) => String(item.id) === String(paymentForm.withdrawalId)
    )
  }, [withdrawals, paymentForm.withdrawalId])

  const remainingDifference = selectedWithdrawal
    ? Number(selectedWithdrawal.difference || 0)
    : 0

  const projectedDifference = selectedWithdrawal
    ? Number(selectedWithdrawal.difference || 0) -
      Number(paymentForm.amount || 0)
    : 0

  const filteredCashEntries = useMemo(() => {
    const text = search.toLowerCase().trim()

    return cashEntries.filter((item) => {
      const matchesDate = isDateInsideRange(item.createdAt, selectedDate)

      const matchesSearch =
        !text ||
        item.withdrawal?.client?.name?.toLowerCase().includes(text) ||
        item.withdrawal?.client?.cedula?.toLowerCase().includes(text) ||
        item.withdrawal?.client?.phone?.toLowerCase().includes(text) ||
        item.withdrawal?.betHouse?.name?.toLowerCase().includes(text) ||
        item.betHouse?.name?.toLowerCase().includes(text) ||
        item.withdrawal?.withdrawalCode?.toLowerCase().includes(text) ||
        item.receiptNumber?.toLowerCase().includes(text) ||
        item.paymentMethod?.toLowerCase().includes(text) ||
        item.notes?.toLowerCase().includes(text)

      return matchesDate && matchesSearch
    })
  }, [cashEntries, search, selectedDate])

  const totalReceivedByHouses = filteredCashEntries.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  )

  const pendingAmount = withdrawals
    .filter((item) => item.status !== "COMPENSADO" && item.status !== "ANULADO")
    .reduce((sum, item) => sum + Number(item.difference || 0), 0)

  function validatePaymentForm() {
    if (!paymentForm.withdrawalId) {
      alert("Selecciona el retiro que se va a compensar.")
      return false
    }

    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      alert("Ingresa un monto válido.")
      return false
    }

    if (Number(paymentForm.amount) > Number(remainingDifference)) {
      const confirmExtra = confirm(
        "El valor pagado por la casa es mayor a la diferencia pendiente. ¿Deseas continuar?"
      )

      if (!confirmExtra) return false
    }

    if (!paymentForm.paymentMethod) {
      alert("Selecciona el método de pago.")
      return false
    }

    if (
      paymentForm.paymentMethod === "TRANSFERENCIA" &&
      !paymentForm.bankName
    ) {
      alert("Selecciona el banco.")
      return false
    }

    if (!paymentForm.receiptNumber.trim()) {
      alert("Ingresa el número de comprobante.")
      return false
    }

    return true
  }

  function openConfirmPayment() {
    if (!validatePaymentForm()) return

    setConfirmOpen(true)
  }

  async function createCashEntry() {
    try {
      if (!validatePaymentForm()) return

      setSaving(true)

      const notes =
        paymentForm.paymentMethod === "TRANSFERENCIA"
          ? `Banco: ${paymentForm.bankName}${
              paymentForm.notes ? ` | ${paymentForm.notes}` : ""
            }`
          : paymentForm.notes || "Pago en efectivo"

      await api.post("/api/cash", {
        type: "INGRESO",
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        receiptNumber: paymentForm.receiptNumber,
        notes,
        betHouseId: selectedWithdrawal?.betHouseId || null,
        withdrawalId: Number(paymentForm.withdrawalId),
      })

      setConfirmOpen(false)
      resetPaymentForm()

      await loadData(selectedDate)
      alert("Pago de casa registrado correctamente.")
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.error || "Error registrando pago de casa.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell title="Caja">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#d90416] via-[#8f000c] to-[#050505] p-6 shadow-2xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
                Apertura y compensaciones
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Caja diaria
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-white/75">
                Registra la apertura de la jornada, saldos iniciales por casa y
                pagos que las casas realizan para compensar retiros pendientes.
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffd400] text-black">
              <WalletCards className="h-7 w-7" />
            </div>
          </div>
        </div>

        <Card
          id="fecha-caja"
          className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl"
        >
          <CardHeader className="border-b border-white/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <CalendarDays className="h-5 w-5 text-[#ffd400]" />
                  Fecha de caja
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Selecciona la fecha para crear o consultar la caja.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => loadData(selectedDate)}
                disabled={loading}
                className="h-11 border border-white/10 bg-black font-semibold text-white hover:bg-white/10"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-[220px_auto_1fr]">
              <div className="space-y-2">
                <Label className="text-zinc-300">Fecha</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-11 border-white/10 bg-black text-white"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={setToday}
                  className="h-11 bg-[#ffd400] font-semibold text-black hover:bg-[#ffe766]"
                >
                  Hoy
                </Button>
              </div>

              <div className="flex items-end">
                <div className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-zinc-400">
                  Estado:{" "}
                  {dailyCashBox ? (
                    <span className="font-bold text-emerald-300">
                      Caja creada para {formatDate(dailyCashBox.date)}
                    </span>
                  ) : (
                    <span className="font-bold text-[#ffd400]">
                      Aún no existe caja para esta fecha
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-5">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Caja inicial ventas</p>
              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {formatMoney(dailyCashBox?.salesInitialCash)}
              </p>
            </CardContent>
          </Card>

          {betHouses.map((house) => {
            const balance = houseCashBoxes.find(
              (item) => String(item.betHouseId) === String(house.id)
            )

            return (
              <Card
                key={house.id}
                className="border-white/10 bg-[#0b0b0d] text-white"
              >
                <CardContent className="p-5">
                  <p className="text-sm text-zinc-400">{house.name}</p>
                  <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                    {formatMoney(balance?.initialBalance)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Saldo inicial casa
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Pagado por casas hoy</p>
              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {formatMoney(totalReceivedByHouses)}
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
              <p className="text-sm text-zinc-400">Pagos registrados hoy</p>
              <p className="mt-2 text-3xl font-bold">
                {filteredCashEntries.length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Store className="h-5 w-5 text-[#ffd400]" />
              Caja inicial de ventas
            </CardTitle>

            <p className="text-sm text-zinc-400">
              Aquí se registra el dinero inicial de la caja física para ventas
              del día.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="space-y-2">
                <Label className="text-zinc-300">Saldo inicial ventas</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashBoxForm.salesInitialCash}
                  onChange={(e) =>
                    setCashBoxForm({
                      ...cashBoxForm,
                      salesInitialCash: e.target.value,
                    })
                  }
                  placeholder="0.00"
                  className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Observación general</Label>
                <Input
                  value={cashBoxForm.notes}
                  onChange={(e) =>
                    setCashBoxForm({
                      ...cashBoxForm,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Ej: Inicio de jornada / caja entregada al vendedor"
                  className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end border-t border-white/10 pt-5">
              <Button
                type="button"
                onClick={saveDailyCashBox}
                disabled={saving}
                className="h-11 w-full bg-[#d90416] px-8 font-semibold text-white hover:bg-[#ff1024] md:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                Guardar caja diaria
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card
          id="form-saldo-casa"
          className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl"
        >
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Landmark className="h-5 w-5 text-[#ffd400]" />
              Saldos iniciales por casa
            </CardTitle>

            <p className="text-sm text-zinc-400">
              Registra cuánto saldo tiene cada casa de apuestas al iniciar la
              jornada.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_200px_1fr]">
              <div className="space-y-2">
                <Label className="text-zinc-300">Casa de apuestas</Label>
                <Select
                  value={houseForm.betHouseId}
                  onValueChange={(value) =>
                    setHouseForm({ ...houseForm, betHouseId: value })
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
                <Label className="text-zinc-300">Saldo inicial</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={houseForm.initialBalance}
                  onChange={(e) =>
                    setHouseForm({
                      ...houseForm,
                      initialBalance: e.target.value,
                    })
                  }
                  placeholder="0.00"
                  className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Observación</Label>
                <Input
                  value={houseForm.notes}
                  onChange={(e) =>
                    setHouseForm({ ...houseForm, notes: e.target.value })
                  }
                  placeholder="Opcional"
                  className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4 text-sm text-[#ffd400]">
              Casa seleccionada:{" "}
              <span className="font-bold">{selectedHouseName}</span>. Si ya
              existe saldo para esa casa en esta fecha, se actualizará.
            </div>

            <div className="mt-5 flex justify-end border-t border-white/10 pt-5">
              <Button
                type="button"
                onClick={saveHouseCashBox}
                disabled={saving}
                className="h-11 w-full bg-[#d90416] px-8 font-semibold text-white hover:bg-[#ff1024] md:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                Guardar saldo de casa
              </Button>
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
              Selecciona un retiro pendiente y registra el valor que la casa ya
              pagó a la tienda.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Retiro a compensar</Label>
                  <Select
                    value={paymentForm.withdrawalId}
                    onValueChange={(value) => {
                      const withdrawal = withdrawals.find(
                        (item) => String(item.id) === String(value)
                      )

                      setPaymentForm({
                        ...paymentForm,
                        withdrawalId: value,
                        amount: withdrawal?.difference || "",
                      })
                    }}
                  >
                    <SelectTrigger className="h-11 border-white/10 bg-black text-white">
                      <SelectValue placeholder="Selecciona retiro pendiente" />
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
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        amount: e.target.value,
                      })
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
                    value={paymentForm.paymentMethod}
                    onValueChange={(value) =>
                      setPaymentForm({
                        ...paymentForm,
                        paymentMethod: value,
                        bankName:
                          value === "EFECTIVO" ? "" : paymentForm.bankName,
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
                {paymentForm.paymentMethod === "TRANSFERENCIA" && (
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Banco</Label>
                    <Select
                      value={paymentForm.bankName}
                      onValueChange={(value) =>
                        setPaymentForm({
                          ...paymentForm,
                          bankName: value,
                        })
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
                    value={paymentForm.receiptNumber}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        receiptNumber: e.target.value,
                      })
                    }
                    placeholder="Ej: 001234567"
                    className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Nota opcional</Label>
                  <Input
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        notes: e.target.value,
                      })
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
                        {formatMoney(paymentForm.amount)}
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
                  onClick={openConfirmPayment}
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
                  Resumen de apertura
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Saldos iniciales guardados para la fecha seleccionada.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black px-4 py-2 text-sm text-zinc-400">
                Casas registradas:{" "}
                <span className="font-bold text-[#ffd400]">
                  {houseCashBoxes.length}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {missingHouses.length > 0 && (
              <div className="mb-5 rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4 text-sm text-[#ffd400]">
                Faltan por registrar:{" "}
                <span className="font-bold">
                  {missingHouses.map((house) => house.name).join(", ")}
                </span>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/[0.03] hover:bg-white/[0.03]">
                    <TableHead className="text-zinc-400">Fecha</TableHead>
                    <TableHead className="text-zinc-400">Casa</TableHead>
                    <TableHead className="text-zinc-400">Observación</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Saldo inicial
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Estado
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Acción
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
                        Cargando caja diaria...
                      </TableCell>
                    </TableRow>
                  ) : !dailyCashBox ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-zinc-400"
                      >
                        Primero guarda la caja diaria para esta fecha.
                      </TableCell>
                    </TableRow>
                  ) : houseCashBoxes.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-zinc-400"
                      >
                        No hay saldos iniciales por casa registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    houseCashBoxes.map((item) => (
                      <TableRow
                        key={item.id}
                        className="border-white/10 hover:bg-white/[0.03]"
                      >
                        <TableCell className="text-zinc-400">
                          {formatDate(dailyCashBox.date)}
                        </TableCell>

                        <TableCell className="font-medium text-white">
                          {item.betHouse?.name || "-"}
                        </TableCell>

                        <TableCell className="text-zinc-400">
                          {item.notes || "-"}
                        </TableCell>

                        <TableCell className="text-right font-bold text-[#ffd400]">
                          {formatMoney(item.initialBalance)}
                        </TableCell>

                        <TableCell className="text-right">
                          <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                            Aperturada
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            type="button"
                            onClick={() => fillHouseForm(item)}
                            className="h-9 border border-white/10 bg-black px-4 text-sm font-semibold text-white hover:bg-white/10"
                          >
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-zinc-500">Caja inicial ventas</p>
                  <p className="mt-1 text-2xl font-bold text-[#ffd400]">
                    {formatMoney(dailyCashBox?.salesInitialCash)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Saldo inicial casas</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {formatMoney(totalHouseInitialBalance)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl font-bold">
                  Movimientos de caja / pagos de casas
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Historial de pagos que las casas realizaron para compensar
                  retiros.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black px-4 py-2 text-sm text-zinc-400">
                Registros hoy:{" "}
                <span className="font-bold text-[#ffd400]">
                  {filteredCashEntries.length}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="mb-5">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar movimiento..."
                  className="h-11 border-white/10 bg-black pl-10 text-white placeholder:text-zinc-600"
                />
              </div>
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
                        No hay pagos de casas registrados para esta fecha.
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

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl font-bold">
                  Historial de cajas iniciales diarias
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Consulta las aperturas de caja registradas por día.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black px-4 py-2 text-sm text-zinc-400">
                Jornadas registradas:{" "}
                <span className="font-bold text-[#ffd400]">
                  {dailyCashBoxHistory.length}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/[0.03] hover:bg-white/[0.03]">
                    <TableHead className="text-zinc-400">Fecha</TableHead>
                    <TableHead className="text-zinc-400">
                      Caja ventas
                    </TableHead>
                    <TableHead className="text-zinc-400">
                      Casas registradas
                    </TableHead>
                    <TableHead className="text-zinc-400">
                      Saldo casas
                    </TableHead>
                    <TableHead className="text-zinc-400">Observación</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Acción
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
                        Cargando historial...
                      </TableCell>
                    </TableRow>
                  ) : dailyCashBoxHistory.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-zinc-400"
                      >
                        Todavía no hay cajas diarias registradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dailyCashBoxHistory.map((item) => (
                      <TableRow
                        key={item.id}
                        className="border-white/10 hover:bg-white/[0.03]"
                      >
                        <TableCell className="text-zinc-400">
                          {formatDate(item.date)}
                        </TableCell>

                        <TableCell className="font-bold text-[#ffd400]">
                          {formatMoney(item.salesInitialCash)}
                        </TableCell>

                        <TableCell>
                          <Badge className="bg-white/10 text-zinc-300 hover:bg-white/10">
                            {item.housesCount || 0} casas
                          </Badge>
                        </TableCell>

                        <TableCell className="font-bold text-white">
                          {formatMoney(item.totalHouseInitialBalance)}
                        </TableCell>

                        <TableCell className="text-zinc-400">
                          {item.notes || "-"}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            type="button"
                            onClick={() => openHistoryDate(item.date)}
                            className="h-9 border border-white/10 bg-black px-4 text-sm font-semibold text-white hover:bg-white/10"
                          >
                            Ver
                          </Button>
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
                    {paymentForm.paymentMethod}
                  </span>
                </div>

                {paymentForm.paymentMethod === "TRANSFERENCIA" && (
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">Banco</span>
                    <span className="font-semibold text-white">
                      {paymentForm.bankName || "-"}
                    </span>
                  </div>
                )}

                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Comprobante</span>
                  <span className="font-semibold text-white">
                    {paymentForm.receiptNumber || "-"}
                  </span>
                </div>

                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">
                      Valor pagado por la casa
                    </span>
                    <span className="text-2xl font-bold text-[#ffd400]">
                      {formatMoney(paymentForm.amount)}
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