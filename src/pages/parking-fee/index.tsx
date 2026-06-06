import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { ParkingRecord } from '@/types';
import { useApp } from '@/store/appStore';
import { formatTime, getStatusText, getStatusColor } from '@/utils';

const ParkingFeePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('parking');
  const [selectedRecord, setSelectedRecord] = useState<ParkingRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const { parkingRecords, calculateFee, getOriginalFee, reduceFee, payFee, confirmExit, currentRole } = useApp();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const tabs = [
    { key: 'parking', label: '停车中' },
    { key: 'paid', label: '已缴费' },
    { key: 'history', label: '历史记录' }
  ];

  const parkingList = parkingRecords.filter(r => r.status === 'parking');
  const paidList = parkingRecords.filter(r => r.status === 'paid');
  const historyList = parkingRecords.filter(r => r.status === 'exited');
  
  const totalFee = historyList.reduce((sum, r) => sum + calculateFee(r.id), 0);
  const totalParking = parkingList.length + paidList.length;
  const totalCount = parkingRecords.length;

  const handleConfirmExit = (record: ParkingRecord) => {
    Taro.showModal({
      title: '确认离场',
      content: `确定车辆 ${record.plateNumber} 离场吗？`,
      success: (res) => {
        if (res.confirm) {
          confirmExit(record.id);
          Taro.showToast({ title: '已确认离场', icon: 'success' });
        }
      }
    });
  };

  const getParkingDuration = (enterTime: string) => {
    const enter = new Date(enterTime).getTime();
    const now = Date.now();
    const diff = now - enter;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小时${minutes}分钟`;
  };

  const isOvertime = (enterTime: string, expectedEnd?: string) => {
    if (!expectedEnd) {
      const hours = (Date.now() - new Date(enterTime).getTime()) / (1000 * 60 * 60);
      return hours > 8;
    }
    return new Date() > new Date(expectedEnd);
  };

  const handleReduceFee = (record: ParkingRecord) => {
    const currentFee = calculateFee(record.id);
    Taro.showActionSheet({
      itemList: ['减免1小时(5元)', '减免2小时(10元)', '全额减免', '自定义减免'],
      success: (res) => {
        const reduceOptions = [5, 10, currentFee, 0];
        if (res.tapIndex < 3) {
          const amount = reduceOptions[res.tapIndex];
          Taro.showModal({
            title: '确认减免',
            content: `确定减免 ¥${amount} 吗？`,
            editable: true,
            placeholderText: '请输入减免原因',
            success: (modalRes) => {
              if (modalRes.confirm) {
                reduceFee(record.id, amount, modalRes.content || '物业减免');
                Taro.showToast({ title: '减免成功', icon: 'success' });
              }
            }
          });
        } else {
          Taro.showModal({
            title: '自定义减免',
            editable: true,
            placeholderText: '请输入减免金额',
            success: (amountRes) => {
              if (amountRes.confirm && amountRes.content) {
                const amount = parseFloat(amountRes.content);
                if (!isNaN(amount) && amount > 0) {
                  Taro.showModal({
                    title: '减免原因',
                    editable: true,
                    placeholderText: '请输入减免原因',
                    success: (reasonRes) => {
                      if (reasonRes.confirm) {
                        reduceFee(record.id, amount, reasonRes.content || '物业减免');
                        Taro.showToast({ title: '减免成功', icon: 'success' });
                      }
                    }
                  });
                } else {
                  Taro.showToast({ title: '请输入有效金额', icon: 'none' });
                }
              }
            }
          });
        }
      }
    });
  };

  const handlePay = (record: ParkingRecord) => {
    const fee = calculateFee(record.id);
    if (fee <= 0) {
      Taro.showToast({ title: '无需缴费', icon: 'success' });
      payFee(record.id);
      return;
    }
    
    Taro.showModal({
      title: '确认缴费',
      content: `停车费用：¥${fee}\n\n确认支付？`,
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '支付中...' });
          setTimeout(() => {
            Taro.hideLoading();
            payFee(record.id);
            Taro.showToast({ title: '缴费成功', icon: 'success' });
          }, 1000);
        }
      }
    });
  };

  const handleExport = () => {
    Taro.showModal({
      title: '导出记录',
      content: `确定导出 ${currentList.length} 条停车记录吗？`,
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

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.statsCard}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{totalParking}</Text>
          <Text className={styles.statLabel}>停车中</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={styles.statValue}>¥{totalFee}</Text>
          <Text className={styles.statLabel}>累计收费</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{totalCount}</Text>
          <Text className={styles.statLabel}>总记录</Text>
        </View>
      </View>

      <View className={styles.tabs}>
        {tabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key === 'parking' && parkingList.length > 0 && (
              <Text className={styles.tabBadge}>{parkingList.length}</Text>
            )}
            {tab.key === 'paid' && paidList.length > 0 && (
              <Text className={styles.tabBadge}>{paidList.length}</Text>
            )}
          </View>
        ))}
        {currentRole === 'property' && (
          <Button className={styles.exportBtn} onClick={handleExport}>
            导出
          </Button>
        )}
      </View>

      {currentList.length > 0 ? (
        currentList.map((record) => {
          const currentFee = calculateFee(record.id);
          const duration = getParkingDuration(record.enterTime);
          const overtime = activeTab === 'parking' && isOvertime(record.enterTime);
          
          return (
            <View key={record.id} className={styles.recordCard}>
              <View className={styles.cardHeader}>
                <View className={styles.vehicleInfo}>
                  <Text className={styles.plateNumber}>{record.plateNumber}</Text>
                  <Text className={styles.visitorName}>{record.visitorName}</Text>
                </View>
                <Text 
                  className={classnames(styles.statusTag, overtime && styles.overtime)}
                  style={{ 
                    color: overtime ? '#F53F3F' : getStatusColor(record.status), 
                    backgroundColor: `${overtime ? '#F53F3F' : getStatusColor(record.status)}15` 
                  }}
                >
                  {overtime ? '已超时' : getStatusText(record.status)}
                </Text>
              </View>

              <View className={styles.infoGrid}>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>入场时间</Text>
                  <Text className={styles.infoValue}>{formatTime(record.enterTime)}</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>停车时长</Text>
                  <Text className={classnames(styles.infoValue, overtime && styles.overtimeText)}>{duration}</Text>
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

              <View className={styles.feeSection}>
                <View className={styles.feeInfo}>
                  <Text className={styles.feeLabel}>当前费用</Text>
                  <Text className={styles.feeValue}>¥{currentFee}</Text>
                  {record.reducedAmount && record.reducedAmount > 0 && (
                    <Text className={styles.feeOriginal}>原价¥{getOriginalFee(record.id)}</Text>
                  )}
                  {record.remark && (
                    <Text className={styles.feeRemark}>（{record.remark}）</Text>
                  )}
                </View>
              </View>

              {record.exitTime && (
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>离场时间：</Text>
                  <Text className={styles.infoValue}>{formatTime(record.exitTime)}</Text>
                </View>
              )}

              <View className={styles.actionButtons}>
                <Button className={styles.detailBtn} onClick={() => handleViewDetail(record)}>
                  详情
                </Button>
                {record.status === 'parking' && currentRole === 'property' && (
                  <Button className={styles.reduceBtn} onClick={() => handleReduceFee(record)}>
                    费用减免
                  </Button>
                )}
                {record.status === 'parking' && (
                  <Button className={styles.payBtn} onClick={() => handlePay(record)}>
                    {currentFee <= 0 ? '免费离场' : `缴费 ¥${currentFee}`}
                  </Button>
                )}
                {record.status === 'paid' && currentRole === 'property' && (
                  <Button className={styles.exitBtn} onClick={() => handleConfirmExit(record)}>
                    确认离场
                  </Button>
                )}
              </View>
            </View>
          );
        })
      ) : (
        <View className={styles.emptyState}>
          <View className={styles.emptyIcon}>🚗</View>
          <Text className={styles.emptyText}>暂无{activeTab === 'parking' ? '停车中' : '历史'}记录</Text>
        </View>
      )}

      {showDetail && selectedRecord && (
        <View className={styles.modalMask} onClick={() => setShowDetail(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>停车详情</Text>
              <Text className={styles.modalClose} onClick={() => setShowDetail(false)}>×</Text>
            </View>
            <ScrollView scrollY className={styles.modalBody}>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>车牌号</Text>
                <Text className={styles.detailValue}>{selectedRecord.plateNumber}</Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>访客</Text>
                <Text className={styles.detailValue}>{selectedRecord.visitorName}</Text>
              </View>
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
                <Text className={styles.detailValue}>{getParkingDuration(selectedRecord.enterTime)}</Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>车位</Text>
                <Text className={styles.detailValue}>{selectedRecord.parkingSpot}</Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>楼栋房间</Text>
                <Text className={styles.detailValue}>{selectedRecord.building} {selectedRecord.room}</Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>当前费用</Text>
                <Text className={classnames(styles.detailValue, styles.feeHighlight)}>¥{calculateFee(selectedRecord.id)}</Text>
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
                  <Text className={classnames(styles.detailValue, styles.reduceHighlight)}>-¥{selectedRecord.reducedAmount}</Text>
                </View>
              )}
              {selectedRecord.remark && (
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>费用备注</Text>
                  <Text className={styles.detailValue}>{selectedRecord.remark}</Text>
                </View>
              )}
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>状态</Text>
                <Text 
                  className={styles.detailValue}
                  style={{ color: getStatusColor(selectedRecord.status) }}
                >
                  {getStatusText(selectedRecord.status)}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ParkingFeePage;
