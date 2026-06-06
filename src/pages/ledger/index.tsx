import React, { useState } from 'react';
import { View, Text, Button, ScrollView, Input, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { ParkingRecord } from '@/types';
import { useApp } from '@/store/appStore';
import { formatTime, formatDate, getStatusText, getStatusColor } from '@/utils';

const LedgerPage: React.FC = () => {
  const { getRecordsByFilter, parkingRecords, invites, calculateFee, getOriginalFee } = useApp();
  
  const [activeView, setActiveView] = useState('all');
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

  const viewTabs = [
    { key: 'all', label: '全部' },
    { key: 'parking', label: '在场车辆' },
    { key: 'paid', label: '待离场' },
    { key: 'exited', label: '已离场' }
  ];

  const buildingOptions = ['全部', '1栋', '2栋', '3栋', '5栋', '8栋', '10栋'];

  const getViewStatus = (view: string) => {
    switch (view) {
      case 'parking': return 'parking';
      case 'paid': return 'paid';
      case 'exited': return 'exited';
      default: return '';
    }
  };

  const filteredRecords = getRecordsByFilter({
    ...filters,
    building: filters.building === '全部' ? '' : filters.building,
    status: getViewStatus(activeView) || filters.status
  });

  const getTotalFeeByDateRange = () => {
    return filteredRecords
      .filter(r => r.status === 'paid' || r.status === 'exited')
      .reduce((sum, r) => sum + calculateFee(r.id), 0);
  };

  const totalRecords = parkingRecords.length;
  const totalFee = getTotalFeeByDateRange();
  const parkingCount = parkingRecords.filter(r => r.status === 'parking').length;
  const paidCount = parkingRecords.filter(r => r.status === 'paid').length;
  const exitedCount = parkingRecords.filter(r => r.status === 'exited').length;

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

  const handleDateChange = (key: string, e: any) => {
    setFilters(prev => ({ ...prev, [key]: e.detail.value }));
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

  const handleApplyFilter = () => {
    setShowFilter(false);
    Taro.showToast({ title: '筛选已应用', icon: 'success' });
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

  const hasActiveFilters = filters.plateNumber || filters.visitorName || 
                         filters.building || filters.startTime || filters.endTime;

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.statsCard}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{totalRecords}</Text>
          <Text className={styles.statLabel}>总记录</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{parkingCount + paidCount}</Text>
          <Text className={styles.statLabel}>在场</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={styles.statValue}>¥{totalFee}</Text>
          <Text className={styles.statLabel}>
            {filters.startTime || filters.endTime ? '区间收费' : '累计收费'}
          </Text>
        </View>
      </View>

      <View className={styles.viewTabs}>
        {viewTabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.viewTabItem, activeView === tab.key && styles.viewTabActive)}
            onClick={() => setActiveView(tab.key)}
          >
            {tab.label}
            {tab.key === 'parking' && parkingCount > 0 && (
              <Text className={styles.viewTabBadge}>{parkingCount}</Text>
            )}
            {tab.key === 'paid' && paidCount > 0 && (
              <Text className={styles.viewTabBadge}>{paidCount}</Text>
            )}
            {tab.key === 'exited' && exitedCount > 0 && (
              <Text className={styles.viewTabBadge}>{exitedCount}</Text>
            )}
          </View>
        ))}
      </View>

      <View className={styles.filterBar}>
        <Button className={styles.filterBtn} onClick={() => setShowFilter(!showFilter)}>
          <Text>🔍 筛选</Text>
          {hasActiveFilters && (
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
            <Text className={styles.filterLabel}>开始时间</Text>
            <Picker
              mode='date'
              value={filters.startTime}
              onChange={(e) => handleDateChange('startTime', e)}
            >
              <View className={styles.filterPicker}>
                <Text className={classnames(!filters.startTime && styles.placeholder)}>
                  {filters.startTime || '选择开始日期'}
                </Text>
                <Text>📅</Text>
              </View>
            </Picker>
          </View>
          
          <View className={styles.filterRow}>
            <Text className={styles.filterLabel}>结束时间</Text>
            <Picker
              mode='date'
              value={filters.endTime}
              onChange={(e) => handleDateChange('endTime', e)}
            >
              <View className={styles.filterPicker}>
                <Text className={classnames(!filters.endTime && styles.placeholder)}>
                  {filters.endTime || '选择结束日期'}
                </Text>
                <Text>📅</Text>
              </View>
            </Picker>
          </View>
          
          <View className={styles.filterActions}>
            <Button className={styles.resetBtn} onClick={handleReset}>重置</Button>
            <Button className={styles.applyBtn} onClick={handleApplyFilter}>确定</Button>
          </View>
        </View>
      )}

      {(filters.startTime || filters.endTime) && (
        <View className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>
            {filters.startTime || '开始'} 至 {filters.endTime || '今天'}
          </Text>
          <Text className={styles.summaryValue}>
            收费合计：<Text className={styles.summaryAmount}>¥{totalFee}</Text>
          </Text>
        </View>
      )}

      <View className={styles.resultInfo}>
        <Text className={styles.resultText}>共找到 {filteredRecords.length} 条记录</Text>
        {hasActiveFilters && (
          <Text className={styles.filterActiveTag}>已筛选</Text>
        )}
      </View>

      {filteredRecords.length > 0 ? (
        filteredRecords.map((record) => {
          const fee = calculateFee(record.id);
          const originalFee = getOriginalFee(record.id);
          const duration = getParkingDuration(record.enterTime, record.exitTime);
          const remark = getInviteRemark(record.plateNumber);
          const approveInfo = getApproveInfo(record.plateNumber);
          const hasReduction = record.reducedAmount && record.reducedAmount > 0;
          
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

              {(record.status === 'paid' || record.status === 'exited') && record.payTime && (
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>缴费时间：</Text>
                  <Text className={styles.infoValue}>{formatTime(record.payTime)}</Text>
                </View>
              )}

              {record.exitTime && (
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>离场时间：</Text>
                  <Text className={styles.infoValue}>{formatTime(record.exitTime)}</Text>
                </View>
              )}

              <View className={styles.cardFooter}>
                <View className={styles.feeInfo}>
                  <Text className={styles.feeLabel}>实付：</Text>
                  <Text className={styles.feeValue}>¥{fee}</Text>
                  {hasReduction && (
                    <Text className={styles.feeOriginal}>原价¥{originalFee}</Text>
                  )}
                  {hasReduction && (
                    <Text className={styles.feeReduce}>-¥{record.reducedAmount}</Text>
                  )}
                </View>
                {(record.remark || remark) && (
                  <View className={styles.remarkInfo}>
                    <Text className={styles.remarkText}>📝 {record.remark || remark}</Text>
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
                {(selectedRecord.status === 'paid' || selectedRecord.status === 'exited') && selectedRecord.payTime && (
                  <View className={styles.detailRow}>
                    <Text className={styles.detailLabel}>缴费时间</Text>
                    <Text className={styles.detailValue}>{formatTime(selectedRecord.payTime)}</Text>
                  </View>
                )}
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
                  <Text className={styles.detailLabel}>实付金额</Text>
                  <Text className={classnames(styles.detailValue, styles.feeHighlight)}>
                    ¥{calculateFee(selectedRecord.id)}
                  </Text>
                </View>
                {selectedRecord.reducedAmount && selectedRecord.reducedAmount > 0 && (
                  <View className={styles.detailRow}>
                    <Text className={styles.detailLabel}>原价</Text>
                    <Text className={styles.detailValue}>¥{getOriginalFee(selectedRecord.id)}</Text>
                  </View>
                )}
                {selectedRecord.reducedAmount && selectedRecord.reducedAmount > 0 && (
                  <View className={styles.detailRow}>
                    <Text className={styles.detailLabel}>减免金额</Text>
                    <Text className={classnames(styles.detailValue, styles.reduceHighlight)}>
                      -¥{selectedRecord.reducedAmount}
                    </Text>
                  </View>
                )}
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
