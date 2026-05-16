"use client"

import Image from "next/image"
import { useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    try {
      if (!email.trim()) {
        alert("Ingresa el correo.")
        return
      }

      if (!password.trim()) {
        alert("Ingresa la contraseña.")
        return
      }

      setLoading(true)

      const res = await api.post("/api/auth/login", {
        email,
        password,
      })

      localStorage.setItem("token", res.data.token)
      localStorage.setItem("user", JSON.stringify(res.data.user))

      window.location.href = "/dashboard"
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.error || "No se pudo iniciar sesión.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative flex items-center justify-center overflow-hidden bg-[#050505] p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#d90416] via-[#8f000c] to-[#050505]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_78%,rgba(255,212,0,0.18),transparent_34%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(255,255,255,0.07),transparent_28%)]" />
          <div className="absolute right-0 top-0 h-full w-80 bg-gradient-to-r from-transparent via-[#050505]/75 to-[#050505]" />
          <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#050505]/70 to-transparent" />

          <div className="relative z-10 w-full max-w-2xl">
            <div className="relative -ml-2 w-full max-w-2xl">
              <div className="absolute left-4 top-1/2 h-28 w-[85%] -translate-y-1/2 rounded-full bg-black/30 blur-3xl" />
              <div className="absolute left-10 top-1/2 h-20 w-[70%] -translate-y-1/2 rounded-full bg-[#d90416]/35 blur-2xl" />
              <div className="absolute left-6 top-0 h-10 w-[80%] rounded-full bg-[#d90416]/50 blur-2xl" />
              <div className="absolute bottom-0 left-6 h-10 w-[80%] rounded-full bg-[#5a0008]/60 blur-xl" />

              <div
                className="relative h-28 w-full sm:h-32"
                style={{
                  maskImage: [
                    "linear-gradient(to right, transparent 0%, black 12%, black 68%, transparent 100%)",
                    "linear-gradient(to bottom, transparent 0%, black 10%, black 80%, transparent 100%)",
                  ].join(", "),
                  maskComposite: "intersect",
                  WebkitMaskImage: [
                    "linear-gradient(to right, transparent 0%, black 12%, black 68%, transparent 100%)",
                    "linear-gradient(to bottom, transparent 0%, black 10%, black 80%, transparent 100%)",
                  ].join(", "),
                  WebkitMaskComposite: "source-in",
                }}
              >
                <Image
                  src="/logo.png"
                  alt="GAELFAST"
                  fill
                  priority
                  className="object-cover"
                  style={{ mixBlendMode: "lighten" }}
                />
              </div>
            </div>

            <p className="mt-8 max-w-md text-base leading-7 text-white/85">
              Control de recargas, retiros, caja, clientes y productos internos
              del local.
            </p>

            <div className="mt-10 border-t border-white/10 pt-6">
              <p className="text-sm font-semibold tracking-[0.25em] text-[#ffd400]">
                GAELFAST © 2026
              </p>

              <p className="mt-2 text-sm text-white/65">
                Catamayo, Loja - EC
              </p>

              <p className="mt-1 text-xs text-white/45">
                Todos los derechos reservados.
              </p>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center overflow-hidden bg-[#050505] p-8">
          <div className="absolute left-0 top-0 h-full w-44 bg-gradient-to-r from-[#050505] to-transparent" />
          <div className="absolute right-10 top-20 h-52 w-52 rounded-full bg-[#d90416]/10 blur-3xl" />
          <div className="absolute bottom-20 right-24 h-40 w-40 rounded-full bg-[#ffd400]/5 blur-3xl" />

          <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0b0b0d]/95 p-8 shadow-2xl backdrop-blur">
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight">
                Iniciar sesión
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Ingresa con tu usuario autorizado para administrar GAELFAST.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-zinc-300">Correo</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@gaelfast.com"
                  autoComplete="email"
                  className="h-12 border-white/10 bg-black text-white placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Contraseña</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-12 border-white/10 bg-black text-white placeholder:text-zinc-600"
                />
              </div>

              <Button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="h-12 w-full bg-[#d90416] text-base font-semibold text-white hover:bg-[#ff1024]"
              >
                {loading ? "Ingresando..." : "Entrar al sistema"}
              </Button>
            </div>

            <div className="mt-6 rounded-2xl border border-[#ffd400]/30 bg-[#ffd400]/10 p-4">
              <p className="text-sm leading-6 text-[#ffd400]">
                Acceso solo para administrador y vendedores autorizados.
              </p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-zinc-600">
                GAELFAST · Catamayo, Loja - EC
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}