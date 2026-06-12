import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, deleteDoc, getDocsFromServer, getDocFromServer, onSnapshot } from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload bounds for high-res base64 invoice scans
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Direct persistent JSON models
interface Motorizado {
  id: string;
  nombre: string;
  telefono: string;
  estado: string; // "Activo" | "Inactivo"
  fecha_ingreso: string;
  asistencias_realizadas: number;
  total_facturado: number;
  promedio_diario: number;
  ultima_asistencia: string;
}

interface Asistencia {
  id: string;
  fecha: string;
  hora: string;
  numero_factura: string;
  cliente: string;
  ruc_cliente: string;
  telefono: string;
  direccion: string;
  comentario: string;
  ubicacion_servicio: string;
  vendedor: string;
  forma_pago: string;
  subtotal: number;
  itbms: number;
  total: number;
  estado: string; // "Completado" | "Pendiente"
  motorizado_id: string;
  descripcion_servicio?: string;
  descripcion_producto?: string;
  imagen_original: string; // base64 string
  imagen_procesada: string; // base64 string
  ocr_json: any; // complete extracted JSON
  created_at: string;
}

// Fallback seed data
const initialMotorizados: Motorizado[] = [
  {
    id: "diego_torres",
    nombre: "Diego Torres",
    telefono: "+507 6123-4567",
    estado: "Activo",
    fecha_ingreso: "2025-01-10",
    asistencias_realizadas: 14,
    total_facturado: 630.00,
    promedio_diario: 15.5,
    ultima_asistencia: "2026-06-11 09:12"
  },
  {
    id: "sofia_ruiz",
    nombre: "Sofía Ruiz",
    telefono: "+507 6321-8901",
    estado: "Activo",
    fecha_ingreso: "2025-02-14",
    asistencias_realizadas: 11,
    total_facturado: 495.50,
    promedio_diario: 12.1,
    ultima_asistencia: "2026-06-11 08:30"
  },
  {
    id: "carlos_mendoza",
    nombre: "Carlos Mendoza",
    telefono: "+507 6555-4321",
    estado: "Activo",
    fecha_ingreso: "2024-11-05",
    asistencias_realizadas: 28,
    total_facturado: 1260.00,
    promedio_diario: 18.2,
    ultima_asistencia: "2026-06-10 17:40"
  },
  {
    id: "ana_gomez",
    nombre: "Ana Gómez",
    telefono: "+507 6987-6543",
    estado: "Inactivo",
    fecha_ingreso: "2025-03-01",
    asistencias_realizadas: 5,
    total_facturado: 225.00,
    promedio_diario: 8.5,
    ultima_asistencia: "2026-06-08 11:20"
  }
];

const initialAsistencias: Asistencia[] = [
  {
    id: "AST-1001",
    fecha: "2026-06-11",
    hora: "09:12",
    numero_factura: "FAC-99231",
    cliente: "Distribuidora El Éxito",
    ruc_cliente: "8-765-4321 DV 90",
    telefono: "+507 6123-4567",
    direccion: "Ave. Balboa, Edificio Miramar, Planta Baja",
    comentario: "Suministro e instalación de batería por descarga total de panel eléctrico.",
    ubicacion_servicio: "Ave. Balboa, Ciudad de Panamá",
    vendedor: "Juan Carlos Pérez",
    forma_pago: "Efectivo",
    subtotal: 45.00,
    itbms: 3.15,
    total: 48.15,
    estado: "Completado",
    motorizado_id: "diego_torres",
    descripcion_servicio: "Asistencia vial: Carga e instalación de batería",
    descripcion_producto: "Batería Hankook 12V 75Ah",
    imagen_original: "",
    imagen_procesada: "",
    ocr_json: {
      numero_factura: "FAC-99231",
      fecha: "2026-06-11",
      hora: "09:12",
      cliente: "Distribuidora El Éxito",
      ruc_cliente: "8-765-4321 DV 90",
      vendedor: "Juan Carlos Pérez",
      subtotal: 45.00,
      itbms: 3.15,
      total: 48.15,
      descripcion_servicio: "Asistencia vial: Carga e instalación de batería",
      descripcion_producto: "Batería Hankook 12V 75Ah"
    },
    created_at: "2026-06-11T09:12:00.000Z"
  },
  {
    id: "AST-1002",
    fecha: "2026-06-11",
    hora: "08:30",
    numero_factura: "FAC-99232",
    cliente: "Almacén Central S.A.",
    ruc_cliente: "4-123-1492 DV 11",
    telefono: "+507 6321-8901",
    direccion: "Vía España, Galerías Obarrio",
    comentario: "Neumático desinflado, cambio rápido por neumático de repuesto.",
    ubicacion_servicio: "Vía España, Panamá",
    vendedor: "Miriam Herrera",
    forma_pago: "Tarjeta de Crédito",
    subtotal: 35.00,
    itbms: 2.45,
    total: 37.45,
    estado: "Completado",
    motorizado_id: "sofia_ruiz",
    descripcion_servicio: "Asistencia vial: Cambio de neumático",
    descripcion_producto: "Neumático Bridgestone 195/65 R15",
    imagen_original: "",
    imagen_procesada: "",
    ocr_json: {
      numero_factura: "FAC-99232",
      fecha: "2026-06-11",
      hora: "08:30",
      cliente: "Almacén Central S.A.",
      ruc_cliente: "4-123-1492 DV 11",
      vendedor: "Miriam Herrera",
      subtotal: 35.00,
      itbms: 2.45,
      total: 37.45,
      descripcion_servicio: "Asistencia vial: Cambio de neumático",
      descripcion_producto: "Neumático Bridgestone 195/65 R15"
    },
    created_at: "2026-06-11T08:30:00.000Z"
  },
  {
    id: "AST-1003",
    fecha: "2026-06-10",
    hora: "14:15",
    numero_factura: "FAC-99112",
    cliente: "Industrias Metalúrgicas Corro",
    ruc_cliente: "PE-8-9921 DV 02",
    telefono: "+507 6555-4321",
    direccion: "Costa del Este, Parque Industrial",
    comentario: "Remolque liviano solicitado por daño de motor secundario.",
    ubicacion_servicio: "Costa del Este",
    vendedor: "Héctor Guardia",
    forma_pago: "Transferencia Bancaria",
    subtotal: 80.00,
    itbms: 5.60,
    total: 85.60,
    estado: "Completado",
    motorizado_id: "carlos_mendoza",
    descripcion_servicio: "Asistencia vial: Remolque técnico por daño de motor",
    descripcion_producto: "Servicio de Grua Plataforma (Remolque)",
    imagen_original: "",
    imagen_procesada: "",
    ocr_json: {
      numero_factura: "FAC-99112",
      fecha: "2026-06-10",
      subtotal: 80.00,
      itbms: 5.60,
      total: 85.60,
      descripcion_servicio: "Asistencia vial: Remolque técnico por daño de motor",
      descripcion_producto: "Servicio de Grua Plataforma (Remolque)"
    },
    created_at: "2026-06-10T14:15:00.000Z"
  },
  {
    id: "AST-1004",
    fecha: "2026-06-09",
    hora: "11:55",
    numero_factura: "FAC-98711",
    cliente: "Supermercados Rey S.A.",
    ruc_cliente: "9-441-2290 DV 14",
    telefono: "+507 6900-2139",
    direccion: "Calle 50, Plaza Magna",
    comentario: "Apertura técnica de puerta de vehículo, llaves olvidadas adentro.",
    ubicacion_servicio: "Calle 50, Bella Vista",
    vendedor: "Héctor Guardia",
    forma_pago: "Efectivo",
    subtotal: 40.00,
    itbms: 2.80,
    total: 42.80,
    estado: "Completado",
    motorizado_id: "diego_torres",
    descripcion_servicio: "Asistencia vial: Apertura técnica de cerradura coche",
    descripcion_producto: "Servicio Cerrajería Automotriz",
    imagen_original: "",
    imagen_procesada: "",
    ocr_json: {
      numero_factura: "FAC-98711",
      fecha: "2026-06-09",
      subtotal: 40.00,
      itbms: 2.80,
      total: 42.80,
      descripcion_servicio: "Asistencia vial: Apertura técnica de cerradura coche",
      descripcion_producto: "Servicio Cerrajería Automotriz"
    },
    created_at: "2026-06-09T11:55:00.000Z"
  },
  {
    id: "AST-1005",
    fecha: "2026-06-08",
    hora: "09:30",
    numero_factura: "FAC-98604",
    cliente: "Farmacias Arrocha",
    ruc_cliente: "8-111-2222 DV 00",
    telefono: "+507 6443-1288",
    direccion: "Vía España, Sucursal Principal",
    comentario: "Abastecimiento de combustible (2 galones de gasolina de 95 octanos).",
    ubicacion_servicio: "Vía España, Carrasquilla",
    vendedor: "Patricia Domínguez",
    forma_pago: "Tarjeta de Débito",
    subtotal: 15.00,
    itbms: 1.05,
    total: 16.05,
    estado: "Completado",
    motorizado_id: "sofia_ruiz",
    descripcion_servicio: "Asistencia vial: Suministro de combustible",
    descripcion_producto: "2 Galones Gasolina 95 Octanos",
    imagen_original: "",
    imagen_procesada: "",
    ocr_json: {
      numero_factura: "FAC-98604",
      fecha: "2026-06-08",
      subtotal: 15.00,
      itbms: 1.05,
      total: 16.05,
      descripcion_servicio: "Asistencia vial: Suministro de combustible",
      descripcion_producto: "2 Galones Gasolina 95 Octanos"
    },
    created_at: "2026-06-08T09:30:00.000Z"
  }
];

// ----------------------------------------------------
// FIREBASE FIRESTORE INTEGRATION & INITIALIZATION
// ----------------------------------------------------
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Cache State to allow extremely rapid (instantaneous) loading pages on the client
let cachedMotorizados: Motorizado[] = [];
let cachedAsistencias: Asistencia[] = [];

// Purge preloaded datasets from Firestore instantly on startup
async function purgePreloadedData() {
  const preloadedMotoIds = ["diego_torres", "sofia_ruiz", "carlos_mendoza", "ana_gomez"];
  for (const id of preloadedMotoIds) {
    try {
      await deleteDoc(doc(firestoreDb, "motorizados", id));
    } catch (e) {
      // ignore
    }
  }
  const preloadedAstIds = ["AST-1001", "AST-1002", "AST-1003", "AST-1004", "AST-1005"];
  for (const id of preloadedAstIds) {
    try {
      await deleteDoc(doc(firestoreDb, "asistencias", id));
    } catch (e) {
      // ignore
    }
  }
  console.log("Mock preloaded datasets check and purge executed successfully.");
}
purgePreloadedData().catch(console.error);

// Real-time synchronization listeners for sub-second, bi-directional, quota-friendly operations
onSnapshot(
  collection(firestoreDb, "motorizados"),
  async (snapshot) => {
    if (snapshot.empty) {
      console.log("Firestore 'motorizados' is empty.");
      cachedMotorizados = [];
    } else {
      const list: Motorizado[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Motorizado);
      });
      cachedMotorizados = list;
    }
  },
  (err) => {
    console.error("Real-time listener for 'motorizados' failed:", err);
  }
);

onSnapshot(
  collection(firestoreDb, "asistencias"),
  async (snapshot) => {
    if (snapshot.empty) {
      console.log("Firestore 'asistencias' is empty.");
      cachedAsistencias = [];
    } else {
      const list: Asistencia[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Asistencia);
      });
      cachedAsistencias = list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },
  (err) => {
    console.error("Real-time listener for 'asistencias' failed:", err);
  }
);

// Unified persistent config cache for Gemini API Key across sessions/PCs
let cachedGeminiApiKey = "";
onSnapshot(
  doc(firestoreDb, "config", "gemini"),
  (docSnap) => {
    if (docSnap.exists()) {
      cachedGeminiApiKey = docSnap.data().apiKey || "";
      console.log("Synchronized Gemini API key loaded from Firestore.");
    } else {
      cachedGeminiApiKey = "";
    }
  },
  (err) => {
    console.error("Real-time listener for 'config/gemini' document failed:", err);
  }
);

// Instant Response getters
async function getMotorizados(): Promise<Motorizado[]> {
  return cachedMotorizados;
}

async function getAsistencias(): Promise<Asistencia[]> {
  return cachedAsistencias;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Get List of Motorizados & Indicators
app.get("/api/motorizados", async (req, res) => {
  try {
    const list = await getMotorizados();
    res.json(list);
  } catch (err) {
    console.error("Error in GET /api/motorizados:", err);
    res.status(500).json({ error: "Error al obtener motorizados de Firestore." });
  }
});

// 2. Add / Update Motorizado
app.post("/api/motorizados", async (req, res) => {
  try {
    const moto = req.body;
    
    if (!moto.nombre || !moto.telefono) {
      return res.status(400).json({ error: "Nombre y teléfono son obligatorios" });
    }

    const id = moto.id || moto.nombre.toLowerCase().replace(/\s+/g, "_") + "_" + Math.floor(Math.random() * 1000);
    const docRef = doc(firestoreDb, "motorizados", id);
    const docSnap = await getDocFromServer(docRef);

    let updatedMoto: Motorizado;
    if (docSnap.exists()) {
      updatedMoto = { ...docSnap.data() as Motorizado, ...moto };
    } else {
      updatedMoto = {
        id,
        nombre: moto.nombre,
        telefono: moto.telefono,
        estado: moto.estado || "Activo",
        fecha_ingreso: moto.fecha_ingreso || new Date().toISOString().split("T")[0],
        asistencias_realizadas: 0,
        total_facturado: 0,
        promedio_diario: 0,
        ultima_asistencia: "Ninguna"
      };
    }

    await setDoc(docRef, updatedMoto);
    
    // Update local cache immediately
    const existingIndex = cachedMotorizados.findIndex(m => m.id === updatedMoto.id);
    if (existingIndex !== -1) {
      cachedMotorizados[existingIndex] = updatedMoto;
    } else {
      cachedMotorizados.push(updatedMoto);
    }

    res.json({ success: true, motorizados: cachedMotorizados });
  } catch (err) {
    console.error("Error in POST /api/motorizados:", err);
    res.status(500).json({ error: "Error al registrar motorizado en Firestore." });
  }
});

// 3. Get List of Asistencias
app.get("/api/asistencias", async (req, res) => {
  try {
    const list = await getAsistencias();
    res.json(list);
  } catch (err) {
    console.error("Error in GET /api/asistencias:", err);
    res.status(500).json({ error: "Error al obtener asistencias de Firestore." });
  }
});

// 4. Save/register Asistencia & Update Motorizado Statistics
app.post("/api/asistencias", async (req, res) => {
  try {
    const ast: Asistencia = req.body;

    if (!ast.cliente || !ast.numero_factura || !ast.motorizado_id) {
      return res.status(400).json({ error: "Varios campos requeridos están vacíos." });
    }

    // Generate ID if not present
    if (!ast.id) {
      const currentList = await getAsistencias();
      const nextAstVal = 1000 + currentList.length + 1;
      ast.id = `AST-${nextAstVal}`;
    }
    if (!ast.created_at) {
      ast.created_at = new Date().toISOString();
    }

    // Save/update the asistencia document
    const astRef = doc(firestoreDb, "asistencias", ast.id);
    await setDoc(astRef, ast);

    // Update in-memory cache for asistencias immediately
    const existingAstIndex = cachedAsistencias.findIndex(a => a.id === ast.id);
    if (existingAstIndex !== -1) {
      cachedAsistencias[existingAstIndex] = ast;
    } else {
      cachedAsistencias.unshift(ast);
    }

    // Recalculate and update motorizado indicators in real-time
    const motoRef = doc(firestoreDb, "motorizados", ast.motorizado_id);
    const motoSnap = await getDocFromServer(motoRef);
    if (motoSnap.exists()) {
      const targetMoto = motoSnap.data() as Motorizado;
      
      const mAsistencias = cachedAsistencias.filter(a => a.motorizado_id === targetMoto.id && a.estado === "Completado");
      
      targetMoto.asistencias_realizadas = mAsistencias.length;
      const sumTotal = mAsistencias.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
      targetMoto.total_facturado = Number(sumTotal.toFixed(2));
      
      const daysSince = Math.max(1, Math.ceil((Date.now() - new Date(targetMoto.fecha_ingreso).getTime()) / (1000 * 60 * 60 * 24)));
      targetMoto.promedio_diario = Number((targetMoto.total_facturado / daysSince).toFixed(2));
      targetMoto.ultima_asistencia = `${ast.fecha} ${ast.hora}`;

      await setDoc(motoRef, targetMoto);

      // Update in-memory cache for motorizados immediately
      const existingMotoIndex = cachedMotorizados.findIndex(m => m.id === targetMoto.id);
      if (existingMotoIndex !== -1) {
        cachedMotorizados[existingMotoIndex] = targetMoto;
      }
    }

    res.json({ success: true, asistencia: ast });
  } catch (err: any) {
    console.error("Error in POST /api/asistencias:", err);
    res.status(500).json({ error: "Error de Firestore al guardar asistencia.", details: err?.message || String(err) });
  }
});

// 5. Delete Asistencia & Recalculate Motorizado Statistics
app.delete("/api/asistencias/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const astIndex = cachedAsistencias.findIndex(a => a.id === id);
    if (astIndex === -1) {
      return res.status(404).json({ error: "Asistencia no encontrada en el caché." });
    }
    
    const ast = cachedAsistencias[astIndex];
    const motorizadoId = ast.motorizado_id;
    
    // Delete from Firestore
    try {
      const astRef = doc(firestoreDb, "asistencias", id);
      await deleteDoc(astRef);
    } catch (firestoreErr: any) {
      console.error("Error al borrar asistencia de Firestore:", firestoreErr);
      return res.status(500).json({ 
        error: "No se pudo borrar el ticket en Firestore. Compruebe los permisos o internet.",
        details: firestoreErr?.message || String(firestoreErr)
      });
    }
    
    // Remove from cached list
    cachedAsistencias.splice(astIndex, 1);
    
    // Recalculate motorizado statistics
    if (motorizadoId) {
      try {
        const motoRef = doc(firestoreDb, "motorizados", motorizadoId);
        const motoSnap = await getDocFromServer(motoRef);
        if (motoSnap.exists()) {
          const targetMoto = motoSnap.data() as Motorizado;
          
          const mAsistencias = cachedAsistencias.filter(a => a.motorizado_id === targetMoto.id && a.estado === "Completado");
          
          targetMoto.asistencias_realizadas = mAsistencias.length;
          const sumTotal = mAsistencias.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
          targetMoto.total_facturado = Number(sumTotal.toFixed(2));
          
          const daysSince = Math.max(1, Math.ceil((Date.now() - new Date(targetMoto.fecha_ingreso).getTime()) / (1000 * 60 * 60 * 24)));
          targetMoto.promedio_diario = Number((targetMoto.total_facturado / daysSince).toFixed(2));
          
          // Find latest remaining assistance to restore as last assistance timestamp
          const remainingMotoAsts = cachedAsistencias.filter(a => a.motorizado_id === targetMoto.id);
          if (remainingMotoAsts.length > 0) {
            const sorted = [...remainingMotoAsts].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            targetMoto.ultima_asistencia = `${sorted[0].fecha} ${sorted[0].hora}`;
          } else {
            targetMoto.ultima_asistencia = "Ninguna";
          }
          
          await setDoc(motoRef, targetMoto);
          
          // Update in-memory cache for motorizados immediately
          const existingMotoIndex = cachedMotorizados.findIndex(m => m.id === targetMoto.id);
          if (existingMotoIndex !== -1) {
            cachedMotorizados[existingMotoIndex] = targetMoto;
          }
        }
      } catch (calcErr: any) {
        console.error("Error al recalcular estadísticas del motorizado:", calcErr);
        return res.status(500).json({
          error: "El ticket se borró de la base de datos, pero no se pudieron actualizar las estadísticas del conductor.",
          details: calcErr?.message || String(calcErr)
        });
      }
    }
    
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error general en DELETE /api/asistencias/:id", err);
    res.status(500).json({ 
      error: "Error inesperado al eliminar asistencia de la base de datos.",
      details: err?.message || String(err)
    });
  }
});

// 5. Delete Motorizado from Firestore by ID
app.delete("/api/motorizados/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Delete first from Firestore
    try {
      const docRef = doc(firestoreDb, "motorizados", id);
      await deleteDoc(docRef);
    } catch (firestoreErr: any) {
      console.error("Error al borrar motorizado de Firestore:", firestoreErr);
      return res.status(500).json({ 
        error: "No se pudo borrar el motorizado de Firestore. Compruebe los permisos o internet.",
        details: firestoreErr?.message || String(firestoreErr)
      });
    }

    // Force filtering local cache optimistically
    cachedMotorizados = cachedMotorizados.filter(m => m.id !== id);

    res.json({ success: true, motorizados: cachedMotorizados });
  } catch (err: any) {
    console.error("Error general en DELETE /api/motorizados/:id", err);
    res.status(500).json({ 
      error: "Error inesperado al eliminar motorizado de la base de datos.",
      details: err?.message || String(err)
    });
  }
});

// 5.5. System and user Firestore-persisted Gemini API credentials config
app.get("/api/config/gemini", async (req, res) => {
  try {
    let keyToUse = cachedGeminiApiKey || process.env.GEMINI_API_KEY || "";
    // Filter common placeholders to avoid hard errors
    if (
      keyToUse.trim() === "" || 
      keyToUse === "MY_GEMINI_API_KEY" || 
      keyToUse.includes("YOUR_") || 
      keyToUse.includes("INSERT_")
    ) {
      keyToUse = "";
    }

    if (!keyToUse) {
      return res.json({ hasKey: false, maskedKey: "" });
    }
    const masked = keyToUse.length > 8 
      ? `${keyToUse.substring(0, 8)}...${keyToUse.substring(keyToUse.length - 4)}` 
      : "Configurada (Activa)";
    res.json({ hasKey: true, maskedKey: masked });
  } catch (err: any) {
    res.status(500).json({ error: "Fallo al leer la configuración de la clave API." });
  }
});

app.post("/api/config/gemini", async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      return res.status(400).json({ error: "La clave provista está vacía o es inválida." });
    }
    
    // Clean key (remove spaces, quotes or brackets user might accidentally paste)
    let cleanKey = apiKey.trim().replace(/^["']|["']$/g, "");
    
    if (
      cleanKey === "MY_GEMINI_API_KEY" || 
      cleanKey.includes("YOUR_") || 
      cleanKey.includes("INSERT_") ||
      cleanKey.length < 5
    ) {
      return res.status(400).json({ error: "La clave ingresada es un marcador de posición ficticio o es demasiado corta para ser válida." });
    }
    
    // Write directly to cloud Firestore to persist for other computers/sessions
    const configRef = doc(firestoreDb, "config", "gemini");
    await setDoc(configRef, { apiKey: cleanKey, updated_at: new Date().toISOString() });
    
    cachedGeminiApiKey = cleanKey;
    const masked = cleanKey.length > 8 
      ? `${cleanKey.substring(0, 8)}...${cleanKey.substring(cleanKey.length - 4)}` 
      : "Configurada (Activa)";

    res.json({ success: true, maskedKey: masked });
  } catch (err: any) {
    console.error("Error al persistir la clave en Firestore:", err);
    res.status(500).json({ error: "Error al guardar la clave de API en Firestore." });
  }
});

/**
 * Helper to call standard Google Gemini REST API.
 * Supports both standard API Keys (AIzaSy...) and GCP corporate tokens (AQ..., ya29...).
 */
async function callGoogleGemini(
  apiKey: string,
  model: string,
  contentsParts: any[],
  responseSchema?: any,
  responseMimeType?: string
) {
  const isAccessToken = apiKey.startsWith("AQ.") || apiKey.startsWith("ya29.");
  const url = isAccessToken
    ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "aistudio-build",
  };

  if (isAccessToken) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const payload: any = {
    contents: [
      {
        parts: contentsParts,
      }
    ],
  };

  if (responseMimeType || responseSchema) {
    payload.generationConfig = {};
    if (responseMimeType) {
      payload.generationConfig.responseMimeType = responseMimeType;
    }
    if (responseSchema) {
      payload.generationConfig.responseSchema = responseSchema;
    }
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let parsedErr;
    let message = "";
    try {
      parsedErr = JSON.parse(errorBody);
      message = parsedErr?.error?.message || "";
    } catch {
      parsedErr = null;
      message = errorBody;
    }
    
    if (message.includes("prepayment credits are depleted") || message.includes("quota") || response.status === 429) {
      throw new Error(`Error de cuota (429): Tus créditos de API se han agotado o superaste el límite. Detalles: ${message}`);
    }
    
    throw new Error(message || `Gemini API Error with HTTP status ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  return { text, data };
}

app.post("/api/config/gemini/test", async (req, res) => {
  try {
    const { apiKey } = req.body;
    let keyToTest = apiKey ? apiKey.trim().replace(/^["']|["']$/g, "") : (cachedGeminiApiKey || process.env.GEMINI_API_KEY || "");
    
    if (
      !keyToTest || 
      keyToTest === "MY_GEMINI_API_KEY" || 
      keyToTest.includes("YOUR_") || 
      keyToTest.includes("INSERT_") || 
      keyToTest.trim() === ""
    ) {
      return res.status(400).json({ success: false, error: "No hay ninguna clave configurada para probar. Por favor ingresa una clave primero." });
    }
    
    const testResult = await callGoogleGemini(
      keyToTest,
      "gemini-3.5-flash",
      [{ text: "Ping. Responde únicamente con la palabra OK." }]
    );
    
    if (testResult && testResult.text) {
      return res.json({ success: true, message: "¡Conexión Exitosa! Gemini respondió correctamente." });
    } else {
      return res.status(400).json({ success: false, error: "El modelo respondió pero no devolvió el texto esperado." });
    }
  } catch (err: any) {
    console.error("Error al probar la clave Gemini:", err);
    let errorMsg = err?.message || String(err);
    if (errorMsg.includes("API key not valid")) {
      errorMsg = "API key no válida. Asegúrate de copiar la clave exactamente como aparece en Google AI Studio.";
    }
    return res.status(400).json({ success: false, error: errorMsg });
  }
});

app.delete("/api/config/gemini", async (req, res) => {
  try {
    const configRef = doc(firestoreDb, "config", "gemini");
    await deleteDoc(configRef);
    cachedGeminiApiKey = "";
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Error al remover la clave guardada de Firestore." });
  }
});

// 5.8. Purge all mock datasets and clean the database collections
app.post("/api/config/clean", async (req, res) => {
  try {
    const motoCollection = collection(firestoreDb, "motorizados");
    const astCollection = collection(firestoreDb, "asistencias");

    const motoSnapshot = await getDocsFromServer(motoCollection);
    const astSnapshot = await getDocsFromServer(astCollection);

    const deletePromises: Promise<void>[] = [];

    motoSnapshot.forEach((docSnap) => {
      deletePromises.push(deleteDoc(docSnap.ref));
    });

    astSnapshot.forEach((docSnap) => {
      deletePromises.push(deleteDoc(docSnap.ref));
    });

    await Promise.all(deletePromises);

    // Dynamic reset of cache
    cachedMotorizados = [];
    cachedAsistencias = [];

    console.log("Database fully purged by administrative request.");
    res.json({ success: true, message: "Todos los datos de prueba han sido eliminados de la base de datos de Firestore." });
  } catch (err: any) {
    console.error("Error al purgar base de datos:", err);
    res.status(500).json({ error: "Fallo al purgar la base de datos de Firestore.", details: err.message });
  }
});

// 6. OCR Analysis Route with Gemini API Integration (Server-side)
app.post("/api/ocr-process", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "No se proporcionó la imagen de la factura." });
    }

    let apiKey = cachedGeminiApiKey || process.env.GEMINI_API_KEY || "";
    // Sanitize and filter known dummy placeholders
    apiKey = apiKey.trim().replace(/^["']|["']$/g, "");
    if (
      !apiKey || 
      apiKey === "MY_GEMINI_API_KEY" || 
      apiKey.includes("YOUR_") || 
      apiKey.includes("INSERT_") ||
      apiKey.length < 5
    ) {
      return res.status(400).json({
        error: "Clave de API Gemini no configurada o inválida. Por favor, agregue una clave de API Gemini real en el panel de Configuración de la cabecera."
      });
    }

    // Remove data URL prefix if present for binary matching
    const base64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Clean,
      },
    };

    const promptText = `
Analiza la imagen de la factura adjunta de asistencia vial. Tu prioridad es extraer y transcribir con precisión total cada dato visible.
Importante: No te limites. Si encuentras datos contractuales al pie de la página, números de cuentas de bancos para pago, firmas, notas escritas a mano o comentarios, debes extraerlos sin importar el formato.

Reglas del formato de salida:
- Devuelve un JSON estructurado que siga el esquema exacto provisto.
- En los campos numéricos como subtotal, itbms y total, extrae únicamente los valores decimales como números reales (ej: 42.15). Si tiene el símbolo $, elimínalo.
- Si no encuentras un campo, rellenalo con una cadena vacía "" o 0 para números.

Retorna un objeto JSON con los siguientes campos obligatorios.
`;

    const response = await callGoogleGemini(
      apiKey,
      "gemini-3.5-flash",
      [imagePart, { text: promptText }],
      {
        type: Type.OBJECT,
        properties: {
          numero_factura: { type: Type.STRING, description: "Número de factura o serie visible, ej. FAC-10023" },
          fecha: { type: Type.STRING, description: "Fecha de emisión de factura en formato YYYY-MM-DD" },
          hora: { type: Type.STRING, description: "Hora de emisión de factura en formato HH:MM" },
          cliente: { type: Type.STRING, description: "Nombre completo del cliente o empresa" },
          ruc_cliente: { type: Type.STRING, description: "RUC, cédula, DV o NIT del cliente" },
          receptor: { type: Type.STRING, description: "Nombre de la persona o receptor del servicio" },
          telefono: { type: Type.STRING, description: "Teléfono o celular del cliente" },
          direccion: { type: Type.STRING, description: "Dirección física detallada" },
          comentario: { type: Type.STRING, description: "Notas, observaciones o detalles adicionales manuales" },
          descripcion_servicio: { type: Type.STRING, description: "Descripción detallada del servicio prestado, repuestos, combustible, etc." },
          descripcion_producto: { type: Type.STRING, description: "Descripción del producto o repuesto facturado con nombre o modelo, ej: Batería Hankook, Neumático, etc." },
          forma_pago: { type: Type.STRING, description: "Efectivo, Tarjeta, Yappy, Transferencia, ACH, etc." },
          vendedor: { type: Type.STRING, description: "Nombre del vendedor, caja o receptor del pago" },
          cuenta: { type: Type.STRING, description: "Cuentas bancarias citadas al pie para transferencias" },
          factura_interna: { type: Type.STRING, description: "Número de orden, cotización o documento de referencia interno" },
          sucursal: { type: Type.STRING, description: "Nombre de la sucursal o patio de despacho" },
          punto_facturacion: { type: Type.STRING, description: "Dispositivo o punto de facturación" },
          subtotal: { type: Type.NUMBER, description: "Subtotal antes de impuestos" },
          itbms: { type: Type.NUMBER, description: "Impuesto ITBMS (impuesto del 7% panameño u otro aplicable)" },
          total: { type: Type.NUMBER, description: "Total general de la factura" },
          ubicacion_servicio: { type: Type.STRING, description: "Ubicación del evento o destino del servicio" },
          pie_factura: { type: Type.STRING, description: "Información contractual, cuentas bancarias, pie de página o teléfonos adicionales" },
          datos_adicionales: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Cualquier otra información adicional relevante detectada" }
        }
      },
      "application/json"
    );

    const bodyText = response.text;
    if (!bodyText) {
      throw new Error("No se pudo obtener el texto analizado por la inteligencia artificial.");
    }

    const ocrData = JSON.parse(bodyText);
    res.json(ocrData);
  } catch (error: any) {
    console.error("Error en ocr-process API:", error);
    res.status(500).json({ error: error?.message || "Error procesando el OCR de la factura" });
  }
});


// ----------------------------------------------------
// FULL-STACK VITE ROUTING IN EXPRESS
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // DEV MODE: Integrate Vite's Dev Server as a middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware attached in development mode.");
  } else {
    // PRODUCTION MODE: Serve compiled static bundle
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static assets in production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MotoAssist is running at http://localhost:${PORT}`);
  });
}

startServer();
