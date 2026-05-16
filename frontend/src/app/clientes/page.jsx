"use client"

import { useEffect, useMemo, useState } from "react"
import AppShell from "@/components/layout/AppShell"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Eye, Search, Users } from "lucide-react"

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

export default function ClientesPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [history, setHistory] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(false)

  async function loadClients() {
    try {
      setLoading(true)
      const res = await api.get("/api/clients")
      setClients(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error(error)
      alert("No se pudieron cargar los clientes. Revisa que el backend esté encendido.")
    } finally {
      setLoading(false)
    }
  }

  async function openClientHistory(client) {
    try {
      setSelectedClient(client)
      setHistoryOpen(true)
      setHistory(null)
      setLoadingHistory(true)

      const res = await api.get(`/api/clients/${client.id}/history`)
      setHistory(res.data)
    } catch (error) {
      console.error(error)
      alert("No se pudo cargar el historial del cliente.")
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  const filteredClients = useMemo(() => {
    const text = search.toLowerCase().trim()

    if (!text) return clients

    return clients.filter((client) => {
      return (
        client.cedula?.toLowerCase().includes(text) ||
        client.name?.toLowerCase().includes(text) ||
        client.phone?.toLowerCase().includes(text)
      )
    })
  }, [clients, search])

  const totalGeneral = clients.reduce(
    (sum, client) => sum + Number(client.totalRecharged || 0),
    0
  )

  const topClient = clients.reduce((top, client) => {
    const clientTotal = Number(client.totalRecharged || 0)
    const topTotal = Number(top?.totalRecharged || 0)

    return clientTotal > topTotal ? client : top
  }, null)

  return (
    <AppShell title="Clientes">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#d90416] via-[#8f000c] to-[#050505] p-6 shadow-2xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
                Historial de clientes
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Consulta general de clientes
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-white/75">
                Aquí se muestran los clientes generados desde las recargas.
                Puedes consultar por CI/ID o nombre y revisar cuánto ha
                recargado cada persona.
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffd400] text-black">
              <Users className="h-7 w-7" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Clientes registrados</p>
              <p className="mt-2 text-3xl font-bold">{clients.length}</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Total recargado histórico</p>
              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {formatMoney(totalGeneral)}
              </p>
            </CardContent>
          </Card>

         <Card className="border-white/10 bg-[#0b0b0d] text-white">
          <CardContent className="p-5">
            <p className="text-sm text-zinc-400">Cliente con mayor recarga</p>

            {topClient && Number(topClient.totalRecharged || 0) > 0 ? (
              <>
                <p className="mt-2 truncate text-2xl font-bold">
                  {topClient.name}
                </p>
                <p className="mt-1 text-lg font-bold text-[#ffd400]">
                  {formatMoney(topClient.totalRecharged)}
                </p>
              </>
            ) : (
              <p className="mt-2 text-3xl font-bold">-</p>
            )}
          </CardContent>
        </Card>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl font-bold">
                  Historial de recargas por cliente
                </CardTitle>
                <p className="mt-1 text-sm text-zinc-400">
                  Haz clic sobre un cliente para ver todo su historial.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black px-4 py-2 text-sm text-zinc-400">
                Total clientes:{" "}
                <span className="font-bold text-[#ffd400]">
                  {clients.length}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="mb-5">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por CI/ID, nombre o celular..."
                  className="h-11 border-white/10 bg-black pl-10 text-white placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/[0.03] hover:bg-white/[0.03]">
                    <TableHead className="text-zinc-400">CI o ID</TableHead>
                    <TableHead className="text-zinc-400">Nombre</TableHead>
                    <TableHead className="text-zinc-400">Celular</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Total recargado
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Historial
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-zinc-400"
                      >
                        Cargando clientes...
                      </TableCell>
                    </TableRow>
                  ) : filteredClients.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell colSpan={4} className="py-10 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center">
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffd400]/10 text-[#ffd400]">
                            <Users className="h-6 w-6" />
                          </div>

                          <p className="font-semibold text-white">
                            No hay clientes para mostrar
                          </p>

                          <p className="mt-1 text-sm text-zinc-500">
                            Los clientes aparecerán aquí cuando se registren
                            desde una recarga.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client) => (
                      <TableRow
                        key={client.id}
                        onClick={() => openClientHistory(client)}
                        className="cursor-pointer border-white/10 hover:bg-white/[0.05]"
                      >
                        <TableCell className="font-medium text-white">
                          {client.cedula}
                        </TableCell>

                        <TableCell>{client.name}</TableCell>

                        <TableCell className="text-zinc-400">
                          {client.phone || "-"}
                        </TableCell>

                        <TableCell className="text-right font-bold text-[#ffd400]">
                          {formatMoney(client.totalRecharged)}
                        </TableCell>

                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black px-3 py-1 text-xs text-zinc-300">
                            <Eye className="h-3.5 w-3.5 text-[#ffd400]" />
                            Ver
                          </span>
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

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#0b0b0d] text-white sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Historial del cliente
            </DialogTitle>
            <p className="text-sm text-zinc-400">
              Recargas, retiros y diferencias asociadas al cliente seleccionado.
            </p>
          </DialogHeader>

          {loadingHistory ? (
            <div className="rounded-2xl border border-white/10 bg-black p-6 text-zinc-400">
              Cargando historial...
            </div>
          ) : history ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-black p-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-zinc-500">Cliente</p>
                    <p className="mt-1 font-bold text-white">
                      {history.client?.name || selectedClient?.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">CI o ID</p>
                    <p className="mt-1 font-bold text-white">
                      {history.client?.cedula || selectedClient?.cedula}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">Celular</p>
                    <p className="mt-1 font-bold text-white">
                      {history.client?.phone || selectedClient?.phone || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-white/10 bg-black text-white">
                  <CardContent className="p-5">
                    <p className="text-sm text-zinc-400">Total recargado</p>
                    <p className="mt-2 text-2xl font-bold text-[#ffd400]">
                      {formatMoney(history.totals?.totalRecharged)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-black text-white">
                  <CardContent className="p-5">
                    <p className="text-sm text-zinc-400">Total retirado</p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatMoney(history.totals?.totalWithdrawn)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-black text-white">
                  <CardContent className="p-5">
                    <p className="text-sm text-zinc-400">Pagado por casas</p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatMoney(history.totals?.totalPaidByHouse)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-black text-white">
                  <CardContent className="p-5">
                    <p className="text-sm text-zinc-400">Diferencia</p>
                    <p className="mt-2 text-2xl font-bold text-[#ffd400]">
                      {formatMoney(history.totals?.pendingDifference)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 bg-white/[0.03] hover:bg-white/[0.03]">
                      <TableHead className="text-zinc-400">Fecha</TableHead>
                      <TableHead className="text-zinc-400">Tipo</TableHead>
                      <TableHead className="text-zinc-400">Casa</TableHead>
                      <TableHead className="text-zinc-400">Método / ID</TableHead>
                      <TableHead className="text-zinc-400">Comprobante</TableHead>
                      <TableHead className="text-right text-zinc-400">
                        Monto
                      </TableHead>
                      <TableHead className="text-right text-zinc-400">
                        Estado
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {history.movements?.length ? (
                      history.movements.map((movement) => (
                        <TableRow
                          key={movement.id}
                          className="border-white/10 hover:bg-white/[0.03]"
                        >
                          <TableCell className="text-zinc-400">
                            {formatDate(movement.date)}
                          </TableCell>

                          <TableCell>
                            <Badge
                              className={
                                movement.type === "RECARGA"
                                  ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15"
                                  : "bg-[#ffd400]/15 text-[#ffd400] hover:bg-[#ffd400]/15"
                              }
                            >
                              {movement.type}
                            </Badge>
                          </TableCell>

                          <TableCell>{movement.betHouse || "-"}</TableCell>

                          <TableCell className="text-zinc-400">
                            {movement.type === "RECARGA"
                              ? movement.paymentMethod || "-"
                              : movement.withdrawalCode || "-"}
                          </TableCell>

                          <TableCell className="text-zinc-400">
                            {movement.receiptNumber || "-"}
                          </TableCell>

                          <TableCell className="text-right font-bold text-white">
                            {formatMoney(movement.amount)}
                          </TableCell>

                          <TableCell className="text-right text-zinc-400">
                            {movement.status || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="border-white/10">
                        <TableCell
                          colSpan={7}
                          className="py-8 text-center text-zinc-400"
                        >
                          Este cliente todavía no tiene movimientos.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black p-6 text-zinc-400">
              No se pudo cargar el historial.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}