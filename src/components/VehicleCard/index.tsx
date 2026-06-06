import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { VehicleInfo } from '@/types';
import { formatTime } from '@/utils';

interface VehicleCardProps {
  vehicle: VehicleInfo;
  onClick?: () => void;
  showActions?: boolean;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onClick, showActions }) => {
  return (
    <View className={styles.card} onClick={onClick}>
      <View className={styles.header}>
        <Text className={styles.plateNumber}>{vehicle.plateNumber}</Text>
        <View className={styles.tags}>
          {vehicle.isBlacklist && (
            <Text className={styles.blacklistTag}>黑名单</Text>
          )}
          <Text className={classnames(styles.typeTag, vehicle.type === 'fixed' && styles.fixed)}>
            {vehicle.type === 'fixed' ? '固定车辆' : '临时车辆'}
          </Text>
        </View>
      </View>
      
      <View className={styles.infoRow}>
        <Text className={styles.label}>车主：</Text>
        <Text className={styles.value}>{vehicle.ownerName}</Text>
      </View>
      
      <View className={styles.infoRow}>
        <Text className={styles.label}>联系电话：</Text>
        <Text className={styles.value}>{vehicle.ownerPhone}</Text>
      </View>
      
      <View className={styles.footer}>
        <Text className={styles.visitCount}>到访 {vehicle.visitCount} 次</Text>
        {vehicle.lastVisitTime && (
          <Text className={styles.lastVisit}>最近到访：{formatTime(vehicle.lastVisitTime)}</Text>
        )}
      </View>
      
      {vehicle.isBlacklist && vehicle.blacklistReason && (
        <View className={styles.blacklistReason}>
          <Text className={styles.reasonLabel}>拉黑原因：</Text>
          <Text className={styles.reasonText}>{vehicle.blacklistReason}</Text>
        </View>
      )}
    </View>
  );
};

export default VehicleCard;
