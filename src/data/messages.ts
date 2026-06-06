import { MessageInfo } from '@/types';

export const mockMessages: MessageInfo[] = [
  {
    id: '1',
    type: 'entry',
    title: '车辆入场通知',
    content: '访客车辆 京A12345（李先生）已进入小区，车位号：A012',
    isRead: false,
    createTime: '2026-06-07 09:15:00',
    relatedId: '1'
  },
  {
    id: '2',
    type: 'approve',
    title: '审核通过通知',
    content: '您的访客邀请（邀请码：B7M4Q8）已通过审核，访客可凭邀请码入场',
    isRead: false,
    createTime: '2026-06-07 10:30:00',
    relatedId: '2'
  },
  {
    id: '3',
    type: 'timeout',
    title: '停车超时提醒',
    content: '访客车辆 京C54321（赵先生）已停车超过6小时，请注意提醒访客离场',
    isRead: true,
    createTime: '2026-06-07 16:10:00',
    relatedId: '3'
  },
  {
    id: '4',
    type: 'fee',
    title: '停车费用提醒',
    content: '访客车辆 京D98765（刘先生）停车费用：20元，请及时缴费',
    isRead: true,
    createTime: '2026-06-06 20:30:00',
    relatedId: '4'
  },
  {
    id: '5',
    type: 'system',
    title: '系统公告',
    content: '端午节期间（6月10日-6月12日），临时停车位紧张，请业主提前规划访客行程',
    isRead: true,
    createTime: '2026-06-05 09:00:00'
  },
  {
    id: '6',
    type: 'approve',
    title: '待审核提醒',
    content: '您有1条新的访客邀请待审核，请及时处理',
    isRead: false,
    createTime: '2026-06-07 11:00:00',
    relatedId: '6'
  }
];
