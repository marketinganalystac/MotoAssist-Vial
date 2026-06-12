import { LogOut, Settings, KeyRound, ShieldAlert } from "lucide-react";

interface HeaderProps {
  currentMotorizado: string;
  onSelectMotorizado: (id: string) => void;
  motorizados: Array<{ id: string; nombre: string; estado: string }>;
  onOpenConfig: () => void;
  hasApiKey: boolean;
  maskedApiKey: string;
}

export default function Header({
  currentMotorizado,
  onSelectMotorizado,
  motorizados,
  onOpenConfig,
  hasApiKey,
  maskedApiKey,
}: HeaderProps) {
  const currentMotoObj = motorizados.find((m) => m.id === currentMotorizado);

  return (
    <header className="hidden md:flex h-20 bg-brand-dark/40 backdrop-blur-md border-b border-white/5 px-6 md:px-8 items-center justify-between sticky top-0 z-40 transition-all">
      
      {/* Dynamic Title */}
      <div className="flex flex-col">
        <h1 className="text-sm uppercase font-mono tracking-wider text-brand-amber font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-amber animate-pulse border-glow-amber"></span>
          Monitoreo Vial Activo
        </h1>
        <p className="text-[11px] text-slate-400 font-sans tracking-wide mt-0.5">
          Automatización de Cuentas por Cobrar & Rendición de Gastos
        </p>
      </div>

      {/* Realtime Connection status of Firestore DB & Gemini Settings */}
      <div className="flex items-center gap-3">
        
        {/* Dynamic Gemini Key Status Widget */}
        <button
          onClick={onOpenConfig}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all hover:scale-[1.02] cursor-pointer ${
            hasApiKey 
              ? "bg-brand-amber/10 text-brand-yellow border-brand-amber/30 hover:bg-brand-amber/20" 
              : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 animate-pulse"
          }`}
          title="Configuración de clave API Gemini"
        >
          <KeyRound className="h-3.5 w-3.5" />
          <span>
            {hasApiKey ? `Gemini Activa: ${maskedApiKey}` : "Configurar Gemini (Falta Clave)"}
          </span>
          <Settings className="h-3.5 w-3.5 hover:rotate-45 transition-transform" />
        </button>

        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
          <span>Firestore Cloud Conectado</span>
        </div>

        {currentMotoObj ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-xl">
            <div className="text-right">
              <span className="text-[8px] uppercase font-bold text-slate-400 block tracking-wider">
                Despachador
              </span>
              <span className="text-xs font-bold text-slate-200 block leading-tight">
                {currentMotoObj.nombre}
              </span>
            </div>
            <button
              id="header-logout"
              onClick={() => onSelectMotorizado("")}
              title="Cerrar sesión"
              className="text-slate-400 hover:text-rose-500 transition-colors p-1"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl italic">
            Sin conductor asignado
          </div>
        )}

      </div>

    </header>
  );
}
