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
  Banknote,
  Building2,
  Calculator,
  RefreshCcw,
  Save,
  Settings,
} from "lucide-react"

function formatMoney(value) {
  const number = Number(value || 0)

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(number)
}

export default function ConfiguracionPage() {
  const [betHouses, setBetHouses] = useState([])
  const [banks, setBanks] = useState([])
  const [commissionSettings, setCommissionSettings] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [newBank, setNewBank] = useState("")
  const [newHouse, setNewHouse] = useState("")

  const [commissionForm, setCommissionForm] = useState({})

  async function loadData() {
    try {
      setLoading(true)

      const [housesRes, banksRes, commissionsRes] = await Promise.all([
        api.get("/api/bet-houses"),
        api.get("/api/banks"),
        api.get("/api/commission-settings"),
      ])

      const housesData = Array.isArray(housesRes.data) ? housesRes.data : []
      const banksData = Array.isArray(banksRes.data) ? banksRes.data : []
      const commissionsData = Array.isArray(commissionsRes.data)
        ? commissionsRes.data
        : []

      setBetHouses(housesData)
      setBanks(banksData)
      setCommissionSettings(commissionsData)

      const initialForm = {}

      for (const house of housesData) {
        const rechargeSetting = commissionsData.find(
          (item) =>
            String(item.betHouseId) === String(house.id) &&
            item.operationType === "RECARGA"
        )

        const withdrawalSetting = commissionsData.find(
          (item) =>
            String(item.betHouseId) === String(house.id) &&
            item.operationType === "RETIRO"
        )

        initialForm[house.id] = {
          recharge: String(rechargeSetting?.amount ?? 0),
          withdrawal: String(withdrawalSetting?.amount ?? 0),
        }
      }

      setCommissionForm(initialForm)
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
    const rechargeTotal = commissionSettings
      .filter((item) => item.operationType === "RECARGA" && item.active)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const withdrawalTotal = commissionSettings
      .filter((item) => item.operationType === "RETIRO" && item.active)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    return {
      rechargeTotal,
      withdrawalTotal,
      houses: betHouses.length,
      banks: banks.length,
    }
  }, [commissionSettings, betHouses, banks])

  function updateCommissionField(houseId, field, value) {
    setCommissionForm((prev) => ({
      ...prev,
      [houseId]: {
        ...(prev[houseId] || {}),
        [field]: value,
      },
    }))
  }

  async function saveHouseCommissions(houseId) {
    try {
      const values = commissionForm[houseId] || {}

      const rechargeAmount = Number(values.recharge || 0)
      const withdrawalAmount = Number(values.withdrawal || 0)

      if (rechargeAmount < 0 || withdrawalAmount < 0) {
        alert("Las comisiones no pueden ser negativas.")
        return
      }

      setSaving(true)

      await Promise.all([
        api.post("/api/commission-settings", {
          betHouseId: Number(houseId),
          operationType: "RECARGA",
          amount: rechargeAmount,
          active: true,
        }),
        api.post("/api/commission-settings", {
          betHouseId: Number(houseId),
          operationType: "RETIRO",
          amount: withdrawalAmount,
          active: true,
        }),
      ])

      await loadData()
      alert("Comisiones guardadas correctamente.")
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.error || "Error guardando comisiones.")
    } finally {
      setSaving(false)
    }
  }

  async function createBank() {
    try {
      const name = newBank.trim()

      if (!name) {
        alert("Ingresa el nombre del banco.")
        return
      }

      setSaving(true)

      await api.post("/api/banks", {
        name,
      })

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

      const houseRes = await api.post("/api/bet-houses", {
        name,
      })

      const house = houseRes.data

      if (house?.id) {
        await Promise.all([
          api.post("/api/commission-settings", {
            betHouseId: Number(house.id),
            operationType: "RECARGA",
            amount: 0,
            active: true,
          }),
          api.post("/api/commission-settings", {
            betHouseId: Number(house.id),
            operationType: "RETIRO",
            amount: 0,
            active: true,
          }),
        ])
      }

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
                Administra las casas de apuestas, bancos y comisiones que se
                aplicarán automáticamente en recargas y retiros.
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffd400] text-black">
              <Settings className="h-7 w-7" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
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

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Comisión recarga total</p>
              <p className="mt-2 text-3xl font-bold">
                {formatMoney(totals.rechargeTotal)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Comisión retiro total</p>
              <p className="mt-2 text-3xl font-bold">
                {formatMoney(totals.withdrawalTotal)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <Calculator className="h-5 w-5 text-[#ffd400]" />
                  Comisiones por casa
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Estos valores se usarán automáticamente cuando registres una
                  nueva recarga o retiro.
                </p>
              </div>

              <Button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="h-11 border border-white/10 bg-black font-semibold text-white hover:bg-white/10"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/[0.03] hover:bg-white/[0.03]">
                    <TableHead className="text-zinc-400">Casa</TableHead>
                    <TableHead className="text-zinc-400">
                      Comisión recarga
                    </TableHead>
                    <TableHead className="text-zinc-400">
                      Comisión retiro
                    </TableHead>
                    <TableHead className="text-zinc-400">Estado</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Acción
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
                        Cargando configuración...
                      </TableCell>
                    </TableRow>
                  ) : betHouses.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={5}
                        className="py-10 text-center text-zinc-400"
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
                        <TableCell>
                          <div>
                            <p className="font-bold text-white">{house.name}</p>
                            <p className="text-xs text-zinc-500">
                              ID: {house.id}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={commissionForm[house.id]?.recharge || ""}
                            onChange={(e) =>
                              updateCommissionField(
                                house.id,
                                "recharge",
                                e.target.value
                              )
                            }
                            placeholder="0.00"
                            className="h-10 max-w-[160px] border-white/10 bg-black text-white placeholder:text-zinc-600"
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={commissionForm[house.id]?.withdrawal || ""}
                            onChange={(e) =>
                              updateCommissionField(
                                house.id,
                                "withdrawal",
                                e.target.value
                              )
                            }
                            placeholder="0.00"
                            className="h-10 max-w-[160px] border-white/10 bg-black text-white placeholder:text-zinc-600"
                          />
                        </TableCell>

                        <TableCell>
                          <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                            Activa
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            type="button"
                            onClick={() => saveHouseCommissions(house.id)}
                            disabled={saving}
                            className="h-10 bg-[#d90416] font-semibold text-white hover:bg-[#ff1024]"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Guardar
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

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Banknote className="h-5 w-5 text-[#ffd400]" />
                Bancos
              </CardTitle>

              <p className="text-sm text-zinc-400">
                Agrega bancos para usarlos en recargas y caja.
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
                    {banks.length === 0 ? (
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
                    {betHouses.length === 0 ? (
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