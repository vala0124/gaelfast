"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
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
  Barcode,
  Banknote,
  CalendarDays,
  CreditCard,
  ReceiptText,
  RefreshCcw,
  Search,
  ShoppingCart,
} from "lucide-react"

type Product = {
  id: number
  name: string
  barcode: string | null
  category: string | null
  purchasePrice: number
  salePrice: number
  stock: number
  active: boolean
  createdAt: string
  updatedAt: string
}

type ProductSale = {
  id: number
  productId: number
  quantity: number
  unitPrice: number
  total: number
  paymentMethod: string
  createdAt: string
  product?: Product
}

type ApiError = {
  response?: {
    status?: number
    data?: {
      error?: string
    }
  }
}

function formatMoney(value: number | string | null | undefined) {
  const number = Number(value || 0)

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(number)
}

function formatDate(value: string | null | undefined) {
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

function isDateInsideRange(dateValue: string, startDate: string, endDate: string) {
  const itemDate = new Date(dateValue)
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T23:59:59`)

  return itemDate >= start && itemDate <= end
}

export default function VentasProductosPage() {
  const barcodeInputRef = useRef<HTMLInputElement | null>(null)
  const today = getTodayDate()

  const [sales, setSales] = useState<ProductSale[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [barcodeSearch, setBarcodeSearch] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [unitPrice, setUnitPrice] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO")
  const [cashReceived, setCashReceived] = useState("")

  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadSales() {
    try {
      setLoading(true)

      const res = await api.get("/api/product-sales")
      setSales(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error(error)
      alert("No se pudieron cargar las ventas. Revisa que el backend esté encendido.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSales()
  }, [])

  useEffect(() => {
    barcodeInputRef.current?.focus()
  }, [])

  function resetSaleForm() {
    setSelectedProduct(null)
    setBarcodeSearch("")
    setQuantity("1")
    setUnitPrice("")
    setPaymentMethod("EFECTIVO")
    setCashReceived("")

    setTimeout(() => {
      barcodeInputRef.current?.focus()
    }, 80)
  }

  async function findProductByBarcode(barcodeValue?: string) {
    const barcode = String(barcodeValue || barcodeSearch).trim()

    if (!barcode) {
      alert("Escanea o ingresa un código de barra.")
      return
    }

    try {
      setSaving(true)

      const res = await api.get(`/api/products/barcode/${encodeURIComponent(barcode)}`)
      const product: Product = res.data

      setSelectedProduct(product)
      setUnitPrice(String(product.salePrice || ""))
      setQuantity("1")
      setCashReceived("")
    } catch (error) {
      const apiError = error as ApiError

      if (apiError.response?.status === 404) {
        setSelectedProduct(null)
        setUnitPrice("")
        setCashReceived("")
        alert("Producto no encontrado. Primero créalo en el módulo de Productos.")
        return
      }

      console.error(error)
      alert(apiError.response?.data?.error || "Error buscando producto.")
    } finally {
      setSaving(false)
    }
  }

  function handleBarcodeKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      findProductByBarcode()
    }
  }

  const projectedTotal = Number(quantity || 0) * Number(unitPrice || 0)
  const cashChange = Number(cashReceived || 0) - projectedTotal

  async function createSale() {
    try {
      if (!selectedProduct) {
        alert("Busca primero un producto por código de barra.")
        return
      }

      if (!quantity || Number(quantity) <= 0) {
        alert("Ingresa una cantidad válida.")
        return
      }

      if (Number(quantity) > Number(selectedProduct.stock || 0)) {
        alert("Stock insuficiente para esta venta.")
        return
      }

      if (!unitPrice || Number(unitPrice) <= 0) {
        alert("Ingresa un precio de venta válido.")
        return
      }

      if (!paymentMethod) {
        alert("Selecciona el método de pago.")
        return
      }

      if (paymentMethod === "EFECTIVO") {
        if (!cashReceived || Number(cashReceived) < projectedTotal) {
          alert("El valor recibido no puede ser menor al total a cobrar.")
          return
        }
      }

      setSaving(true)

      await api.post("/api/product-sales", {
        productId: selectedProduct.id,
        quantity: Number(quantity),
        paymentMethod,
        unitPrice: Number(unitPrice),
      })

      await loadSales()
      alert("Venta registrada correctamente.")
      resetSaleForm()
    } catch (error) {
      const apiError = error as ApiError
      console.error(error)
      alert(apiError.response?.data?.error || "Error registrando venta.")
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
    setTodayFilter()
  }

  const filteredSales = useMemo(() => {
    const text = search.toLowerCase().trim()

    return sales.filter((sale) => {
      const matchesDate = isDateInsideRange(sale.createdAt, startDate, endDate)

      const matchesSearch =
        !text ||
        sale.product?.name?.toLowerCase().includes(text) ||
        sale.product?.barcode?.toLowerCase().includes(text) ||
        sale.product?.category?.toLowerCase().includes(text) ||
        sale.paymentMethod?.toLowerCase().includes(text)

      return matchesDate && matchesSearch
    })
  }, [sales, search, startDate, endDate])

  const totalSales = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0
  )


  const totalUnits = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.quantity || 0),
    0
  )

  return (
    <AppShell title="Ventas productos">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#d90416] via-[#8f000c] to-[#050505] p-6 shadow-2xl">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
                Punto de venta
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Venta por código de barra
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-white/75">
                Escanea el producto, ajusta cantidad o precio de venta, calcula
                cambio en efectivo y registra la venta.
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffd400] text-black">
              <ShoppingCart className="h-7 w-7" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Total vendido</p>
              <p className="mt-2 text-3xl font-bold text-[#ffd400]">
                {formatMoney(totalSales)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Unidades vendidas</p>
              <p className="mt-2 text-3xl font-bold">{totalUnits}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Barcode className="h-5 w-5 text-[#ffd400]" />
              Nueva venta
            </CardTitle>

            <p className="text-sm text-zinc-400">
              Coloca el cursor en el código de barra y escanea el producto.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
              <div className="space-y-2">
                <Label className="text-zinc-300">Código de barra</Label>
                <Input
                  ref={barcodeInputRef}
                  value={barcodeSearch}
                  onChange={(e) => setBarcodeSearch(e.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder="Escanea o escribe el código"
                  className="h-12 border-white/10 bg-black text-white placeholder:text-zinc-600"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={() => findProductByBarcode()}
                  disabled={saving}
                  className="h-12 w-full bg-[#ffd400] px-8 font-bold text-black hover:bg-[#ffe766] lg:w-auto"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={resetSaleForm}
                  className="h-12 w-full border border-white/10 bg-black px-8 font-bold text-white hover:bg-white/10 lg:w-auto"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Limpiar
                </Button>
              </div>
            </div>

            {!selectedProduct ? (
              <div className="mt-5 rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4 text-sm text-[#ffd400]">
                Esperando producto. Escanea un código para cargar la venta.
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-white/10 bg-black p-5">
                <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                      Producto encontrado
                    </Badge>

                    <h3 className="mt-3 text-2xl font-bold text-white">
                      {selectedProduct.name}
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      Código: {selectedProduct.barcode || "-"} · Categoría:{" "}
                      {selectedProduct.category || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 px-5 py-3 text-right">
                    <p className="text-sm text-[#ffd400]/80">Stock actual</p>
                    <p className="text-3xl font-bold text-[#ffd400]">
                      {selectedProduct.stock}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="h-11 border-white/10 bg-[#0b0b0d] text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Precio venta</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      className="h-11 border-white/10 bg-[#0b0b0d] text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Método de pago</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(value) => {
                        setPaymentMethod(value)
                        if (value === "TRANSFERENCIA") {
                          setCashReceived("")
                        }
                      }}
                    >
                      <SelectTrigger className="h-11 border-white/10 bg-[#0b0b0d] text-white">
                        <SelectValue placeholder="Método" />
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

                  <div className="rounded-2xl border border-white/10 bg-[#0b0b0d] p-4">
                    <p className="text-sm text-zinc-500">Total a cobrar</p>
                    <p className="mt-1 text-2xl font-bold text-[#ffd400]">
                      {formatMoney(projectedTotal)}
                    </p>
                  </div>
                </div>

                {paymentMethod === "EFECTIVO" && (
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Dinero recibido</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder="0.00"
                        className="h-11 border-white/10 bg-[#0b0b0d] text-white placeholder:text-zinc-600"
                      />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0b0b0d] p-4">
                      <p className="text-sm text-zinc-500">Cambio a entregar</p>
                      <p
                        className={
                          cashChange < 0
                            ? "mt-1 text-2xl font-bold text-red-300"
                            : "mt-1 text-2xl font-bold text-emerald-300"
                        }
                      >
                        {formatMoney(cashChange > 0 ? cashChange : 0)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4">
                      <p className="text-sm text-[#ffd400]/80">
                        Estado del pago
                      </p>
                      <p className="mt-1 font-bold text-[#ffd400]">
                        {!cashReceived
                          ? "Esperando efectivo"
                          : cashChange < 0
                          ? `Falta ${formatMoney(Math.abs(cashChange))}`
                          : cashChange === 0
                          ? "Pago exacto"
                          : "Cambio listo"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex justify-end border-t border-white/10 pt-5">
                  <Button
                    type="button"
                    onClick={createSale}
                    disabled={saving}
                    className="h-11 bg-[#d90416] px-8 font-bold text-white hover:bg-[#ff1024]"
                  >
                    <ReceiptText className="mr-2 h-4 w-4" />
                    {saving ? "Guardando..." : "Registrar venta"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <CardTitle className="text-xl font-bold">
                  Historial de ventas
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Consulta ventas por fecha, producto, código o método de pago.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black px-4 py-2 text-sm text-zinc-400">
                Registros:{" "}
                <span className="font-bold text-[#ffd400]">
                  {filteredSales.length}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto_auto]">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar venta..."
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
                    <TableHead className="text-zinc-400">Producto</TableHead>
                    <TableHead className="text-zinc-400">Método</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Cantidad
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Precio
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Total
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
                        Cargando ventas...
                      </TableCell>
                    </TableRow>
                  ) : filteredSales.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-zinc-400"
                      >
                        No hay ventas registradas para este filtro.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSales.map((sale) => (
                      <TableRow
                        key={sale.id}
                        className="border-white/10 hover:bg-white/[0.03]"
                      >
                        <TableCell className="text-zinc-400">
                          {formatDate(sale.createdAt)}
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="font-medium text-white">
                              {sale.product?.name || "-"}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {sale.product?.barcode || "-"} ·{" "}
                              {sale.product?.category || "-"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={
                              sale.paymentMethod === "EFECTIVO"
                                ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15"
                                : "bg-[#ffd400]/15 text-[#ffd400] hover:bg-[#ffd400]/15"
                            }
                          >
                            {sale.paymentMethod}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right font-bold text-white">
                          {sale.quantity}
                        </TableCell>

                        <TableCell className="text-right text-zinc-400">
                          {formatMoney(sale.unitPrice)}
                        </TableCell>

                        <TableCell className="text-right font-bold text-[#ffd400]">
                          {formatMoney(sale.total)}
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