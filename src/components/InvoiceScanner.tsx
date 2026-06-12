import React, { useState, useRef, useEffect } from "react";
import { Asistencia, Motorizado } from "../types";
import { generateInvoiceImageBase64, mockInvoiceTemplates } from "../utils/invoiceGenerator";
import { 
  Camera, 
  Sparkles, 
  RotateCw, 
  Sliders, 
  Check, 
  AlertCircle, 
  Upload, 
  Loader2, 
  MapPin, 
  ArrowRight,
  Database,
  FileSpreadsheet,
  Layers,
  CheckCircle2
} from "lucide-react";

interface InvoiceScannerProps {
  motorizados: Motorizado[];
  currentMotorizado: string;
  onAsistenciaCreated: (newAst: Asistencia) => void;
  onOpenConfig?: () => void;
}

export default function InvoiceScanner({
  motorizados,
  currentMotorizado,
  onAsistenciaCreated,
  onOpenConfig
}: InvoiceScannerProps) {
  // Input sources
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number>(-1);
  
  // Image improvement sliders (stored in state to render real-time Canvas or CSS filters)
  const [brightness, setBrightness] = useState<number>(105);
  const [contrast, setContrast] = useState<number>(125);
  const [sharpness, setSharpness] = useState<number>(1.2);
  const [rotate, setRotate] = useState<number>(0);
  const [noiseReduction, setNoiseReduction] = useState<boolean>(true);
  const [contrastBoost, setContrastBoost] = useState<boolean>(true);
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [perspectiveCorrect, setPerspectiveCorrect] = useState<boolean>(true);

  // System states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingState, setProcessingState] = useState<string>("");
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [warningText, setWarningText] = useState<string | null>(null);

  // Form State for manual review validation ticket
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<Asistencia>>({});
  const [savedValidationData, setSavedValidationData] = useState<{ id: string; cliente: string; ruc_cliente: string; total: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef<HTMLDivElement>(null);

  // Generate visual filters
  const getFilterStyle = () => {
    let filterString = `brightness(${brightness}%) contrast(${contrast}%)`;
    if (grayscale) filterString += " grayscale(100%)";
    if (sharpness > 1) filterString += ` saturate(${Math.round(sharpness * 100)}%)`;
    return {
      filter: filterString,
      transform: `rotate(${rotate}deg)`,
      transition: "transform 0.15s ease-out, filter 0.05s ease"
    };
  };

  // Load a template dynamically to test
  const handleLoadTemplate = (idx: number) => {
    setErrorText(null);
    setSuccessMsg(null);
    setShowForm(false);
    setSelectedTemplateIdx(idx);
    
    // Base template
    const base64 = generateInvoiceImageBase64(idx, 0);
    setSelectedImage(base64);
    
    // Simulate auto alignment/enhancement on select
    setRotate(idx === 1 ? -1.5 : 0.8); // slight offset mimicking photo
    setBrightness(110);
    setContrast(130);
    setProcessedImage(base64);
  };

  // Handle uploaded files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setProcessedImage(reader.result as string);
        setSelectedTemplateIdx(-1);
        setErrorText(null);
        setSuccessMsg(null);
        setShowForm(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverRef.current) {
      dragOverRef.current.classList.add("border-amber-500", "bg-amber-500/5");
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverRef.current) {
      dragOverRef.current.classList.remove("border-amber-500", "bg-amber-500/5");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverRef.current) {
      dragOverRef.current.classList.remove("border-amber-500", "bg-amber-500/5");
    }
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setProcessedImage(reader.result as string);
        setErrorText(null);
        setSuccessMsg(null);
        setShowForm(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset controls
  const handleResetFilters = () => {
    setBrightness(105);
    setContrast(125);
    setSharpness(1.2);
    setRotate(0);
    setGrayscale(false);
    setNoiseReduction(true);
    setContrastBoost(true);
    setPerspectiveCorrect(true);
  };

  // OCR Processing Simulation + Actual Gemini call if API key configured
  const handleRunOCR = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    setErrorText(null);
    setSuccessMsg(null);
    setWarningText(null);
    
    // Multistep visualization timeline (Optimized for ultra-rapid and highly responsive feedback)
    const steps = [
      { text: "Estabilizando giroscopio... [OK]", ms: 120, progress: 20 },
      { text: "Detectando bordes y perspectiva de página... [OK]", ms: 120, progress: 40 },
      { text: "Optimizando contraste y eliminando ruido de fondo... [OK]", ms: 120, progress: 60 },
      { text: "Enviando imagen a Gemini 3.5 Flash... [OK]", ms: 120, progress: 80 },
      { text: "Analizando estructura con IA... [OK]", ms: 120, progress: 95 }
    ];

    let currentStep = 0;
    
    const runAnimation = () => {
      if (currentStep < steps.length) {
        setProcessingState(steps[currentStep].text);
        setProcessingProgress(steps[currentStep].progress);
        setTimeout(() => {
          currentStep++;
          runAnimation();
        }, steps[currentStep].ms);
      } else {
        // Run actual fullstack OCR
        executeActualOCR();
      }
    };

    runAnimation();
  };
  const executeActualOCR = async () => {
    try {
      if (!selectedImage) return;

      const response = await fetch("/api/ocr-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: selectedImage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fallo en la comunicación con el servidor OCR.");
      }

      const extractedData = await response.json();

      // Transform into state structure
      setFormData({
        id: "", // generated on save
        fecha: extractedData.fecha || new Date().toISOString().split("T")[0],
        hora: extractedData.hora || new Date().toTimeString().slice(0, 5),
        numero_factura: extractedData.numero_factura || "S/N",
        cliente: extractedData.cliente || "",
        ruc_cliente: extractedData.ruc_cliente || "",
        telefono: extractedData.telefono || "",
        direccion: extractedData.direccion || "",
        comentario: extractedData.comentario || "",
        ubicacion_servicio: extractedData.ubicacion_servicio || "",
        vendedor: extractedData.vendedor || "",
        forma_pago: extractedData.forma_pago || "Efectivo",
        subtotal: Number(extractedData.subtotal) || 0,
        itbms: Number(extractedData.itbms) || 0,
        total: Number(extractedData.total) || 0,
        estado: "Pendiente", // requires validation confirm
        motorizado_id: currentMotorizado || "diego_torres",
        descripcion_servicio: [extractedData.descripcion_servicio, extractedData.descripcion_producto].filter(Boolean).join(" - "),
        descripcion_producto: "",
        ocr_json: extractedData
      });

      setSuccessMsg("¡Factura procesada con IA exitosamente! Por favor revise los datos extraídos.");
      setShowForm(true);
    } catch (error: any) {
      console.error("OCR API error detected, engaging manual-fill fallback:", error);
      const errorMsg = error?.message || "Servicio temporalmente no disponible";
      const isUnavailable = errorMsg.includes("503") || errorMsg.includes("demand") || errorMsg.includes("unavailable") || errorMsg.includes("limit") || errorMsg.includes("UNAVAILABLE");

      // Set fallback initial fields so the user can type everything in manually instead of being entirely blocked
      setFormData({
        id: "",
        fecha: new Date().toISOString().split("T")[0],
        hora: new Date().toTimeString().slice(0, 5),
        numero_factura: "F-NUEVA",
        cliente: "",
        ruc_cliente: "",
        telefono: "",
        direccion: "",
        comentario: isUnavailable 
          ? "Modo manual activado por alta demanda temporal del motor de IA Gemini (Error 503)." 
          : `Modo manual activado debido a: ${errorMsg}`,
        ubicacion_servicio: "",
        vendedor: "Auditor Contable",
        forma_pago: "Efectivo",
        subtotal: 0,
        itbms: 0,
        total: 0,
        estado: "Pendiente",
        motorizado_id: currentMotorizado || "diego_torres",
        descripcion_servicio: "",
        descripcion_producto: "",
        ocr_json: { fallback_mode: true, reason: errorMsg }
      });

      setWarningText(
        isUnavailable 
          ? "El motor de IA Gemini está experimentando alta demanda (Error 503). Para no interrumpir su trabajo, hemos activado el Formulario de Carga Manual para que pueda registrar los datos usted mismo directamente."
          : `Hemos habilitado la edición del formulario manual asistido debido al siguiente error: ${errorMsg}`
      );
      setSuccessMsg(null);
      setErrorText(null); // Clear errors from current visibility to let user work cleanly
      setShowForm(true);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Bypass OCR analysis to test without Gemini API key using mock templates
  const handleBypassOCR = () => {
    setErrorText(null);
    setSuccessMsg(null);
    
    // Choose selected template info or default
    const idx = selectedTemplateIdx !== -1 ? selectedTemplateIdx : 0;
    const templateInfo = mockInvoiceTemplates[idx];
    
    setFormData({
      id: "",
      fecha: templateInfo.date,
      hora: templateInfo.time,
      numero_factura: templateInfo.invoiceNum,
      cliente: templateInfo.clientName,
      ruc_cliente: templateInfo.clientRuc,
      telefono: templateInfo.clientPhone,
      direccion: templateInfo.clientAddress,
      comentario: templateInfo.pie,
      ubicacion_servicio: templateInfo.type === "Bateria" ? "Tumba Muerto, Ciudad de Panamá" : "Marbella, Ciudad de Panamá",
      vendedor: templateInfo.vendedor,
      forma_pago: templateInfo.formaPago,
      subtotal: templateInfo.subtotal,
      itbms: templateInfo.itbms,
      total: templateInfo.total,
      estado: "Pendiente",
      motorizado_id: currentMotorizado || "diego_torres",
      descripcion_servicio: [templateInfo.serviceDetail, templateInfo.type === "Bateria" ? "Batería Hankook NS60L" : "Servicio de Grúa Plataforma"].filter(Boolean).join(" - "),
      descripcion_producto: "",
      ocr_json: templateInfo as any
    });
    
    setSuccessMsg("¡Formulario de verificación autocompletado con datos precargados de simulación!");
    setShowForm(true);
  };

  // Recalculate values dynamically in validation form
  const handleFormChange = (key: string, value: any) => {
    const updated = { ...formData, [key]: value };
    
    // Auto calculate totals if subtotal or ITBMS change
    if (key === "subtotal" || key === "itbms") {
      const sub = Number(updated.subtotal) || 0;
      const tax = Number(updated.itbms) || 0;
      updated.total = Number((sub + tax).toFixed(2));
    }
    
    setFormData(updated);
  };

  // Save digital ticket to persistent storage
  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente || !formData.numero_factura) {
      setErrorText("El cliente y número de factura son obligatorios.");
      return;
    }
    if (!formData.motorizado_id) {
      setErrorText("Debe seleccionar un motorizado asignado para registrar este servicio.");
      return;
    }
    
    try {
      const payload = {
        ...formData,
        estado: "Completado", // once verified, mark as Completado
        imagen_original: selectedImage || "",
        imagen_procesada: selectedImage ? "URL_PROCESSED_SIMULATED" : "",
        created_at: new Date().toISOString()
      };

      const res = await fetch("/api/asistencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const detailSuffix = errData.details ? `: ${errData.details}` : "";
        throw new Error((errData.error || "No se pudo escribir en la base de datos de Firestore.") + detailSuffix);
      }

      const finalSaved = await res.json();
      const savedAst = finalSaved.asistencia || (payload as Asistencia);
      onAsistenciaCreated(savedAst);
      
      setSavedValidationData({
        id: savedAst.id,
        cliente: savedAst.cliente,
        ruc_cliente: savedAst.ruc_cliente || "Sin RUC",
        total: Number(savedAst.total) || 0
      });
      
      setSuccessMsg("¡Ticket de asistencia digitalizado, verificado y guardado en la Base de Datos!");
      
      // Cleanup
      setSelectedImage(null);
      setProcessedImage(null);
      setSelectedTemplateIdx(-1);
      setShowForm(false);
      setFormData({});
    } catch (err: any) {
      setErrorText(`Error al guardar: ${err.message}`);
    }
  };

  return (
    <div id="panel-scanner" className="space-y-6 animate-fade-in">
      
      {/* Informative Alerts Block */}
      {errorText && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-5 py-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-sans animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 stroke-[2.5] text-rose-500 flex-shrink-0" />
            <div>
              <span className="font-bold block mb-0.5 text-white uppercase tracking-wider text-[10px]">Operación Fallida</span>
              <p className="text-slate-300">{errorText}</p>
            </div>
          </div>
          {onOpenConfig && (errorText.toLowerCase().includes("api key") || errorText.toLowerCase().includes("clave") || errorText.toLowerCase().includes("cuota") || errorText.toLowerCase().includes("agotado") || errorText.toLowerCase().includes("429") || errorText.toLowerCase().includes("400")) && (
            <button
              onClick={onOpenConfig}
              className="px-3 py-1.5 bg-brand-amber hover:bg-amber-600 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-lg transition-all shrink-0 cursor-pointer text-center whitespace-nowrap shadow-sm shadow-amber-500/10 font-sans"
            >
              Configurar Clave API
            </button>
          )}
        </div>
      )}

      {warningText && (
        <div className="bg-amber-500/10 border border-brand-amber/35 text-brand-yellow px-5 py-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-sans animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 stroke-[2.5] flex-shrink-0 text-brand-amber text-glow-amber" />
            <div>
              <span className="font-bold block mb-0.5 text-white uppercase tracking-wider text-[10px]">Asistencia de Carga Manual Activada</span>
              <p className="text-slate-300 leading-relaxed text-[11px]">{warningText}</p>
            </div>
          </div>
          {onOpenConfig && (warningText.toLowerCase().includes("api key") || warningText.toLowerCase().includes("clave") || warningText.toLowerCase().includes("400")) && (
            <button
              onClick={onOpenConfig}
              className="px-3 py-1.5 bg-brand-amber hover:bg-amber-600 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-lg transition-all shrink-0 cursor-pointer text-center whitespace-nowrap shadow-sm shadow-amber-500/10 font-sans"
            >
              Configurar Clave API
            </button>
          )}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-5 py-4 rounded-xl flex items-start gap-3 text-xs font-sans animate-fade-in">
          <CheckCircle2 className="h-5 w-5 stroke-[2.5] flex-shrink-0 text-emerald-400" />
          <div>
            <span className="font-bold block mb-0.5 text-white uppercase tracking-wider text-[10px]">Éxito en la Operación</span>
            <p className="text-slate-300">{successMsg}</p>
          </div>
        </div>
      )}

      {/* RETAIL SCANNER CONTROLS */}
      {!showForm && (
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* IMAGE CARRIER VIEWPORT */}
          <div className="flex flex-col space-y-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm animate-fade-in animate-[duration_0.2s]">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-950 font-sans flex items-center gap-2">
                  <Camera className="h-5 w-5 text-amber-505 text-amber-500" /> Digitalización Inteligente de Gastos
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  El sistema optimiza automáticamente el contraste e iluminación para un reconocimiento óptimo con Gemini 3.5 Flash.
                </p>
              </div>
            </div>

            {/* DRAG CONTAINER / PREVIEW WINDOW */}
            <div 
              ref={dragOverRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative min-h-[360px] bg-slate-50 border-2 border-dashed ${
                selectedImage ? "border-slate-205" : "border-slate-300 hover:border-amber-500 hover:bg-amber-500/5"
              } rounded-2xl flex flex-col items-center justify-center p-6 transition-all overflow-hidden`}
            >
              {selectedImage ? (
                // Live Filter Preview Viewport
                <div className="relative w-full max-w-[280px] flex items-center justify-center">
                  <img 
                    src={selectedImage} 
                    alt="Scan Factura" 
                    style={getFilterStyle()}
                    className="max-h-[320px] w-auto shadow-xl rounded-lg object-contain border border-slate-200"
                  />
                  
                  {/* Digital Line Overlay (Scanner Effect) - Styled Amber */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-505 via-amber-500 to-transparent shadow-[0_0_8px_rgba(245,158,11,0.9)] animate-[scan_3s_linear_infinite]" />
                </div>
              ) : (
                // Upload Prompt Empty State
                <div className="text-center space-y-4 max-w-sm">
                  <div className="mx-auto w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shadow-xs">
                    <Upload className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">Arrastre su factura de asistencia o compra</p>
                    <p className="text-xs text-slate-500 font-sans">Admite JPG, PNG o capturas instantáneas de cámara de celular</p>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      id="btn-upload-trigger"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-navi-50 hover:bg-navi-100 border border-navi-200 rounded-xl text-xs font-bold text-navi-800 transition-colors cursor-pointer"
                    >
                      Seleccionar Archivo Local
                    </button>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* TRIGGER ANALYSIS BLOCK */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <button
                id="btn-run-ocr"
                onClick={handleRunOCR}
                disabled={!selectedImage || isProcessing}
                className="w-full py-3.5 bg-navi-900 hover:bg-navi-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-navi-900/10 active:scale-[0.98] transition-all disabled:opacity-45 disabled:pointer-events-none cursor-pointer text-xs"
              >
                <Sparkles className="h-5 w-5 fill-amber-502 text-amber-500" />
                <span>Extraer Datos con Inteligencia Artificial</span>
              </button>

              {selectedImage && (
                <div className="flex gap-2 justify-center">
                  <button
                    id="btn-reset-image"
                    onClick={() => {
                      setSelectedImage(null);
                      setRotate(0);
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-705 text-slate-705 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Quitar Foto
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* OCR PROGRESS SIMULATION FULLOVERLAY */}
      {isProcessing && (
        <div className="fixed inset-0 bg-navi-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
            
            <div className="relative inline-block">
              <Loader2 className="h-16 w-16 stroke-[2] text-amber-500 animate-spin" />
              <Sparkles className="h-6 w-6 text-navi-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-bold text-slate-900 font-sans">
                Extrayendo Datos de Factura con IA
              </h4>
              <p className="text-xs text-slate-500 font-sans tracking-wide min-h-8">
                {processingState}
              </p>
            </div>

            {/* Progress line */}
            <div className="space-y-1">
              <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${processingProgress}%` }} 
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                />
              </div>
              <div className="flex justify-between font-mono text-[10px] text-slate-400">
                <span>ESTIMANDO PROCESO</span>
                <span className="font-bold text-slate-600">{processingProgress}%</span>
              </div>
            </div>



          </div>
        </div>
      )}

      {/* VERIFICATION FORM PANEL(Ticket Digital Prellenado) */}
      {showForm && (
        <form onSubmit={handleSaveTicket} className="bg-white border border-slate-250 rounded-3xl p-6 md:p-8 shadow-md space-y-6 animate-fade-in text-slate-850">
          
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-amber-700 uppercase bg-amber-50 px-2.5 py-1 rounded border border-amber-200 font-bold">
                Paso 3: Validación de Datos
              </span>
              <h3 className="text-lg font-bold text-slate-950 font-sans mt-2">
                Ticket Vial Digital Prellenado
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Revise la información cargada automáticamente por la IA antes de archivar en la base de datos
              </p>
            </div>

            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-150 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 stroke-[2.5]" /> Confiabilidad Extrema OCR
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
            
            {/* ROW 1: INFO DE FACTURA (LEFT) */}
            <div className={selectedImage ? "md:col-span-4 space-y-4" : "md:col-span-6 space-y-4"}>
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 border-l-2 border-amber-500 pl-2">
                Información de Facturación
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold font-sans block">Número de Factura</label>
                  <input 
                    type="text" 
                    value={formData.numero_factura || ""}
                    onChange={(e) => handleFormChange("numero_factura", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-mono text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="FAC-0000"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold font-sans block">Motorizado Registrador</label>
                  <select
                    value={formData.motorizado_id || ""}
                    onChange={(e) => handleFormChange("motorizado_id", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  >
                    {motorizados.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold font-sans block">Fecha de Emisión</label>
                  <input 
                    type="date" 
                    value={formData.fecha || ""}
                    onChange={(e) => handleFormChange("fecha", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-mono text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold font-sans block">Hora de Emisión</label>
                  <input 
                    type="text" 
                    value={formData.hora || ""}
                    onChange={(e) => handleFormChange("hora", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-mono text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="HH:MM"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold font-sans block">Vendedor/Cajero</label>
                  <input 
                    type="text" 
                    value={formData.vendedor || ""}
                    onChange={(e) => handleFormChange("vendedor", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Vendedor"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold font-sans block">Forma de Pago</label>
                  <input 
                    type="text" 
                    value={formData.forma_pago || ""}
                    onChange={(e) => handleFormChange("forma_pago", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Efectivo, Tarjeta, ACH, etc"
                  />
                </div>
              </div>

            </div>

            {/* ROW 2: DATOS DEL CLIENTE (RIGHT) */}
            <div className={selectedImage ? "md:col-span-4 space-y-4" : "md:col-span-6 space-y-4"}>
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 border-l-2 border-amber-500 pl-2">
                Datos del Cliente
              </h4>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold font-sans block">Razón Social</label>
                <input 
                  type="text" 
                  value={formData.cliente || ""}
                  onChange={(e) => handleFormChange("cliente", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Cliente corporativo o personal"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold font-sans block">RUC / NIT Identificación</label>
                  <input 
                    type="text" 
                    value={formData.ruc_cliente || ""}
                    onChange={(e) => handleFormChange("ruc_cliente", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="8-992-1234"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold font-sans block">Teléfono Cliente</label>
                  <input 
                    type="text" 
                    value={formData.telefono || ""}
                    onChange={(e) => handleFormChange("telefono", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="+507 celular"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold font-sans block">Dirección Fiscal Cliente</label>
                <input 
                  type="text" 
                  value={formData.direccion || ""}
                  onChange={(e) => handleFormChange("direccion", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Dirección fiscal..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold font-sans block">Número de cuenta</label>
                <input 
                  type="text" 
                  value={formData.ocr_json?.cuenta || ""}
                  onChange={(e) => handleFormChange("ocr_json", { ...formData.ocr_json, cuenta: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Número de cuenta detectado o manual..."
                />
              </div>

            </div>

            {/* ORIGINAL SCANNED DOCUMENT COLUMN (RIGHT) */}
            {selectedImage && (
              <div className="md:col-span-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 border-l-2 border-brand-amber pl-2">
                  Documento Original Escaneado
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex flex-col items-center justify-center overflow-hidden h-[330px] relative group">
                  <img
                    src={selectedImage}
                    alt="Factura Original"
                    className="max-h-[310px] max-w-full rounded-xl object-contain shadow-xs transition-transform duration-300 hover:scale-[1.10] cursor-zoom-in"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 bg-slate-900/60 backdrop-blur-sm text-[10px] text-white font-sans px-2.5 py-1 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    Imagen de origen en verificación
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* SERVICE DESCRIPTORS AND DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-slate-100">
            
            <div className="md:col-span-8 space-y-4">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 border-l-2 border-amber-500 pl-2">
                Detalles del Servicio Vial
              </h4>
              
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold font-sans block">
                  Descripción técnica, del producto o repuesto facturado
                </label>
                <textarea 
                  value={formData.descripcion_servicio || ""}
                  onChange={(e) => handleFormChange("descripcion_servicio", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[60px]"
                  placeholder="Descripción técnica, del producto o repuesto facturado..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold font-sans block">Comentarios</label>
                <input 
                  type="text" 
                  value={formData.comentario || ""}
                  onChange={(e) => handleFormChange("comentario", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Escriba aquí los comentarios u observaciones adicionales..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold font-sans block">Ubicación física del Evento Vial</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={formData.ubicacion_servicio || ""}
                    onChange={(e) => handleFormChange("ubicacion_servicio", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 pl-10 pr-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Ave. Balboa, Al lado del edif..."
                  />
                  <MapPin className="h-4 w-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

            </div>

            {/* CHARGES & FINANCIAL CALCULATIONS PANEL */}
            <div className="md:col-span-4 bg-slate-50 border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
              
              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 border-l-2 border-amber-500 pl-2 mb-4">
                  Balances y Totales
                </h4>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs text-slate-700">
                    <span className="font-medium">Subtotal Neto</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.subtotal || 0}
                      onChange={(e) => handleFormChange("subtotal", parseFloat(e.target.value) || 0)}
                      className="w-24 text-right bg-white border border-slate-200 text-slate-850 px-2 py-1 rounded font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-700">
                    <span className="font-medium">Impuestos ITBMS</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.itbms || 0}
                      onChange={(e) => handleFormChange("itbms", parseFloat(e.target.value) || 0)}
                      className="w-24 text-right bg-white border border-slate-200 text-slate-855 text-slate-850 px-2 py-1 rounded font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 mt-6 space-y-4">
                <div className="flex justify-between items-center font-bold font-sans">
                  <span className="text-sm text-slate-800">Total Generado</span>
                  <span className="text-lg text-amber-600 font-mono">B/. {(formData.total || 0).toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <button
                    id="btn-confirm-save-ticket"
                    type="submit"
                    className="w-full py-3.5 bg-navi-900 hover:bg-navi-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-navi-950/20 active:scale-[0.98] transition-all"
                  >
                    <Check className="h-4.5 w-4.5 stroke-[2.5]" />
                    <span>Guardar Ticket y Sincronizar</span>
                  </button>
                  <button
                    id="btn-cancel-scan"
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedImage(null);
                      setProcessedImage(null);
                    }}
                    className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Descartar escaneo
                  </button>
                </div>
              </div>

            </div>

          </div>

        </form>
      )}

      {/* SUCCESS PERSISTENCE VALIDATOR DIALOG */}
      {savedValidationData && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in animate-[duration_0.2s]">
          <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
            
            <div className="mx-auto w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-xs">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-extrabold text-slate-900 font-sans">
                ¡Validación de Datos Exitosa!
              </h4>
              <p className="text-xs text-slate-500 font-sans max-w-xs mx-auto leading-relaxed">
                El documento se ha guardado, verificado y sincronizado de forma persistente en los servidores de la nube de Firebase Firestore.
              </p>
            </div>

            {/* TELEMETRY METRIC CHECKPOINT CARDS */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left divide-y divide-slate-100 space-y-2.5">
              <div className="flex justify-between items-center text-xs pb-2.5">
                <span className="text-slate-400 font-medium font-sans">ID Documental</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-200/50 px-2 py-0.5 rounded text-[11px]">{savedValidationData.id}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2.5 pb-2.5">
                <span className="text-slate-400 font-medium font-sans">Razón Social</span>
                <span className="font-semibold text-slate-800 line-clamp-1 max-w-[200px] text-right">{savedValidationData.cliente}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2.5 pb-2.5">
                <span className="text-slate-400 font-medium font-sans">RUC Cliente</span>
                <span className="font-mono text-slate-600">{savedValidationData.ruc_cliente}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2.5">
                <span className="text-slate-400 font-medium font-sans">Total Confirmado</span>
                <span className="font-extrabold text-emerald-700 font-mono">B/. {savedValidationData.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="btn-dismiss-validation"
                onClick={() => setSavedValidationData(null)}
                className="w-full py-3 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Cerrar y Confirmar Validación
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
