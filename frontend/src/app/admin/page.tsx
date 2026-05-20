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
import { Save, ShieldCheck, Users } from "lucide-react"

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  })

  async function loadUsers() {
    const res = await api.get("/api/users")
    setUsers(Array.isArray(res.data) ? res.data : [])
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
        name: form.name,
        email: form.email,
        password: form.password,
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

  return (
    <AppShell title="Panel Admin">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#d90416] via-[#8f000c] to-[#050505] p-6 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
            Administración
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Panel del administrador
          </h1>

          <p className="mt-2 text-sm text-white/75">
            Crea vendedores y controla los usuarios que pueden entrar al sistema.
          </p>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2">
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
                  className="border-white/10 bg-black text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Correo</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="border-white/10 bg-black text-white"
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
                    className="border-white/10 bg-black text-white"
                    />
              </div>
            </div>

            <div className="mt-5 flex justify-end border-t border-white/10 pt-5">
              <Button
                onClick={createSeller}
                disabled={saving}
                className="bg-[#d90416] font-bold text-white hover:bg-[#ff1024]"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Guardando..." : "Crear vendedor"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#ffd400]" />
              Usuarios del sistema
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className="bg-[#ffd400]/15 text-[#ffd400]">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-500/15 text-emerald-300">
                        Activo
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}