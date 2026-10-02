export interface NotificationResponse {
  id: number;
  applicationId: number;
  /** application.created | approved | rejected | no_show | rescheduled | cancelled | completed */
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  unread: number;
}
