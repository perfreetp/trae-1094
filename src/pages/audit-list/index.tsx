import React, { useState } from 'react';
import { View, Text, Button, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { InviteInfo } from '@/types';
import { useApp } from '@/store/appStore';
import { formatTime, getStatusText, getStatusColor } from '@/utils';

const AuditListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [approveRemark, setApproveRemark] = useState<{ [key: string]: string }>({});
  const { invites, vehicles, approveInvite, rejectInvite, addBlacklist } = useApp();

  const tabs = [
    { key: 'pending', label: '待审核' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已拒绝' }
  ];

  const pendingCount = invites.filter(i => i.status === 'pending').length;
  const filteredInvites = invites.filter(i => i.status === activeTab);

  const checkBlacklist = (plateNumber: string) => {
    return vehicles.some(v => v.plateNumber === plateNumber && v.isBlacklist);
  };

  const getBlacklistReason = (plateNumber: string) => {
    const vehicle = vehicles.find(v => v.plateNumber === plateNumber);
    return vehicle?.blacklistReason || '';
  };

  const isVisitExpired = (visitEndTime: string) => {
    return new Date(visitEndTime) < new Date();
  };

  const handleApprove = (invite: InviteInfo) => {
    const isBlacklist = checkBlacklist(invite.plateNumber);
    const isExpired = isVisitExpired(invite.visitEndTime);

    if (isBlacklist) {
      Taro.showModal({
        title: '黑名单车辆警告',
        content: `该车辆（${invite.plateNumber}）在黑名单中：${getBlacklistReason(invite.plateNumber)}\n\n确认要特殊放行并添加备注吗？`,
        editable: true,
        placeholderText: '请输入放行原因',
        confirmColor: '#1677FF',
        success: (res) => {
          if (res.confirm) {
            approveInvite(invite.id, res.content || '黑名单车辆特殊放行');
            Taro.showToast({ title: '已通过', icon: 'success' });
          }
        }
      });
    } else if (isExpired) {
      Taro.showModal({
        title: '有效期已过',
        content: '该邀请的到访时段已过期，确认要通过吗？',
        success: (res) => {
          if (res.confirm) {
            approveInvite(invite.id);
            Taro.showToast({ title: '已通过', icon: 'success' });
          }
        }
      });
    } else {
      Taro.showModal({
        title: '确认通过',
        content: `确认通过访客 ${invite.visitorName} 的邀请申请？`,
        editable: true,
        placeholderText: '可选：填写备注信息',
        success: (res) => {
          if (res.confirm) {
            approveInvite(invite.id, res.content);
            Taro.showToast({ title: '审核通过', icon: 'success' });
          }
        }
      });
    }
  };

  const handleReject = (invite: InviteInfo) => {
    Taro.showModal({
      title: '拒绝原因',
      editable: true,
      placeholderText: '请输入拒绝原因',
      success: (res) => {
        if (res.confirm && res.content) {
          rejectInvite(invite.id, res.content);
          Taro.showToast({ title: '已拒绝', icon: 'success' });
        } else if (res.confirm) {
          Taro.showToast({ title: '请填写拒绝原因', icon: 'none' });
        }
      }
    });
  };

  const handleAddBlacklist = (invite: InviteInfo) => {
    Taro.showModal({
      title: '加入黑名单',
      editable: true,
      content: '请输入加入黑名单的原因',
      placeholderText: '例如：多次违规停车',
      success: (res) => {
        if (res.confirm && res.content) {
          addBlacklist(invite.plateNumber, res.content);
          rejectInvite(invite.id, '车辆已加入黑名单');
          Taro.showToast({ title: '已加入黑名单', icon: 'success' });
        } else if (res.confirm) {
          Taro.showToast({ title: '请填写原因', icon: 'none' });
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
          setApproveRemark(prev => ({ ...prev, [invite.id]: res.content || '' }));
          Taro.showToast({ title: '备注已添加', icon: 'success' });
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
        filteredInvites.map((invite) => {
          const isBlacklist = checkBlacklist(invite.plateNumber);
          const isExpired = isVisitExpired(invite.visitEndTime);
          
          return (
            <View key={invite.id} className={classnames(styles.auditCard, isBlacklist && styles.hasBlacklistWarning)}>
              <View className={styles.cardHeader}>
                <View className={styles.visitorInfo}>
                  <Text className={styles.visitorName}>{invite.visitorName}</Text>
                  <Text className={styles.plateNumber}>{invite.plateNumber}</Text>
                </View>
                <View className={styles.headerRight}>
                  <Text 
                    className={classnames(
                      styles.statusTag,
                      isExpired && activeTab === 'pending' && styles.expired
                    )}
                    style={{ color: getStatusColor(invite.status), backgroundColor: `${getStatusColor(invite.status)}15` }}
                  >
                    {isExpired && activeTab === 'pending' ? '已过期' : getStatusText(invite.status)}
                  </Text>
                </View>
              </View>

              {isBlacklist && (
                <View className={styles.blacklistWarning}>
                  <View className={styles.warningHeader}>
                    <Text className={styles.warningIcon}>🚫</Text>
                    <Text className={styles.warningTitle}>黑名单车辆</Text>
                  </View>
                  <Text className={styles.warningText}>
                    原因：{getBlacklistReason(invite.plateNumber)}
                  </Text>
                  {invite.status === 'pending' && (
                    <View className={styles.blacklistActions}>
                      <Button 
                        className={classnames(styles.btnSmall, styles.btnBlacklist)}
                        onClick={() => handleAddBlacklist(invite)}
                      >
                        确认拉黑
                      </Button>
                      <Button 
                        className={classnames(styles.btnSmall, styles.btnSpecial)}
                        onClick={() => handleApprove(invite)}
                      >
                        特殊放行
                      </Button>
                    </View>
                  )}
                </View>
              )}

              {isExpired && activeTab === 'pending' && !isBlacklist && (
                <View className={classnames(styles.blacklistWarning, styles.expiredWarning)}>
                  <Text className={styles.warningIcon}>⏰</Text>
                  <Text className={styles.warningText}>到访时段已过期</Text>
                </View>
              )}

              <View className={styles.infoGrid}>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>业主</Text>
                  <Text className={styles.infoValue}>{invite.ownerName}</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>楼栋</Text>
                  <Text className={styles.infoValue}>{invite.building} {invite.room}</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>电话</Text>
                  <Text className={styles.infoValue}>{invite.visitorPhone}</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>申请时间</Text>
                  <Text className={styles.infoValue}>{formatTime(invite.createTime)}</Text>
                </View>
              </View>

              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>到访时段：</Text>
                <Text className={classnames(styles.infoValue, isExpired && styles.expiredText)}>
                  {formatTime(invite.visitStartTime)} - {formatTime(invite.visitEndTime)}
                </Text>
              </View>

              {invite.parkingSpot && (
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>分配车位：</Text>
                  <Text className={styles.infoValue} style={{ color: '#1677FF', fontWeight: '600' }}>
                    {invite.parkingSpot}
                  </Text>
                </View>
              )}

              {invite.remark && (
                <View className={styles.remarkBox}>
                  <Text className={styles.remarkLabel}>备注：</Text>
                  <Text className={styles.remarkText}>{invite.remark}</Text>
                </View>
              )}

              {invite.approveTime && (
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>审核时间：</Text>
                  <Text className={styles.infoValue}>{formatTime(invite.approveTime)}</Text>
                </View>
              )}

              {invite.status === 'pending' && (
                <View className={styles.actionButtons}>
                  <Button className={styles.btnRemark} onClick={() => handleRemark(invite)}>
                    备注
                  </Button>
                  <Button className={styles.btnReject} onClick={() => handleReject(invite)}>
                    拒绝
                  </Button>
                  <Button className={styles.btnApprove} onClick={() => handleApprove(invite)}>
                    通过
                  </Button>
                </View>
              )}
            </View>
          );
        })
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
