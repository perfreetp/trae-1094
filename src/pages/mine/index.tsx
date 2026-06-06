import React from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useApp } from '@/store/appStore';

const MinePage: React.FC = () => {
  const { currentRole, invites, parkingRecords, messages, setCurrentRole } = useApp();

  const stats = [
    { label: '发起邀请', value: invites.length },
    { label: '停车记录', value: parkingRecords.length },
    { label: '未读消息', value: messages.filter(m => !m.isRead).length }
  ];

  const ownerMenus = [
    { icon: '📋', text: '通行记录', path: '' },
    { icon: '🚗', text: '我的车辆', path: '' },
    { icon: '📊', text: '停车账单', path: '/pages/parking-fee/index' },
    { icon: '💬', text: '投诉反馈', path: '/pages/feedback/index' },
    { icon: '⚙️', text: '设置', path: '' }
  ];

  const propertyMenus = [
    { icon: '✅', text: '审核列表', path: '/pages/audit-list/index', badge: String(invites.filter(i => i.status === 'pending').length) },
    { icon: '🎫', text: '入场放行', path: '/pages/entry/index' },
    { icon: '📊', text: '物业台账', path: '/pages/ledger/index' },
    { icon: '📤', text: '记录导出', path: '' },
    { icon: '⚠️', text: '黑名单管理', path: '' },
    { icon: '💬', text: '投诉处理', path: '/pages/feedback/index' },
    { icon: '⚙️', text: '系统设置', path: '' }
  ];

  const currentMenus = currentRole === 'property' ? propertyMenus : ownerMenus;

  const handleMenuClick = (path: string) => {
    if (path) {
      Taro.navigateTo({ url: path });
    } else {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
    }
  };

  const handleSwitchRole = () => {
    Taro.showActionSheet({
      itemList: ['业主', '访客', '物业前台'],
      success: (res) => {
        const roles: Array<'owner' | 'visitor' | 'property'> = ['owner', 'visitor', 'property'];
        setCurrentRole(roles[res.tapIndex]);
        Taro.showToast({ title: '切换成功', icon: 'success' });
      }
    });
  };

  const getRoleText = () => {
    const roleMap = { owner: '业主', visitor: '访客', property: '物业前台' };
    return roleMap[currentRole];
  };

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>👤</View>
          <View className={styles.userText}>
            <View style={{ display: 'flex', alignItems: 'center' }}>
              <Text className={styles.userName}>张先生</Text>
              <Text className={styles.roleTag}>{getRoleText()}</Text>
            </View>
            <Text className={styles.userDetail}>5栋1502 · 138****8000</Text>
          </View>
        </View>
      </View>

      <View className={styles.statsCard}>
        <View className={styles.statsRow}>
          {stats.map((stat, index) => (
            <View key={index} className={styles.statItem}>
              <Text className={styles.statValue}>{stat.value}</Text>
              <Text className={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.menuList}>
        {currentMenus.map((menu, index) => (
          <View 
            key={index} 
            className={styles.menuItem}
            onClick={() => handleMenuClick(menu.path)}
          >
            <View className={styles.menuIcon}>{menu.icon}</View>
            <Text className={styles.menuText}>{menu.text}</Text>
            {menu.badge && menu.badge !== '0' && <Text className={styles.menuBadge}>{menu.badge}</Text>}
            <Text className={styles.menuArrow}>›</Text>
          </View>
        ))}
      </View>

      <Button className={styles.switchRoleBtn} onClick={handleSwitchRole}>
        切换角色
      </Button>
    </ScrollView>
  );
};

export default MinePage;
