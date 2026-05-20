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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Banknote,
  CalendarDays,
  CreditCard,
  ReceiptText,
  Search,
  Wallet,
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

function getBankFromNotes(notes) {
  if (!notes) return "-"

  const match = String(notes).match(/Banco:\s*([^|]+)/i)

  if (!match) return "-"

  return match[1].trim()
}

export default function RecargasPage() {
  const today = getTodayDate()

  const [clients, setClients] = useState([])
  const [betHouses, setBetHouses] = useState([])
  const [banks, setBanks] = useState([])
  const [recharges, setRecharges] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [houseFilter, setHouseFilter] = useState("TODAS")

  const [form, setForm] = useState({
    clientName: "",
    clientCedula: "",
    clientPhone: "",
    amount: "",
    betHouseId: "",
    paymentMethod: "EFECTIVO",
    bankName: "",
    receiptNumber: "",
  })

  async function loadData() {
    try {
      setLoading(true)

      const [clientsRes, housesRes, banksRes, rechargesRes] =
        await Promise.all([
          api.get("/api/clients"),
          api.get("/api/bet-houses"),
          api.get("/api/banks"),
          api.get(`/api/recharges?startDate=${startDate}&endDate=${endDate}`),
        ])

      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : [])
      setBetHouses(Array.isArray(housesRes.data) ? housesRes.data : [])
      setBanks(Array.isArray(banksRes.data) ? banksRes.data : [])
      setRecharges(Array.isArray(rechargesRes.data) ? rechargesRes.data : [])
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

  function findClientByCedula(value) {
    const cedula = String(value || "").trim()

    if (!cedula) return null

    return clients.find((client) => String(client.cedula).trim() === cedula)
  }

  function handleCedulaChange(value) {
    const existingClient = findClientByCedula(value)

    if (existingClient) {
      setForm({
        ...form,
        clientCedula: value,
        clientName: existingClient.name || "",
        clientPhone: existingClient.phone || "",
      })

      return
    }

    setForm({
      ...form,
      clientCedula: value,
    })
  }

  function handleCedulaBlur() {
    const existingClient = findClientByCedula(form.clientCedula)

    if (!existingClient) return

    setForm({
      ...form,
      clientName: existingClient.name || "",
      clientPhone: existingClient.phone || "",
    })
  }

  function getSelectedBetHouseName() {
    const house = betHouses.find(
      (item) => String(item.id) === String(form.betHouseId)
    )

    return house?.name || "-"
  }

  function validateRechargeForm() {
    if (!form.clientCedula.trim()) {
      alert("Ingresa la cédula o ID del cliente.")
      return false
    }

    if (!form.clientName.trim()) {
      alert("Ingresa el nombre del cliente.")
      return false
    }

    if (!form.betHouseId) {
      alert("Selecciona la casa de apuestas.")
      return false
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Ingresa una cantidad válida.")
      return false
    }

    if (!form.paymentMethod) {
      alert("Selecciona el método de pago.")
      return false
    }

    if (form.paymentMethod === "TRANSFERENCIA" && !form.bankName) {
      alert("Selecciona el banco de la transferencia.")
      return false
    }

    if (form.paymentMethod === "TRANSFERENCIA" && !form.receiptNumber.trim()) {
      alert("Ingresa el número de comprobante.")
      return false
    }

    return true
  }

  function openConfirmRecharge() {
    if (!validateRechargeForm()) return

    setConfirmOpen(true)
  }

  async function createRecharge() {
    try {
      if (!validateRechargeForm()) return

      setSaving(true)

      await api.post("/api/recharges", {
        clientName: form.clientName,
        clientCedula: form.clientCedula,
        clientPhone: form.clientPhone,
        amount: Number(form.amount),
        betHouseId: Number(form.betHouseId),
        paymentMethod: form.paymentMethod,
        bankName: form.bankName,
        receiptNumber: form.receiptNumber,
        status: "RECARGADO",
      })

      setForm({
        clientName: "",
        clientCedula: "",
        clientPhone: "",
        amount: "",
        betHouseId: "",
        paymentMethod: "EFECTIVO",
        bankName: "",
        receiptNumber: "",
      })

      setConfirmOpen(false)

      await loadData()
      alert("Recarga registrada correctamente.")
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.error || "Error registrando la recarga.")
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
    setHouseFilter("TODAS")
    setTodayFilter()
  }

  const filteredRecharges = useMemo(() => {
    const text = search.toLowerCase().trim()

    return recharges.filter((item) => {
      const matchesDate = isDateInsideRange(item.createdAt, startDate, endDate)

      const matchesHouse =
        houseFilter === "TODAS" || String(item.betHouseId) === String(houseFilter)

      const bankName = getBankFromNotes(item.notes)

      const matchesSearch =
        !text ||
        item.client?.name?.toLowerCase().includes(text) ||
        item.client?.cedula?.toLowerCase().includes(text) ||
        item.client?.phone?.toLowerCase().includes(text) ||
        item.betHouse?.name?.toLowerCase().includes(text) ||
        item.receiptNumber?.toLowerCase().includes(text) ||
        item.paymentMethod?.toLowerCase().includes(text) ||
        item.notes?.toLowerCase().includes(text) ||
        bankName.toLowerCase().includes(text)

      return matchesDate && matchesHouse && matchesSearch
    })
  }, [recharges, search, startDate, endDate, houseFilter])

  const totalRecharged = filteredRecharges
    .filter((item) => item.status !== "ANULADO")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const totalCash = filteredRecharges
    .filter((item) => item.paymentMethod === "EFECTIVO")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const totalTransfer = filteredRecharges
    .filter((item) => item.paymentMethod === "TRANSFERENCIA")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  return (
    <AppShell title="Recargas">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#d90416] via-[#8f000c] to-[#050505] p-6 shadow-2xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
                Registro principal
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Recargas de clientes
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-white/75">
                Registra recargas por cliente, casa de apuestas, método de pago
                y número de comprobante. Si el cliente ya existe, se completa
                automáticamente por CI/ID.
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffd400] text-black">
              <Wallet className="h-7 w-7" />
            </div>
          </div>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <ReceiptText className="h-5 w-5 text-[#ffd400]" />
              Nueva recarga
            </CardTitle>
            <p className="text-sm text-zinc-400">
              Ingresa primero la cédula o ID. Si el cliente ya existe, sus datos
              se completan automáticamente.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Cédula o ID</Label>
                  <Input
                    value={form.clientCedula}
                    onChange={(e) => handleCedulaChange(e.target.value)}
                    onBlur={handleCedulaBlur}
                    placeholder="Ingresa cédula o ID"
                    className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Nombre</Label>
                  <Input
                    value={form.clientName}
                    onChange={(e) =>
                      setForm({ ...form, clientName: e.target.value })
                    }
                    placeholder="Nombre del cliente"
                    className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Celular</Label>
                  <Input
                    value={form.clientPhone}
                    onChange={(e) =>
                      setForm({ ...form, clientPhone: e.target.value })
                    }
                    placeholder="Celular del cliente"
                    className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Casa de apuestas</Label>
                  <Select
                    value={form.betHouseId}
                    onValueChange={(value) =>
                      setForm({ ...form, betHouseId: value })
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
                  <Label className="text-zinc-300">Cantidad</Label>
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
                  <Label className="text-zinc-300">Método de pago</Label>
                  <Select
                    value={form.paymentMethod}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        paymentMethod: value,
                        bankName: value === "EFECTIVO" ? "" : form.bankName,
                        receiptNumber:
                          value === "EFECTIVO" ? "" : form.receiptNumber,
                      })
                    }
                  >
                    <SelectTrigger className="h-11 border-white/10 bg-black text-white">
                      <SelectValue placeholder="Selecciona método" />
                    </SelectTrigger>

                    <SelectContent className="border-white/10 bg-[#0b0b0d] text-white">
                      <SelectItem value="EFECTIVO">
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-[#ffd400]" />
                          Efectivo
                        </div>
                      </SelectItem>

                      <SelectItem value="TRANSFERENCIA">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-[#ffd400]" />
                          Transferencia
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid min-h-[84px] gap-4 md:grid-cols-3">
                {form.paymentMethod === "TRANSFERENCIA" ? (
                  <>
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

                    <div className="space-y-2">
                      <Label className="text-zinc-300">
                        Nro. de comprobante
                      </Label>
                      <Input
                        value={form.receiptNumber}
                        onChange={(e) =>
                          setForm({ ...form, receiptNumber: e.target.value })
                        }
                        placeholder="Ej: 001234567"
                        className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                      />
                    </div>

                    <div />
                  </>
                ) : (
                  <div className="md:col-span-3">
                    <div className="rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4 text-sm font-medium text-[#ffd400]">
                      Pago en efectivo: no requiere banco ni número de
                      comprobante.
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-white/10 pt-5">
                <Button
                  onClick={openConfirmRecharge}
                  disabled={saving}
                  className="h-11 w-full bg-[#d90416] px-8 text-base font-semibold text-white hover:bg-[#ff1024] md:w-auto"
                >
                  Registrar recarga
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Total recargado</p>
              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {formatMoney(totalRecharged)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Efectivo</p>
              <p className="mt-2 text-3xl font-bold">
                {formatMoney(totalCash)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Transferencias</p>
              <p className="mt-2 text-3xl font-bold">
                {formatMoney(totalTransfer)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl font-bold">
                  Historial de recargas
                </CardTitle>
                <p className="mt-1 text-sm text-zinc-400">
                  Consulta recargas por fecha, cliente, celular, casa,
                  comprobante o método.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black px-4 py-2 text-sm text-zinc-400">
                Registros filtrados:{" "}
                <span className="font-bold text-[#ffd400]">
                  {filteredRecharges.length}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_180px_190px_auto_auto]">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar recarga..."
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

              <Select value={houseFilter} onValueChange={setHouseFilter}>
                <SelectTrigger className="h-11 border-white/10 bg-black text-white">
                  <SelectValue placeholder="Casa" />
                </SelectTrigger>

                <SelectContent className="border-white/10 bg-[#0b0b0d] text-white">
                  <SelectItem value="TODAS">Todas</SelectItem>
                  {betHouses.map((house) => (
                    <SelectItem key={house.id} value={String(house.id)}>
                      {house.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
                    <TableHead className="text-zinc-400">Cliente</TableHead>
                    <TableHead className="text-zinc-400">Celular</TableHead>
                    <TableHead className="text-zinc-400">Casa</TableHead>
                    <TableHead className="text-zinc-400">
                      Detalle de pago
                    </TableHead>
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
                        Cargando recargas...
                      </TableCell>
                    </TableRow>
                  ) : filteredRecharges.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-zinc-400"
                      >
                        No hay recargas registradas para este filtro.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecharges.map((item) => (
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
                              {item.client?.name || "-"}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {item.client?.cedula || "-"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="text-zinc-400">
                          {item.client?.phone || "-"}
                        </TableCell>

                        <TableCell>{item.betHouse?.name || "-"}</TableCell>

                        <TableCell>
                          {item.paymentMethod === "EFECTIVO" ? (
                            <div className="flex flex-col gap-1">
                              <Badge className="w-fit bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                                EFECTIVO
                              </Badge>
                              <span className="text-sm text-zinc-500">
                                Pago en local
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <Badge className="w-fit bg-[#ffd400]/15 text-[#ffd400] hover:bg-[#ffd400]/15">
                                TRANSFERENCIA
                              </Badge>
                              <span className="text-sm text-zinc-400">
                                {getBankFromNotes(item.notes)} · Comp.{" "}
                                {item.receiptNumber || "Sin número"}
                              </span>
                            </div>
                          )}
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
              Confirmar recarga
            </DialogTitle>
            <p className="text-sm text-zinc-400">
              Revisa los datos antes de registrar la operación.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4">
              <p className="text-sm text-[#ffd400]">
                Esta acción guardará la recarga en el historial del cliente.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black p-4">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">CI o ID</span>
                  <span className="font-semibold text-white">
                    {form.clientCedula || "-"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Cliente</span>
                  <span className="font-semibold text-white">
                    {form.clientName || "-"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Celular</span>
                  <span className="font-semibold text-white">
                    {form.clientPhone || "-"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Casa de apuestas</span>
                  <span className="font-semibold text-white">
                    {getSelectedBetHouseName()}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Método</span>
                  <span className="font-semibold text-white">
                    {form.paymentMethod}
                  </span>
                </div>

                {form.paymentMethod === "TRANSFERENCIA" && (
                  <>
                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-500">Banco</span>
                      <span className="font-semibold text-white">
                        {form.bankName || "-"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-500">Comprobante</span>
                      <span className="font-semibold text-white">
                        {form.receiptNumber || "-"}
                      </span>
                    </div>
                  </>
                )}

                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">Cantidad</span>
                    <span className="text-2xl font-bold text-[#ffd400]">
                      {formatMoney(form.amount)}
                    </span>
                  </div>
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
                onClick={createRecharge}
                disabled={saving}
                className="bg-[#d90416] font-semibold text-white hover:bg-[#ff1024]"
              >
                {saving ? "Guardando..." : "Confirmar y registrar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}