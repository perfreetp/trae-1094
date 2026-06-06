export const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const generateParkingSpot = (): string => {
  const areas = ['A', 'B', 'C', 'D'];
  const area = areas[Math.floor(Math.random() * areas.length)];
  const num = Math.floor(Math.random() * 50) + 1;
  return `${area}${String(num).padStart(3, '0')}`;
};

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    entered: '已入场',
    exited: '已离场',
    expired: '已过期',
    parking: '停车中',
    paid: '已缴费/可离场',
    processing: '处理中',
    resolved: '已解决'
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: '#FF7D00',
    approved: '#00B42A',
    rejected: '#F53F3F',
    entered: '#165DFF',
    exited: '#86909C',
    expired: '#C9CDD4',
    parking: '#165DFF',
    paid: '#00B42A',
    processing: '#FF7D00',
    resolved: '#00B42A'
  };
  return colorMap[status] || '#86909C';
};

export const calculateParkingFee = (enterTime: string, exitTime?: string): number => {
  const enter = new Date(enterTime).getTime();
  const exit = exitTime ? new Date(exitTime).getTime() : Date.now();
  const hours = Math.ceil((exit - enter) / (1000 * 60 * 60));
  const firstHourFree = 1;
  const hourlyRate = 5;
  const maxDailyFee = 50;
  
  if (hours <= firstHourFree) return 0;
  
  const fee = (hours - firstHourFree) * hourlyRate;
  return Math.min(fee, maxDailyFee);
};

export const validatePlateNumber = (plate: string): boolean => {
  const plateRegex = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]$/;
  return plateRegex.test(plate.toUpperCase());
};
