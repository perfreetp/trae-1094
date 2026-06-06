import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { InviteInfo, ParkingRecord, MessageInfo, FeedbackInfo, VehicleInfo } from '@/types';
import { mockInvites } from '@/data/invites';
import { mockParkingRecords, mockMessages, mockFeedbacks } from '@/data/records';
import { mockVehicles } from '@/data/vehicles';
import { generateInviteCode, generateParkingSpot, getStatusText } from '@/utils';

interface AppState {
  invites: InviteInfo[];
  parkingRecords: ParkingRecord[];
  messages: MessageInfo[];
  feedbacks: FeedbackInfo[];
  vehicles: VehicleInfo[];
  currentRole: 'owner' | 'visitor' | 'property';
}

interface AppContextType extends AppState {
  setCurrentRole: (role: 'owner' | 'visitor' | 'property') => void;
  createInvite: (data: Omit<InviteInfo, 'id' | 'inviteCode' | 'ownerId' | 'ownerName' | 'createTime' | 'status' | 'parkingSpot' | 'approveTime'> & { autoApprove: boolean }) => InviteInfo;
  approveInvite: (id: string, remark?: string) => void;
  rejectInvite: (id: string, reason: string) => void;
  addBlacklist: (plateNumber: string, reason: string) => void;
  confirmEntry: (inviteId: string) => boolean;
  calculateFee: (recordId: string) => number;
  reduceFee: (recordId: string, amount: number, reason: string) => void;
  payFee: (recordId: string) => void;
  addMessage: (message: Omit<MessageInfo, 'id' | 'createTime' | 'isRead'>) => void;
  markMessageRead: (id: string) => void;
  markAllMessagesRead: () => void;
  submitFeedback: (data: Omit<FeedbackInfo, 'id' | 'userId' | 'userName' | 'createTime' | 'status'>) => void;
  replyFeedback: (id: string, reply: string, status: 'processing' | 'resolved') => void;
  getUnreadMessageCount: () => number;
  getMyInvites: (ownerId?: string) => InviteInfo[];
  getRecordsByFilter: (filters: {
    plateNumber?: string;
    visitorName?: string;
    building?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
  }) => ParkingRecord[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [invites, setInvites] = useState<InviteInfo[]>(mockInvites);
  const [parkingRecords, setParkingRecords] = useState<ParkingRecord[]>(mockParkingRecords);
  const [messages, setMessages] = useState<MessageInfo[]>(mockMessages);
  const [feedbacks, setFeedbacks] = useState<FeedbackInfo[]>(mockFeedbacks);
  const [vehicles, setVehicles] = useState<VehicleInfo[]>(mockVehicles);
  const [currentRole, setCurrentRole] = useState<'owner' | 'visitor' | 'property'>('owner');

  const addMessage = (message: Omit<MessageInfo, 'id' | 'createTime' | 'isRead'>) => {
    const newMessage: MessageInfo = {
      ...message,
      id: String(Date.now()),
      createTime: new Date().toISOString(),
      isRead: false
    };
    setMessages(prev => [newMessage, ...prev]);
  };

  const createInvite: AppContextType['createInvite'] = (data) => {
    const isBlacklist = vehicles.some(v => v.plateNumber === data.plateNumber && v.isBlacklist);
    const isFrequentVisitor = vehicles.some(v => v.plateNumber === data.plateNumber && v.visitCount >= 3);
    
    let status: InviteInfo['status'] = 'pending';
    let approveTime: string | undefined = undefined;
    let parkingSpot: string | undefined = undefined;
    
    if (data.autoApprove && !isBlacklist) {
      status = 'approved';
      approveTime = new Date().toISOString();
      parkingSpot = generateParkingSpot();
    }

    const newInvite: InviteInfo = {
      id: String(Date.now()),
      inviteCode: generateInviteCode(),
      ownerId: 'o1',
      ownerName: '张先生',
      ...data,
      status,
      parkingSpot,
      createTime: new Date().toISOString(),
      approveTime
    };

    setInvites(prev => [newInvite, ...prev]);

    if (status === 'approved') {
      addMessage({
        type: 'approve',
        title: '邀请自动通过',
        content: `您的访客邀请（邀请码：${newInvite.inviteCode}）已自动通过审核`,
        relatedId: newInvite.id
      });
    } else if (status === 'pending') {
      addMessage({
        type: 'approve',
        title: '待审核提醒',
        content: `您的访客邀请（邀请码：${newInvite.inviteCode}）已提交，等待物业审核`,
        relatedId: newInvite.id
      });
    }

    return newInvite;
  };

  const approveInvite: AppContextType['approveInvite'] = (id, remark) => {
    const parkingSpot = generateParkingSpot();
    setInvites(prev => prev.map(invite => 
      invite.id === id 
        ? { 
            ...invite, 
            status: 'approved', 
            approveTime: new Date().toISOString(), 
            parkingSpot,
            remark: remark || invite.remark
          }
        : invite
    ));

    const invite = invites.find(i => i.id === id);
    if (invite) {
      addMessage({
        type: 'approve',
        title: '审核通过通知',
        content: `您的访客邀请（邀请码：${invite.inviteCode}）已通过审核，车位号：${parkingSpot}`,
        relatedId: id
      });
    }
  };

  const rejectInvite: AppContextType['rejectInvite'] = (id, reason) => {
    setInvites(prev => prev.map(invite => 
      invite.id === id 
        ? { ...invite, status: 'rejected', approveTime: new Date().toISOString(), remark: reason }
        : invite
    ));

    const invite = invites.find(i => i.id === id);
    if (invite) {
      addMessage({
        type: 'approve',
        title: '审核拒绝通知',
        content: `您的访客邀请（邀请码：${invite.inviteCode}）已被拒绝，原因：${reason}`,
        relatedId: id
      });
    }
  };

  const addBlacklist: AppContextType['addBlacklist'] = (plateNumber, reason) => {
    setVehicles(prev => {
      const existing = prev.find(v => v.plateNumber === plateNumber);
      if (existing) {
        return prev.map(v => v.plateNumber === plateNumber ? { ...v, isBlacklist: true, blacklistReason: reason } : v);
      }
      return [...prev, {
        id: String(Date.now()),
        plateNumber,
        ownerName: '未知',
        ownerPhone: '未知',
        type: 'temporary',
        createTime: new Date().toISOString(),
        visitCount: 0,
        isBlacklist: true,
        blacklistReason: reason
      }];
    });
  };

  const confirmEntry: AppContextType['confirmEntry'] = (inviteId) => {
    const invite = invites.find(i => i.id === inviteId);
    if (!invite) return false;
    
    if (invite.status !== 'approved') return false;
    
    const isBlacklist = vehicles.some(v => v.plateNumber === invite.plateNumber && v.isBlacklist);
    if (isBlacklist) return false;
    
    const alreadyEntered = parkingRecords.some(
      r => r.plateNumber === invite.plateNumber && r.status === 'parking'
    );
    if (alreadyEntered) return false;

    setInvites(prev => prev.map(i => 
      i.id === inviteId ? { ...i, status: 'entered', enterTime: new Date().toISOString() } : i
    ));

    const newRecord: ParkingRecord = {
      id: String(Date.now()),
      plateNumber: invite.plateNumber,
      visitorName: invite.visitorName,
      enterTime: new Date().toISOString(),
      parkingSpot: invite.parkingSpot || generateParkingSpot(),
      fee: 0,
      status: 'parking',
      building: invite.building,
      room: invite.room
    };
    setParkingRecords(prev => [newRecord, ...prev]);

    addMessage({
      type: 'entry',
      title: '车辆入场通知',
      content: `访客车辆 ${invite.plateNumber}（${invite.visitorName}）已进入小区，车位号：${newRecord.parkingSpot}`,
      relatedId: inviteId
    });

    setVehicles(prev => prev.map(v => 
      v.plateNumber === invite.plateNumber 
        ? { ...v, visitCount: v.visitCount + 1, lastVisitTime: new Date().toISOString() }
        : v
    ));

    return true;
  };

  const calculateFee: AppContextType['calculateFee'] = (recordId) => {
    const record = parkingRecords.find(r => r.id === recordId);
    if (!record) return 0;
    
    const enter = new Date(record.enterTime).getTime();
    const exit = record.exitTime ? new Date(record.exitTime).getTime() : Date.now();
    const hours = Math.ceil((exit - enter) / (1000 * 60 * 60));
    const firstHourFree = 1;
    const hourlyRate = 5;
    const maxDailyFee = 50;
    
    if (hours <= firstHourFree) return 0;
    
    const fee = (hours - firstHourFree) * hourlyRate;
    return Math.min(fee, maxDailyFee);
  };

  const reduceFee: AppContextType['reduceFee'] = (recordId, amount, reason) => {
    setParkingRecords(prev => prev.map(r => 
      r.id === recordId 
        ? { ...r, fee: Math.max(0, r.fee - amount), remark: reason }
        : r
    ));
  };

  const payFee: AppContextType['payFee'] = (recordId) => {
    const fee = calculateFee(recordId);
    const record = parkingRecords.find(r => r.id === recordId);
    
    setParkingRecords(prev => prev.map(r => 
      r.id === recordId 
        ? { ...r, status: 'paid', fee, exitTime: new Date().toISOString() }
        : r
    ));

    if (record) {
      setInvites(prev => prev.map(i => 
        i.plateNumber === record.plateNumber && i.status === 'entered'
          ? { ...i, status: 'exited', exitTime: new Date().toISOString(), parkingFee: fee }
          : i
      ));

      addMessage({
        type: 'fee',
        title: '缴费成功通知',
        content: `车辆 ${record.plateNumber} 停车费 ¥${fee} 已支付，祝您一路平安`,
        relatedId: recordId
      });
    }
  };

  const markMessageRead: AppContextType['markMessageRead'] = (id) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
  };

  const markAllMessagesRead: AppContextType['markAllMessagesRead'] = () => {
    setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
  };

  const submitFeedback: AppContextType['submitFeedback'] = (data) => {
    const newFeedback: FeedbackInfo = {
      ...data,
      id: String(Date.now()),
      userId: 'o1',
      userName: '张先生',
      status: 'pending',
      createTime: new Date().toISOString(),
      contact: data.contact
    };
    setFeedbacks(prev => [newFeedback, ...prev]);
    
    addMessage({
      type: 'system',
      title: '反馈提交成功',
      content: `您的"${data.type}"反馈已提交，我们会尽快处理`,
      relatedId: newFeedback.id
    });
  };

  const replyFeedback: AppContextType['replyFeedback'] = (id, reply, status) => {
    setFeedbacks(prev => prev.map(f => 
      f.id === id 
        ? { ...f, status, reply, replyTime: new Date().toISOString() }
        : f
    ));

    const feedback = feedbacks.find(f => f.id === id);
    if (feedback) {
      addMessage({
        type: 'system',
        title: '反馈处理通知',
        content: `您的"${feedback.type}"反馈已${status === 'resolved' ? '解决' : '处理中'}：${reply}`,
        relatedId: id
      });
    }
  };

  const getUnreadMessageCount: AppContextType['getUnreadMessageCount'] = () => {
    return messages.filter(m => !m.isRead).length;
  };

  const getMyInvites: AppContextType['getMyInvites'] = (ownerId = 'o1') => {
    return invites.filter(i => i.ownerId === ownerId);
  };

  const getRecordsByFilter: AppContextType['getRecordsByFilter'] = (filters) => {
    return parkingRecords.filter(record => {
      if (filters.plateNumber && !record.plateNumber.includes(filters.plateNumber)) return false;
      if (filters.visitorName && !record.visitorName.includes(filters.visitorName)) return false;
      if (filters.building && !record.building.includes(filters.building)) return false;
      if (filters.status && record.status !== filters.status) return false;
      if (filters.startTime && new Date(record.enterTime) < new Date(filters.startTime)) return false;
      if (filters.endTime && new Date(record.enterTime) > new Date(filters.endTime)) return false;
      return true;
    });
  };

  const value: AppContextType = {
    invites,
    parkingRecords,
    messages,
    feedbacks,
    vehicles,
    currentRole,
    setCurrentRole,
    createInvite,
    approveInvite,
    rejectInvite,
    addBlacklist,
    confirmEntry,
    calculateFee,
    reduceFee,
    payFee,
    addMessage,
    markMessageRead,
    markAllMessagesRead,
    submitFeedback,
    replyFeedback,
    getUnreadMessageCount,
    getMyInvites,
    getRecordsByFilter
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
