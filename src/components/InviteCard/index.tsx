import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { InviteInfo } from '@/types';
import { formatTime, getStatusText, getStatusColor } from '@/utils';

interface InviteCardProps {
  invite: InviteInfo;
  onClick?: () => void;
}

const InviteCard: React.FC<InviteCardProps> = ({ invite, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/invite-detail/index?id=${invite.id}`
      });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.visitorInfo}>
          <Text className={styles.visitorName}>{invite.visitorName}</Text>
          <Text className={styles.plateNumber}>{invite.plateNumber}</Text>
        </View>
        <View 
          className={styles.status}
          style={{ color: getStatusColor(invite.status), backgroundColor: `${getStatusColor(invite.status)}15` }}
        >
          {getStatusText(invite.status)}
        </View>
      </View>
      
      <View className={styles.infoRow}>
        <Text className={styles.label}>到访地址：</Text>
        <Text className={styles.value}>{invite.building} {invite.room}</Text>
      </View>
      
      <View className={styles.infoRow}>
        <Text className={styles.label}>到访时段：</Text>
        <Text className={styles.value}>{formatTime(invite.visitStartTime)} - {formatTime(invite.visitEndTime)}</Text>
      </View>
      
      <View className={styles.footer}>
        <Text className={styles.inviteCode}>邀请码：{invite.inviteCode}</Text>
        <Text className={styles.createTime}>{formatTime(invite.createTime)}</Text>
      </View>
      
      {invite.parkingSpot && (
        <View className={styles.parkingSpot}>
          <Text className={styles.spotLabel}>分配车位：</Text>
          <Text className={styles.spotValue}>{invite.parkingSpot}</Text>
        </View>
      )}
    </View>
  );
};

export default InviteCard;
