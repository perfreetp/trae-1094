import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import MessageItem from '@/components/MessageItem';
import { useApp } from '@/store/appStore';
import { MessageInfo } from '@/types';

const MessagePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { messages, markMessageRead, markAllMessagesRead, invites, parkingRecords, feedbacks } = useApp();

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'system', label: '系统通知' },
    { key: 'approve', label: '审核结果' },
    { key: 'entry', label: '入场通知' },
    { key: 'fee', label: '费用提醒' },
    { key: 'feedback', label: '反馈回复' }
  ];

  const filteredMessages = activeTab === 'all' 
    ? messages 
    : messages.filter(m => m.type === activeTab);

  const handleMarkAllRead = () => {
    markAllMessagesRead();
    Taro.showToast({ title: '已全部标为已读', icon: 'success' });
  };

  const handleMessageClick = (message: MessageInfo) => {
    markMessageRead(message.id);
    
    switch (message.type) {
      case 'approve':
        const invite = invites.find(i => i.id === message.relatedId);
        if (invite) {
          Taro.navigateTo({ url: `/pages/invite-detail/index?id=${invite.id}` });
        } else {
          Taro.navigateTo({ url: '/pages/audit-list/index' });
        }
        break;
      case 'fee':
        const record = parkingRecords.find(r => r.id === message.relatedId);
        if (record) {
          Taro.navigateTo({ url: '/pages/parking-fee/index' });
        } else {
          Taro.navigateTo({ url: '/pages/parking-fee/index' });
        }
        break;
      case 'feedback':
        Taro.navigateTo({ url: '/pages/feedback/index' });
        break;
      case 'entry':
        Taro.navigateTo({ url: '/pages/parking-fee/index' });
        break;
      case 'system':
      case 'timeout':
        const parkRecord = parkingRecords.find(r => r.id === message.relatedId);
        if (parkRecord) {
          Taro.navigateTo({ url: '/pages/parking-fee/index' });
        }
        break;
      default:
        break;
    }
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>消息中心</Text>
        <View className={styles.headerRight}>
          {unreadCount > 0 && (
            <Button className={styles.markAllBtn} onClick={handleMarkAllRead}>
              全部已读
            </Button>
          )}
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
            {tab.key === 'all' && unreadCount > 0 && (
              <Text className={styles.tabBadge}>{unreadCount}</Text>
            )}
          </View>
        ))}
      </View>

      <View className={styles.messageList}>
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message) => (
            <MessageItem 
              key={message.id} 
              message={message}
              onClick={() => handleMessageClick(message)}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <View className={styles.emptyIcon}>📭</View>
            <Text className={styles.emptyText}>暂无消息</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default MessagePage;
