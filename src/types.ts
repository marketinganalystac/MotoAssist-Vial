export interface Motorizado {
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

export interface Asistencia {
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
  imagen_original: string; // base64 string or URI
  imagen_procesada: string; // base64 string or URI
  ocr_json: any; // Complete JSON response
  created_at: string;
}
