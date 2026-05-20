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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  HandCoins,
  Plus,
  Search,
  TicketCheck,
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

function getStatusClass(status) {
  if (status === "COMPENSADO") {
    return "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15"
  }

  if (status === "DIFERENCIA") {
    return "bg-[#ffd400]/15 text-[#ffd400] hover:bg-[#ffd400]/15"
  }

  if (status === "ANULADO") {
    return "bg-red-500/15 text-red-300 hover:bg-red-500/15"
  }

  return "bg-white/10 text-zinc-300 hover:bg-white/10"
}

export default function RetirosPage() {
  const today = getTodayDate()

  const [clients, setClients] = useState([])
  const [betHouses, setBetHouses] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [houseFilter, setHouseFilter] = useState("TODAS")

  const [form, setForm] = useState({
    clientId: "",
    clientCedula: "",
    clientName: "",
    clientPhone: "",
    betHouseId: "",
    amount: "",
    withdrawalCode: "",
  })

  async function loadData() {
    try {
      setLoading(true)

      const [clientsRes, housesRes, withdrawalsRes] = await Promise.all([
        api.get("/api/clients"),
        api.get("/api/bet-houses"),
        api.get(`/api/withdrawals?startDate=${startDate}&endDate=${endDate}`),
      ])

      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : [])
      setBetHouses(Array.isArray(housesRes.data) ? housesRes.data : [])
      setWithdrawals(Array.isArray(withdrawalsRes.data) ? withdrawalsRes.data : [])
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

  function resetForm() {
    setForm({
      clientId: "",
      clientCedula: "",
      clientName: "",
      clientPhone: "",
      betHouseId: "",
      amount: "",
      withdrawalCode: "",
    })
  }

  function openNewWithdrawal() {
    resetForm()
    setOpen(true)
  }

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
        clientId: String(existingClient.id),
        clientCedula: value,
        clientName: existingClient.name || "",
        clientPhone: existingClient.phone || "",
      })

      return
    }

    setForm({
      ...form,
      clientId: "",
      clientCedula: value,
    })
  }

  function handleCedulaBlur() {
    const existingClient = findClientByCedula(form.clientCedula)

    if (!existingClient) return

    setForm({
      ...form,
      clientId: String(existingClient.id),
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

  function validateWithdrawalForm() {
    if (!form.clientCedula.trim()) {
      alert("Ingresa la cédula o ID del cliente.")
      return false
    }

    if (!form.clientName.trim()) {
      alert("Ingresa el nombre del cliente.")
      return false
    }

    if (!form.betHouseId) {
      alert("Selecciona la casa de apuestas donde ganó.")
      return false
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Ingresa un valor válido para el retiro.")
      return false
    }

    if (!form.withdrawalCode.trim()) {
      alert("Ingresa el # de retiro.")
      return false
    }

    return true
  }

  function openConfirmWithdrawal() {
    if (!validateWithdrawalForm()) return

    setConfirmOpen(true)
  }

  async function createWithdrawal() {
    try {
      if (!validateWithdrawalForm()) return

      setSaving(true)

      await api.post("/api/withdrawals", {
        clientId: form.clientId ? Number(form.clientId) : null,
        clientName: form.clientName,
        clientCedula: form.clientCedula,
        clientPhone: form.clientPhone,
        betHouseId: Number(form.betHouseId),
        amount: Number(form.amount),
        withdrawalCode: form.withdrawalCode,
        receiptNumber: null,
        paidToClient: false,
        status: "PENDIENTE",
      })

      setConfirmOpen(false)
      setOpen(false)
      resetForm()

      await loadData()
      alert("Retiro registrado correctamente.")
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.error || "Error registrando el retiro.")
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

  const filteredWithdrawals = useMemo(() => {
    const text = search.toLowerCase().trim()

    return withdrawals.filter((item) => {
      const matchesDate = isDateInsideRange(item.createdAt, startDate, endDate)

      const matchesHouse =
        houseFilter === "TODAS" || String(item.betHouseId) === String(houseFilter)

      const matchesSearch =
        !text ||
        item.client?.name?.toLowerCase().includes(text) ||
        item.client?.cedula?.toLowerCase().includes(text) ||
        item.client?.phone?.toLowerCase().includes(text) ||
        item.betHouse?.name?.toLowerCase().includes(text) ||
        item.withdrawalCode?.toLowerCase().includes(text) ||
        item.status?.toLowerCase().includes(text)

      return matchesDate && matchesHouse && matchesSearch
    })
  }, [withdrawals, search, startDate, endDate, houseFilter])

  const totalWithdrawals = filteredWithdrawals
    .filter((item) => item.status !== "ANULADO")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const totalPaidByHouse = filteredWithdrawals
    .filter((item) => item.status !== "ANULADO")
    .reduce((sum, item) => sum + Number(item.paidByHouse || 0), 0)

  const totalDifference = filteredWithdrawals
    .filter((item) => item.status !== "ANULADO")
    .reduce((sum, item) => sum + Number(item.difference || 0), 0)

  return (
    <AppShell title="Retiros">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#d90416] via-[#8f000c] to-[#050505] p-6 shadow-2xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
                Control de retiros
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Retiros de clientes
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-white/75">
                Registra cuando un cliente gana y solicita retiro. Luego en caja
                se compensa el valor que la casa de apuestas transfiere al dueño.
              </p>
            </div>

            <Button
              type="button"
              onClick={openNewWithdrawal}
              className="h-11 bg-[#ffd400] px-5 font-semibold text-black hover:bg-[#ffe766]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Retirar
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Total retirado</p>
              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {formatMoney(totalWithdrawals)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Pagado por casas</p>
              <p className="mt-2 text-3xl font-bold">
                {formatMoney(totalPaidByHouse)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Diferencia pendiente</p>
              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {formatMoney(totalDifference)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl font-bold">
                  Historial de retiros
                </CardTitle>
                <p className="mt-1 text-sm text-zinc-400">
                  Consulta retiros por fecha, cliente, casa, # retiro o estado.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black px-4 py-2 text-sm text-zinc-400">
                Registros filtrados:{" "}
                <span className="font-bold text-[#ffd400]">
                  {filteredWithdrawals.length}
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
                  placeholder="Buscar retiro..."
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
                    <TableHead className="text-zinc-400">Casa</TableHead>
                    <TableHead className="text-zinc-400"># Retiro</TableHead>
                    <TableHead className="text-right text-zinc-400">Monto</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Pagado casa
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Diferencia
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Estado
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
                        Cargando retiros...
                      </TableCell>
                    </TableRow>
                  ) : filteredWithdrawals.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={8}
                        className="py-10 text-center text-zinc-400"
                      >
                        No hay retiros registrados para este filtro.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWithdrawals.map((item) => (
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
                              {item.client?.cedula || "-"} ·{" "}
                              {item.client?.phone || "-"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>{item.betHouse?.name || "-"}</TableCell>

                        <TableCell className="font-medium text-zinc-300">
                          {item.withdrawalCode || "-"}
                        </TableCell>

                        <TableCell className="text-right font-bold text-[#ffd400]">
                          {formatMoney(item.amount)}
                        </TableCell>

                        <TableCell className="text-right text-zinc-300">
                          {formatMoney(item.paidByHouse)}
                        </TableCell>

                        <TableCell className="text-right font-bold text-white">
                          {formatMoney(item.difference)}
                        </TableCell>

                        <TableCell className="text-right">
                          <Badge className={getStatusClass(item.status)}>
                            {item.status || "PENDIENTE"}
                          </Badge>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-[#0b0b0d] text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Registrar retiro
            </DialogTitle>
            <p className="text-sm text-zinc-400">
              Ingresa el CI/ID del cliente para completar sus datos y registrar
              el retiro solicitado.
            </p>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-zinc-300">CI o ID</Label>
                <Input
                  value={form.clientCedula}
                  onChange={(e) => handleCedulaChange(e.target.value)}
                  onBlur={handleCedulaBlur}
                  placeholder="Ingresa CI o ID"
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
                  placeholder="Celular opcional"
                  className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                />
              </div>
            </div>

            {!form.clientId && form.clientCedula.trim() && (
              <div className="rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4 text-sm text-[#ffd400]">
                Cliente nuevo: se creará automáticamente al registrar el retiro.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-zinc-300">Casa donde ganó</Label>
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
                    {betHouses.map((house) => (
                      <SelectItem key={house.id} value={String(house.id)}>
                        {house.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Valor</Label>
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
                <Label className="text-zinc-300"># retiro</Label>
                <Input
                  value={form.withdrawalCode}
                  onChange={(e) =>
                    setForm({ ...form, withdrawalCode: e.target.value })
                  }
                  placeholder="Ej: RET-123456"
                  className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-white/10 pt-5">
              <Button
                type="button"
                onClick={openConfirmWithdrawal}
                disabled={saving}
                className="h-11 w-full bg-[#d90416] px-8 font-semibold text-white hover:bg-[#ff1024] md:w-auto"
              >
                Registrar retiro
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="border-white/10 bg-[#0b0b0d] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Confirmar retiro
            </DialogTitle>
            <p className="text-sm text-zinc-400">
              Revisa los datos antes de registrar el retiro.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4">
              <p className="text-sm text-[#ffd400]">
                Este retiro quedará como PENDIENTE hasta que se compense desde caja.
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
                  <span className="text-zinc-500">Casa</span>
                  <span className="font-semibold text-white">
                    {getSelectedBetHouseName()}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500"># retiro</span>
                  <span className="font-semibold text-white">
                    {form.withdrawalCode || "-"}
                  </span>
                </div>

                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">Valor</span>
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
                onClick={createWithdrawal}
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