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
  Boxes,
  Package,
  PlusCircle,
  RefreshCcw,
  Search,
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

type ProductForm = {
  name: string
  barcode: string
  category: string
  purchasePrice: string
  salePrice: string
  stock: string
}

type PageMode = "SCAN" | "CREATE" | "EXISTING"

type ApiError = {
  response?: {
    status?: number
    data?: {
      error?: string
    }
  }
}

const categories = ["Bebidas", "Snacks"]

function formatMoney(value: number | string | null | undefined) {
  const number = Number(value || 0)

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(number)
}

function emptyForm(): ProductForm {
  return {
    name: "",
    barcode: "",
    category: "Bebidas",
    purchasePrice: "",
    salePrice: "",
    stock: "",
  }
}

export default function ProductosPage() {
  const barcodeInputRef = useRef<HTMLInputElement | null>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [barcodeSearch, setBarcodeSearch] = useState("")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("TODAS")

  const [form, setForm] = useState<ProductForm>(emptyForm())
  const [stockToAdd, setStockToAdd] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<PageMode>("SCAN")

  async function loadProducts() {
    try {
      setLoading(true)

      const res = await api.get("/api/products")
      setProducts(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error(error)
      alert("No se pudieron cargar los productos. Revisa que el backend esté encendido.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    barcodeInputRef.current?.focus()
  }, [])

  function resetScanner() {
    setSelectedProduct(null)
    setBarcodeSearch("")
    setForm(emptyForm())
    setStockToAdd("")
    setMode("SCAN")

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
      setForm({
        name: product.name || "",
        barcode: product.barcode || barcode,
        category: product.category || "Bebidas",
        purchasePrice: String(product.purchasePrice || ""),
        salePrice: String(product.salePrice || ""),
        stock: "",
      })
      setStockToAdd("")
      setMode("EXISTING")
    } catch (error) {
      const apiError = error as ApiError

      if (apiError.response?.status === 404) {
        setSelectedProduct(null)
        setForm({
          ...emptyForm(),
          barcode,
        })
        setStockToAdd("")
        setMode("CREATE")
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

  async function createProduct() {
    try {
      if (!form.barcode.trim()) {
        alert("Ingresa o escanea el código de barra.")
        return
      }

      if (!form.name.trim()) {
        alert("Ingresa el nombre del producto.")
        return
      }

      if (!form.category) {
        alert("Selecciona la categoría.")
        return
      }

      if (!form.purchasePrice || Number(form.purchasePrice) < 0) {
        alert("Ingresa un precio costo válido.")
        return
      }

      if (!form.salePrice || Number(form.salePrice) <= 0) {
        alert("Ingresa un precio venta válido.")
        return
      }

      if (!form.stock || Number(form.stock) < 0) {
        alert("Ingresa el stock inicial.")
        return
      }

      setSaving(true)

      await api.post("/api/products", {
        name: form.name,
        barcode: form.barcode,
        category: form.category,
        purchasePrice: Number(form.purchasePrice),
        salePrice: Number(form.salePrice),
        stock: Number(form.stock),
      })

      await loadProducts()
      alert("Producto creado correctamente.")
      resetScanner()
    } catch (error) {
      const apiError = error as ApiError
      console.error(error)
      alert(apiError.response?.data?.error || "Error creando producto.")
    } finally {
      setSaving(false)
    }
  }

  async function updateProductInfo() {
    try {
      if (!selectedProduct) return

      if (!form.name.trim()) {
        alert("Ingresa el nombre del producto.")
        return
      }

      if (!form.salePrice || Number(form.salePrice) <= 0) {
        alert("Ingresa un precio venta válido.")
        return
      }

      setSaving(true)

      const res = await api.patch(`/api/products/${selectedProduct.id}`, {
        name: form.name,
        barcode: form.barcode,
        category: form.category,
        purchasePrice: Number(form.purchasePrice || 0),
        salePrice: Number(form.salePrice),
        active: true,
      })

      setSelectedProduct(res.data)
      await loadProducts()
      alert("Producto actualizado correctamente.")
    } catch (error) {
      const apiError = error as ApiError
      console.error(error)
      alert(apiError.response?.data?.error || "Error actualizando producto.")
    } finally {
      setSaving(false)
    }
  }

  async function addStock() {
    try {
      if (!selectedProduct) return

      if (!stockToAdd || Number(stockToAdd) <= 0) {
        alert("Ingresa una cantidad válida para agregar stock.")
        return
      }

      setSaving(true)

      const res = await api.post(`/api/products/${selectedProduct.id}/add-stock`, {
        quantity: Number(stockToAdd),
        purchasePrice: form.purchasePrice,
        salePrice: form.salePrice,
      })

      const updatedProduct: Product = res.data.product

      setSelectedProduct(updatedProduct)
      setStockToAdd("")
      setForm({
        name: updatedProduct.name || "",
        barcode: updatedProduct.barcode || "",
        category: updatedProduct.category || "Bebidas",
        purchasePrice: String(updatedProduct.purchasePrice || ""),
        salePrice: String(updatedProduct.salePrice || ""),
        stock: "",
      })

      await loadProducts()
      alert("Stock agregado correctamente.")
    } catch (error) {
      const apiError = error as ApiError
      console.error(error)
      alert(apiError.response?.data?.error || "Error agregando stock.")
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = useMemo(() => {
    const text = search.toLowerCase().trim()

    return products.filter((product) => {
      const matchesCategory =
        categoryFilter === "TODAS" || product.category === categoryFilter

      const matchesSearch =
        !text ||
        product.name?.toLowerCase().includes(text) ||
        product.barcode?.toLowerCase().includes(text) ||
        product.category?.toLowerCase().includes(text)

      return matchesCategory && matchesSearch
    })
  }, [products, search, categoryFilter])

  const totals = useMemo(() => {
    const totalStock = products.reduce(
      (sum, product) => sum + Number(product.stock || 0),
      0
    )

    const inventoryCost = products.reduce(
      (sum, product) =>
        sum + Number(product.stock || 0) * Number(product.purchasePrice || 0),
      0
    )

    return {
      totalStock,
      inventoryCost,
    }
  }, [products])

  return (
    <AppShell title="Productos">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#d90416] via-[#8f000c] to-[#050505] p-6 shadow-2xl">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffd400]">
                Inventario interno
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Productos por código de barra
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-white/75">
                Escanea el código de barra para crear productos nuevos o agregar
                stock al mismo producto cuando se termine.
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffd400] text-black">
              <Barcode className="h-7 w-7" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">Productos</p>
                <Package className="h-5 w-5 text-[#ffd400]" />
              </div>
              <p className="mt-2 text-3xl font-bold">{products.length}</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">Unidades stock</p>
                <Boxes className="h-5 w-5 text-[#ffd400]" />
              </div>
              <p className="mt-2 text-3xl font-bold">{totals.totalStock}</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#0b0b0d] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-400">Inventario costo</p>
              <p className="mt-2 text-3xl font-bold">
                {formatMoney(totals.inventoryCost)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#0b0b0d] text-white shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Barcode className="h-5 w-5 text-[#ffd400]" />
              Escáner / ingreso de producto
            </CardTitle>

            <p className="text-sm text-zinc-400">
              Coloca el cursor en el campo de código y escanea. El lector de
              barras funciona como teclado y normalmente presiona Enter.
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
                  placeholder="Escanea o escribe el código de barra"
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
                  onClick={resetScanner}
                  className="h-12 w-full border border-white/10 bg-black px-8 font-bold text-white hover:bg-white/10 lg:w-auto"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Limpiar
                </Button>
              </div>
            </div>

            {mode === "SCAN" && (
              <div className="mt-5 rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/10 p-4 text-sm text-[#ffd400]">
                Esperando código de barra. Si el producto existe, se cargará
                para agregar stock; si no existe, podrás crearlo.
              </div>
            )}

            {mode === "CREATE" && (
              <div className="mt-6 rounded-3xl border border-white/10 bg-black p-5">
                <div className="mb-5">
                  <Badge className="bg-[#ffd400]/15 text-[#ffd400] hover:bg-[#ffd400]/15">
                    Producto nuevo
                  </Badge>

                  <p className="mt-2 text-sm text-zinc-400">
                    No existe un producto con este código. Completa los datos
                    para crearlo.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Nombre</Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Ej: Coca Cola 500ml"
                      className="h-11 border-white/10 bg-[#0b0b0d] text-white placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Código de barra</Label>
                    <Input
                      value={form.barcode}
                      onChange={(e) =>
                        setForm({ ...form, barcode: e.target.value })
                      }
                      placeholder="Código"
                      className="h-11 border-white/10 bg-[#0b0b0d] text-white placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Categoría</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) =>
                        setForm({ ...form, category: value })
                      }
                    >
                      <SelectTrigger className="h-11 border-white/10 bg-[#0b0b0d] text-white">
                        <SelectValue placeholder="Categoría" />
                      </SelectTrigger>

                      <SelectContent className="border-white/10 bg-[#0b0b0d] text-white">
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Precio costo</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.purchasePrice}
                      onChange={(e) =>
                        setForm({ ...form, purchasePrice: e.target.value })
                      }
                      placeholder="0.00"
                      className="h-11 border-white/10 bg-[#0b0b0d] text-white placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Precio venta</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.salePrice}
                      onChange={(e) =>
                        setForm({ ...form, salePrice: e.target.value })
                      }
                      placeholder="0.00"
                      className="h-11 border-white/10 bg-[#0b0b0d] text-white placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Stock inicial</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={form.stock}
                      onChange={(e) =>
                        setForm({ ...form, stock: e.target.value })
                      }
                      placeholder="0"
                      className="h-11 border-white/10 bg-[#0b0b0d] text-white placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end border-t border-white/10 pt-5">
                  <Button
                    type="button"
                    onClick={createProduct}
                    disabled={saving}
                    className="h-11 bg-[#d90416] px-8 font-bold text-white hover:bg-[#ff1024]"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {saving ? "Guardando..." : "Crear producto"}
                  </Button>
                </div>
              </div>
            )}

            {mode === "EXISTING" && selectedProduct && (
              <div className="mt-6 rounded-3xl border border-white/10 bg-black p-5">
                <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                      Producto existente
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

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <div className="space-y-2 xl:col-span-2">
                    <Label className="text-zinc-300">Nombre</Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="h-11 border-white/10 bg-[#0b0b0d] text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Categoría</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) =>
                        setForm({ ...form, category: value })
                      }
                    >
                      <SelectTrigger className="h-11 border-white/10 bg-[#0b0b0d] text-white">
                        <SelectValue placeholder="Categoría" />
                      </SelectTrigger>

                      <SelectContent className="border-white/10 bg-[#0b0b0d] text-white">
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Precio costo</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.purchasePrice}
                      onChange={(e) =>
                        setForm({ ...form, purchasePrice: e.target.value })
                      }
                      className="h-11 border-white/10 bg-[#0b0b0d] text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Precio venta</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.salePrice}
                      onChange={(e) =>
                        setForm({ ...form, salePrice: e.target.value })
                      }
                      className="h-11 border-white/10 bg-[#0b0b0d] text-white"
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto_auto]">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">
                      Cantidad a agregar al stock
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={stockToAdd}
                      onChange={(e) => setStockToAdd(e.target.value)}
                      placeholder="Ej: 12"
                      className="h-11 border-white/10 bg-[#0b0b0d] text-white placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={updateProductInfo}
                      disabled={saving}
                      className="h-11 w-full border border-white/10 bg-black px-8 font-bold text-white hover:bg-white/10 md:w-auto"
                    >
                      Actualizar datos
                    </Button>
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={addStock}
                      disabled={saving}
                      className="h-11 w-full bg-[#d90416] px-8 font-bold text-white hover:bg-[#ff1024] md:w-auto"
                    >
                      Agregar stock
                    </Button>
                  </div>
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
                  Inventario de productos
                </CardTitle>

                <p className="mt-1 text-sm text-zinc-400">
                  Productos registrados por categoría, código de barra, precio y stock.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black px-4 py-2 text-sm text-zinc-400">
                Registros:{" "}
                <span className="font-bold text-[#ffd400]">
                  {filteredProducts.length}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_auto]">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar producto por nombre, código o categoría..."
                  className="h-11 border-white/10 bg-black pl-10 text-white placeholder:text-zinc-600"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-11 border-white/10 bg-black text-white">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>

                <SelectContent className="border-white/10 bg-[#0b0b0d] text-white">
                  <SelectItem value="TODAS">Todas</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                onClick={loadProducts}
                className="h-11 border border-white/10 bg-black font-bold text-white hover:bg-white/10"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/[0.03] hover:bg-white/[0.03]">
                    <TableHead className="text-zinc-400">Producto</TableHead>
                    <TableHead className="text-zinc-400">Código</TableHead>
                    <TableHead className="text-zinc-400">Categoría</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Costo
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Venta
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Stock
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
                        Cargando productos...
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-zinc-400"
                      >
                        No hay productos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className="border-white/10 hover:bg-white/[0.03]"
                      >
                        <TableCell className="font-medium text-white">
                          {product.name}
                        </TableCell>

                        <TableCell className="text-zinc-400">
                          {product.barcode || "-"}
                        </TableCell>

                        <TableCell>
                          <Badge className="bg-[#ffd400]/15 text-[#ffd400] hover:bg-[#ffd400]/15">
                            {product.category || "-"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right text-zinc-400">
                          {formatMoney(product.purchasePrice)}
                        </TableCell>

                        <TableCell className="text-right font-bold text-white">
                          {formatMoney(product.salePrice)}
                        </TableCell>

                        <TableCell className="text-right">
                          <Badge
                            className={
                              Number(product.stock || 0) <= 0
                                ? "bg-red-500/15 text-red-300 hover:bg-red-500/15"
                                : Number(product.stock || 0) <= 5
                                ? "bg-[#ffd400]/15 text-[#ffd400] hover:bg-[#ffd400]/15"
                                : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15"
                            }
                          >
                            {product.stock}
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