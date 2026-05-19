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

function getDateKey(value) {
  if (!value) return ""
  return String(value).slice(0, 10)
}

export default function CajaPage() {
  const today = getTodayDate()

  const [betHouses, setBetHouses] = useState([])
  const [dailyCashBox, setDailyCashBox] = useState(null)
  const [dailyCashBoxHistory, setDailyCashBoxHistory] = useState([])

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

  async function loadData(dateValue = selectedDate) {
    try {
      setLoading(true)

      const [housesRes, cashBoxRes, historyRes] = await Promise.all([
        api.get("/api/bet-houses"),
        api.get(`/api/daily-cash-box?date=${dateValue}`),
        api.get("/api/daily-cash-box/history"),
      ])

      const housesData = Array.isArray(housesRes.data) ? housesRes.data : []
      const cashBoxData = cashBoxRes.data || null
      const historyData = Array.isArray(historyRes.data) ? historyRes.data : []

      setBetHouses(housesData)
      setDailyCashBox(cashBoxData)
      setDailyCashBoxHistory(historyData)

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

  function resetHouseForm() {
    setHouseForm({
      betHouseId: "",
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

  function fillHouseForm(item) {
    setHouseForm({
      betHouseId: String(item.betHouseId),
      initialBalance: String(item.initialBalance || 0),
      notes: item.notes || "",
    })
  }

  function setToday() {
    setSelectedDate(today)
  }

  function openHistoryDate(dateValue) {
    setSelectedDate(getDateKey(dateValue))
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
                Registra el dinero con el que inicia la jornada: caja de ventas
                y saldo inicial por cada casa de apuestas. El cierre final se
                realiza en el módulo de Cuadre.
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffd400] text-black">
              <WalletCards className="h-7 w-7" />
            </div>
          </div>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
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

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
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
    </AppShell>
  )
}