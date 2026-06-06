import { ParkingRecord, FeedbackInfo } from '@/types';

export const mockParkingRecords: ParkingRecord[] = [
  {
    id: '1',
    plateNumber: '京A12345',
    visitorName: '李先生',
    enterTime: '2026-06-07 09:15:00',
    parkingSpot: 'A012',
    fee: 0,
    status: 'parking',
    building: '5栋',
    room: '1502'
  },
  {
    id: '2',
    plateNumber: '京C54321',
    visitorName: '赵先生',
    enterTime: '2026-06-07 10:10:00',
    parkingSpot: 'B008',
    fee: 0,
    status: 'parking',
    building: '8栋',
    room: '803'
  },
  {
    id: '3',
    plateNumber: '京D98765',
    visitorName: '刘先生',
    enterTime: '2026-06-06 15:20:00',
    exitTime: '2026-06-06 20:30:00',
    parkingSpot: 'C025',
    duration: 310,
    fee: 20,
    status: 'paid',
    building: '3栋',
    room: '601'
  },
  {
    id: '4',
    plateNumber: '京E22222',
    visitorName: '孙女士',
    enterTime: '2026-06-05 14:00:00',
    exitTime: '2026-06-05 19:00:00',
    parkingSpot: 'A003',
    duration: 300,
    fee: 15,
    status: 'paid',
    building: '8栋',
    room: '803'
  }
];

export const mockFeedbacks: FeedbackInfo[] = [
  {
    id: '1',
    userId: 'o1',
    userName: '张先生',
    type: '车位问题',
    content: 'A区012车位经常被占用，希望物业加强管理',
    status: 'resolved',
    createTime: '2026-06-01 10:00:00',
    reply: '您好，已安排保安加强巡查，感谢您的反馈！',
    replyTime: '2026-06-01 15:30:00'
  },
  {
    id: '2',
    userId: 'o2',
    userName: '李女士',
    type: '系统问题',
    content: '邀请码生成后无法分享，提示分享失败',
    status: 'processing',
    createTime: '2026-06-05 14:00:00'
  },
  {
    id: '3',
    userId: 'o3',
    userName: '王先生',
    type: '收费问题',
    content: '停车费计算有误，实际停车3小时却收了4小时的费用',
    status: 'pending',
    createTime: '2026-06-07 09:30:00'
  }
];
