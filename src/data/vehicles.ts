import { VehicleInfo } from '@/types';

export const mockVehicles: VehicleInfo[] = [
  {
    id: '1',
    plateNumber: '京A12345',
    ownerName: '李先生',
    ownerPhone: '13800138001',
    type: 'temporary',
    createTime: '2026-06-01 10:00:00',
    lastVisitTime: '2026-06-07 09:15:00',
    visitCount: 5,
    isBlacklist: false
  },
  {
    id: '2',
    plateNumber: '京B67890',
    ownerName: '王女士',
    ownerPhone: '13900139002',
    type: 'temporary',
    createTime: '2026-06-02 14:00:00',
    lastVisitTime: '2026-06-05 16:00:00',
    visitCount: 3,
    isBlacklist: false
  },
  {
    id: '3',
    plateNumber: '京C54321',
    ownerName: '赵先生',
    ownerPhone: '13700137003',
    type: 'temporary',
    createTime: '2026-06-03 09:00:00',
    lastVisitTime: '2026-06-07 10:10:00',
    visitCount: 8,
    isBlacklist: false
  },
  {
    id: '4',
    plateNumber: '京D98765',
    ownerName: '刘先生',
    ownerPhone: '13600136004',
    type: 'fixed',
    createTime: '2026-01-15 09:00:00',
    lastVisitTime: '2026-06-06 15:20:00',
    visitCount: 45,
    isBlacklist: false
  },
  {
    id: '5',
    plateNumber: '京E88888',
    ownerName: '周先生',
    ownerPhone: '13300133005',
    type: 'temporary',
    createTime: '2026-05-20 10:00:00',
    lastVisitTime: '2026-06-01 14:00:00',
    visitCount: 2,
    isBlacklist: true,
    blacklistReason: '多次违规占用他人车位'
  }
];
