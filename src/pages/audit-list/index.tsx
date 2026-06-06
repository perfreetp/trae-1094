import React, { useState } from 'react';
import { View, Text, Button, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { InviteInfo } from '@/types';
import { mockInvites, mockVehicles } from '@/data/invites';
import { formatTime, getStatusText, getStatusColor, generateParkingSpot } from '@/utils';

const AuditListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [invites, setInvites] = useState<InviteInfo[]>(mockInvites);

  const tabs = [
    { key: 'pending', label: '待审核' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已拒绝' }
  ];

  const pendingCount = invites.filter(i => i.status === 'pending').length;

  const filteredInvites = invites.filter(i => i.status === activeTab);

  const checkBlacklist = (plateNumber: string) => {
    return mockVehicles.some(v => v.plateNumber === plateNumber && v.isBlacklist);
  };

  const getBlacklistReason = (plateNumber: string) => {
    const vehicle = mockVehicles.find(v => v.plateNumber === plateNumber);
    return vehicle?.blacklistReason || '';
  };

  const handleApprove = (invite: InviteInfo) => {
    Taro.showModal({
      title: '确认通过',
      content: `确认通过访客 ${invite.visitorName} 的邀请申请？`,
      success: (res) => {
        if (res.confirm) {
          const parkingSpot = generateParkingSpot();
          setInvites(prev => prev.map(i => 
            i.id === invite.id 
              ? { ...i, status: 'approved', approveTime: new Date().toISOString(), parkingSpot }
              : i
          ));
          Taro.showToast({ title: '审核通过', icon: 'success' });
        }
      }
    });
  };

  const handleReject = (invite: InviteInfo) => {
    Taro.showModal({
      title: '拒绝原因',
      editable: true,
      placeholderText: '请输入拒绝原因',
      success: (res) => {
        if (res.confirm) {
          setInvites(prev => prev.map(i => 
            i.id === invite.id 
              ? { ...i, status: 'rejected', approveTime: new Date().toISOString(), remark: res.content }
              : i
          ));
          Taro.showToast({ title: '已拒绝', icon: 'success' });
        }
      }
    });
  };

  const handleRemark = (invite: InviteInfo) => {
    Taro.showModal({
      title: '添加备注',
      editable: true,
      content: invite.remark || '',
      placeholderText: '请输入备注信息',
      success: (res) => {
        if (res.confirm) {
          setInvites(prev => prev.map(i => 
            i.id === invite.id ? { ...i, remark: res.content } : i
          ));
          Taro.showToast({ title: '备注已添加', icon: 'success' });
        }
      }
    });
  };

  const handleAddBlacklist = (invite: InviteInfo) => {
    Taro.showModal({
      title: '加入黑名单',
      content: `确定将车牌号 ${invite.plateNumber} 加入黑名单吗？`,
      success: (res) => {
        if (res.confirm) {
          setInvites(prev => prev.map(i => 
            i.id === invite.id ? { ...i, isBlacklist: true } : i
          ));
          Taro.showToast({ title: '已加入黑名单', icon: 'success' });
        }
      }
    });
  };

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.tabs}>
        {tabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key === 'pending' && pendingCount > 0 && (
              <Text className={styles.tabBadge}>{pendingCount}</Text>
            )}
          </View>
        ))}
      </View>

      {filteredInvites.length > 0 ? (
        filteredInvites.map((invite) => (
          <View key={invite.id} className={styles.auditCard}>
            <View className={styles.cardHeader}>
              <View className={styles.visitorInfo}>
                <Text className={styles.visitorName}>{invite.visitorName}</Text>
                <Text className={styles.plateNumber}>{invite.plateNumber}</Text>
              </View>
              <View>
                <Text 
                  className={styles.statusTag}
                  style={{ color: getStatusColor(invite.status), backgroundColor: `${getStatusColor(invite.status)}15` }}
                >
                  {getStatusText(invite.status)}
                </Text>
                {invite.status === 'pending' && (
                  <Button className={styles.btnRemark} onClick={() => handleRemark(invite)}>
                    备注
                  </Button>
                )}
              </View>
            </View>

            {checkBlacklist(invite.plateNumber) && (
              <View className={styles.blacklistWarning}>
                <Text className={styles.warningIcon}>⚠️</Text>
                <Text className={styles.warningText}>
                  该车辆在黑名单中：{getBlacklistReason(invite.plateNumber)}
                </Text>
                {invite.status === 'pending' && (
                  <Button 
                    className={styles.btnRemark} 
                    onClick={() => handleAddBlacklist(invite)}
                    style={{ background: 'rgba(245, 63, 63, 0.1)', color: '#F53F3F' }}
                  >
                    拉黑
                  </Button>
                )}
              </View>
            )}

            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>业主信息：</Text>
              <Text className={styles.infoValue}>{invite.ownerName} · {invite.building}{invite.room}</Text>
            </View>

            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>联系电话：</Text>
              <Text className={styles.infoValue}>{invite.visitorPhone}</Text>
            </View>

            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>到访时段：</Text>
              <Text className={styles.infoValue}>
                {formatTime(invite.visitStartTime)} - {formatTime(invite.visitEndTime)}
              </Text>
            </View>

            {invite.remark && (
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>备注：</Text>
                <Text className={styles.infoValue} style={{ color: '#FF7D00' }}>{invite.remark}</Text>
              </View>
            )}

            {invite.status === 'pending' && (
              <View className={styles.actionButtons}>
                <Button className={styles.btnReject} onClick={() => handleReject(invite)}>
                  拒绝
                </Button>
                <Button className={styles.btnApprove} onClick={() => handleApprove(invite)}>
                  通过
                </Button>
              </View>
            )}
          </View>
        ))
      ) : (
        <View className={styles.emptyState}>
          <View className={styles.emptyIcon}>📋</View>
          <Text className={styles.emptyText}>暂无{activeTab === 'pending' ? '待审核' : activeTab === 'approved' ? '已通过' : '已拒绝'}记录</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default AuditListPage;
