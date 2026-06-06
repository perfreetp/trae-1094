export interface UserInfo {
  id: string;
  name: string;
  phone: string;
  role: 'owner' | 'visitor' | 'property';
  building?: string;
  room?: string;
}

export interface InviteInfo {
  id: string;
  inviteCode: string;
  ownerId: string;
  ownerName: string;
  visitorName: string;
  visitorPhone: string;
  plateNumber: string;
  building: string;
  room: string;
  visitStartTime: string;
  visitEndTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'entered' | 'exited' | 'expired';
  parkingSpot?: string;
  createTime: string;
  approveTime?: string;
  enterTime?: string;
  exitTime?: string;
  parkingFee?: number;
  isBlacklist?: boolean;
  remark?: string;
  autoApprove?: boolean;
}

export interface VehicleInfo {
  id: string;
  plateNumber: string;
  ownerName: string;
  ownerPhone: string;
  type: 'temporary' | 'fixed';
  createTime: string;
  lastVisitTime?: string;
  visitCount: number;
  isBlacklist: boolean;
  blacklistReason?: string;
}

export interface MessageInfo {
  id: string;
  type: 'system' | 'entry' | 'timeout' | 'approve' | 'fee';
  title: string;
  content: string;
  isRead: boolean;
  createTime: string;
  relatedId?: string;
}

export interface ParkingRecord {
  id: string;
  plateNumber: string;
  visitorName: string;
  enterTime: string;
  exitTime?: string;
  parkingSpot: string;
  duration?: number;
  fee: number;
  status: 'parking' | 'exited' | 'paid';
  building: string;
  room: string;
}

export interface FeedbackInfo {
  id: string;
  userId: string;
  userName: string;
  type: string;
  content: string;
  images?: string[];
  status: 'pending' | 'processing' | 'resolved';
  createTime: string;
  reply?: string;
  replyTime?: string;
  contact?: string;
}
