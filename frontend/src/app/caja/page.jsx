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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Building2,
  CalendarDays,
  Landmark,
  RefreshCcw,
  Save,
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

  const dateKey = String(value).slice(0, 10)
  const [year, month, day] = dateKey.split("-")

  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
  }).format(new Date(Number(year), Number(month) - 1, Number(day)))
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

export default function CajaPage() {
  const today = getTodayDate()

  const [betHouses, setBetHouses] = useState([])
  const [banks, setBanks] = useState([])
  const [dailyCashBox, setDailyCashBox] = useState(null)
  const [dailyCashBoxHistory, setDailyCashBoxHistory] = useState([])

  const [withdrawals, setWithdrawals] = useState([])
  const [paymentForms, setPaymentForms] = useState({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [selectedDate, setSelectedDate] = useState(today)

  const [cashBoxForm, setCashBoxForm] = useState({
    salesInitialCash: "",
    notes: "",
  })

  const [houseForm, setHouseForm] = useState({
    betHouseId: "",
    initialBalance: "",
    notes: "",
  })

  const [bankForm, setBankForm] = useState({
    bankId: "",
    initialBalance: "",
    notes: "",
  })

  async function loadData(dateValue = selectedDate) {
    try {
      setLoading(true)

      const [housesRes, banksRes, cashBoxRes, historyRes, withdrawalsRes] =
        await Promise.all([
          api.get("/api/bet-houses"),
          api.get("/api/banks"),
          api.get(`/api/daily-cash-box?date=${dateValue}`),
          api.get("/api/daily-cash-box/history"),
          api.get(
            `/api/withdrawals?startDate=${selectedDate}&endDate=${selectedDate}`
          ),
        ])

        const withdrawalsData = Array.isArray(withdrawalsRes.data)
          ? withdrawalsRes.data
          : []

        setWithdrawals(withdrawalsData)

      const housesData = Array.isArray(housesRes.data) ? housesRes.data : []
      const banksData = Array.isArray(banksRes.data) ? banksRes.data : []
      const cashBoxData = cashBoxRes.data || null
      const historyData = Array.isArray(historyRes.data) ? historyRes.data : []

      setBetHouses(housesData)
      setBanks(banksData)
      setDailyCashBox(cashBoxData)
      setDailyCashBoxHistory(historyData)
      setWithdrawals(withdrawalsData)

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

  function resetBankForm() {
    setBankForm({
      bankId: "",
      initialBalance: "",
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

  async function saveBankCashBox() {
    try {
      if (!selectedDate) {
        alert("Selecciona la fecha.")
        return
      }

      if (!bankForm.bankId) {
        alert("Selecciona el banco o cuenta.")
        return
      }

      if (
        bankForm.initialBalance === "" ||
        Number(bankForm.initialBalance) < 0
      ) {
        alert("Ingresa un saldo inicial válido para el banco.")
        return
      }

      setSaving(true)

      await api.post("/api/daily-cash-box/bank", {
        date: selectedDate,
        bankId: Number(bankForm.bankId),
        initialBalance: Number(bankForm.initialBalance),
        notes: bankForm.notes,
      })

      resetBankForm()
      await loadData(selectedDate)

      alert("Saldo inicial por banco guardado correctamente.")
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.error || "Error guardando caja por banco.")
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

  function fillBankForm(item) {
    setBankForm({
      bankId: String(item.bankId),
      initialBalance: String(item.initialBalance || 0),
      notes: item.notes || "",
    })

    scrollToElement("form-saldo-banco")
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
  const bankCashBoxes = dailyCashBox?.bankCashBoxes || []

  const totalHouseInitialBalance = useMemo(() => {
    return houseCashBoxes.reduce(
      (sum, item) => sum + Number(item.initialBalance || 0),
      0
    )
  }, [houseCashBoxes])

  const totalBankInitialBalance = useMemo(() => {
    return bankCashBoxes.reduce(
      (sum, item) => sum + Number(item.initialBalance || 0),
      0
    )
  }, [bankCashBoxes])

  const totalOpening = useMemo(() => {
    return (
      Number(dailyCashBox?.salesInitialCash || 0) +
      Number(totalHouseInitialBalance || 0) +
      Number(totalBankInitialBalance || 0)
    )
  }, [dailyCashBox, totalHouseInitialBalance, totalBankInitialBalance])

  const selectedHouseName = useMemo(() => {
    const house = betHouses.find(
      (item) => String(item.id) === String(houseForm.betHouseId)
    )

    return house?.name || "-"
  }, [betHouses, houseForm.betHouseId])

  const selectedBankName = useMemo(() => {
    const bank = banks.find((item) => String(item.id) === String(bankForm.bankId))

    return bank?.name || "-"
  }, [banks, bankForm.bankId])

  const missingHouses = useMemo(() => {
    const registeredIds = new Set(
      houseCashBoxes.map((item) => String(item.betHouseId))
    )

    return betHouses.filter((house) => !registeredIds.has(String(house.id)))
  }, [betHouses, houseCashBoxes])

  const missingBanks = useMemo(() => {
    const registeredIds = new Set(
      bankCashBoxes.map((item) => String(item.bankId))
    )

    return banks.filter((bank) => !registeredIds.has(String(bank.id)))
  }, [banks, bankCashBoxes])

  const pendingWithdrawals = useMemo(() => {
    return withdrawals.filter((item) => {
      const dateKey = getDateKey(item.createdAt)

      return (
        dateKey === selectedDate &&
        item.status !== "COMPENSADO" &&
        item.status !== "ANULADO"
      )
    })
  }, [withdrawals, selectedDate])

  async function saveHousePayment(withdrawal) {
    try {
      const value = paymentForms[withdrawal.id] || withdrawal.amount

      if (!value || Number(value) <= 0) {
        alert("Ingresa el valor pagado por la casa.")
        return
      }

      setSaving(true)

      await api.post("/api/cash", {
        type: "INGRESO",
        amount: Number(value),
        paymentMethod: "EFECTIVO",
        receiptNumber: withdrawal.receiptNumber || null,
        notes: `Pago de casa por retiro #${withdrawal.id}`,
        betHouseId: withdrawal.betHouseId,
        withdrawalId: withdrawal.id,
      })

      setPaymentForms((current) => ({
        ...current,
        [withdrawal.id]: "",
      }))

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
                Apertura de jornada
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Caja diaria
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-white/75">
                Registra el dinero con el que inicia la jornada: caja de ventas,
                saldos iniciales de bancos y saldos iniciales por cada casa de
                apuestas. El cierre final se realiza en el módulo de Cuadre.
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
                  Selecciona la fecha para crear o consultar la apertura de caja.
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Caja inicial ventas</p>
              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {formatMoney(dailyCashBox?.salesInitialCash)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Saldo inicial bancos</p>
              <p className="mt-2 text-3xl font-bold">
                {formatMoney(totalBankInitialBalance)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Saldo inicial casas</p>
              <p className="mt-2 text-3xl font-bold">
                {formatMoney(totalHouseInitialBalance)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Total apertura</p>
              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {formatMoney(totalOpening)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Building2 className="h-5 w-5 text-[#ffd400]" />
              Saldos iniciales de bancos
            </CardTitle>

            <p className="text-sm text-zinc-400">
              Dinero inicial registrado en cada cuenta bancaria al iniciar la
              jornada.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {banks.map((bank) => {
                const balance = bankCashBoxes.find(
                  (item) => String(item.bankId) === String(bank.id)
                )

                return (
                  <Card
                    key={bank.id}
                    className="border-white/10 bg-black text-white"
                  >
                    <CardContent className="p-5">
                      <p className="text-sm text-zinc-400">{bank.name}</p>

                      <p className="mt-2 text-2xl font-bold text-[#ffd400]">
                        {formatMoney(balance?.initialBalance)}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Saldo inicial banco
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Landmark className="h-5 w-5 text-[#ffd400]" />
              Saldos iniciales de casas
            </CardTitle>

            <p className="text-sm text-zinc-400">
              Saldo inicial registrado para cada casa de apuestas al iniciar la
              jornada.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {betHouses.map((house) => {
                const balance = houseCashBoxes.find(
                  (item) => String(item.betHouseId) === String(house.id)
                )

                return (
                  <Card
                    key={house.id}
                    className="border-white/10 bg-black text-white"
                  >
                    <CardContent className="p-5">
                      <p className="text-sm text-zinc-400">{house.name}</p>

                      <p className="mt-2 text-2xl font-bold text-[#ffd400]">
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
          </CardContent>
        </Card>

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
          id="form-saldo-banco"
          className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl"
        >
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Building2 className="h-5 w-5 text-[#ffd400]" />
              Registrar saldo inicial de banco
            </CardTitle>

            <p className="text-sm text-zinc-400">
              Registra cuánto dinero existe al iniciar el día en cada banco o
              cuenta.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_200px_1fr]">
              <div className="space-y-2">
                <Label className="text-zinc-300">Banco / cuenta</Label>
                <Select
                  value={bankForm.bankId}
                  onValueChange={(value) =>
                    setBankForm({ ...bankForm, bankId: value })
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
                        <SelectItem key={bank.id} value={String(bank.id)}>
                          {bank.name}
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
                  value={bankForm.initialBalance}
                  onChange={(e) =>
                    setBankForm({
                      ...bankForm,
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
                  value={bankForm.notes}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, notes: e.target.value })
                  }
                  placeholder="Opcional"
                  className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4 text-sm text-[#ffd400]">
              Banco seleccionado:{" "}
              <span className="font-bold">{selectedBankName}</span>. Si ya
              existe saldo para ese banco en esta fecha, se actualizará.
            </div>

            <div className="mt-5 flex justify-end border-t border-white/10 pt-5">
              <Button
                type="button"
                onClick={saveBankCashBox}
                disabled={saving}
                className="h-11 w-full bg-[#d90416] px-8 font-semibold text-white hover:bg-[#ff1024] md:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                Guardar saldo de banco
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
              Registrar saldo inicial de casa
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
                Registros:{" "}
                <span className="font-bold text-[#ffd400]">
                  {bankCashBoxes.length + houseCashBoxes.length}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {missingBanks.length > 0 && (
              <div className="rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4 text-sm text-[#ffd400]">
                Bancos pendientes:{" "}
                <span className="font-bold">
                  {missingBanks.map((bank) => bank.name).join(", ")}
                </span>
              </div>
            )}

            {missingHouses.length > 0 && (
              <div className="rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4 text-sm text-[#ffd400]">
                Casas pendientes:{" "}
                <span className="font-bold">
                  {missingHouses.map((house) => house.name).join(", ")}
                </span>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/[0.03] hover:bg-white/[0.03]">
                    <TableHead className="text-zinc-400">Tipo</TableHead>
                    <TableHead className="text-zinc-400">Nombre</TableHead>
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
                  ) : bankCashBoxes.length === 0 &&
                    houseCashBoxes.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-zinc-400"
                      >
                        No hay saldos iniciales registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {bankCashBoxes.map((item) => (
                        <TableRow
                          key={`bank-${item.id}`}
                          className="border-white/10 hover:bg-white/[0.03]"
                        >
                          <TableCell>
                            <Badge className="bg-blue-500/15 text-blue-300 hover:bg-blue-500/15">
                              Banco
                            </Badge>
                          </TableCell>

                          <TableCell className="font-medium text-white">
                            {item.bank?.name || "-"}
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
                              onClick={() => fillBankForm(item)}
                              className="h-9 border border-white/10 bg-black px-4 text-sm font-semibold text-white hover:bg-white/10"
                            >
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {houseCashBoxes.map((item) => (
                        <TableRow
                          key={`house-${item.id}`}
                          className="border-white/10 hover:bg-white/[0.03]"
                        >
                          <TableCell>
                            <Badge className="bg-[#ffd400]/15 text-[#ffd400] hover:bg-[#ffd400]/15">
                              Casa
                            </Badge>
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
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black p-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-zinc-500">Caja inicial ventas</p>
                  <p className="mt-1 text-2xl font-bold text-[#ffd400]">
                    {formatMoney(dailyCashBox?.salesInitialCash)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Bancos</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {formatMoney(totalBankInitialBalance)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Casas</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {formatMoney(totalHouseInitialBalance)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Total apertura</p>
                  <p className="mt-1 text-2xl font-bold text-[#ffd400]">
                    {formatMoney(totalOpening)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
  <CardHeader className="border-b border-white/10">
    <CardTitle className="flex items-center gap-2 text-xl font-bold">
      <Landmark className="h-5 w-5 text-[#ffd400]" />
      Pagos pendientes de casas
    </CardTitle>

    <p className="text-sm text-zinc-400">
      Aquí registras cuando la casa paga un retiro pendiente.
    </p>
  </CardHeader>

  <CardContent className="p-6">
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 bg-white/[0.03]">
            <TableHead className="text-zinc-400">ID</TableHead>
            <TableHead className="text-zinc-400">Cliente</TableHead>
            <TableHead className="text-zinc-400">Casa</TableHead>
            <TableHead className="text-right text-zinc-400">Retiro</TableHead>
            <TableHead className="text-right text-zinc-400">
              Pago casa
            </TableHead>
            <TableHead className="text-zinc-400">Estado</TableHead>
            <TableHead className="text-right text-zinc-400">Acción</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {pendingWithdrawals.length === 0 ? (
            <TableRow className="border-white/10">
              <TableCell
                colSpan={7}
                className="py-10 text-center text-zinc-400"
              >
                No hay retiros pendientes para esta fecha.
              </TableCell>
            </TableRow>
          ) : (
            pendingWithdrawals.map((item) => (
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
                    value={paymentForms[item.id] ?? String(item.amount || "")}
                    onChange={(e) =>
                      setPaymentForms((current) => ({
                        ...current,
                        [item.id]: e.target.value,
                      }))
                    }
                    className="ml-auto h-9 max-w-[130px] border-white/10 bg-black text-right text-white"
                  />
                </TableCell>

                <TableCell>
                  <Badge className="bg-[#ffd400]/15 text-[#ffd400]">
                    {item.status}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <Button
                    type="button"
                    onClick={() => saveHousePayment(item)}
                    disabled={saving}
                    className="h-9 bg-[#d90416] font-bold text-white hover:bg-[#ff1024]"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Registrar pago
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
                    <TableHead className="text-zinc-400">Bancos</TableHead>
                    <TableHead className="text-zinc-400">
                      Saldo bancos
                    </TableHead>
                    <TableHead className="text-zinc-400">Casas</TableHead>
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
                        colSpan={8}
                        className="py-8 text-center text-zinc-400"
                      >
                        Cargando historial...
                      </TableCell>
                    </TableRow>
                  ) : dailyCashBoxHistory.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={8}
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
                          <Badge className="bg-blue-500/15 text-blue-300 hover:bg-blue-500/15">
                            {item.banksCount || 0} bancos
                          </Badge>
                        </TableCell>

                        <TableCell className="font-bold text-white">
                          {formatMoney(item.totalBankInitialBalance)}
                        </TableCell>

                        <TableCell>
                          <Badge className="bg-[#ffd400]/15 text-[#ffd400] hover:bg-[#ffd400]/15">
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
    </AppShell>
  )
}