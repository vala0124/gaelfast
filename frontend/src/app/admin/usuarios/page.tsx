"use client"

import { useEffect, useState } from "react"
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
import { KeyRound, Save, ShieldCheck, Users } from "lucide-react"

type User = {
  id: number
  name: string
  email: string
  role: string
  active: boolean
  createdAt: string
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [saving, setSaving] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  })

  const [passwords, setPasswords] = useState<Record<string, string>>({})

  async function loadUsers() {
    try {
      const res = await api.get("/api/users")
      setUsers(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error(error)
      alert("No se pudieron cargar los usuarios.")
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function createSeller() {
    try {
      if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
        alert("Nombre, correo y contraseña son obligatorios.")
        return
      }

      setSaving(true)

      await api.post("/api/users/sellers", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
      })

      setForm({
        name: "",
        email: "",
        password: "",
      })

      await loadUsers()
      alert("Vendedor creado correctamente.")
    } catch (error: any) {
      console.error(error)
      alert(error.response?.data?.error || "Error creando vendedor.")
    } finally {
      setSaving(false)
    }
  }

  async function toggleUser(user: User) {
    try {
      setSavingId(user.id)

      await api.patch(`/api/users/${user.id}/status`, {
        active: !user.active,
        })

      await loadUsers()
    } catch (error: any) {
      console.error(error)
      alert(error.response?.data?.error || "Error actualizando usuario.")
    } finally {
      setSavingId(null)
    }
  }

  async function updatePassword(user: User) {
    try {
      const password = passwords[user.id]?.trim()

      if (!password) {
        alert("Ingresa una nueva contraseña.")
        return
      }

      setSavingId(user.id)

      await api.patch(`/api/users/${user.id}/password`, {
        password,
      })

      setPasswords((current) => ({
        ...current,
        [user.id]: "",
      }))

      alert("Contraseña actualizada correctamente.")
    } catch (error: any) {
      console.error(error)
      alert(error.response?.data?.error || "Error actualizando contraseña.")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <AppShell title="Admin · Usuarios">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#d90416] via-[#8f000c] to-[#050505] p-6 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
            Administración
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Usuarios del sistema
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-white/75">
            Crea vendedores, activa o desactiva accesos y actualiza contraseñas.
          </p>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <ShieldCheck className="h-5 w-5 text-[#ffd400]" />
              Crear vendedor
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-zinc-300">Nombre</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Correo</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="vendedor@gaelfast.com"
                  className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Contraseña</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Contraseña"
                  className="h-11 border-white/10 bg-black text-white placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end border-t border-white/10 pt-5">
              <Button
                type="button"
                onClick={createSeller}
                disabled={saving}
                className="h-11 bg-[#d90416] px-8 font-bold text-white hover:bg-[#ff1024]"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Guardando..." : "Crear vendedor"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Users className="h-5 w-5 text-[#ffd400]" />
              Usuarios registrados
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/[0.03]">
                    <TableHead className="text-zinc-400">Nombre</TableHead>
                    <TableHead className="text-zinc-400">Correo</TableHead>
                    <TableHead className="text-zinc-400">Rol</TableHead>
                    <TableHead className="text-zinc-400">Estado</TableHead>
                    <TableHead className="text-zinc-400">Nueva clave</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {users.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-zinc-400"
                      >
                        No hay usuarios registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} className="border-white/10">
                        <TableCell className="font-medium text-white">
                          {user.name}
                        </TableCell>

                        <TableCell className="text-zinc-400">
                          {user.email}
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={
                              user.role === "ADMIN"
                                ? "bg-[#ffd400]/15 text-[#ffd400]"
                                : "bg-blue-500/15 text-blue-300"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={
                              user.active
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-red-500/15 text-red-300"
                            }
                          >
                            {user.active ? "Activo" : "Desactivado"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Input
                            type="password"
                            value={passwords[user.id] || ""}
                            onChange={(e) =>
                              setPasswords((current) => ({
                                ...current,
                                [user.id]: e.target.value,
                              }))
                            }
                            placeholder="Nueva contraseña"
                            className="h-9 max-w-[190px] border-white/10 bg-black text-white placeholder:text-zinc-600"
                          />
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              onClick={() => updatePassword(user)}
                              disabled={savingId === user.id}
                              className="h-9 border border-white/10 bg-black px-3 font-semibold text-white hover:bg-white/10"
                            >
                              <KeyRound className="mr-2 h-4 w-4" />
                              Clave
                            </Button>

                            <Button
                              type="button"
                              onClick={() => toggleUser(user)}
                              disabled={savingId === user.id}
                              className={
                                user.active
                                  ? "h-9 bg-red-600 px-3 font-semibold text-white hover:bg-red-500"
                                  : "h-9 bg-emerald-600 px-3 font-semibold text-white hover:bg-emerald-500"
                              }
                            >
                              {user.active ? "Desactivar" : "Activar"}
                            </Button>
                          </div>
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