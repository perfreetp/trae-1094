import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import MessageItem from '@/components/MessageItem';
import { MessageInfo } from '@/types';
import { mockMessages } from '@/data/messages';

const MessagePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [messages, setMessages] = useState<MessageInfo[]>(mockMessages);

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'system', label: '系统通知' },
    { key: 'entry', label: '入场通知' },
    { key: 'fee', label: '费用提醒' }
  ];

  const filteredMessages = activeTab === 'all' 
    ? messages 
    : messages.filter(m => m.type === activeTab);

  const handleMarkAllRead = () => {
    setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    Taro.showToast({ title: '已全部标为已读', icon: 'success' });
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
              <Text style={{ marginLeft: '8rpx', fontSize: '20rpx' }}>({unreadCount})</Text>
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
              onClick={() => {
                setMessages(prev => prev.map(m => 
                  m.id === message.id ? { ...m, isRead: true } : m
                ));
              }}
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
