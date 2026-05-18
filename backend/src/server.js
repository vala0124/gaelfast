const express = require("express")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { PrismaClient } = require("@prisma/client")
require("dotenv").config()

const prisma = new PrismaClient()
const app = express()

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET || "gaelfast_secret_2026"

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  )
}

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({ error: "Token no enviado" })
    }

    const token = authHeader.replace("Bearer ", "")
    const decoded = jwt.verify(token, JWT_SECRET)

    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      error: "Sesión inválida o expirada",
    })
  }
}

app.get("/", (req, res) => {
  res.json({
    message: "BetAdmin API funcionando correctamente",
  })
})

/* =========================
   AUTENTICACIÓN
========================= */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: "Correo y contraseña son obligatorios",
      })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: String(email).trim().toLowerCase(),
      },
    })

    if (!user) {
      return res.status(401).json({
        error: "Credenciales incorrectas",
      })
    }

    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      return res.status(401).json({
        error: "Credenciales incorrectas",
      })
    }

    const token = generateToken(user)

    res.json({
      message: "Inicio de sesión correcto",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error iniciando sesión",
    })
  }
})

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  res.json({
    user: req.user,
  })
})

/* =========================
   SEED INICIAL
========================= */
app.post("/api/seed", async (req, res) => {
  try {
    const defaultUsers = [
      {
        name: "Administrador",
        email: "admin@empresa.com",
        password: "123456",
        role: "ADMIN",
      },
      {
        name: "Klever Ágreda",
        email: "kleverventas@gaelfast.com",
        password: "123456",
        role: "VENDEDOR",
      },
    ]

    for (const userData of defaultUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      })

      if (!existingUser) {
        const hashed = await bcrypt.hash(userData.password, 10)

        await prisma.user.create({
          data: {
            name: userData.name,
            email: userData.email,
            password: hashed,
            role: userData.role,
          },
        })
      }
    }

    const houses = ["Ecuabet", "Doradobet", "Mas1x2", "ASTROBET"]

    await prisma.betHouse.updateMany({
      data: {
        active: false,
      },
    })

    for (const house of houses) {
      await prisma.betHouse.upsert({
        where: { name: house },
        update: {
          active: true,
        },
        create: {
          name: house,
          active: true,
        },
      })
    }

    const banks = [
      "Coopmego",
      "Banco Guayaquil",
      "Pichincha",
      "Banco de Loja",
      "JEP",
      "Produbanco",
    ]

    await prisma.bank.updateMany({
      data: {
        active: false,
      },
    })

    for (const bank of banks) {
      await prisma.bank.upsert({
        where: { name: bank },
        update: {
          active: true,
        },
        create: {
          name: bank,
          active: true,
        },
      })
    }

    res.json({
      message: "Datos iniciales creados correctamente",
      users: defaultUsers.map((user) => ({
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
      })),
      houses,
      banks,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error creando datos iniciales",
    })
  }
})

/* =========================
   DASHBOARD
========================= */
app.get("/api/dashboard", async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      recharges,
      withdrawals,
      cashEntries,
      productSales,
      latestRecharges,
      latestWithdrawals,
    ] = await Promise.all([
      prisma.recharge.findMany({
        where: {
          createdAt: { gte: today },
          status: { not: "ANULADO" },
        },
      }),
      prisma.withdrawal.findMany({
        where: {
          createdAt: { gte: today },
          status: { not: "ANULADO" },
        },
      }),
      prisma.cashEntry.findMany({
        where: {
          createdAt: { gte: today },
        },
      }),
      prisma.productSale.findMany({
        where: {
          createdAt: { gte: today },
        },
      }),
      prisma.recharge.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { client: true, betHouse: true },
      }),
      prisma.withdrawal.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { client: true, betHouse: true },
      }),
    ])

    const totalRecharges = recharges.reduce(
      (sum, item) => sum + item.amount,
      0
    )

    const totalWithdrawals = withdrawals.reduce(
      (sum, item) => sum + item.amount,
      0
    )

    const totalCash = cashEntries.reduce(
      (sum, item) => sum + item.amount,
      0
    )

    const totalProductSales = productSales.reduce(
      (sum, item) => sum + item.total,
      0
    )

    const pendingDifference = totalWithdrawals - totalCash

    res.json({
      totals: {
        recharges: totalRecharges,
        withdrawals: totalWithdrawals,
        cash: totalCash,
        productSales: totalProductSales,
        pendingDifference,
      },
      latest: {
        recharges: latestRecharges,
        withdrawals: latestWithdrawals,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error obteniendo dashboard",
    })
  }
})

/* =========================
   CLIENTES
========================= */
app.get("/api/clients", async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { name: "asc" },
      include: {
        recharges: {
          where: {
            status: {
              not: "ANULADO",
            },
          },
        },
      },
    })

    const formattedClients = clients.map((client) => {
      const totalRecharged = client.recharges.reduce(
        (sum, recharge) => sum + recharge.amount,
        0
      )

      return {
        id: client.id,
        cedula: client.cedula,
        name: client.name,
        email: client.email,
        phone: client.phone,
        active: client.active,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        totalRecharged,
      }
    })

    res.json(formattedClients)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error obteniendo clientes",
    })
  }
})

app.get("/api/clients/:id/history", async (req, res) => {
  try {
    const clientId = Number(req.params.id)

    if (!clientId) {
      return res.status(400).json({
        error: "ID de cliente inválido",
      })
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        recharges: {
          orderBy: { createdAt: "desc" },
          include: {
            betHouse: true,
          },
        },
        withdrawals: {
          orderBy: { createdAt: "desc" },
          include: {
            betHouse: true,
            cashEntries: true,
          },
        },
      },
    })

    if (!client) {
      return res.status(404).json({
        error: "Cliente no encontrado",
      })
    }

    const totalRecharged = client.recharges
      .filter((item) => item.status !== "ANULADO")
      .reduce((sum, item) => sum + item.amount, 0)

    const totalWithdrawn = client.withdrawals
      .filter((item) => item.status !== "ANULADO")
      .reduce((sum, item) => sum + item.amount, 0)

    const totalPaidByHouse = client.withdrawals.reduce((sum, withdrawal) => {
      const paid = withdrawal.cashEntries.reduce(
        (entrySum, entry) => entrySum + entry.amount,
        0
      )

      return sum + paid
    }, 0)

    const pendingDifference = totalWithdrawn - totalPaidByHouse

    const movements = [
      ...client.recharges.map((item) => ({
        id: `recharge-${item.id}`,
        type: "RECARGA",
        date: item.createdAt,
        amount: item.amount,
        betHouse: item.betHouse?.name || "-",
        paymentMethod: item.paymentMethod,
        receiptNumber: item.receiptNumber,
        status: item.status,
        notes: item.notes,
      })),
      ...client.withdrawals.map((item) => {
        const paidByHouse = item.cashEntries.reduce(
          (sum, entry) => sum + entry.amount,
          0
        )

        return {
          id: `withdrawal-${item.id}`,
          type: "RETIRO",
          date: item.createdAt,
          amount: item.amount,
          paidByHouse,
          difference: item.amount - paidByHouse,
          betHouse: item.betHouse?.name || "-",
          withdrawalCode: item.withdrawalCode,
          receiptNumber: item.receiptNumber,
          status: item.status,
          notes: item.notes,
        }
      }),
    ].sort((a, b) => new Date(b.date) - new Date(a.date))

    res.json({
      client: {
        id: client.id,
        cedula: client.cedula,
        name: client.name,
        email: client.email,
        phone: client.phone,
        active: client.active,
      },
      totals: {
        totalRecharged,
        totalWithdrawn,
        totalPaidByHouse,
        pendingDifference,
      },
      movements,
      recharges: client.recharges,
      withdrawals: client.withdrawals,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error obteniendo historial del cliente",
    })
  }
})

app.post("/api/clients", async (req, res) => {
  try {
    const { cedula, name, email, phone } = req.body

    if (!cedula || !name) {
      return res.status(400).json({
        error: "Cédula y nombre son obligatorios",
      })
    }

    const client = await prisma.client.create({
      data: {
        cedula: String(cedula).trim(),
        name: String(name).trim(),
        email: email || null,
        phone: phone || null,
      },
    })

    res.status(201).json(client)
  } catch (error) {
    console.error(error)

    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Ya existe un cliente con esa cédula",
      })
    }

    res.status(500).json({
      error: "Error creando cliente",
    })
  }
})

/* =========================
   CASAS DE APUESTAS
========================= */
app.get("/api/bet-houses", async (req, res) => {
  try {
    const order = ["Ecuabet", "Doradobet", "Mas1x2", "ASTROBET"]

    const houses = await prisma.betHouse.findMany({
      where: {
        active: true,
      },
    })

    const sortedHouses = houses.sort((a, b) => {
      return order.indexOf(a.name) - order.indexOf(b.name)
    })

    res.json(sortedHouses)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error obteniendo casas de apuestas",
    })
  }
})

app.post("/api/bet-houses", async (req, res) => {
  try {
    const { name, notes } = req.body

    if (!name) {
      return res.status(400).json({
        error: "El nombre es obligatorio",
      })
    }

    const house = await prisma.betHouse.create({
      data: {
        name,
        notes: notes || null,
      },
    })

    res.status(201).json(house)
  } catch (error) {
    console.error(error)

    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Ya existe una casa de apuestas con ese nombre",
      })
    }

    res.status(500).json({
      error: "Error creando casa de apuestas",
    })
  }
})

/* =========================
   BANCOS
========================= */
app.get("/api/banks", async (req, res) => {
  try {
    const banks = await prisma.bank.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    res.json(banks)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error obteniendo bancos",
    })
  }
})

app.post("/api/banks", async (req, res) => {
  try {
    const { name, notes } = req.body

    if (!name) {
      return res.status(400).json({
        error: "El nombre del banco es obligatorio",
      })
    }

    const bank = await prisma.bank.upsert({
      where: {
        name: String(name).trim(),
      },
      update: {
        active: true,
        notes: notes || null,
      },
      create: {
        name: String(name).trim(),
        notes: notes || null,
        active: true,
      },
    })

    res.status(201).json(bank)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error creando banco",
    })
  }
})

app.patch("/api/banks/:id", async (req, res) => {
  try {
    const bankId = Number(req.params.id)
    const { name, active, notes } = req.body

    if (!bankId) {
      return res.status(400).json({
        error: "ID de banco inválido",
      })
    }

    const bank = await prisma.bank.update({
      where: {
        id: bankId,
      },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(active !== undefined && { active: Boolean(active) }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    })

    res.json(bank)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error actualizando banco",
    })
  }
})

/* =========================
   RECARGAS
========================= */
app.get("/api/recharges", async (req, res) => {
  try {
    const recharges = await prisma.recharge.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        betHouse: true,
      },
    })

    res.json(recharges)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error obteniendo recargas",
    })
  }
})

app.post("/api/recharges", async (req, res) => {
  try {
    const {
      clientId,
      clientName,
      clientCedula,
      clientEmail,
      clientPhone,
      betHouseId,
      amount,
      paymentMethod,
      bankName,
      receiptNumber,
      notes,
      status,
    } = req.body

    if (!betHouseId || !amount || !paymentMethod) {
      return res.status(400).json({
        error: "Casa de apuestas, monto y método de pago son obligatorios",
      })
    }

    const numericAmount = toNumber(amount)

    if (numericAmount <= 0) {
      return res.status(400).json({
        error: "El monto debe ser mayor a cero",
      })
    }

    let finalClientId = clientId ? Number(clientId) : null

    if (!finalClientId) {
      if (!clientName || !clientCedula) {
        return res.status(400).json({
          error: "Nombre y cédula/ID del cliente son obligatorios",
        })
      }

      const normalizedCedula = String(clientCedula).trim()
      const normalizedName = String(clientName).trim()

      const existingClient = await prisma.client.findUnique({
        where: { cedula: normalizedCedula },
      })

      if (existingClient) {
        finalClientId = existingClient.id

        await prisma.client.update({
          where: { id: existingClient.id },
          data: {
            name: normalizedName || existingClient.name,
            email: clientEmail || existingClient.email,
            phone: clientPhone || existingClient.phone,
          },
        })
      } else {
        const newClient = await prisma.client.create({
          data: {
            cedula: normalizedCedula,
            name: normalizedName,
            email: clientEmail || null,
            phone: clientPhone || null,
          },
        })

        finalClientId = newClient.id
      }
    }

    const recharge = await prisma.recharge.create({
      data: {
        clientId: finalClientId,
        betHouseId: Number(betHouseId),
        amount: numericAmount,
        paymentMethod,
        receiptNumber: receiptNumber || null,
        notes:
          bankName && paymentMethod === "TRANSFERENCIA"
            ? `Banco: ${bankName}${notes ? ` | ${notes}` : ""}`
            : notes || null,
        status: status || "RECARGADO",
      },
      include: {
        client: true,
        betHouse: true,
      },
    })

    res.status(201).json(recharge)
  } catch (error) {
    console.error(error)

    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Ya existe un cliente con esa cédula/ID",
      })
    }

    res.status(500).json({
      error: "Error creando recarga",
    })
  }
})

/* =========================
   RETIROS
========================= */
app.get("/api/withdrawals", async (req, res) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        betHouse: true,
        cashEntries: true,
      },
    })

    const formatted = withdrawals.map((item) => {
      const paidByHouse = item.cashEntries.reduce(
        (sum, entry) => sum + entry.amount,
        0
      )

      const difference = item.amount - paidByHouse

      return {
        ...item,
        paidByHouse,
        difference,
      }
    })

    res.json(formatted)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error obteniendo retiros",
    })
  }
})

app.post("/api/withdrawals", async (req, res) => {
  try {
    const {
      clientId,
      betHouseId,
      amount,
      withdrawalCode,
      receiptNumber,
      paidToClient,
      notes,
      status,
    } = req.body

    if (!clientId || !betHouseId || !amount) {
      return res.status(400).json({
        error: "Cliente, casa de apuestas y monto son obligatorios",
      })
    }

    const numericAmount = toNumber(amount)

    if (numericAmount <= 0) {
      return res.status(400).json({
        error: "El monto debe ser mayor a cero",
      })
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        clientId: Number(clientId),
        betHouseId: Number(betHouseId),
        amount: numericAmount,
        withdrawalCode: withdrawalCode || null,
        receiptNumber: receiptNumber || null,
        paidToClient: Boolean(paidToClient),
        notes: notes || null,
        status: status || "PENDIENTE",
      },
      include: {
        client: true,
        betHouse: true,
      },
    })

    res.status(201).json(withdrawal)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error creando retiro",
    })
  }
})

/* =========================
   SALDOS INICIALES POR CASA
========================= */
app.get("/api/house-balances", async (req, res) => {
  try {
    const balances = await prisma.houseBalance.findMany({
      orderBy: {
        date: "desc",
      },
      include: {
        betHouse: true,
      },
    })

    res.json(balances)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error obteniendo saldos iniciales",
    })
  }
})

app.post("/api/house-balances", async (req, res) => {
  try {
    const { betHouseId, date, amount, notes } = req.body

    if (!betHouseId || !date || amount === undefined || amount === null) {
      return res.status(400).json({
        error: "Casa, fecha y saldo inicial son obligatorios",
      })
    }

    const numericAmount = toNumber(amount)

    if (numericAmount < 0) {
      return res.status(400).json({
        error: "El saldo inicial no puede ser negativo",
      })
    }

    const balanceDate = new Date(`${date}T00:00:00`)

    const balance = await prisma.houseBalance.upsert({
      where: {
        betHouseId_date: {
          betHouseId: Number(betHouseId),
          date: balanceDate,
        },
      },
      update: {
        amount: numericAmount,
        notes: notes || null,
      },
      create: {
        betHouseId: Number(betHouseId),
        date: balanceDate,
        amount: numericAmount,
        notes: notes || null,
      },
      include: {
        betHouse: true,
      },
    })

    res.status(201).json({
      message: "Saldo inicial guardado correctamente",
      balance,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error guardando saldo inicial",
    })
  }
})

/* =========================
   CAJA
========================= */
app.get("/api/cash", async (req, res) => {
  try {
    const entries = await prisma.cashEntry.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        betHouse: true,
        withdrawal: {
          include: {
            client: true,
            betHouse: true,
          },
        },
      },
    })

    res.json(entries)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error obteniendo caja",
    })
  }
})

app.post("/api/cash", async (req, res) => {
  try {
    const {
      type,
      amount,
      paymentMethod,
      receiptNumber,
      notes,
      betHouseId,
      withdrawalId,
    } = req.body

    if (!type || !amount) {
      return res.status(400).json({
        error: "Tipo y monto son obligatorios",
      })
    }

    const numericAmount = toNumber(amount)

    if (numericAmount <= 0) {
      return res.status(400).json({
        error: "El monto debe ser mayor a cero",
      })
    }

    const entry = await prisma.cashEntry.create({
      data: {
        type,
        amount: numericAmount,
        paymentMethod: paymentMethod || null,
        receiptNumber: receiptNumber || null,
        notes: notes || null,
        betHouseId: betHouseId ? Number(betHouseId) : null,
        withdrawalId: withdrawalId ? Number(withdrawalId) : null,
      },
    })

    if (withdrawalId) {
      const withdrawal = await prisma.withdrawal.findUnique({
        where: { id: Number(withdrawalId) },
        include: { cashEntries: true },
      })

      if (withdrawal) {
        const totalPaid = withdrawal.cashEntries.reduce(
          (sum, item) => sum + item.amount,
          0
        )

        let newStatus = "PENDIENTE"

        if (totalPaid === withdrawal.amount) {
          newStatus = "COMPENSADO"
        } else if (totalPaid > 0 && totalPaid !== withdrawal.amount) {
          newStatus = "DIFERENCIA"
        }

        await prisma.withdrawal.update({
          where: { id: Number(withdrawalId) },
          data: { status: newStatus },
        })
      }
    }

    res.status(201).json(entry)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error creando movimiento de caja",
    })
  }
})

/* =========================
   PRODUCTOS
========================= */
app.get("/api/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: [
        { category: "asc" },
        { name: "asc" },
      ],
    })

    res.json(products)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error obteniendo productos",
    })
  }
})

app.get("/api/products/barcode/:barcode", async (req, res) => {
  try {
    const barcode = String(req.params.barcode || "").trim()

    if (!barcode) {
      return res.status(400).json({
        error: "Código de barra obligatorio",
      })
    }

    const product = await prisma.product.findUnique({
      where: { barcode },
    })

    if (!product) {
      return res.status(404).json({
        error: "Producto no encontrado",
      })
    }

    res.json(product)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error buscando producto por código de barra",
    })
  }
})

app.post("/api/products", async (req, res) => {
  try {
    const {
      name,
      barcode,
      category,
      purchasePrice,
      salePrice,
      stock,
    } = req.body

    if (!name || !barcode || !salePrice) {
      return res.status(400).json({
        error: "Nombre, código de barra y precio de venta son obligatorios",
      })
    }

    const normalizedBarcode = String(barcode).trim()
    const normalizedCategory = category || "Bebidas"

    const existingProduct = await prisma.product.findUnique({
      where: { barcode: normalizedBarcode },
    })

    if (existingProduct) {
      return res.status(400).json({
        error: "Ya existe un producto con ese código de barra",
        product: existingProduct,
      })
    }

    const product = await prisma.product.create({
      data: {
        name: String(name).trim(),
        barcode: normalizedBarcode,
        category: normalizedCategory,
        purchasePrice: toNumber(purchasePrice),
        salePrice: toNumber(salePrice),
        stock: Number(stock || 0),
        active: true,
      },
    })

    res.status(201).json(product)
  } catch (error) {
    console.error(error)

    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Ya existe un producto con ese código de barra",
      })
    }

    res.status(500).json({
      error: "Error creando producto",
    })
  }
})

app.patch("/api/products/:id", async (req, res) => {
  try {
    const productId = Number(req.params.id)

    if (!productId) {
      return res.status(400).json({
        error: "ID de producto inválido",
      })
    }

    const {
      name,
      barcode,
      category,
      purchasePrice,
      salePrice,
      active,
    } = req.body

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(barcode !== undefined && { barcode: String(barcode).trim() }),
        ...(category !== undefined && { category }),
        ...(purchasePrice !== undefined && {
          purchasePrice: toNumber(purchasePrice),
        }),
        ...(salePrice !== undefined && {
          salePrice: toNumber(salePrice),
        }),
        ...(active !== undefined && {
          active: Boolean(active),
        }),
      },
    })

    res.json(product)
  } catch (error) {
    console.error(error)

    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Ya existe un producto con ese código de barra",
      })
    }

    res.status(500).json({
      error: "Error actualizando producto",
    })
  }
})

app.post("/api/products/:id/add-stock", async (req, res) => {
  try {
    const productId = Number(req.params.id)
    const { quantity, purchasePrice, salePrice } = req.body

    if (!productId) {
      return res.status(400).json({
        error: "ID de producto inválido",
      })
    }

    const qty = Number(quantity || 0)

    if (qty <= 0) {
      return res.status(400).json({
        error: "La cantidad debe ser mayor a cero",
      })
    }

    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!currentProduct) {
      return res.status(404).json({
        error: "Producto no encontrado",
      })
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        stock: currentProduct.stock + qty,
        ...(purchasePrice !== undefined &&
          purchasePrice !== "" && {
            purchasePrice: toNumber(purchasePrice),
          }),
        ...(salePrice !== undefined &&
          salePrice !== "" && {
            salePrice: toNumber(salePrice),
          }),
        active: true,
      },
    })

    res.json({
      message: "Stock agregado correctamente",
      product,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error agregando stock",
    })
  }
})

/* =========================
   VENTAS PRODUCTOS
========================= */
app.get("/api/product-sales", async (req, res) => {
  try {
    const sales = await prisma.productSale.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: true,
      },
    })

    res.json(sales)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error obteniendo ventas de productos",
    })
  }
})

app.post("/api/product-sales", async (req, res) => {
  try {
    const { productId, quantity, paymentMethod, unitPrice } = req.body

    if (!productId || !quantity || !paymentMethod) {
      return res.status(400).json({
        error: "Producto, cantidad y método de pago son obligatorios",
      })
    }

    const numericQuantity = Number(quantity)

    if (numericQuantity <= 0) {
      return res.status(400).json({
        error: "La cantidad debe ser mayor a cero",
      })
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
    })

    if (!product) {
      return res.status(404).json({
        error: "Producto no encontrado",
      })
    }

    if (product.stock < numericQuantity) {
      return res.status(400).json({
        error: "Stock insuficiente",
      })
    }

    const finalUnitPrice =
      unitPrice !== undefined && unitPrice !== null && unitPrice !== ""
        ? toNumber(unitPrice)
        : product.salePrice

    if (finalUnitPrice <= 0) {
      return res.status(400).json({
        error: "El precio de venta debe ser mayor a cero",
      })
    }

    const total = finalUnitPrice * numericQuantity

    const sale = await prisma.productSale.create({
      data: {
        productId: Number(productId),
        quantity: numericQuantity,
        unitPrice: finalUnitPrice,
        total,
        paymentMethod,
      },
      include: {
        product: true,
      },
    })

    await prisma.product.update({
      where: { id: Number(productId) },
      data: {
        stock: product.stock - numericQuantity,
      },
    })

    res.status(201).json(sale)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error creando venta",
    })
  }
})

/* =========================
   CIERRES DE CAJA / CUADRE
========================= */
app.get("/api/cash-closings", async (req, res) => {
  try {
    const closings = await prisma.cashClosing.findMany({
      orderBy: {
        closingDate: "desc",
      },
    })

    res.json(closings)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error obteniendo cierres de caja",
    })
  }
})

app.post("/api/cash-closings", async (req, res) => {
  try {
    const {
      closingDate,
      expectedValues,
      realValues,
      summary,
      notes,
    } = req.body

    if (!closingDate) {
      return res.status(400).json({
        error: "La fecha de cierre es obligatoria",
      })
    }

    if (!expectedValues || !realValues || !summary) {
      return res.status(400).json({
        error: "Faltan datos del cierre",
      })
    }

    const date = new Date(`${closingDate}T00:00:00`)

    const expectedTotal = toNumber(summary.expectedTotal)
    const realTotal = toNumber(summary.realTotal)
    const differenceTotal = toNumber(summary.differenceTotal)

    const closing = await prisma.cashClosing.upsert({
      where: {
        closingDate: date,
      },
      update: {
        expectedValues,
        realValues,
        summary,
        expectedTotal,
        realTotal,
        differenceTotal,
        notes: notes || null,
      },
      create: {
        closingDate: date,
        expectedValues,
        realValues,
        summary,
        expectedTotal,
        realTotal,
        differenceTotal,
        notes: notes || null,
      },
    })

    res.status(201).json({
      message: "Cierre de caja guardado correctamente",
      closing,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: "Error guardando cierre de caja",
    })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})