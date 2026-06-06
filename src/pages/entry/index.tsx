import React, { useState } from 'react';
import { View, Text, Button, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { InviteInfo } from '@/types';
import { mockInvites, mockVehicles } from '@/data/invites';
import { formatTime, generateParkingSpot } from '@/utils';

const EntryPage: React.FC = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [foundInvite, setFoundInvite] = useState<InviteInfo | null>(null);
  const [isScanned, setIsScanned] = useState(false);

  const handleScan = () => {
    Taro.scanCode({
      success: (res) => {
        const code = res.result.toUpperCase();
        setInviteCode(code);
        searchInvite(code);
      },
      fail: () => {
        Taro.showToast({ title: '扫码失败', icon: 'none' });
      }
    });
  };

  const handleCodeInput = (e: any) => {
    setInviteCode(e.detail.value.toUpperCase());
  };

  const searchInvite = (code: string) => {
    const invite = mockInvites.find(i => i.inviteCode === code);
    if (invite) {
      if (invite.status === 'approved') {
        const isBlacklist = mockVehicles.some(v => v.plateNumber === invite.plateNumber && v.isBlacklist);
        if (isBlacklist) {
          Taro.showModal({
            title: '黑名单提醒',
            content: '该车辆在黑名单中，是否继续放行？',
            success: (res) => {
              if (res.confirm) {
                setFoundInvite(invite);
                setIsScanned(true);
              }
            }
          });
        } else {
          setFoundInvite(invite);
          setIsScanned(true);
        }
      } else if (invite.status === 'pending') {
        Taro.showToast({ title: '邀请待审核中', icon: 'none' });
      } else if (invite.status === 'rejected') {
        Taro.showToast({ title: '邀请已被拒绝', icon: 'none' });
      } else if (invite.status === 'entered') {
        Taro.showToast({ title: '车辆已入场', icon: 'none' });
      } else if (invite.status === 'expired') {
        Taro.showToast({ title: '邀请已过期', icon: 'none' });
      }
    } else {
      Taro.showToast({ title: '邀请码无效', icon: 'none' });
    }
  };

  const handleSearch = () => {
    if (!inviteCode) {
      Taro.showToast({ title: '请输入邀请码', icon: 'none' });
      return;
    }
    searchInvite(inviteCode);
  };

  const handleConfirmEntry = () => {
    if (!foundInvite) return;
    
    const parkingSpot = foundInvite.parkingSpot || generateParkingSpot();
    
    Taro.showModal({
      title: '确认入场',
      content: `确认放行车辆 ${foundInvite.plateNumber}？分配车位：${parkingSpot}`,
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '登记中...' });
          setTimeout(() => {
            Taro.hideLoading();
            Taro.showToast({ title: '入场成功', icon: 'success' });
            
            Taro.vibrateShort({ type: 'medium' });
            
            setTimeout(() => {
              setInviteCode('');
              setFoundInvite(null);
              setIsScanned(false);
            }, 1500);
          }, 1000);
        }
      }
    });
  };

  const parkingSpot = foundInvite?.parkingSpot || (foundInvite ? generateParkingSpot() : '');

  return (
    <ScrollView scrollY className={styles.container}>
      {!isScanned ? (
        <View className={styles.scanSection}>
          <Text className={styles.scanTitle}>扫码入场</Text>
          
          <View className={styles.scanArea} onClick={handleScan}>
            <Text className={styles.scanIcon}>📷</Text>
          </View>
          
          <Text className={styles.scanTip}>点击扫描访客邀请二维码</Text>
          
          <View className={styles.inputGroup}>
            <Input
              className={styles.codeInput}
              placeholder='或输入6位邀请码'
              value={inviteCode}
              onInput={handleCodeInput}
              maxlength={6}
            />
            <Button className={styles.scanBtn} onClick={handleSearch}>
              查询
            </Button>
          </View>
        </View>
      ) : foundInvite ? (
        <View>
          <View className={styles.vehicleCard}>
            <Text className={styles.cardTitle}>车辆信息</Text>
            
            <View className={styles.plateDisplay}>
              <Text className={styles.plateBig}>{foundInvite.plateNumber}</Text>
              <Text className={styles.visitorName}>{foundInvite.visitorName}</Text>
            </View>
            
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>业主信息：</Text>
              <Text className={styles.infoValue}>{foundInvite.ownerName} · {foundInvite.building}{foundInvite.room}</Text>
            </View>
            
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>联系电话：</Text>
              <Text className={styles.infoValue}>{foundInvite.visitorPhone}</Text>
            </View>
            
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>有效时段：</Text>
              <Text className={styles.infoValue}>
                {formatTime(foundInvite.visitStartTime)} - {formatTime(foundInvite.visitEndTime)}
              </Text>
            </View>
            
            <View className={styles.spotInfo}>
              <Text className={styles.spotLabel}>分配车位：</Text>
              <Text className={styles.spotValue}>{parkingSpot}</Text>
            </View>
          </View>
          
          <Button className={styles.confirmBtn} onClick={handleConfirmEntry}>
            确认放行
          </Button>
        </View>
      ) : (
        <View className={styles.emptyState}>
          <View className={styles.emptyIcon}>🚗</View>
          <Text className={styles.emptyText}>请扫描二维码或输入邀请码</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default EntryPage;
