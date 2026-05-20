"use client"

import { useEffect, useMemo, useState } from "react"
import AppShell from "@/components/layout/AppShell"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Package } from "lucide-react"

function formatMoney(value: number | string | null | undefined) {
  const number = Number(value || 0)

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(number)
}

export default function AdminProductosPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadProducts() {
    try {
      setLoading(true)

      const res = await api.get("/api/products")
      setProducts(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error(error)
      alert("No se pudo cargar el stock de productos.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const totals = useMemo(() => {
    const units = products.reduce(
      (sum, item) => sum + Number(item.stock || 0),
      0
    )

    const inventoryCost = products.reduce(
      (sum, item) =>
        sum + Number(item.stock || 0) * Number(item.purchasePrice || 0),
      0
    )

    const inventorySaleValue = products.reduce(
      (sum, item) =>
        sum + Number(item.stock || 0) * Number(item.salePrice || 0),
      0
    )

    return {
      units,
      inventoryCost,
      inventorySaleValue,
    }
  }, [products])

  return (
    <AppShell title="Admin · Productos Stock">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#d90416] via-[#8f000c] to-[#050505] p-6 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
            Administración
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Stock de productos
          </h1>

          <p className="mt-2 text-sm text-white/75">
            Consulta el inventario actual. Esta vista es solo informativa para el administrador.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <Package className="h-5 w-5 text-[#ffd400]" />
              <p className="mt-3 text-sm text-zinc-400">Unidades en stock</p>
              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {loading ? "..." : totals.units}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Costo inventario</p>
              <p className="mt-2 text-3xl font-bold">
                {loading ? "..." : formatMoney(totals.inventoryCost)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Valor venta inventario</p>
              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {loading ? "..." : formatMoney(totals.inventorySaleValue)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-xl font-bold">
              Inventario actual
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/[0.03]">
                    <TableHead className="text-zinc-400">Producto</TableHead>
                    <TableHead className="text-zinc-400">Categoría</TableHead>
                    <TableHead className="text-right text-zinc-400">Costo</TableHead>
                    <TableHead className="text-right text-zinc-400">Precio venta</TableHead>
                    <TableHead className="text-right text-zinc-400">Stock</TableHead>
                    <TableHead className="text-right text-zinc-400">Estado</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow className="border-white/10">
                      <TableCell colSpan={6} className="py-8 text-center text-zinc-400">
                        Cargando productos...
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell colSpan={6} className="py-10 text-center text-zinc-400">
                        No hay productos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((item) => (
                      <TableRow key={item.id} className="border-white/10">
                        <TableCell className="font-medium text-white">
                          {item.name}
                          <p className="text-xs text-zinc-500">
                            {item.barcode || "-"}
                          </p>
                        </TableCell>

                        <TableCell className="text-zinc-400">
                          {item.category || "-"}
                        </TableCell>

                        <TableCell className="text-right">
                          {formatMoney(item.purchasePrice)}
                        </TableCell>

                        <TableCell className="text-right text-[#ffd400]">
                          {formatMoney(item.salePrice)}
                        </TableCell>

                        <TableCell className="text-right font-bold">
                          {item.stock}
                        </TableCell>

                        <TableCell className="text-right">
                          <Badge
                            className={
                              Number(item.stock || 0) > 0
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-red-500/15 text-red-300"
                            }
                          >
                            {Number(item.stock || 0) > 0 ? "Disponible" : "Sin stock"}
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
    </AppShell>
  )
}