import React, { useState } from 'react';
import { View, Text, Button, ScrollView, Input, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { ParkingRecord } from '@/types';
import { useApp } from '@/store/appStore';
import { formatTime, getStatusText, getStatusColor } from '@/utils';

const LedgerPage: React.FC = () => {
  const { getRecordsByFilter, parkingRecords, invites } = useApp();
  
  const [showFilter, setShowFilter] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ParkingRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  const [filters, setFilters] = useState({
    plateNumber: '',
    visitorName: '',
    building: '',
    startTime: '',
    endTime: '',
    status: ''
  });

  const buildingOptions = ['全部', '1栋', '2栋', '3栋', '5栋', '8栋', '10栋'];
  const statusOptions = [
    { key: '', label: '全部状态' },
    { key: 'parking', label: '停车中' },
    { key: 'paid', label: '已缴费' },
    { key: 'exited', label: '已离场' }
  ];

  const filteredRecords = getRecordsByFilter({
    ...filters,
    building: filters.building === '全部' ? '' : filters.building
  });

  const totalRecords = parkingRecords.length;
  const totalFee = parkingRecords.reduce((sum, r) => {
    const enter = new Date(r.enterTime).getTime();
    const exit = r.exitTime ? new Date(r.exitTime).getTime() : Date.now();
    const hours = Math.ceil((exit - enter) / (1000 * 60 * 60));
    const fee = hours > 1 ? Math.min((hours - 1) * 5, 50) : 0;
    return sum + fee;
  }, 0);
  const parkingCount = parkingRecords.filter(r => r.status === 'parking').length;

  const getInviteRemark = (plateNumber: string) => {
    const invite = invites.find(i => i.plateNumber === plateNumber);
    return invite?.remark || '';
  };

  const getApproveInfo = (plateNumber: string) => {
    const invite = invites.find(i => i.plateNumber === plateNumber);
    return invite ? {
      approveTime: invite.approveTime,
      status: invite.status
    } : null;
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({
      plateNumber: '',
      visitorName: '',
      building: '',
      startTime: '',
      endTime: '',
      status: ''
    });
  };

  const handleExport = () => {
    Taro.showModal({
      title: '导出记录',
      content: `确定导出 ${filteredRecords.length} 条通行记录吗？`,
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '导出中...' });
          setTimeout(() => {
            Taro.hideLoading();
            Taro.showToast({ title: '导出成功', icon: 'success' });
          }, 1500);
        }
      }
    });
  };

  const handleViewDetail = (record: ParkingRecord) => {
    setSelectedRecord(record);
    setShowDetail(true);
  };

  const getParkingDuration = (enterTime: string, exitTime?: string) => {
    const enter = new Date(enterTime).getTime();
    const exit = exitTime ? new Date(exitTime).getTime() : Date.now();
    const diff = exit - enter;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小时${minutes}分钟`;
  };

  const calculateFee = (enterTime: string, exitTime?: string) => {
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

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.statsCard}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{totalRecords}</Text>
          <Text className={styles.statLabel}>总记录</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{parkingCount}</Text>
          <Text className={styles.statLabel}>停车中</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={styles.statValue}>¥{totalFee}</Text>
          <Text className={styles.statLabel}>累计收费</Text>
        </View>
      </View>

      <View className={styles.filterBar}>
        <Button className={styles.filterBtn} onClick={() => setShowFilter(!showFilter)}>
          <Text>🔍 筛选</Text>
          {(filters.plateNumber || filters.visitorName || filters.building || filters.status) && (
            <Text className={styles.filterBadge}></Text>
          )}
        </Button>
        <Button className={styles.exportBtn} onClick={handleExport}>
          📤 导出
        </Button>
      </View>

      {showFilter && (
        <View className={styles.filterPanel}>
          <View className={styles.filterRow}>
            <Text className={styles.filterLabel}>车牌号</Text>
            <Input
              className={styles.filterInput}
              placeholder='请输入车牌号'
              value={filters.plateNumber}
              onInput={(e) => handleFilterChange('plateNumber', e.detail.value)}
            />
          </View>
          
          <View className={styles.filterRow}>
            <Text className={styles.filterLabel}>访客姓名</Text>
            <Input
              className={styles.filterInput}
              placeholder='请输入访客姓名'
              value={filters.visitorName}
              onInput={(e) => handleFilterChange('visitorName', e.detail.value)}
            />
          </View>
          
          <View className={styles.filterRow}>
            <Text className={styles.filterLabel}>楼栋</Text>
            <Picker
              mode='selector'
              range={buildingOptions}
              onChange={(e) => handleFilterChange('building', buildingOptions[e.detail.value])}
            >
              <View className={styles.filterPicker}>
                <Text className={classnames(!filters.building && styles.placeholder)}>
                  {filters.building || '全部楼栋'}
                </Text>
                <Text>›</Text>
              </View>
            </Picker>
          </View>
          
          <View className={styles.filterRow}>
            <Text className={styles.filterLabel}>状态</Text>
            <Picker
              mode='selector'
              range={statusOptions.map(s => s.label)}
              onChange={(e) => handleFilterChange('status', statusOptions[e.detail.value].key)}
            >
              <View className={styles.filterPicker}>
                <Text className={classnames(!filters.status && styles.placeholder)}>
                  {statusOptions.find(s => s.key === filters.status)?.label || '全部状态'}
                </Text>
                <Text>›</Text>
              </View>
            </Picker>
          </View>
          
          <View className={styles.filterActions}>
            <Button className={styles.resetBtn} onClick={handleReset}>重置</Button>
            <Button className={styles.applyBtn} onClick={() => setShowFilter(false)}>确定</Button>
          </View>
        </View>
      )}

      <View className={styles.resultInfo}>
        <Text className={styles.resultText}>共找到 {filteredRecords.length} 条记录</Text>
      </View>

      {filteredRecords.length > 0 ? (
        filteredRecords.map((record) => {
          const fee = calculateFee(record.enterTime, record.exitTime);
          const duration = getParkingDuration(record.enterTime, record.exitTime);
          const remark = getInviteRemark(record.plateNumber);
          const approveInfo = getApproveInfo(record.plateNumber);
          
          return (
            <View key={record.id} className={styles.recordCard} onClick={() => handleViewDetail(record)}>
              <View className={styles.cardHeader}>
                <View className={styles.vehicleInfo}>
                  <Text className={styles.plateNumber}>{record.plateNumber}</Text>
                  <Text className={styles.visitorName}>{record.visitorName}</Text>
                </View>
                <Text 
                  className={styles.statusTag}
                  style={{ color: getStatusColor(record.status), backgroundColor: `${getStatusColor(record.status)}15` }}
                >
                  {getStatusText(record.status)}
                </Text>
              </View>

              <View className={styles.infoGrid}>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>入场时间</Text>
                  <Text className={styles.infoValue}>{formatTime(record.enterTime)}</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>停车时长</Text>
                  <Text className={styles.infoValue}>{duration}</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>车位</Text>
                  <Text className={styles.infoValue}>{record.parkingSpot}</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>楼栋</Text>
                  <Text className={styles.infoValue}>{record.building} {record.room}</Text>
                </View>
              </View>

              <View className={styles.cardFooter}>
                <View className={styles.feeInfo}>
                  <Text className={styles.feeLabel}>费用：</Text>
                  <Text className={styles.feeValue}>¥{fee}</Text>
                </View>
                {remark && (
                  <View className={styles.remarkInfo}>
                    <Text className={styles.remarkText}>📝 {remark}</Text>
                  </View>
                )}
                {approveInfo?.approveTime && (
                  <View className={styles.approveInfo}>
                    <Text className={styles.approveText}>✅ 已审核</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })
      ) : (
        <View className={styles.emptyState}>
          <View className={styles.emptyIcon}>📋</View>
          <Text className={styles.emptyText}>暂无通行记录</Text>
        </View>
      )}

      {showDetail && selectedRecord && (
        <View className={styles.modalMask} onClick={() => setShowDetail(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>通行记录详情</Text>
              <Text className={styles.modalClose} onClick={() => setShowDetail(false)}>×</Text>
            </View>
            <ScrollView scrollY className={styles.modalBody}>
              <View className={styles.detailSection}>
                <Text className={styles.detailSectionTitle}>基本信息</Text>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>车牌号</Text>
                  <Text className={styles.detailValue}>{selectedRecord.plateNumber}</Text>
                </View>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>访客姓名</Text>
                  <Text className={styles.detailValue}>{selectedRecord.visitorName}</Text>
                </View>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>楼栋房间</Text>
                  <Text className={styles.detailValue}>{selectedRecord.building} {selectedRecord.room}</Text>
                </View>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>停车位</Text>
                  <Text className={styles.detailValue}>{selectedRecord.parkingSpot}</Text>
                </View>
              </View>

              <View className={styles.detailSection}>
                <Text className={styles.detailSectionTitle}>时间信息</Text>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>入场时间</Text>
                  <Text className={styles.detailValue}>{formatTime(selectedRecord.enterTime)}</Text>
                </View>
                {selectedRecord.exitTime && (
                  <View className={styles.detailRow}>
                    <Text className={styles.detailLabel}>离场时间</Text>
                    <Text className={styles.detailValue}>{formatTime(selectedRecord.exitTime)}</Text>
                  </View>
                )}
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>停车时长</Text>
                  <Text className={styles.detailValue}>{getParkingDuration(selectedRecord.enterTime, selectedRecord.exitTime)}</Text>
                </View>
              </View>

              <View className={styles.detailSection}>
                <Text className={styles.detailSectionTitle}>费用信息</Text>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>停车费用</Text>
                  <Text className={classnames(styles.detailValue, styles.feeHighlight)}>
                    ¥{calculateFee(selectedRecord.enterTime, selectedRecord.exitTime)}
                  </Text>
                </View>
                {selectedRecord.remark && (
                  <View className={styles.detailRow}>
                    <Text className={styles.detailLabel}>费用备注</Text>
                    <Text className={styles.detailValue}>{selectedRecord.remark}</Text>
                  </View>
                )}
              </View>

              {getInviteRemark(selectedRecord.plateNumber) && (
                <View className={styles.detailSection}>
                  <Text className={styles.detailSectionTitle}>审核信息</Text>
                  <View className={styles.detailRow}>
                    <Text className={styles.detailLabel}>审核备注</Text>
                    <Text className={styles.detailValue}>{getInviteRemark(selectedRecord.plateNumber)}</Text>
                  </View>
                  {getApproveInfo(selectedRecord.plateNumber)?.approveTime && (
                    <View className={styles.detailRow}>
                      <Text className={styles.detailLabel}>审核时间</Text>
                      <Text className={styles.detailValue}>
                        {formatTime(getApproveInfo(selectedRecord.plateNumber)!.approveTime!)}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View className={styles.detailSection}>
                <Text className={styles.detailSectionTitle}>状态信息</Text>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>当前状态</Text>
                  <Text 
                    className={styles.detailValue}
                    style={{ color: getStatusColor(selectedRecord.status) }}
                  >
                    {getStatusText(selectedRecord.status)}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default LedgerPage;
