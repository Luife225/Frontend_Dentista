import { apiClient } from "./apiClient"

export interface CashPayment {
  id: string
  cargoId: string
  importe: number
  medio: string
  referencia?: string
  anulado: boolean
  motivoAnulacion?: string
  creadoPorId: string
  fechaCreacion: string
}
export interface CashCharge {
  id: string
  pacienteId: string
  pacienteNombre: string
  citaId?: string
  concepto: string
  importe: number
  pagado: number
  saldo: number
  estado: string
  moneda: string
  motivoAnulacion?: string
  fechaCreacion: string
  pagos: CashPayment[]
}
export interface InventoryItem {
  id: string
  codigo?: string
  nombre: string
  categoria: string
  presentacion?: "UNIDAD" | "CAJA" | "ENVASE" | string
  unidad: string
  clasificacion?: "CONSUMIBLE" | "REUTILIZABLE" | string
  contenidoDescriptivo?: string
  stock: number
  stockCerrado?: number
  stockEnUso?: number
  stockMinimo: number
  costoUnitario: number
  proveedor?: string
  activo: boolean
  stockBajo: boolean
}
export interface InventoryMovement {
  id: string
  insumoId: string
  tipo: string
  cantidad: number
  estadoOrigen?: string
  estadoDestino?: string
  stockAnterior: number
  stockResultante: number
  stockCerradoAnterior?: number
  stockCerradoResultante?: number
  stockEnUsoAnterior?: number
  stockEnUsoResultante?: number
  motivo: string
  creadoPorId: string
  fechaCreacion: string
}
export interface CatalogRowDto {
  codigo?: string
  descripcion: string
  unidadMedida?: string
  precioReferencial?: number
  familia?: string
}

export interface CatalogRowAnalysis {
  fila: number
  codigo: string
  descripcion: string
  unidadMedida: string
  familia: string
  precioReferencial: number
  tipoDetectado: "INSUMO_FISICO" | "SERVICIO_PROCEDIMIENTO"
  presentacionSugerida: "UNIDAD" | "CAJA" | "ENVASE"
  unidadSugerida: string
  clasificacionSugerida: "CONSUMIBLE" | "REUTILIZABLE"
  contenidoDescriptivoSugerido: string
  categoriaSugerida: string
  observacion: string
  importable: boolean
  existenteEnInventario: boolean
  insumoExistenteId?: string
}

export interface CatalogPreviewResponse {
  loteId: string
  totalFilas: number
  filasImportables: number
  filasServiciosOmitidas: number
  filasExistentes: number
  filas: CatalogRowAnalysis[]
  advertencias: string[]
}

export interface CatalogConfirmItem {
  codigo?: string
  nombre: string
  categoria: string
  presentacion: string
  unidad: string
  clasificacion: string
  contenidoDescriptivo?: string
  stockCerradoInicial: number
  stockEnUsoInicial: number
  stockMinimo: number
  costoUnitario?: number
  proveedor?: string
}

export interface CatalogConfirmResponse {
  loteId: string
  itemsRegistrados: number
  itemsOmitidos: number
  mensaje: string
}

export const listCharges = () => apiClient<CashCharge[]>("/caja/cargos")
export const createCharge = (data: {
  pacienteId: string
  citaId?: string
  concepto: string
  importe: string
  solicitudId: string
}) =>
  apiClient<CashCharge>("/caja/cargos", {
    method: "POST",
    body: JSON.stringify(data),
  })
export const payCharge = (
  id: string,
  data: {
    importe: string
    medio: string
    referencia?: string
    solicitudId: string
  },
) =>
  apiClient<CashCharge>(`/caja/cargos/${id}/pagos`, {
    method: "POST",
    body: JSON.stringify(data),
  })
export const voidCharge = (id: string, motivo: string) =>
  apiClient<CashCharge>(`/caja/cargos/${id}/anular`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  })
export const voidPayment = (id: string, motivo: string) =>
  apiClient<CashCharge>(`/caja/pagos/${id}/anular`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  })
export const listItems = () => apiClient<InventoryItem[]>("/inventario/insumos")
export const saveItem = (
  data: Partial<InventoryItem>,
  id?: string,
) =>
  apiClient<InventoryItem>(`/inventario/insumos${id ? `/${id}` : ""}`, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(data),
  })
export const moveItem = (
  id: string,
  data: {
    tipo: string
    cantidad: number
    estadoOrigen?: string
    estadoDestino?: string
    motivo: string
    solicitudId: string
  },
) =>
  apiClient<InventoryItem>(`/inventario/insumos/${id}/movimientos`, {
    method: "POST",
    body: JSON.stringify(data),
  })
export const getItemHistory = (id: string) =>
  apiClient<InventoryMovement[]>(`/inventario/insumos/${id}/movimientos`)

export const previewCatalog = (data: { filas: CatalogRowDto[]; origen?: string }) =>
  apiClient<CatalogPreviewResponse>("/inventario/catalogo/previsualizar", {
    method: "POST",
    body: JSON.stringify(data),
  })

export const confirmCatalog = (data: {
  loteId: string
  items: CatalogConfirmItem[]
  solicitudId: string
}) =>
  apiClient<CatalogConfirmResponse>("/inventario/catalogo/confirmar", {
    method: "POST",
    body: JSON.stringify(data),
  })
