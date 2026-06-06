import React, { useState } from 'react';
import { View, Text, Button, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { InviteInfo } from '@/types';
import { useApp } from '@/store/appStore';
import { formatTime } from '@/utils';

type ValidationResult = {
  valid: boolean;
  message: string;
  level: 'error' | 'warning' | 'success';
};

const EntryPage: React.FC = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [foundInvite, setFoundInvite] = useState<InviteInfo | null>(null);
  const [isScanned, setIsScanned] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { invites, vehicles, parkingRecords, confirmEntry } = useApp();

  const validateInvite = (invite: InviteInfo): ValidationResult => {
    const isBlacklist = vehicles.some(v => v.plateNumber === invite.plateNumber && v.isBlacklist);
    if (isBlacklist) {
      const vehicle = vehicles.find(v => v.plateNumber === invite.plateNumber);
      return {
        valid: false,
        message: `黑名单车辆：${vehicle?.blacklistReason || '无原因'}`,
        level: 'error'
      };
    }

    const now = new Date();
    if (new Date(invite.visitEndTime) < now) {
      return {
        valid: false,
        message: '邀请已过期',
        level: 'error'
      };
    }

    if (new Date(invite.visitStartTime) > now) {
      return {
        valid: false,
        message: '邀请尚未生效',
        level: 'warning'
      };
    }

    if (invite.status === 'rejected') {
      return {
        valid: false,
        message: '邀请已被拒绝',
        level: 'error'
      };
    }

    if (invite.status === 'pending') {
      return {
        valid: false,
        message: '邀请待审核中',
        level: 'warning'
      };
    }

    if (invite.status === 'entered') {
      return {
        valid: false,
        message: '车辆已入场',
        level: 'error'
      };
    }

    if (invite.status === 'exited') {
      return {
        valid: false,
        message: '车辆已离场',
        level: 'error'
      };
    }

    if (invite.status !== 'approved') {
      return {
        valid: false,
        message: '邀请状态异常',
        level: 'error'
      };
    }

    const alreadyParking = parkingRecords.some(
      r => r.plateNumber === invite.plateNumber && r.status === 'parking'
    );
    if (alreadyParking) {
      return {
        valid: false,
        message: '该车辆已在场内停车',
        level: 'error'
      };
    }

    return {
      valid: true,
      message: '校验通过，可以入场',
      level: 'success'
    };
  };

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
    const invite = invites.find(i => i.inviteCode === code);
    if (invite) {
      const validation = validateInvite(invite);
      setValidationResult(validation);
      
      if (validation.level === 'error') {
        Taro.showModal({
          title: validation.level === 'error' ? '禁止入场' : '提示',
          content: validation.message,
          showCancel: false
        });
        setFoundInvite(invite);
        setIsScanned(true);
      } else {
        setFoundInvite(invite);
        setIsScanned(true);
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
    
    const validation = validateInvite(foundInvite);
    if (!validation.valid) {
      Taro.showModal({
        title: '无法入场',
        content: validation.message,
        showCancel: false
      });
      return;
    }

    Taro.showModal({
      title: '确认入场',
      content: `确认放行车辆 ${foundInvite.plateNumber}（${foundInvite.visitorName}）？\n分配车位：${foundInvite.parkingSpot || '自动分配'}`,
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '登记中...' });
          const success = confirmEntry(foundInvite.id);
          setTimeout(() => {
            Taro.hideLoading();
            if (success) {
              Taro.showToast({ title: '入场成功', icon: 'success' });
              Taro.vibrateShort({ type: 'medium' });
              setTimeout(() => {
                setInviteCode('');
                setFoundInvite(null);
                setIsScanned(false);
                setValidationResult(null);
              }, 1500);
            } else {
              Taro.showToast({ title: '入场失败，请重试', icon: 'none' });
            }
          }, 800);
        }
      }
    });
  };

  const handleReset = () => {
    setInviteCode('');
    setFoundInvite(null);
    setIsScanned(false);
    setValidationResult(null);
  };

  return (
    <ScrollView scrollY className={styles.container}>
      {!isScanned ? (
        <View className={styles.scanSection}>
          <Text className={styles.scanTitle}>访客入场登记</Text>
          
          <View className={styles.scanArea} onClick={handleScan}>
            <View className={styles.scanFrame}>
              <Text className={styles.scanIcon}>📷</Text>
              <Text className={styles.scanText}>扫描二维码</Text>
            </View>
          </View>
          
          <View className={styles.divider}>
            <View className={styles.dividerLine} />
            <Text className={styles.dividerText}>或</Text>
            <View className={styles.dividerLine} />
          </View>
          
          <View className={styles.inputGroup}>
            <Input
              className={styles.codeInput}
              placeholder='输入6位邀请码'
              value={inviteCode}
              onInput={handleCodeInput}
              maxlength={6}
            />
            <Button className={styles.searchBtn} onClick={handleSearch}>
              查询
            </Button>
          </View>
          
          <View className={styles.tips}>
            <Text className={styles.tipsTitle}>入场须知</Text>
            <Text className={styles.tipsItem}>• 请确保邀请码有效且在有效期内</Text>
            <Text className={styles.tipsItem}>• 首小时免费，超出后每小时5元</Text>
            <Text className={styles.tipsItem}>• 单日最高50元封顶</Text>
          </View>
        </View>
      ) : foundInvite ? (
        <View className={styles.resultSection}>
          <View className={styles.vehicleCard}>
            <View className={styles.cardHeader}>
              <Text className={styles.cardTitle}>车辆信息</Text>
              <Text 
                className={classnames(
                  styles.validationTag,
                  styles[`validation${validationResult?.level || 'success'}`]
                )}
              >
                {validationResult?.message || '校验通过'}
              </Text>
            </View>
            
            <View className={styles.plateDisplay}>
              <Text className={styles.plateBig}>{foundInvite.plateNumber}</Text>
              <Text className={styles.visitorName}>{foundInvite.visitorName}</Text>
            </View>
            
            <View className={styles.infoGrid}>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>业主</Text>
                <Text className={styles.infoValue}>{foundInvite.ownerName}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>楼栋</Text>
                <Text className={styles.infoValue}>{foundInvite.building} {foundInvite.room}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>电话</Text>
                <Text className={styles.infoValue}>{foundInvite.visitorPhone}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>状态</Text>
                <Text className={classnames(styles.infoValue, styles.statusValue)}>
                  {validationResult?.valid ? '可入场' : '不可入场'}
                </Text>
              </View>
            </View>
            
            <View className={styles.timeSection}>
              <Text className={styles.timeLabel}>有效时段</Text>
              <Text className={styles.timeValue}>
                {formatTime(foundInvite.visitStartTime)}
              </Text>
              <Text className={styles.timeDash}>-</Text>
              <Text className={styles.timeValue}>
                {formatTime(foundInvite.visitEndTime)}
              </Text>
            </View>
            
            {foundInvite.parkingSpot && (
              <View className={styles.spotInfo}>
                <View className={styles.spotBox}>
                  <Text className={styles.spotLabel}>分配车位</Text>
                  <Text className={styles.spotValue}>{foundInvite.parkingSpot}</Text>
                </View>
              </View>
            )}

            {foundInvite.remark && (
              <View className={styles.remarkBox}>
                <Text className={styles.remarkLabel}>📝 备注：{foundInvite.remark}</Text>
              </View>
            )}
          </View>
          
          <View className={styles.actionButtons}>
            <Button className={styles.resetBtn} onClick={handleReset}>
              返回
            </Button>
            <Button 
              className={classnames(styles.confirmBtn, !validationResult?.valid && styles.confirmDisabled)} 
              onClick={handleConfirmEntry}
              disabled={!validationResult?.valid}
            >
              确认放行
            </Button>
          </View>
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
