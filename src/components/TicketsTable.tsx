import { useState, useMemo } from "react";
import { Asistencia, Motorizado } from "../types";
import { 
  FileSpreadsheet, 
  Search, 
  MapPin, 
  User, 
  DollarSign, 
  Filter, 
  Eye, 
  Calendar, 
  Layers, 
  X, 
  ChevronRight, 
  Tags,
  CheckCircle2,
  FileText,
  Clock,
  Briefcase,
  Trash2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface TicketsTableProps {
  asistencias: Asistencia[];
  motorizados: Motorizado[];
  onDeleteAsistencia?: (id: string) => void;
}

export default function TicketsTable({ asistencias, motorizados, onDeleteAsistencia }: TicketsTableProps) {
  // Query Filters State
  const [filterCliente, setFilterCliente] = useState<string>("");
  const [filterEstado, setFilterEstado] = useState<string>("TODOS");
  const [filterMotorizado, setFilterMotorizado] = useState<string>("TODOS");
  const [filterFechaInicio, setFilterFechaInicio] = useState<string>("");
  const [filterFechaFin, setFilterFechaFin] = useState<string>("");

  // Inspect detail popup state
  const [selectedTicket, setSelectedTicket] = useState<Asistencia | null>(null);
  const [showOriginalImage, setShowOriginalImage] = useState<boolean>(false);

  // Custom delete state
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null);

  // Filter computation
  const filteredAsistencias = useMemo(() => {
    return asistencias.filter(item => {
      // 1. Client search (partial ignore case)
      if (filterCliente.trim() && !item.cliente.toLowerCase().includes(filterCliente.toLowerCase()) && !item.numero_factura.toLowerCase().includes(filterCliente.toLowerCase())) {
        return false;
      }
      
      // 2. Status check
      if (filterEstado !== "TODOS" && item.estado !== filterEstado) {
        return false;
      }

      // 3. Motorizado assignee
      if (filterMotorizado !== "TODOS" && item.motorizado_id !== filterMotorizado) {
        return false;
      }

      // 4. Start date boundary
      if (filterFechaInicio && item.fecha < filterFechaInicio) {
        return false;
      }

      // 5. End date boundary
      if (filterFechaFin && item.fecha > filterFechaFin) {
        return false;
      }

      return true;
    });
  }, [asistencias, filterCliente, filterEstado, filterMotorizado, filterFechaInicio, filterFechaFin]);

  // Export filtered data as a beautifully matching Excel-ready CSV
  const handleExportExcel = () => {
    // UTF-8 BOM byte array so Excel interprets Spanish accents (ñ, í, ó) correctly
    const headers = [
      "ID",
      "Fecha de Emision",
      "Hora de Emision",
      "Numero de Factura",
      "Cliente Razon Social",
      "Ruc Cliente",
      "Telefono Cliente",
      "Direccion Fiscal Cliente",
      "Observacion Operativa (Comentario)",
      "Ubicacion de Servicio Vial",
      "Vendedor o Cajero",
      "Forma de Pago",
      "Descripcion Tecnica del Servicio",
      "Producto / Repuesto Facturado",
      "Subtotal Neto",
      "ITBMS (Cargos)",
      "Total Factura",
      "Estado del Ticket",
      "ID Conductor Motorizado",
      "Nombre Conductor Motorizado",
      "Fecha de Creacion Registro",
      "Tiene Imagen Original",
      "Tiene Imagen Procesada"
    ];

    const rows = filteredAsistencias.map(item => {
      const motoName = motorizados.find(m => m.id === item.motorizado_id)?.nombre || "Desconocido";
      return [
        item.id,
        item.fecha,
        item.hora,
        `"${item.numero_factura}"`,
        `"${item.cliente.replace(/"/g, '""')}"`,
        `"${item.ruc_cliente}"`,
        `"${item.telefono}"`,
        `"${item.direccion.replace(/"/g, '""')}"`,
        `"${item.comentario.replace(/"/g, '""')}"`,
        `"${item.ubicacion_servicio.replace(/"/g, '""')}"`,
        `"${item.vendedor}"`,
        `"${item.forma_pago}"`,
        `"${(item.descripcion_servicio || "").replace(/"/g, '""')}"`,
        `"${(item.descripcion_producto || "").replace(/"/g, '""')}"`,
        item.subtotal,
        item.itbms,
        item.total,
        item.estado,
        `"${item.motorizado_id}"`,
        `"${motoName}"`,
        item.created_at,
        `"${item.imagen_original ? "SI" : "NO"}"`,
        `"${item.imagen_procesada ? "SI" : "NO"}"`
      ];
    });

    const csvContent = 
      "\uFEFF" + 
      [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_asistencias_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="panel-tickets" className="space-y-6 animate-fade-in">
      
      {/* FILTER BUILDER GROUP */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
        
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Filter className="h-4.5 w-4.5 text-amber-500" />
          <h4 className="text-sm font-bold text-slate-900 font-sans">
            Filtros Avanzados y Reportes
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
          {/* Cliente o Factura */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Búsqueda rápida</label>
            <div className="relative">
              <input 
                type="text" 
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 pl-9 pr-3.5 py-2.5 rounded-xl text-xs font-sans focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Cliente o N° factura..."
              />
              <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Motorizado */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Conductor</label>
            <select
              value={filterMotorizado}
              onChange={(e) => setFilterMotorizado(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl text-xs font-sans focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="TODOS">Todos los motorizados</option>
              {motorizados.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Estado del Ticket</label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl text-xs font-sans focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="Completado">Completados</option>
              <option value="Pendiente">Pendientes de Validación</option>
            </select>
          </div>

          {/* Rango Inicial */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Fecha Inicial</label>
            <input 
              type="date"
              value={filterFechaInicio}
              onChange={(e) => setFilterFechaInicio(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl text-xs font-mono focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Rango Final */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Fecha Final</label>
            <input 
              type="date"
              value={filterFechaFin}
              onChange={(e) => setFilterFechaFin(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl text-xs font-mono focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

        </div>

        {/* EXCEL EXPORT TRIGGER BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-100 gap-4">
          <p className="text-xs text-slate-500 font-sans">
            Mostrando <span className="text-slate-800 font-bold">{filteredAsistencias.length}</span> asistencias viales que coinciden con los filtros
          </p>
          <button
            id="btn-export-excel"
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="h-4.5 w-4.5" />
            <span>Exportar reporte a Excel (CSV)</span>
          </button>
        </div>

      </div>

      {/* CORE DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-5 py-4 text-xs font-sans uppercase tracking-wider text-slate-500 font-bold">Fecha</th>
                <th className="px-5 py-4 text-xs font-sans uppercase tracking-wider text-slate-500 font-bold">Factura</th>
                <th className="px-5 py-4 text-xs font-sans uppercase tracking-wider text-slate-500 font-bold">Cliente</th>
                <th className="px-5 py-4 text-xs font-sans uppercase tracking-wider text-slate-500 font-bold">Comentario / Destino</th>
                <th className="px-5 py-4 text-xs font-sans uppercase tracking-wider text-slate-500 font-bold">Motorizado</th>
                <th className="px-5 py-4 text-xs font-sans uppercase tracking-wider text-slate-500 font-bold">Estado</th>
                <th className="px-5 py-4 text-xs font-sans uppercase tracking-wider text-slate-500 font-bold text-right">Monto Total</th>
                <th className="px-5 py-4 text-xs font-sans uppercase tracking-wider text-slate-500 font-bold text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-750 font-sans">
              {filteredAsistencias.map(item => {
                const motoObj = motorizados.find(m => m.id === item.motorizado_id);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{item.fecha}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.hora || "00:00"}</div>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-amber-600 whitespace-nowrap">
                      {item.numero_factura}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800 line-clamp-1">{item.cliente}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.ruc_cliente || "Sin RUC"}</div>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="line-clamp-2 text-slate-500 leading-relaxed">
                        {item.comentario || item.descripcion_servicio || "Sin comentarios ingresados"}
                      </p>
                      {item.descripcion_producto && (
                        <div className="mt-1 flex items-center">
                          <span className="bg-amber-50 text-amber-700 font-semibold border border-amber-100 text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <Tags className="h-3 w-3 text-amber-600 flex-shrink-0" />
                            <span>Contenido: {item.descripcion_producto}</span>
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-700 whitespace-nowrap text-xs">
                      {motoObj ? motoObj.nombre : "Desconocido"}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.estado === "Completado" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${item.estado === "Completado" ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {item.estado === "Completado" ? "Completado" : "Por Verificar"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-extrabold text-slate-900 text-right whitespace-nowrap">
                      B/. {(item.total || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          id={`btn-open-ticket-${item.id}`}
                          onClick={() => {
                            setSelectedTicket(item);
                            setShowOriginalImage(false);
                          }}
                          className="p-1 px-3 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg transition-colors border border-slate-200 inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
                        >
                          <Eye className="h-4 w-4 text-slate-400" />
                          <span>Ver</span>
                        </button>
                        {onDeleteAsistencia && (
                          <button
                            id={`btn-delete-ticket-${item.id}`}
                            onClick={() => setDeletingTicketId(item.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition-all border border-rose-100 inline-flex items-center cursor-pointer"
                            title="Eliminar asistencia"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAsistencias.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 italic">
                    Ninguna asistencia cumple con los parámetros de búsqueda configurados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL TICKET DETAILS INSPECT DIALOG (SLIDEOUT DRAWER / POPUP) */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className={`bg-white border border-slate-200 rounded-3xl ${selectedTicket.imagen_original ? "max-w-5xl" : "max-w-3xl"} w-full p-6 shadow-2xl relative my-8 text-slate-800`}>
            
            {/* Close */}
            <button
              id="btn-close-ticket-modal"
              onClick={() => setSelectedTicket(null)}
              className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-full transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Modal Heading */}
            <div className="border-b border-slate-100 pb-4 pr-10">
              <span className="text-[10px] font-mono tracking-widest text-amber-700 uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50">
                Auditoría Contable de Asistencia Vial
              </span>
              <h3 className="text-xl font-bold text-slate-900 font-sans mt-2">
                Ticket Digital #{selectedTicket.id}
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Información extraída de la factura y guardada permanentemente
              </p>
            </div>

            {/* Ticket body elements */}
            <div className="mt-6 max-h-[500px] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: All Audit Details */}
              <div className={`${selectedTicket.imagen_original ? "md:col-span-7" : "md:col-span-12"} space-y-6`}>
                
                {/* Upper grid for fields under details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Primary client details metadata */}
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-amber-600 font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4" /> DATOS DEL TICKET
                    </h4>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Razón Social:</span>
                        <span className="font-semibold text-slate-800 text-right">{selectedTicket.cliente}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">RUC Fiscal:</span>
                        <span className="font-mono text-slate-700 font-semibold">{selectedTicket.ruc_cliente || "Sin RUC"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Factura Asistencial:</span>
                        <span className="font-mono font-semibold text-amber-600">{selectedTicket.numero_factura}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Teléfono:</span>
                        <span className="font-mono text-slate-700">{selectedTicket.telefono || "Vacío"}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500 text-xs">
                        <span>Dirección Fiscal:</span>
                        <span className="text-right text-slate-700 font-semibold">{selectedTicket.direccion || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Asignación Operativa */}
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-amber-600 font-bold flex items-center gap-2">
                      <Briefcase className="h-4 w-4" /> ASIGNACIÓN OPERATIVA
                    </h4>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Asignado a:</span>
                        <span className="font-semibold text-slate-800">
                          {motorizados.find(m => m.id === selectedTicket.motorizado_id)?.nombre || "Desconocido"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Ubicación del Evento:</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1 text-[11px] text-right">
                          <MapPin className="h-3 w-3 text-rose-500" /> {selectedTicket.ubicacion_servicio || "No especificada"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Fecha de Registro:</span>
                        <span className="font-mono text-slate-700">{selectedTicket.fecha} {selectedTicket.hora}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row inside left panel: Financial and Descriptions */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Financials table */}
                  <div className="sm:col-span-5 space-y-2">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-amber-600 font-bold flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> TOTALES
                    </h4>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Subtotal:</span>
                        <span className="font-mono text-slate-700 font-bold">B/. {selectedTicket.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">ITBMS (7%):</span>
                        <span className="font-mono text-slate-700 font-bold">B/. {selectedTicket.itbms.toFixed(2)}</span>
                      </div>
                      <hr className="border-slate-200" />
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-800">Total:</span>
                        <span className="font-mono text-amber-600 font-extrabold">B/. {selectedTicket.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Descriptions details */}
                  <div className="sm:col-span-7 space-y-3">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-amber-600 font-bold flex items-center gap-2">
                      <Clock className="h-4 w-4" /> DESCRIPCIÓN TÉCNICA EXTRAÍDA
                    </h4>
                    <p className="text-[11px] bg-slate-50 p-3 rounded-xl text-slate-800 border border-slate-150 leading-relaxed font-semibold">
                      {selectedTicket.descripcion_servicio || "Sin detalles extraídos."}
                    </p>

                    {selectedTicket.descripcion_producto && (
                      <>
                        <h4 className="text-xs uppercase font-mono tracking-wider text-amber-600 font-bold flex items-center gap-2">
                          <Tags className="h-4 w-4" /> PRODUCTO / REPUESTO (HISTÓRICO)
                        </h4>
                        <p className="text-[11px] bg-slate-50 p-3 rounded-xl text-slate-800 border border-slate-150 leading-relaxed font-semibold">
                          {selectedTicket.descripcion_producto}
                        </p>
                      </>
                    )}

                    {selectedTicket.comentario && (
                      <p className="text-[11px] bg-slate-50 p-3 rounded-xl text-slate-600 border border-slate-200 leading-relaxed">
                        <strong>Comentarios:</strong> {selectedTicket.comentario}
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Original Invoice Scan Image (Direct view, no accordion required) */}
              {selectedTicket.imagen_original && (
                <div className="md:col-span-5 space-y-3">
                  <h4 className="text-xs uppercase font-mono tracking-wider text-amber-600 font-bold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" /> DOCUMENTO ORIGINAL ESCANEADO
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-3 flex flex-col items-center justify-center shadow-xs overflow-hidden h-[420px] relative group">
                    <img
                      src={selectedTicket.imagen_original}
                      alt="Factura Original Escaneada"
                      className="max-h-[380px] max-w-full rounded-2xl object-contain shadow-md transition-transform duration-300 hover:scale-[1.05] cursor-zoom-in"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-4 bg-slate-900/70 backdrop-blur-xs text-[10px] text-white font-sans font-medium px-3 py-1.5 rounded-full select-none pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      Pase el cursor para ampliar (Zoom)
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* RAW JSON METADATA ACCORDION */}
            <div className="mt-6 border-t border-slate-100 pt-6">
              <details className="group">
                <summary className="text-xs font-mono font-bold uppercase cursor-pointer text-slate-400 select-none hover:text-slate-700 flex justify-between items-center">
                  <span>Visualizar OCR JSON Completo (AI Payload)</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
                </summary>
                <div className="mt-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-600 font-mono text-[10px] whitespace-pre overflow-x-auto max-h-40 leading-relaxed">
                  {JSON.stringify(selectedTicket.ocr_json || selectedTicket, null, 2)}
                </div>
              </details>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              {onDeleteAsistencia && (
                <button
                  id="btn-delete-ticket-modal"
                  type="button"
                  onClick={() => {
                    setDeletingTicketId(selectedTicket.id);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer mr-auto"
                >
                  Eliminar Ticket
                </button>
              )}
              <button
                id="btn-print-audit"
                onClick={() => window.print()}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-xs rounded-xl font-bold transition-colors border border-slate-200 text-slate-700 cursor-pointer"
              >
                Imprimir Factura Auditada
              </button>
              <button
                id="btn-archive-close"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-navi-900 hover:bg-navi-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cerrar Auditoría
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CUSTOM REACTION-BASED DELETE CONFIRMATION DIALOG */}
      {deletingTicketId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-8 text-slate-800">
            <div className="flex gap-4 items-start">
              <div className="bg-rose-50 text-rose-600 p-3 rounded-full border border-rose-100 shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-950 font-sans">
                  ¿Eliminar Ticket Permanentemente?
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Esta acción es irreversible y borrará de inmediato el ticket <span className="font-bold text-slate-700 font-mono">{deletingTicketId}</span> de la base de datos de Firestore. Las estadísticas asociadas al conductor se recalcularán en tiempo real.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                id="btn-confirm-delete-cancel"
                onClick={() => setDeletingTicketId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-delete-execute"
                onClick={() => {
                  if (onDeleteAsistencia) {
                    onDeleteAsistencia(deletingTicketId);
                  }
                  setDeletingTicketId(null);
                  setSelectedTicket(null); // close detail modal if indeed it was open
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/10 active:scale-95 transition-all cursor-pointer"
              >
                Eliminar Registro
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
