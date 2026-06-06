import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import InviteCard from '@/components/InviteCard';
import { useApp } from '@/store/appStore';

const HomePage: React.FC = () => {
  const { getMyInvites, currentRole, getUnreadMessageCount } = useApp();
  const myInvites = getMyInvites().slice(0, 3);
  const unreadCount = getUnreadMessageCount();

  const quickActions = [
    { icon: '📩', text: '发起邀请', bg: 'rgba(22, 93, 255, 0.1)', path: '/pages/invite-detail/index?new=true' },
    { icon: '🚗', text: '车牌登记', bg: 'rgba(0, 180, 42, 0.1)', path: '/pages/plate-register/index' },
    { icon: '✅', text: '审核列表', bg: 'rgba(255, 125, 0, 0.1)', path: '/pages/audit-list/index' },
    { icon: '🎫', text: '入场放行', bg: 'rgba(245, 63, 63, 0.1)', path: '/pages/entry/index' },
    { icon: '💰', text: '停车计费', bg: 'rgba(22, 93, 255, 0.1)', path: '/pages/parking-fee/index' },
    { icon: '📋', text: '通行记录', bg: 'rgba(0, 180, 42, 0.1)', path: '/pages/mine/index' },
    { icon: '📢', text: '消息通知', bg: 'rgba(255, 125, 0, 0.1)', path: '/pages/message/index' },
    { icon: '💬', text: '投诉反馈', bg: 'rgba(245, 63, 63, 0.1)', path: '/pages/feedback/index' }
  ];

  const handleActionClick = (path: string) => {
    Taro.navigateTo({ url: path });
  };

  const handleCreateInvite = () => {
    Taro.navigateTo({ url: '/pages/invite-detail/index?new=true' });
  };

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>👤</View>
          <View className={styles.userText}>
            <Text className={styles.userName}>张先生</Text>
            <Text className={styles.userRole}>5栋1502 · 业主</Text>
          </View>
        </View>
        <Text className={styles.welcomeText}>欢迎使用</Text>
        <Text className={styles.subText}>社区访客停车管理系统</Text>
      </View>

      <View className={styles.content}>
        <View className={styles.quickActions}>
          <Text className={styles.actionTitle}>快捷功能</Text>
          <View className={styles.actionGrid}>
            {quickActions.map((action, index) => (
              <View 
                key={index} 
                className={styles.actionItem}
                onClick={() => handleActionClick(action.path)}
              >
                <View className={styles.actionIcon} style={{ background: action.bg }}>
                  {action.icon}
                </View>
                <Text className={styles.actionText}>{action.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>我的邀请</Text>
            <Text className={styles.seeAll}>查看全部</Text>
          </View>
          
          {myInvites.length > 0 ? (
            <View>
              {myInvites.map((invite) => (
                <InviteCard key={invite.id} invite={invite} />
              ))}
            </View>
          ) : (
            <View className={styles.emptyState}>
              <View className={styles.emptyIcon}>📭</View>
              <Text className={styles.emptyText}>暂无邀请记录</Text>
            </View>
          )}
          
          <Button className={styles.createBtn} onClick={handleCreateInvite}>
            + 发起新邀请
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
