// Configuration & Données métier pour GRISPELLA GENERAL TRADING SARL
// Cahier des charges : Système intégré de gestion de grossiste (Mode Réseau & Offline-First)

export const COMPANY = {
  name: "GRISPELLA GENERAL TRADING SARL",
  subtitle: "Commerce Général & Import-Export de Gros",
  address: "Zone Industrielle / Boulevard de la République, Djibouti",
  phone: "+253 21 35 00 00 / +253 77 00 00 00",
  email: "contact@grispella.com",
  nif: "NIF-DJ-2026-009842",
  rc: "RC-DJI-2026-B-1142",
  currency: "FDJ",
  timezone: "UTC+3 (Djibouti)",
};

export const PAYMENT_METHODS = [
  { id: "cash", label: "Espèces (Cash)", icon: "💵", color: "#059669" },
  { id: "waafi", label: "Waafi (Mobile Money)", icon: "📱", color: "#0284c7" },
  { id: "cac", label: "CAC International Bank", icon: "🏦", color: "#d97706" },
  { id: "saba", label: "Saba Islamic Bank", icon: "🏛️", color: "#7c3aed" },
  { id: "exim", label: "Exim Bank Djibouti", icon: "💳", color: "#db2777" },
];

export const DEPOTS = [
  { id: "DEP-01", name: "Dépôt Principal (Zone Industrielle)", code: "PRINCIPAL" },
  { id: "DEP-02", name: "Dépôt Port de Djibouti", code: "PORT" },
  { id: "DEP-03", name: "Magasin Central (Vente Comptoir)", code: "MAGASIN" },
];

export const ROLES = {
  ADMIN: { id: "admin", label: "Administrateur", desc: "Accès total, prix, validation, rapports, audit" },
  CAISSE: { id: "caisse", label: "Caisse / Caissier", desc: "Ventes, encaissements, facturation, clôture caisse" },
  AGENT_STOCK: { id: "agent_stock", label: "Agent Stock", desc: "Réceptions, préparation sorties, scan" },
  RESPONSABLE_STOCK: { id: "resp_stock", label: "Responsable Stock", desc: "Contrôle, validation mouvements, ajustements" },
};

export const STAFF_USERS = [
  {
    id: "USR-01",
    username: "admin",
    email: "admin@grispella.com",
    password: "password123",
    name: "Abdourahman Hassan",
    role: "admin",
    title: "Directeur Général / Administrateur",
    badge: "Accès Total",
    color: "#10b981",
    icon: "👑",
  },
  {
    id: "USR-02",
    username: "caisse",
    email: "caisse@grispella.com",
    password: "password123",
    name: "Fathia Omar",
    role: "caisse",
    title: "Caissière Principale",
    badge: "Ventes & Caisse",
    color: "#3b82f6",
    icon: "🛒",
  },
  {
    id: "USR-03",
    username: "resp_stock",
    email: "stock@grispella.com",
    password: "password123",
    name: "Mohamed Aden",
    role: "resp_stock",
    title: "Responsable Entrepôt & Stock",
    badge: "Gestion Entrepôt",
    color: "#f59e0b",
    icon: "🏬",
  },
  {
    id: "USR-04",
    username: "agent_stock",
    email: "agent@grispella.com",
    password: "password123",
    name: "Ali Barkhad",
    role: "agent_stock",
    title: "Agent Manutention & Scan",
    badge: "Opérations Entrepôt",
    color: "#8b5cf6",
    icon: "📦",
  },
];

export const INITIAL_PRODUCTS = [
  {
    id: "prod-1",
    ref: "ART-1001",
    sku: "600123456789",
    name: "Huile Végétale Raffinée 5L",
    category: "Alimentaire",
    baseUnit: "pièce",
    saleUnits: [
      { unit: "carton", factor: 4, label: "Carton (4 bidons)", priceGross: 9600, priceRetail: 10400 },
      { unit: "pièce", factor: 1, label: "Bidon 5L", priceGross: 2500, priceRetail: 2700 }
    ],
    purchasePrice: 2100, // FDJ par unité de base
    priceGross: 2500,
    priceRetail: 2700,
    alertThreshold: 20,
    stocks: { "DEP-01": 150, "DEP-02": 80, "DEP-03": 35 },
    reserved: 10,
    lotNumber: "LOT-2026-A1",
    expiryDate: "2027-12-31",
    active: true,
  },
  {
    id: "prod-2",
    ref: "ART-1002",
    sku: "600987654321",
    name: "Riz Basmati Super Qualité 25kg",
    category: "Alimentaire",
    baseUnit: "sac",
    saleUnits: [
      { unit: "sac", factor: 1, label: "Sac 25kg", priceGross: 7800, priceRetail: 8200 }
    ],
    purchasePrice: 6500,
    priceGross: 7800,
    priceRetail: 8200,
    alertThreshold: 30,
    stocks: { "DEP-01": 220, "DEP-02": 150, "DEP-03": 45 },
    reserved: 25,
    lotNumber: "LOT-2026-R4",
    expiryDate: "2028-06-30",
    active: true,
  },
  {
    id: "prod-3",
    ref: "ART-1003",
    sku: "600554433221",
    name: "Sucre Blanc Raffiné 50kg",
    category: "Alimentaire",
    baseUnit: "sac",
    saleUnits: [
      { unit: "sac", factor: 1, label: "Sac 50kg", priceGross: 12500, priceRetail: 13200 }
    ],
    purchasePrice: 10800,
    priceGross: 12500,
    priceRetail: 13200,
    alertThreshold: 25,
    stocks: { "DEP-01": 180, "DEP-02": 100, "DEP-03": 20 },
    reserved: 0,
    lotNumber: "LOT-2026-S9",
    expiryDate: "2028-10-15",
    active: true,
  },
  {
    id: "prod-4",
    ref: "ART-1004",
    sku: "600778899001",
    name: "Pâtes Alimentaires Spaghetti 500g",
    category: "Alimentaire",
    baseUnit: "pièce",
    saleUnits: [
      { unit: "carton", factor: 24, label: "Carton (24 paquets)", priceGross: 4800, priceRetail: 5200 },
      { unit: "paquet", factor: 1, label: "Paquet 500g", priceGross: 210, priceRetail: 230 }
    ],
    purchasePrice: 170,
    priceGross: 210,
    priceRetail: 230,
    alertThreshold: 50,
    stocks: { "DEP-01": 400, "DEP-02": 250, "DEP-03": 90 },
    reserved: 40,
    lotNumber: "LOT-2026-P2",
    expiryDate: "2027-08-20",
    active: true,
  },
  {
    id: "prod-5",
    ref: "ART-1005",
    sku: "600332211445",
    name: "Lait Concentré Sucré 390g",
    category: "Boissons & Laiterie",
    baseUnit: "boîte",
    saleUnits: [
      { unit: "carton", factor: 48, label: "Carton (48 boîtes)", priceGross: 14400, priceRetail: 15300 },
      { unit: "boîte", factor: 1, label: "Boîte 390g", priceGross: 310, priceRetail: 330 }
    ],
    purchasePrice: 260,
    priceGross: 310,
    priceRetail: 330,
    alertThreshold: 48,
    stocks: { "DEP-01": 80, "DEP-02": 60, "DEP-03": 12 },
    reserved: 0,
    lotNumber: "LOT-2026-L8",
    expiryDate: "2027-05-10",
    active: true,
  },
  {
    id: "prod-6",
    ref: "ART-1006",
    sku: "600667788990",
    name: "Savon de Ménage Multiusage (Pack x10)",
    category: "Hygiène",
    baseUnit: "pack",
    saleUnits: [
      { unit: "carton", factor: 10, label: "Carton (10 packs)", priceGross: 6500, priceRetail: 7000 },
      { unit: "pack", factor: 1, label: "Pack 10 savons", priceGross: 680, priceRetail: 750 }
    ],
    purchasePrice: 520,
    priceGross: 680,
    priceRetail: 750,
    alertThreshold: 30,
    stocks: { "DEP-01": 95, "DEP-02": 40, "DEP-03": 18 },
    reserved: 5,
    lotNumber: "LOT-2026-S1",
    expiryDate: "2029-01-01",
    active: true,
  }
];

export const INITIAL_CUSTOMERS = [
  {
    id: "CLI-001",
    name: "Supermarché Al-Baraka",
    phone: "+253 77 12 34 56",
    address: "Avenue 13, Quartier 4, Djibouti",
    creditLimit: 500000,
    currentDebt: 125000,
    notes: "Client régulier, paiement par Waafi et chèques",
  },
  {
    id: "CLI-002",
    name: "Épicerie Centrale Balbala",
    phone: "+253 77 88 99 00",
    address: "Balbala PK12, Djibouti",
    creditLimit: 250000,
    currentDebt: 45000,
    notes: "Bon payeur, délai 15 jours",
  },
  {
    id: "CLI-003",
    name: "Al-Nour Alimentation Générale",
    phone: "+253 77 44 55 66",
    address: "Arhiba, Djibouti",
    creditLimit: 300000,
    currentDebt: 0,
    notes: "Comptant ou crédit court terme",
  },
  {
    id: "CLI-000",
    name: "Client Comptoir / Vente Directe",
    phone: "—",
    address: "Djibouti",
    creditLimit: 0,
    currentDebt: 0,
    notes: "Client passager au comptant",
  }
];

export const INITIAL_SUPPLIERS = [
  {
    id: "FOU-001",
    name: "Dubai Global Agro Commodities FZE",
    phone: "+971 4 222 3344",
    email: "orders@dubaiglobalagro.ae",
    country: "Émirats Arabes Unis",
    category: "Riz, Huile, Sucre",
    balance: 0,
  },
  {
    id: "FOU-002",
    name: "Mombasa Grain Exporters Ltd",
    phone: "+254 41 234 5678",
    email: "sales@mombasagrain.co.ke",
    country: "Kenya",
    category: "Pâtes, Farine",
    balance: 450000,
  },
  {
    id: "FOU-003",
    name: "Société Industrielle de l'Est Africain",
    phone: "+253 21 35 11 22",
    email: "commercial@siea-dj.com",
    country: "Djibouti",
    category: "Savons & Produits d'Entretien",
    balance: 0,
  }
];
