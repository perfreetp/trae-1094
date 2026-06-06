import React from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import InviteCard from '@/components/InviteCard';
import { useApp } from '@/store/appStore';

const HomePage: React.FC = () => {
  const { getMyInvites, currentRole, getUnreadMessageCount, getTodayStats } = useApp();
  const myInvites = getMyInvites().slice(0, 3);
  const unreadCount = getUnreadMessageCount();
  const todayStats = getTodayStats();

  const quickActions = [
    { icon: '📩', text: '发起邀请', bg: 'rgba(22, 93, 255, 0.1)', path: '/pages/invite-detail/index?new=true' },
    { icon: '🚗', text: '车牌登记', bg: 'rgba(0, 180, 42, 0.1)', path: '/pages/plate-register/index' },
    { icon: '✅', text: '审核列表', bg: 'rgba(255, 125, 0, 0.1)', path: '/pages/audit-list/index' },
    { icon: '🎫', text: '入场放行', bg: 'rgba(245, 63, 63, 0.1)', path: '/pages/entry/index' },
    { icon: '💰', text: '停车计费', bg: 'rgba(22, 93, 255, 0.1)', path: '/pages/parking-fee/index' },
    { icon: '📋', text: '物业台账', bg: 'rgba(0, 180, 42, 0.1)', path: '/pages/ledger/index' },
    { icon: '📢', text: '消息通知', bg: 'rgba(255, 125, 0, 0.1)', path: '/pages/message/index' },
    { icon: '💬', text: '投诉反馈', bg: 'rgba(245, 63, 63, 0.1)', path: '/pages/feedback/index' }
  ];

  const handleActionClick = (path: string) => {
    Taro.navigateTo({ url: path });
  };

  const handleCreateInvite = () => {
    Taro.navigateTo({ url: '/pages/invite-detail/index?new=true' });
  };

  const overviewItems = [
    { 
      label: '待审核', 
      value: todayStats.pendingAudit, 
      color: '#FF7D00', 
      bg: 'rgba(255, 125, 0, 0.1)',
      path: '/pages/audit-list/index'
    },
    { 
      label: '在场车辆', 
      value: todayStats.parkingNow, 
      color: '#165DFF', 
      bg: 'rgba(22, 93, 255, 0.1)',
      path: '/pages/parking-fee/index?tab=parking'
    },
    { 
      label: '待离场', 
      value: todayStats.pendingExit, 
      color: '#00B42A', 
      bg: 'rgba(0, 180, 42, 0.1)',
      path: '/pages/parking-fee/index?tab=paid'
    },
    { 
      label: '今日收费', 
      value: `¥${todayStats.todayFee}`, 
      color: '#F53F3F', 
      bg: 'rgba(245, 63, 63, 0.1)',
      path: '/pages/ledger/index'
    }
  ];

  const handleOverviewClick = (path: string) => {
    Taro.navigateTo({ url: path });
  };

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>👤</View>
          <View className={styles.userText}>
            <Text className={styles.userName}>张先生</Text>
            <Text className={styles.userRole}>5栋1502 · {currentRole === 'owner' ? '业主' : currentRole === 'property' ? '物业前台' : '访客'}</Text>
          </View>
        </View>
        <Text className={styles.welcomeText}>欢迎使用</Text>
        <Text className={styles.subText}>社区访客停车管理系统</Text>
      </View>

      <View className={styles.content}>
        {currentRole === 'property' && (
          <View className={styles.overviewCard}>
            <Text className={styles.overviewTitle}>今日概览</Text>
            <View className={styles.overviewGrid}>
              {overviewItems.map((item, index) => (
                <View 
                  key={index} 
                  className={styles.overviewItem}
                  onClick={() => handleOverviewClick(item.path)}
                  style={{ background: item.bg }}
                >
                  <Text className={styles.overviewValue} style={{ color: item.color }}>
                    {item.value}
                  </Text>
                  <Text className={styles.overviewLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

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
                {action.text === '消息通知' && unreadCount > 0 && (
                  <Text className={styles.actionBadge}>{unreadCount}</Text>
                )}
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
