"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function Header({ title }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")

    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login"
  }

  const userName = user?.name || "Usuario"
  const userRole = user?.role === "ADMIN" ? "Administrador" : "Vendedor"

  return (
    <header className="flex h-20 items-center justify-between border-b border-white/10 bg-black/40 px-6 backdrop-blur">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
          GAELFAST
        </p>

        <h2 className="mt-1 text-2xl font-black text-white">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-white">{userName}</p>
          <p className="text-xs text-zinc-500">{userRole} · Sesión activa</p>
        </div>

        <Button
          type="button"
          onClick={logout}
          className="border border-white/10 bg-black font-bold text-white hover:bg-white/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Salir
        </Button>
      </div>
    </header>
  )
}