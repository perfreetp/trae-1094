import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { ParkingRecord } from '@/types';
import { mockParkingRecords } from '@/data/records';
import { formatTime, getStatusText, getStatusColor, calculateParkingFee } from '@/utils';

const ParkingFeePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('parking');
  const [records, setRecords] = useState<ParkingRecord[]>(mockParkingRecords);

  const tabs = [
    { key: 'parking', label: '停车中' },
    { key: 'history', label: '历史记录' }
  ];

  const parkingRecords = records.filter(r => r.status === 'parking');
  const historyRecords = records.filter(r => r.status !== 'parking');

  const currentRecords = activeTab === 'parking' ? parkingRecords : historyRecords;

  const totalFee = historyRecords.reduce((sum, r) => sum + r.fee, 0);
  const totalParking = parkingRecords.length;
  const totalCount = records.length;

  const handleReduceFee = (record: ParkingRecord) => {
    Taro.showActionSheet({
      itemList: ['减免1小时', '减免2小时', '全额减免', '自定义减免'],
      success: (res) => {
        const reduceOptions = [5, 10, record.fee, 0];
        if (res.tapIndex < 3) {
          Taro.showModal({
            title: '确认减免',
            content: `确定减免 ${reduceOptions[res.tapIndex]} 元吗？`,
            success: (res) => {
              if (res.confirm) {
                Taro.showToast({ title: '减免成功', icon: 'success' });
              }
            }
          });
        } else {
          Taro.showModal({
            title: '自定义减免',
            editable: true,
            placeholderText: '请输入减免金额',
            success: (res) => {
              if (res.confirm && res.content) {
                Taro.showToast({ title: '减免成功', icon: 'success' });
              }
            }
          });
        }
      }
    });
  };

  const handlePay = (record: ParkingRecord) => {
    const fee = record.fee > 0 ? record.fee : calculateParkingFee(record.enterTime, record.exitTime);
    if (fee === 0) {
      Taro.showToast({ title: '停车免费', icon: 'success' });
      return;
    }
    
    Taro.showModal({
      title: '确认支付',
      content: `需支付停车费 ¥${fee}`,
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '支付中...' });
          setTimeout(() => {
            Taro.hideLoading();
            Taro.showToast({ title: '支付成功', icon: 'success' });
            setRecords(prev => prev.map(r => 
              r.id === record.id ? { ...r, status: 'paid', fee } : r
            ));
          }, 1500);
        }
      }
    });
  };

  const handleExport = () => {
    Taro.showModal({
      title: '导出记录',
      content: '确定要导出通行记录Excel吗？',
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

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.summaryCard}>
        <Text className={styles.summaryTitle}>累计停车费用</Text>
        <Text className={styles.summaryAmount}>¥{totalFee}</Text>
        <View className={styles.summaryStats}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{totalParking}</Text>
            <Text className={styles.statLabel}>停车中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{totalCount}</Text>
            <Text className={styles.statLabel}>总记录</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{historyRecords.filter(r => r.status === 'paid').length}</Text>
            <Text className={styles.statLabel}>已缴费</Text>
          </View>
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
            {tab.key === 'parking' && parkingRecords.length > 0 && (
              <Text style={{ marginLeft: '8rpx', fontSize: '20rpx' }}>({parkingRecords.length})</Text>
            )}
          </View>
        ))}
      </View>

      {currentRecords.length > 0 ? (
        <View>
          {currentRecords.map((record) => {
            const currentFee = record.fee > 0 ? record.fee : calculateParkingFee(record.enterTime, record.exitTime);
            return (
              <View key={record.id} className={styles.parkingCard}>
                <View className={styles.cardHeader}>
                  <Text className={styles.plateNumber}>{record.plateNumber}</Text>
                  <Text 
                    className={styles.statusTag}
                    style={{ color: getStatusColor(record.status), backgroundColor: `${getStatusColor(record.status)}15` }}
                  >
                    {getStatusText(record.status)}
                  </Text>
                </View>
                
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>访客：</Text>
                  <Text className={styles.infoValue}>{record.visitorName} · {record.building}{record.room}</Text>
                </View>
                
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>车位：</Text>
                  <Text className={styles.infoValue}>{record.parkingSpot}</Text>
                </View>
                
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>入场时间：</Text>
                  <Text className={styles.infoValue}>{formatTime(record.enterTime)}</Text>
                </View>
                
                {record.exitTime && (
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>离场时间：</Text>
                    <Text className={styles.infoValue}>{formatTime(record.exitTime)}</Text>
                  </View>
                )}
                
                {record.duration && (
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>停车时长：</Text>
                    <Text className={styles.infoValue}>{Math.floor(record.duration / 60)}小时{record.duration % 60}分钟</Text>
                  </View>
                )}
                
                <View className={styles.feeRow}>
                  <Text className={styles.feeLabel}>停车费用：</Text>
                  {currentFee === 0 ? (
                    <Text className={styles.freeTag}>免费</Text>
                  ) : (
                    <Text className={styles.feeAmount}>¥{currentFee}</Text>
                  )}
                </View>
                
                {record.status === 'parking' && (
                  <View className={styles.actionRow}>
                    <Button className={styles.btnReduce} onClick={() => handleReduceFee(record)}>
                      费用减免
                    </Button>
                    <Button className={styles.btnPay} onClick={() => handlePay(record)}>
                      缴费离场
                    </Button>
                  </View>
                )}
              </View>
            );
          })}
          
          {activeTab === 'history' && (
            <Button className={styles.exportBtn} onClick={handleExport}>
              📤 导出通行记录
            </Button>
          )}
        </View>
      ) : (
        <View className={styles.emptyState}>
          <View className={styles.emptyIcon}>🚗</View>
          <Text className={styles.emptyText}>暂无{activeTab === 'parking' ? '停车中' : '历史'}记录</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default ParkingFeePage;
