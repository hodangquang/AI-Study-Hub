// Types for Notification APIs

export type NotificationType =
  | 'share_received'
  | 'ai_ready'
  | 'ai_failed'
  | 'extract_ready'
  | 'extract_failed'
  | 'storage_warning'
  | 'solution_updated'
  | 'recycle_auto_delete'
  | 'system'

export type NotificationPriority = 'low' | 'normal' | 'high'
export type NotificationRefEntity = 'solution' | 'session' | 'account'
export type NotificationTarget = 'all' | 'recipientIds'

// ── User notification ────────────────────────────────
export interface UserNotification {
  _id: string
  recipientId: string
  senderId: string
  sourceEventId: string
  type: NotificationType
  title: string
  body: string
  refEntity: NotificationRefEntity
  refEntityId?: string
  actionUrl: string
  isRead: boolean
  readAt?: string
  priority: NotificationPriority
  createdAt: string
}

export interface UserNotificationsMeta {
  unreadCount: number
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface GetMyNotificationsResponse {
  message: string
  data: UserNotification[]
  meta: UserNotificationsMeta
}

export interface MarkReadResponse {
  message: string
  data: {
    _id: string
    isRead: boolean
    readAt: string
  }
}

// ── Admin send notification ──────────────────────────
export interface SendNotificationRequest {
  title: string
  body: string
  type: NotificationType
  priority?: NotificationPriority
  target: NotificationTarget
  recipientIds?: string[]
  refEntity?: NotificationRefEntity
  refEntityId?: string
  actionUrl?: string
  sendEmail?: boolean
}

export interface SendNotificationResponse {
  message: string
  data: {
    sourceEventId: string
    title: string
    type: NotificationType
    target: NotificationTarget
    recipientCount: number
    sentAt: string
  }
}

// ── Admin notification history ───────────────────────
export interface AdminNotificationGroup {
  _id: string
  sourceEventId: string
  title: string
  body: string
  type: NotificationType
  priority: NotificationPriority
  recipientCount: number
  readCount: number
  sentAt: string
  senderId: string
}

export interface AdminNotificationsResponse {
  message: string
  data: AdminNotificationGroup[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
