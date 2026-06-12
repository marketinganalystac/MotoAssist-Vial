import { useState, useEffect } from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import InvoiceScanner from "./components/InvoiceScanner";
import TicketsTable from "./components/TicketsTable";
import MotorizadosCatalog from "./components/MotorizadosCatalog";
import { Asistencia, Motorizado } from "./types";
import { 
  Camera, 
  Layers, 
  Users, 
  BarChart3, 
  ListTodo,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Calendar,
  Coins,
  FileCheck,
  FileClock,
  Menu,
  X,
  Settings,
  KeyRound
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"scan" | "tickets" | "motorizados" | "charts">("scan");
  const [motorizados, setMotorizados] = useState<Motorizado[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [currentMotorizado, setCurrentMotorizado] = useState<string>("diego_torres");
  const [loading, setLoading] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Gemini cloud API key overrides
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [maskedApiKey, setMaskedApiKey] = useState<string>("");
  const [apiConfigOpen, setApiConfigOpen] = useState<boolean>(false);
  const [typedApiKey, setTypedApiKey] = useState<string>("");
  const [isTestingApiKey, setIsTestingApiKey] = useState<boolean>(false);
  const [testApiResult, setTestApiResult] = useState<string | null>(null);
  const [testApiSuccess, setTestApiSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!apiConfigOpen) {
      setTypedApiKey("");
      setTestApiResult(null);
      setTestApiSuccess(null);
    }
  }, [apiConfigOpen]);

  // Sync API States
  const fetchData = async () => {
    try {
      const [motoRes, astRes] = await Promise.all([
        fetch("/api/motorizados"),
        fetch("/api/asistencias")
      ]);
      
      if (!motoRes.ok || !astRes.ok) {
        throw new Error("No se pudo obtener la información de asistencia vial del servidor.");
      }
      
      const [motoData, astData] = await Promise.all([
        motoRes.json(),
        astRes.json()
      ]);

      setMotorizados(motoData);
      setAsistencias(astData);
      setErrorText(null);
    } catch (err: any) {
      console.error(err);
      setErrorText("Error de sincronización con la base de datos local. Verifique la consola.");
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKeyStatus = async () => {
    try {
      const res = await fetch("/api/config/gemini");
      if (res.ok) {
        const data = await res.json();
        setHasApiKey(data.hasKey);
        setMaskedApiKey(data.maskedKey || "");
      }
    } catch (e) {
      console.error("Error fetching Gemini key status:", e);
    }
  };

  const handleSaveApiKey = async (newKey: string) => {
    const res = await fetch("/api/config/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: newKey })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Error desconocido" }));
      throw new Error(err.error || "Fallo al guardar la clave.");
    }
    await fetchApiKeyStatus();
  };

  const handleDeleteApiKey = async () => {
    const res = await fetch("/api/config/gemini", { method: "DELETE" });
    if (res.ok) {
      await fetchApiKeyStatus();
    } else {
      throw new Error("No se pudo remover la clave.");
    }
  };

  useEffect(() => {
    fetchData();
    fetchApiKeyStatus();

    // Setup micro polling loop to simulate beautiful Supabase Realtime updates perfectly
    const pollInterval = setInterval(() => {
      fetchData();
    }, 6000);

    return () => clearInterval(pollInterval);
  }, []);

  // Update on creation
  const handleAsistenciaCreated = (newAst: Asistencia) => {
    // Optimistic fast refresh
    setAsistencias(prev => [newAst, ...prev]);
    fetchData(); // pull verified recalculations from backend
  };

  const handleAsistenciaDeleted = async (id: string) => {
    try {
      const res = await fetch(`/api/asistencias/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setAsistencias(prev => prev.filter(a => a.id !== id));
        fetchData();
        setErrorText(null);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorText(errJson.error || "No se pudo eliminar el registro de asistencia del servidor.");
        console.error("No se pudo eliminar el registro de asistencia del servidor:", errJson);
      }
    } catch (err: any) {
      setErrorText("Error al borrar asistencia: " + (err?.message || String(err)));
      console.error("Error al borrar asistencia de forma remota:", err);
    }
  };

  const handleAddMotorizado = (newMoto: Motorizado) => {
    setMotorizados(prev => [...prev, newMoto]);
    fetchData();
  };

  const handleDeleteMotorizado = async (id: string) => {
    try {
      const res = await fetch(`/api/motorizados/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setMotorizados(prev => prev.filter(m => m.id !== id));
        fetchData();
        setErrorText(null);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorText(errJson.error || "No se pudo eliminar el motorizado del servidor.");
      }
    } catch (err: any) {
      setErrorText("Error al borrar motorizado: " + (err?.message || String(err)));
    }
  };

  // Pre-calculations for Top-Level Metrics
  const summaryMetrics = (() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const hoyCount = asistencias.filter(a => a.fecha === todayStr).length;
    
    // total amount
    const totalFacturado = asistencias
      .filter(a => a.estado === "Completado")
      .reduce((sum, a) => sum + (Number(a.total) || 0), 0);
    
    const completados = asistencias.filter(a => a.estado === "Completado").length;
    const pendientes = asistencias.filter(a => a.estado === "Pendiente").length;

    return {
      hoyCount,
      totalFacturado,
      completados,
      pendientes
    };
  })();  return (
    <div className="min-h-screen bg-brand-dark text-slate-100 font-sans flex flex-col md:flex-row antialiased selection:bg-brand-amber selection:text-brand-dark">
      
      {/* MOBILE HEADER (Only visible on small devices) */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-brand-dark border-b border-white/5 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-mobile-menu"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors focus:outline-none"
            title="Abrir menú"
          >
            <Menu className="h-5 w-5 text-white" />
          </button>
          <div className="flex items-center gap-1">
            <span className="text-base font-bold tracking-tight text-white">MotoAssist</span>
            <span className="text-[7px] uppercase font-mono tracking-widest bg-brand-amber text-brand-dark px-1.5 py-0.5 rounded font-extrabold">
              PRO
            </span>
          </div>
        </div>
        
        {/* Quick mobile settings and status indicators */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setApiConfigOpen(true)}
            className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
              hasApiKey ? 'bg-brand-amber/20 text-brand-yellow' : 'bg-rose-500/20 text-rose-400 animate-pulse'
            }`}
            title="Clave API"
          >
            <KeyRound className="h-4 w-4" />
          </button>
          <div className="text-[9px] text-brand-amber font-mono font-bold bg-brand-amber/10 px-2 py-0.5 rounded border border-brand-amber/20">
            {hasApiKey ? "IA ACTIVA" : "SIN CLAVE"}
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER SIDEBAR OVERLAY */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* Drawer Panel */}
          <div 
            className="w-72 max-w-[80vw] bg-brand-dark border-r border-white/10 text-white h-full flex flex-col shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Close */}
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-brand-amber rounded-lg flex items-center justify-center shadow-md">
                  <Zap className="h-4.5 w-4.5 text-brand-dark stroke-[2.5]" />
                </div>
                <span className="text-base font-bold text-white">MotoAssist</span>
              </div>
              <button
                id="btn-close-mobile-menu"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Navigation Actions */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              <div className="px-3 mb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Principal
              </div>
              
              <button
                id="mob-tab-scan"
                onClick={() => {
                  setActiveTab("scan");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "scan"
                    ? "bg-brand-amber text-brand-dark shadow-lg shadow-brand-amber/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Camera className="h-4 w-4" />
                <span>Digitalizar Factura (IA)</span>
              </button>

              <button
                id="mob-tab-tickets"
                onClick={() => {
                  setActiveTab("tickets");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "tickets"
                    ? "bg-brand-amber text-brand-dark shadow-lg shadow-brand-amber/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <ListTodo className="h-4 w-4" />
                <span>Control de Asistencias</span>
              </button>

              <button
                id="mob-tab-motorizados"
                onClick={() => {
                  setActiveTab("motorizados");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "motorizados"
                    ? "bg-brand-amber text-brand-dark shadow-lg shadow-brand-amber/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Flota Motorizados</span>
              </button>

              <button
                id="mob-tab-charts"
                onClick={() => {
                  setActiveTab("charts");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "charts"
                    ? "bg-brand-amber text-brand-dark shadow-lg shadow-brand-amber/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Reportes & Tendencias</span>
              </button>

              <div className="pt-4 border-t border-white/5 mt-4 space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Configuración
                </div>
                <button
                  onClick={() => {
                    setApiConfigOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  <KeyRound className="h-4 w-4 text-brand-amber" />
                  <span>Clave de API Gemini</span>
                </button>
              </div>
            </nav>

            {/* Operator selector inside mobile drawer */}
            <div className="p-4 border-t border-white/10 bg-brand-dark/40">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-2 px-1">
                Operador de Turno
              </div>
              <select
                value={currentMotorizado}
                onChange={(e) => {
                  setCurrentMotorizado(e.target.value);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-brand-medium border border-white/10 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-brand-amber font-sans text-white"
              >
                <option value="" className="text-slate-800">-- Sin Conductor --</option>
                {motorizados.map(m => (
                  <option key={m.id} value={m.id} className="text-slate-800">{m.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* PERSISTENT DESKTOP SIDEBAR NAVIGATION PANEL (Only visible on md screens & up) */}
      <aside className="hidden md:flex w-64 bg-brand-dark border-r border-white/10 text-white flex-col shrink-0 min-h-screen">
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-8 h-8 bg-brand-amber rounded-lg flex items-center justify-center shadow-lg shadow-brand-amber/20">
            <Zap className="h-5 w-5 text-brand-dark stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white">MotoAssist</span>
              <span className="text-[9px] uppercase font-mono tracking-widest bg-brand-amber/10 text-brand-yellow px-1.5 py-0.5 rounded border border-brand-amber/25">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Gastos & Asistencia IA</p>
          </div>
        </div>

        {/* Navigation Actions */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 font-sans">
          <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            Principal
          </div>
          
          <button
            id="tab-scan"
            onClick={() => {
              if (activeTab !== "scan") {
                setActiveTab("scan");
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "scan"
                ? "bg-brand-amber text-brand-dark shadow-lg shadow-brand-amber/10"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Digitalizar Factura (IA)</span>
          </button>

          <button
            id="tab-tickets"
            onClick={() => {
              if (activeTab !== "tickets") {
                setActiveTab("tickets");
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "tickets"
                ? "bg-brand-amber text-brand-dark shadow-lg shadow-brand-amber/10"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <ListTodo className="h-4 w-4" />
            <span>Control de Asistencias</span>
          </button>

          <button
            id="tab-motorizados"
            onClick={() => {
              if (activeTab !== "motorizados") {
                setActiveTab("motorizados");
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "motorizados"
                ? "bg-brand-amber text-brand-dark shadow-lg shadow-brand-amber/10"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Flota Motorizados</span>
          </button>

          <button
            id="tab-charts"
            onClick={() => {
              if (activeTab !== "charts") {
                setActiveTab("charts");
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "charts"
                ? "bg-brand-amber text-brand-dark shadow-lg shadow-brand-amber/10"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Reportes & Tendencias</span>
          </button>

          <div className="pt-4 border-t border-white/5 mt-4 space-y-1">
            <div className="px-3 mb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
              Parámetros
            </div>
            <button
              onClick={() => setApiConfigOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-all"
            >
              <KeyRound className="h-4 w-4 text-brand-amber" />
              <span>Configuración API</span>
            </button>
          </div>
        </nav>

        {/* Desktop Sidebar Footer Session Control */}
        <div className="p-4 border-t border-white/10 bg-brand-dark/40">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-2 px-1">
            Operador de Turno
          </div>
          <select
            value={currentMotorizado}
            onChange={(e) => {
              setCurrentMotorizado(e.target.value);
            }}
            className="w-full bg-brand-medium border border-white/10 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-brand-amber font-sans cursor-pointer text-white"
          >
            <option value="" className="text-slate-400">-- Sin Conductor --</option>
            {motorizados.map(m => (
              <option key={m.id} value={m.id} className="text-white">{m.nombre}</option>
            ))}
          </select>
          {currentMotorizado && (
            <div className="mt-3 flex items-center gap-2 px-1 text-[11px] text-brand-amber">
              <span className="w-1.5 h-1.5 bg-brand-amber rounded-full animate-pulse border-glow-amber"></span>
              <span className="font-mono">Sesión Activa</span>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN LAYOUT CANVAS */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Header bar */}
        <Header 
          currentMotorizado={currentMotorizado}
          onSelectMotorizado={(id) => {
            setCurrentMotorizado(id);
          }}
          motorizados={motorizados}
          onOpenConfig={() => setApiConfigOpen(true)}
          hasApiKey={hasApiKey}
          maskedApiKey={maskedApiKey}
        />

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6 max-w-7xl w-full mx-auto">

          {/* Database Status fallback */}
          {errorText && (
            <div className="bg-amber-500/10 border border-brand-amber/30 text-brand-yellow p-4 rounded-xl text-xs flex items-center gap-3 font-medium animate-fade-in shadow-sm">
              <AlertTriangle className="h-5 w-5 text-brand-amber shrink-0 animate-pulse" />
              <span>Sincronizando estado remoto: {errorText}</span>
            </div>
          )}

          {/* 2. CORPORATE CORE INDICATORS BAR (Dark Glassmorphic Bento Grid) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="glass-panel glass-panel-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-mono">Servicios del Día</span>
              <div className="flex items-end justify-between mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white text-glow-amber">{summaryMetrics.hoyCount}</span>
                <span className="text-[9px] bg-brand-amber/10 text-brand-yellow font-bold px-2 py-0.5 rounded-full border border-brand-amber/25">Hoy</span>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-brand-amber rounded-full -mr-10 -mt-10 -z-0 opacity-5 group-hover:scale-110 transition-transform"></div>
            </div>

            <div className="glass-panel glass-panel-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-mono">Total Recaudado</span>
              <div className="flex items-end justify-between mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white text-glow-amber">B/. {summaryMetrics.totalFacturado.toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/25">PAB</span>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500 rounded-full -mr-10 -mt-10 -z-0 opacity-5 group-hover:scale-110 transition-transform"></div>
            </div>

            <div className="glass-panel glass-panel-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-mono">Tickets Completados</span>
              <div className="flex items-end justify-between mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white text-glow-amber">{summaryMetrics.completados}</span>
                <span className="text-[9px] bg-brand-yellow/10 text-brand-yellow font-bold px-2 py-0.5 rounded-full border border-brand-yellow/25 font-mono">Completos</span>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-brand-yellow rounded-full -mr-10 -mt-10 -z-0 opacity-5 group-hover:scale-110 transition-transform"></div>
            </div>

            <div className="glass-panel glass-panel-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-mono">Estado de Auditoría</span>
              <div className="flex items-end justify-between mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-brand-amber text-glow-amber">{summaryMetrics.pendientes}</span>
                <span className="text-[9px] bg-brand-amber/10 text-brand-amber font-bold px-2 py-0.5 rounded-full border border-brand-amber/25 font-mono">Por Procesar</span>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-brand-amber rounded-full -mr-10 -mt-10 -z-0 opacity-5 group-hover:scale-110 transition-transform"></div>
            </div>

          </section>

          {/* 4. ACTIVE VIEWPORT */}
          <section className="min-h-[500px]">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="relative">
                  <span className="flex h-3 w-3 absolute top-0 right-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-amber opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-amber"></span>
                  </span>
                  <div className="w-12 h-12 border-4 border-white/5 border-t-brand-amber rounded-full animate-spin"></div>
                </div>
                <p className="text-xs text-slate-400 font-mono tracking-wide">Cargando base de datos Firestore y sincronizando tablas...</p>
              </div>
            ) : (
              <div className="transition-all duration-200">
                
                {activeTab === "scan" && (
                  <InvoiceScanner 
                    motorizados={motorizados}
                    currentMotorizado={currentMotorizado}
                    onAsistenciaCreated={handleAsistenciaCreated}
                    onOpenConfig={() => setApiConfigOpen(true)}
                  />
                )}

                {activeTab === "tickets" && (
                  <TicketsTable 
                    asistencias={asistencias}
                    motorizados={motorizados}
                    onDeleteAsistencia={handleAsistenciaDeleted}
                  />
                )}

                {activeTab === "motorizados" && (
                  <MotorizadosCatalog 
                    motorizados={motorizados}
                    onAddMotorizado={handleAddMotorizado}
                    onDeleteMotorizado={handleDeleteMotorizado}
                  />
                )}

                {activeTab === "charts" && (
                  <Dashboard 
                    asistencias={asistencias}
                    motorizados={motorizados}
                  />
                )}

              </div>
            )}

          </section>

        </main>

      </div>

      {/* GEMINI CONFIGURATION MODAL (Glassmorphic theme) */}
      {apiConfigOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in text-slate-100">
          <div className="bg-brand-medium/95 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative flex flex-col gap-4 animate-scale-up">
            
            {/* Header info */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm uppercase tracking-wider font-bold font-mono text-brand-amber text-glow-amber flex items-center gap-2">
                  <KeyRound className="h-4.5 w-4.5 text-brand-amber" /> Configuración Clave API
                </h3>
                <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                  Guarda tu Gemini API Key de forma segura en Firestore Cloud. La clave se persistirá para todas tus sesiones y dispositivos de manera inmediata.
                </p>
              </div>
              <button
                onClick={() => setApiConfigOpen(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-full transition-colors"
                title="Cerrar modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              
              {/* Status information */}
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Estado de Clave:</span>
                  <span className={`font-bold font-mono ${hasApiKey ? "text-emerald-400" : "text-brand-amber"}`}>
                    {hasApiKey ? "Activa y Persistida" : "Falta Clave Personalizada"}
                  </span>
                </div>
                {hasApiKey && (
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-slate-450 text-slate-400">Máscara:</span>
                    <span className="text-slate-200">{maskedApiKey}</span>
                  </div>
                )}
                {!hasApiKey && (
                  <p className="text-[10px] text-slate-400 pt-1 leading-relaxed">
                    * Si no configuras una clave de nube, el backend utilizará la variable de entorno por defecto del sistema o habilitará el formulario de fallback asistido.
                  </p>
                )}
              </div>

              {/* Link helper */}
              <div className="text-[10px] bg-sky-500/10 border border-sky-500/20 text-sky-300 p-3 rounded-xl leading-relaxed space-y-1">
                <span className="font-bold flex items-center gap-1 text-[11px] text-white">
                  💡 ¿No tienes una clave Gemini?
                </span>
                <p>
                  Puedes crear una clave de API completamente <strong>gratis y en segundos</strong> en Google AI Studio.
                </p>
                <div className="pt-1">
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-amber hover:underline font-extrabold flex items-center gap-1 uppercase tracking-wider text-[9px]"
                  >
                    Obtener clave gratis en Google AI Studio &rarr;
                  </a>
                </div>
              </div>

              {/* Form Input for update */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block">
                    Clave de API Gemini
                  </label>
                  <button
                    onClick={async () => {
                      const val = typedApiKey || "";
                      setIsTestingApiKey(true);
                      setTestApiResult(null);
                      setTestApiSuccess(null);
                      try {
                        const res = await fetch("/api/config/gemini/test", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ apiKey: val || undefined })
                        });
                        const data = await res.json();
                        setTestApiSuccess(res.ok);
                        setTestApiResult(data.message || data.error);
                      } catch (err: any) {
                        setTestApiSuccess(false);
                        setTestApiResult(err?.message || "Fallo de red al probar conexión.");
                      } finally {
                        setIsTestingApiKey(false);
                      }
                    }}
                    disabled={isTestingApiKey}
                    className="text-[9px] uppercase tracking-wider bg-white/5 hover:bg-white/10 text-brand-amber font-extrabold border border-white/5 px-2 py-1 rounded-lg hover:border-brand-amber/30 transition-all cursor-pointer disabled:opacity-50 font-sans"
                  >
                    {isTestingApiKey ? "Probando..." : "Probar Conexión ⭐"}
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type="password"
                    id="gemini-api-key-input"
                    value={typedApiKey}
                    onChange={(e) => {
                      setTypedApiKey(e.target.value);
                      if (testApiResult) {
                        setTestApiResult(null);
                        setTestApiSuccess(null);
                      }
                    }}
                    placeholder={hasApiKey ? "••••••••••••••••••••••••" : "AIzaSy..."}
                    className="w-full bg-brand-dark border border-white/10 text-slate-100 text-xs rounded-xl p-3 focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber font-mono"
                    onFocus={() => {
                      setTestApiResult(null);
                      setTestApiSuccess(null);
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        const keyVal = typedApiKey || "";
                        if (!keyVal.trim()) return;
                        try {
                          await handleSaveApiKey(keyVal);
                          setTypedApiKey("");
                          alert("¡Clave de API configurada y persistida!");
                          setApiConfigOpen(false);
                        } catch (err: any) {
                          alert("Error al guardar: " + err.message);
                        }
                      }
                    }}
                  />
                </div>

                {/* Real-time Input Validator Hints */}
                {typedApiKey.trim() && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-2 text-[11px] leading-relaxed animate-fade-in font-sans">
                    <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400 block mb-1">
                      Análisis en Tiempo Real de la Clave:
                    </span>
                    {typedApiKey.startsWith("sk-") ? (
                      <div className="text-rose-400 flex items-start gap-1.5">
                        <span className="shrink-0 text-amber-500">⚠️</span>
                        <p>
                          <strong>¡Clave de OpenAI Detectada!</strong> Las claves de OpenAI empiezan con <code>sk-</code>. No funcionarán aquí. Para esta aplicación necesitas una clave de <strong>Google Gemini</strong> de Google AI Studio, que comienza con <code>AIzaSy</code>.
                        </p>
                      </div>
                    ) : !typedApiKey.trim() ? (
                      <div className="text-amber-400 flex items-start gap-1.5 border border-amber-500/20 p-1.5 rounded-lg bg-amber-500/5">
                        <span className="shrink-0">ℹ️</span>
                        <p>Ingresa la clave para validarla y guardarla.</p>
                      </div>
                    ) : typedApiKey.startsWith("AQ.") || typedApiKey.startsWith("ya29.") ? (
                      <div className="text-emerald-400 flex items-start gap-1.5">
                        <span className="shrink-0 text-emerald-400">✨</span>
                        <p>
                          <strong>¡Token de Acceso Detectado!</strong> Formato administrativo detectado. Pulsa <strong>&quot;Probar Conexión ⭐&quot;</strong> para verificarla en tiempo real.
                        </p>
                      </div>
                    ) : (
                      <div className="text-emerald-400 flex items-start gap-1.5">
                        <span className="shrink-0 text-emerald-400">✨</span>
                        <p>
                          <strong>¡Formato listo!</strong> Pulsa <strong>&quot;Probar Conexión ⭐&quot;</strong> para verificarla en tiempo real.
                        </p>
                      </div>
                    )}
                    {(typedApiKey.includes('"') || typedApiKey.includes("'") || typedApiKey.includes("[") || typedApiKey.includes("]")) && (
                      <div className="text-amber-450 text-amber-400 flex items-start gap-1.5 border-t border-white/5 pt-1 mt-1">
                        <span className="shrink-0">⚙️</span>
                        <p>
                          Se detectaron comillas, espacios o caracteres especiales adicionales. Los limpiaremos automáticamente al guardar.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Live Diagnostic Message block */}
                {testApiResult && (
                  <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed animate-fade-in ${
                    testApiSuccess 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                      : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  }`}>
                    <span className="font-bold uppercase tracking-wider block text-[9px] mb-0.5 text-white font-mono">
                      {testApiSuccess ? "Prueba Exitosa" : "Fallo en Verificación"}
                    </span>
                    <p className="text-slate-300">{testApiResult}</p>
                  </div>
                )}
              </div>

              {/* Database Cleaning tools */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <label className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block">
                  Limpieza y Base de Datos (Mantenimiento)
                </label>
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs flex justify-between items-center gap-2">
                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans max-w-[210px]">
                    Borra todos los tickets y motorizados de Firestore para iniciar tu flujo de trabajo en limpio.
                  </p>
                  <button
                    onClick={async () => {
                      if (confirm("🚨 ¿ATENCIÓN: Estás seguro de borrar todos los tickets y motorizados de la base de datos Firestore? Esta acción destruirá todos los datos de prueba permanentemente.")) {
                        try {
                          const res = await fetch("/api/config/clean", { method: "POST" });
                          if (res.ok) {
                            alert("¡Base de datos limpiada con éxito! Todos los registros han sido removidos.");
                            setApiConfigOpen(false);
                            window.location.reload();
                          } else {
                            alert("Error al limpiar la base de datos.");
                          }
                        } catch (e: any) {
                          alert("Error: " + e.message);
                        }
                      }
                    }}
                    className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] uppercase tracking-wider font-extrabold rounded-lg cursor-pointer transition-all shrink-0 font-sans"
                  >
                    Purgar Todo
                  </button>
                </div>
              </div>

              {/* Action trigger row */}
              <div className="flex gap-2.5 justify-end mt-2 pt-2 border-t border-white/10">
                {hasApiKey && (
                  <button
                    onClick={async () => {
                      if (confirm("¿Estás seguro de desconectar y borrar la clave API de Firestore?")) {
                        try {
                          await handleDeleteApiKey();
                          setMaskedApiKey("");
                          setTypedApiKey("");
                        } catch (e: any) {
                          alert("Error al borrar: " + e.message);
                        }
                      }
                    }}
                    className="px-3 py-2 hover:bg-rose-500/15 text-rose-400 border border-rose-500/20 text-[10px] uppercase tracking-wide font-bold rounded-xl cursor-pointer transition-all mr-auto font-sans"
                  >
                    Borrar
                  </button>
                )}
                
                <button
                  onClick={() => setApiConfigOpen(false)}
                  className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition-all font-sans"
                >
                  Cancelar
                </button>

                <button
                  onClick={async () => {
                    const keyVal = typedApiKey || "";
                    if (!keyVal.trim()) {
                      alert("Por favor ingresa una clave API válida.");
                      return;
                    }
                    try {
                      await handleSaveApiKey(keyVal);
                      setTypedApiKey("");
                      alert("¡Clave de API cargada y persistida en la nube con éxito!");
                      setApiConfigOpen(false);
                    } catch (e: any) {
                      alert("Error al guardar: " + e.message);
                    }
                  }}
                  className="px-4 py-2 bg-brand-amber hover:bg-brand-amber/90 text-brand-dark text-xs font-extrabold rounded-xl cursor-pointer transition-all shadow-md shadow-brand-amber/10 font-sans"
                >
                  Guardar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
