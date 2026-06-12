import React, { useState } from "react";
import { Motorizado } from "../types";
import { 
  Plus, 
  UserCheck, 
  Trash2, 
  UserX, 
  Phone, 
  TrendingUp, 
  Coins, 
  Calendar, 
  X,
  PlusCircle,
  Clock
} from "lucide-react";

interface MotorizadosCatalogProps {
  motorizados: Motorizado[];
  onAddMotorizado: (newMoto: Motorizado) => void;
  onDeleteMotorizado?: (id: string) => void;
}

export default function MotorizadosCatalog({ motorizados, onAddMotorizado, onDeleteMotorizado }: MotorizadosCatalogProps) {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newNombre, setNewNombre] = useState<string>("");
  const [newTelefono, setNewTelefono] = useState<string>("");
  const [newEstado, setNewEstado] = useState<string>("Activo");
  const [newFecha, setNewFecha] = useState<string>(new Date().toISOString().split("T")[0]);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    if (!newNombre.trim() || !newTelefono.trim()) {
      setErrorLocal("El nombre y teléfono son requeridos.");
      return;
    }

    const secureId = newNombre.toLowerCase().trim().replace(/\s+/g, "_") + "_" + Math.floor(Math.random() * 100);

    const newMoto: Motorizado = {
      id: secureId,
      nombre: newNombre.trim(),
      telefono: newTelefono.trim(),
      estado: newEstado,
      fecha_ingreso: newFecha,
      asistencias_realizadas: 0,
      total_facturado: 0,
      promedio_diario: 0,
      ultima_asistencia: "Ninguna"
    };

    try {
      const res = await fetch("/api/motorizados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMoto)
      });

      if (!res.ok) {
        throw new Error("No se pudo agregar el motorizado en el servidor.");
      }

      onAddMotorizado(newMoto);
      
      // Reset
      setNewNombre("");
      setNewTelefono("");
      setNewEstado("Activo");
      setNewFecha(new Date().toISOString().split("T")[0]);
      setShowAddModal(false);
    } catch (err: any) {
      setErrorLocal(`Error: ${err.message}`);
    }
  };

  return (
    <div id="panel-motorizados" className="space-y-6 animate-fade-in">
      
      {/* SECTION HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 font-sans">
            Catálogo y Desempeño de Motorizados
          </h3>
          <p className="text-xs text-slate-500 font-sans">
            Métricas de control, facturación y productividad por conductor de flota
          </p>
        </div>

        <button
          id="btn-add-motorizado-show"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-navi-900 hover:bg-navi-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-amber-500/5 animate-fade-in"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          <span>Registrar Nuevo Conductor</span>
        </button>
      </div>

      {/* DRIVERS GRID WITH STATISTICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {motorizados.map(item => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-amber-350 hover:shadow-md transition-all space-y-4">
            
            {/* NAME / STATE INDICATOR */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 leading-tight">{item.nombre}</h4>
                <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-slate-300" /> {item.telefono}
                </p>
              </div>

              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${
                item.estado === "Activo" 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                  : "bg-rose-50 text-rose-700 border border-rose-105"
              }`}>
                {item.estado === "Activo" ? "Activo" : "Retirado"}
              </span>
            </div>

            {/* PERFORMANCE METRICS */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Facturado</span>
                <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">B/. {item.total_facturado.toFixed(2)}</span>
              </div>

              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Asistencias</span>
                <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">{item.asistencias_realizadas} serv.</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Ingreso</span>
                <span className="text-xs font-semibold text-slate-600 mt-0.5 block">{item.fecha_ingreso}</span>
              </div>

              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Prom. diario</span>
                <span className="text-xs font-extrabold text-amber-600 mt-0.5 block">B/. {item.promedio_diario.toFixed(2)}</span>
              </div>
            </div>

            {/* ULTIMA ASISTENCIA STATUS & DELETE OPTION */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
              <div className="text-[10px] text-slate-500 font-sans flex items-center gap-1.5 truncate">
                <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="truncate">Último Ticket: {item.ultima_asistencia || "Ninguno"}</span>
              </div>
              {onDeleteMotorizado && (
                <button
                  type="button"
                  id={`btn-delete-motorizado-${item.id}`}
                  onClick={() => setDeleteConfirmId(item.id)}
                  className="p-1 px-2 border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                  title="Eliminar motorizado"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Quitar</span>
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* REGISTER NEW DRIVER POPUP MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-scale-up text-slate-800">
            
            <button
              id="btn-close-new-motorizado"
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-full transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-base font-bold text-slate-950 font-sans">
                Registrar Nuevo Operador
              </h4>
              <p className="text-xs text-slate-500 font-sans">
                Incorpore un conductor para asignarle incidencias viales
              </p>
            </div>

            {errorLocal && (
              <div className="bg-rose-50 text-rose-700 p-2.5 rounded-xl text-xs mb-3 font-sans border border-rose-100">
                {errorLocal}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 font-sans block">Nombre Completo</label>
                <input 
                  type="text"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                  placeholder="Ej. Roberto Martínez"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 font-sans block">Teléfono de Enlace</label>
                <input 
                  type="text"
                  value={newTelefono}
                  onChange={(e) => setNewTelefono(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                  placeholder="Ej. +507 6220-4139"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 font-sans block">Estado Inicial</label>
                  <select
                    value={newEstado}
                    onChange={(e) => setNewEstado(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 font-sans block">Fecha de Registro</label>
                  <input 
                    type="date"
                    value={newFecha}
                    onChange={(e) => setNewFecha(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3 py-2.5 rounded-xl text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6 overflow-hidden flex gap-3">
                <button
                  id="btn-add-motorizado-cancel"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs text-center transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-add-motorizado-confirm"
                  type="submit"
                  className="w-1/2 py-2.5 bg-navi-900 text-white font-bold rounded-xl hover:bg-navi-800 text-xs text-center transition-all cursor-pointer"
                >
                  Guardar Conductor
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CUSTOM REACTION-BASED DELETE CONFIRMATION DIALOG FOR MOTORIZADO */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative my-8 text-slate-800 animate-scale-up">
            <div className="flex gap-4 items-start">
              <div className="bg-rose-50 text-rose-600 p-3 rounded-full border border-rose-100 shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-950 font-sans">
                  ¿Eliminar Conductor?
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-sans mt-2">
                  Esta acción eliminará de inmediato al motorizado <strong className="text-slate-800">
                    {motorizados.find(m => m.id === deleteConfirmId)?.nombre || deleteConfirmId}
                  </strong> de la base de datos de Firestore. Las asistencias archivadas permanecerán integradas, pero no se podrán registrar nuevas asistencias con este conductor.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                id="btn-confirm-delete-moto-cancel"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-delete-moto-execute"
                onClick={async () => {
                  if (onDeleteMotorizado) {
                    await onDeleteMotorizado(deleteConfirmId);
                  }
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/10 active:scale-95 transition-all cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
