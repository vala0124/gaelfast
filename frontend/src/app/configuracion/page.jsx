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
import { Banknote, Building2, Settings } from "lucide-react"

export default function ConfiguracionPage() {
  const [betHouses, setBetHouses] = useState([])
  const [banks, setBanks] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [newBank, setNewBank] = useState("")
  const [newHouse, setNewHouse] = useState("")

  async function loadData() {
    try {
      setLoading(true)

      const [housesRes, banksRes] = await Promise.all([
        api.get("/api/bet-houses"),
        api.get("/api/banks"),
      ])

      setBetHouses(Array.isArray(housesRes.data) ? housesRes.data : [])
      setBanks(Array.isArray(banksRes.data) ? banksRes.data : [])
    } catch (error) {
      console.error(error)
      alert("No se pudo cargar configuración. Revisa que el backend esté encendido.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const totals = useMemo(() => {
    return {
      houses: betHouses.length,
      banks: banks.length,
    }
  }, [betHouses, banks])

  async function createBank() {
    try {
      const name = newBank.trim()

      if (!name) {
        alert("Ingresa el nombre del banco.")
        return
      }

      setSaving(true)

      await api.post("/api/banks", { name })

      setNewBank("")
      await loadData()
      alert("Banco agregado correctamente.")
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.error || "Error agregando banco.")
    } finally {
      setSaving(false)
    }
  }

  async function createHouse() {
    try {
      const name = newHouse.trim()

      if (!name) {
        alert("Ingresa el nombre de la casa de apuestas.")
        return
      }

      setSaving(true)

      await api.post("/api/bet-houses", { name })

      setNewHouse("")
      await loadData()
      alert("Casa de apuestas agregada correctamente.")
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.error || "Error agregando casa de apuestas.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell title="Configuración">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#d90416] via-[#8f000c] to-[#050505] p-6 shadow-2xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
                Administración
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Configuración general
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-white/75">
                Administra las casas de apuestas y bancos disponibles para
                recargas, retiros, caja y cuadre.
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffd400] text-black">
              <Settings className="h-7 w-7" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Casas activas</p>
              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {totals.houses}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Bancos activos</p>
              <p className="mt-2 text-3xl font-bold">{totals.banks}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Banknote className="h-5 w-5 text-[#ffd400]" />
                Bancos
              </CardTitle>

              <p className="text-sm text-zinc-400">
                Agrega bancos para usarlos en recargas, ventas, caja y cuadre.
              </p>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Nombre del banco</Label>
                  <Input
                    value={newBank}
                    onChange={(e) => setNewBank(e.target.value)}
                    placeholder="Ej: Banco de Loja"
                    className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={createBank}
                    disabled={saving}
                    className="h-11 w-full bg-[#ffd400] font-bold text-black hover:bg-[#ffe766] md:w-auto"
                  >
                    Agregar
                  </Button>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 bg-white/[0.03] hover:bg-white/[0.03]">
                      <TableHead className="text-zinc-400">Banco</TableHead>
                      <TableHead className="text-zinc-400">Estado</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow className="border-white/10">
                        <TableCell
                          colSpan={2}
                          className="py-8 text-center text-zinc-400"
                        >
                          Cargando bancos...
                        </TableCell>
                      </TableRow>
                    ) : banks.length === 0 ? (
                      <TableRow className="border-white/10">
                        <TableCell
                          colSpan={2}
                          className="py-8 text-center text-zinc-400"
                        >
                          No hay bancos registrados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      banks.map((bank) => (
                        <TableRow
                          key={bank.id}
                          className="border-white/10 hover:bg-white/[0.03]"
                        >
                          <TableCell className="font-medium text-white">
                            {bank.name}
                          </TableCell>

                          <TableCell>
                            <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                              Activo
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

          <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Building2 className="h-5 w-5 text-[#ffd400]" />
                Casas de apuestas
              </CardTitle>

              <p className="text-sm text-zinc-400">
                Agrega casas para usarlas en recargas, retiros, caja y cuadre.
              </p>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Label className="text-zinc-300">
                    Nombre de la casa
                  </Label>
                  <Input
                    value={newHouse}
                    onChange={(e) => setNewHouse(e.target.value)}
                    placeholder="Ej: COBET"
                    className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={createHouse}
                    disabled={saving}
                    className="h-11 w-full bg-[#ffd400] font-bold text-black hover:bg-[#ffe766] md:w-auto"
                  >
                    Agregar
                  </Button>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 bg-white/[0.03] hover:bg-white/[0.03]">
                      <TableHead className="text-zinc-400">Casa</TableHead>
                      <TableHead className="text-zinc-400">Estado</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow className="border-white/10">
                        <TableCell
                          colSpan={2}
                          className="py-8 text-center text-zinc-400"
                        >
                          Cargando casas...
                        </TableCell>
                      </TableRow>
                    ) : betHouses.length === 0 ? (
                      <TableRow className="border-white/10">
                        <TableCell
                          colSpan={2}
                          className="py-8 text-center text-zinc-400"
                        >
                          No hay casas registradas.
                        </TableCell>
                      </TableRow>
                    ) : (
                      betHouses.map((house) => (
                        <TableRow
                          key={house.id}
                          className="border-white/10 hover:bg-white/[0.03]"
                        >
                          <TableCell className="font-medium text-white">
                            {house.name}
                          </TableCell>

                          <TableCell>
                            <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                              Activa
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
      </div>
    </AppShell>
  )
}