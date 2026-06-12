import { useState, useMemo } from "react";
import { Asistencia, Motorizado } from "../types";
import { 
  Building2, 
  Calendar, 
  ChevronRight, 
  Coins, 
  FileCheck, 
  FileClock, 
  TrendingUp, 
  Truck, 
  Users 
} from "lucide-react";

interface DashboardProps {
  asistencias: Asistencia[];
  motorizados: Motorizado[];
}

export default function Dashboard({ asistencias, motorizados }: DashboardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Computations
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    // Day comparison
    const asistenciasHoy = asistencias.filter(a => a.fecha === todayStr);
    
    // Week comparison (Past 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const asistenciasSemana = asistencias.filter(a => {
      const aDate = new Date(a.fecha);
      return aDate >= sevenDaysAgo;
    });

    const totalFacturado = asistencias
      .filter(a => a.estado === "Completado")
      .reduce((sum, a) => sum + (Number(a.total) || 0), 0);

    const completados = asistencias.filter(a => a.estado === "Completado").length;
    const pendientes = asistencias.filter(a => a.estado === "Pendiente").length;

    return {
      asistenciasHoy: asistenciasHoy.length,
      asistenciasSemana: asistenciasSemana.length,
      totalFacturado,
      completados,
      pendientes
    };
  }, [asistencias]);

  // Top motorizados (sorted by total facturado)
  const topMotorizados = useMemo(() => {
    return [...motorizados]
      .filter(m => m.estado === "Activo")
      .sort((a, b) => b.total_facturado - a.total_facturado)
      .slice(0, 4);
  }, [motorizados]);

  // Daily Trend (for the last 7 calendar days)
  const dailyTrend = useMemo(() => {
    const days: string[] = [];
    const trendData: { label: string; dateStr: string; count: number; value: number }[] = [];
    
    // generate past 7 dates
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("es-PA", { weekday: "short", day: "numeric" });
      days.push(str);
      
      const filtered = asistencias.filter(a => a.fecha === str);
      const count = filtered.length;
      const value = filtered.reduce((vSum, a) => vSum + (Number(a.total) || 0), 0);
      
      trendData.push({ label, dateStr: str, count, value });
    }
    return trendData;
  }, [asistencias]);

  // Monthly breakdown
  const monthlyLabel = "Junio 2026";
  const monthlyTotal = useMemo(() => {
    return asistencias
      .filter(a => a.fecha.startsWith("2026-06"))
      .reduce((sum, a) => sum + (Number(a.total) || 0), 0);
  }, [asistencias]);

  return (
    <div id="panel-dashboard" className="space-y-6 animate-fade-in">
      
      {/* 1. KEY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Hoy */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md hover:border-amber-350 transition-all">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold block">Asistencias Hoy</span>
            <span className="text-3xl font-extrabold font-sans text-slate-900 block">{stats.asistenciasHoy}</span>
            <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> Tiempo Real
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        {/* Semana */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md hover:border-amber-350 transition-all">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold block">Esta Semana</span>
            <span className="text-3xl font-extrabold font-sans text-slate-900 block">{stats.asistenciasSemana}</span>
            <span className="text-[10px] text-navi-800 font-bold block">Acumulado 7 d</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Facturado */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md hover:border-emerald-300 transition-all bg-emerald-50/10">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold block">Total Facturado</span>
            <span className="text-2xl font-extrabold font-sans text-emerald-600 block">B/. {stats.totalFacturado.toFixed(2)}</span>
            <span className="text-[10px] text-slate-400 font-mono block">{monthlyLabel}: B/. {monthlyTotal.toFixed(2)}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Coins className="h-6 w-6" />
          </div>
        </div>

        {/* Completados */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md hover:border-emerald-350 transition-all">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold block">Completados</span>
            <span className="text-3xl font-extrabold font-sans text-slate-900 block">{stats.completados}</span>
            <span className="text-[10px] text-emerald-600 font-bold block">Cerrados</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md hover:border-rose-300 transition-all">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold block">En Validación</span>
            <span className="text-3xl font-extrabold font-sans text-slate-900 block">{stats.pendientes}</span>
            <span className="text-[10px] text-rose-600 font-bold block">Por Verificar</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <FileClock className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* 2. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TENDENCIA DIARIA (SVG Chart) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-sans">
                Tendencia de Facturación Diaria
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Últimos 7 días de facturación de asistencias viales registradas
              </p>
            </div>
            <span className="text-xs bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1 rounded-full font-mono font-bold">
              B/. Balboas (PAB)
            </span>
          </div>

          {/* SVG Line/Area Chart */}
          <div className="relative h-64 w-full">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="40" y1="160" x2="480" y2="160" stroke="#cbd5e1" strokeWidth="1" />

              {/* Axis labels */}
              <text x="15" y="24" fill="#64748b" className="text-[9px] font-mono">B/ 400</text>
              <text x="15" y="74" fill="#64748b" className="text-[9px] font-mono">B/ 200</text>
              <text x="15" y="124" fill="#64748b" className="text-[9px] font-mono">B/ 100</text>
              <text x="15" y="164" fill="#64748b" className="text-[9px] font-mono">B/ 0</text>

              {/* SVG Area Path & Line */}
              {(() => {
                const maxVal = Math.max(...dailyTrend.map(d => d.value), 300);
                const points = dailyTrend.map((d, idx) => {
                  const x = 50 + idx * 70;
                  // Map value to scale (0 - 160 offset with 160 on bottom, 20 on top)
                  const ratio = d.value / maxVal;
                  const y = 160 - (ratio * 130);
                  return { x, y, label: d.label, val: d.value, count: d.count };
                });

                const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ");
                const areaPath = points.length > 0 
                  ? `${linePath} L ${points[points.length - 1].x} 160 L ${points[0].x} 160 Z`
                  : "";

                return (
                  <>
                    {/* Shadow Area */}
                    {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}
                    
                    {/* Amber Line */}
                    {linePath && <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

                    {/* Circles on trend points */}
                    {points.map((p, idx) => (
                      <g 
                        key={idx} 
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="cursor-pointer"
                      >
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r={hoveredIndex === idx ? 7 : 4} 
                          fill="#ffffff" 
                          stroke="#f59e0b" 
                          strokeWidth="2.5" 
                          className="transition-all duration-150"
                        />
                        {/* Text values */}
                        <text 
                          x={p.x} 
                          y="182" 
                          fill="#64748b" 
                          textAnchor="middle" 
                          className="text-[9px] font-sans font-semibold"
                        >
                          {p.label}
                        </text>

                        {/* Interactive tooltip floating right inside the SVG element */}
                        {hoveredIndex === idx && (
                          <g xmlSpace="preserve">
                            <rect 
                              x={p.x - 55} 
                              y={p.y - 45} 
                              width="110" 
                              height="35" 
                              rx="6" 
                              fill="#0f172a" 
                              stroke="#1e293b" 
                              strokeWidth="1"
                            />
                            <text x={p.x} y={p.y - 32} fill="#ffffff" textAnchor="middle" className="text-[8.5px] font-sans font-bold">
                              B/. {p.val.toFixed(2)}
                            </text>
                            <text x={p.x} y={p.y - 20} fill="#f59e0b" textAnchor="middle" className="text-[7.5px] font-mono">
                              {p.count} asists.
                            </text>
                          </g>
                        )}
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* TOP MOTORIZADOS Y MÁXIMOS RENDIMIENTOS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4.5 w-4.5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 font-sans">
                Top Conductoras y Conductores
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-sans mb-4">
              Rango de producción acumulado este mes
            </p>

            <div className="space-y-4">
              {topMotorizados.map((moto, i) => {
                // Determine percentage scaling based on maximum possible amount
                const maxAmount = Math.max(...topMotorizados.map(m => m.total_facturado), 1);
                const pct = Math.min(100, Math.round((moto.total_facturado / maxAmount) * 100));
                
                return (
                  <div key={moto.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs justify-items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 font-bold h-5 w-5 rounded-full flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="font-semibold text-slate-800">{moto.nombre}</span>
                      </div>
                      <span className="font-bold text-slate-800 font-mono">
                        B/. {moto.total_facturado.toFixed(2)}
                      </span>
                    </div>
                    
                    {/* Simple Custom Bar Graphic */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${pct}%` }} 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          i === 0 ? 'bg-navi-900' : i === 1 ? 'bg-amber-500' : 'bg-slate-300'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}

              {topMotorizados.length === 0 && (
                <p className="text-xs text-slate-450 text-center py-8 font-sans italic">
                  No hay motorizados registrados vigentes todavía.
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans mt-4">
            <span>Actualización Automática</span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-duration-1000"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold">LIVE SYNC</span>
            </div>
          </div>

        </div>

      </div>

      {/* 3. OPERATIONAL DISTRIBUTION STATS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 font-sans mb-4">
          Distribución de Formas de Pago
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Efectivo", "Tarjeta de Crédito", "Transferencia ACH", "Tarjeta de Débito"].map(metodo => {
            const count = asistencias.filter(a => a.forma_pago === metodo).length;
            const pct = asistencias.length > 0 ? Math.round((count / asistencias.length) * 100) : 0;
            return (
              <div key={metodo} className="bg-slate-50 border border-slate-150 p-4 rounded-xl">
                <span className="text-[11px] text-slate-500 font-bold block">{metodo}</span>
                <span className="text-xl font-extrabold text-slate-900 block mt-1">{count} <span className="text-xs font-normal text-slate-400">tickets</span></span>
                <div className="w-full bg-slate-200 h-1 rounded-full mt-2.5">
                  <div style={{ width: `${pct}%` }} className="bg-navi-800 h-full rounded-full" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
