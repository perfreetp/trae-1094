import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { MessageInfo } from '@/types';
import { formatTime } from '@/utils';

interface MessageItemProps {
  message: MessageInfo;
  onClick?: () => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onClick }) => {
  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      system: '📢',
      entry: '🚗',
      timeout: '⏰',
      approve: '✅',
      fee: '💰'
    };
    return iconMap[type] || '📬';
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (message.relatedId) {
      Taro.navigateTo({
        url: `/pages/invite-detail/index?id=${message.relatedId}`
      });
    }
  };

  return (
    <View className={styles.item} onClick={handleClick}>
      <View className={styles.icon}>{getTypeIcon(message.type)}</View>
      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.title}>{message.title}</Text>
          {!message.isRead && <View className={styles.unreadDot} />}
        </View>
        <Text className={styles.desc}>{message.content}</Text>
        <Text className={styles.time}>{formatTime(message.createTime)}</Text>
      </View>
    </View>
  );
};

export default MessageItem;
