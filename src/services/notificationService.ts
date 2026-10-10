import { apiClient } from './apiClient'

export interface NotificationDto {
  id: string
  tipoEvento: string
  titulo: string
  cuerpoMensaje: string
  estado: 'PENDIENTE' | 'ENVIADO' | 'LEIDO' | 'LEIDA'
  fechaCreacion: string
  fechaLectura?: string | null
}

export async function getMyNotifications(): Promise<NotificationDto[]> {
  return apiClient<NotificationDto[]>('/notifications')
}

export async function getUnreadCount(): Promise<{ unreadCount: number }> {
  return apiClient<{ unreadCount: number }>('/notifications/unread-count')
}

export async function markAsRead(id: string): Promise<NotificationDto> {
  return apiClient<NotificationDto>(`/notifications/${id}/read`, {
    method: 'PATCH',
  })
}

export async function markAllAsRead(): Promise<{ markedCount: number }> {
  return apiClient<{ markedCount: number }>('/notifications/read-all', {
    method: 'PATCH',
  })
}
