import React, { useState, useEffect } from 'react';
import { View, Text, Button, Input, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { InviteInfo } from '@/types';
import { mockInvites } from '@/data/invites';
import { formatTime, getStatusText, getStatusColor, generateInviteCode, generateParkingSpot } from '@/utils';

const InviteDetailPage: React.FC = () => {
  const router = useRouter();
  const { id, new: isNew } = router.params;
  
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [visitStartTime, setVisitStartTime] = useState('');
  const [visitEndTime, setVisitEndTime] = useState('');

  useEffect(() => {
    if (isNew) {
      setIsCreateMode(true);
      setBuilding('5栋');
      setRoom('1502');
    } else if (id) {
      const found = mockInvites.find(i => i.id === id);
      if (found) {
        setInvite(found);
      }
    }
  }, [id, isNew]);

  const handleBuildingSelect = () => {
    Taro.showActionSheet({
      itemList: ['1栋', '2栋', '3栋', '5栋', '8栋', '10栋'],
      success: (res) => {
        const buildings = ['1栋', '2栋', '3栋', '5栋', '8栋', '10栋'];
        setBuilding(buildings[res.tapIndex]);
      }
    });
  };

  const handleStartTimeSelect = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    Taro.showActionSheet({
      itemList: ['今天 09:00', '今天 10:00', '今天 14:00', '明天 09:00', '明天 14:00', '自定义'],
      success: (res) => {
        const times = [
          `${year}-${month}-${day} 09:00:00`,
          `${year}-${month}-${day} 10:00:00`,
          `${year}-${month}-${day} 14:00:00`,
          `${year}-${month}-${Number(day) + 1} 09:00:00`,
          `${year}-${month}-${Number(day) + 1} 14:00:00`
        ];
        if (res.tapIndex < 5) {
          setVisitStartTime(times[res.tapIndex]);
        }
      }
    });
  };

  const handleEndTimeSelect = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    Taro.showActionSheet({
      itemList: ['今天 12:00', '今天 18:00', '今天 22:00', '明天 12:00', '明天 18:00', '自定义'],
      success: (res) => {
        const times = [
          `${year}-${month}-${day} 12:00:00`,
          `${year}-${month}-${day} 18:00:00`,
          `${year}-${month}-${day} 22:00:00`,
          `${year}-${month}-${Number(day) + 1} 12:00:00`,
          `${year}-${month}-${Number(day) + 1} 18:00:00`
        ];
        if (res.tapIndex < 5) {
          setVisitEndTime(times[res.tapIndex]);
        }
      }
    });
  };

  const handleShare = () => {
    Taro.showActionSheet({
      itemList: ['微信分享', '复制邀请码', '保存二维码'],
      success: (res) => {
        if (res.tapIndex === 1 && invite) {
          Taro.setClipboardData({
            data: invite.inviteCode,
            success: () => {
              Taro.showToast({ title: '邀请码已复制', icon: 'success' });
            }
          });
        } else {
          Taro.showToast({ title: '功能开发中', icon: 'none' });
        }
      }
    });
  };

  const handleCreateInvite = () => {
    if (!visitorName) {
      Taro.showToast({ title: '请输入访客姓名', icon: 'none' });
      return;
    }
    if (!visitorPhone) {
      Taro.showToast({ title: '请输入访客电话', icon: 'none' });
      return;
    }
    if (!plateNumber) {
      Taro.showToast({ title: '请输入车牌号', icon: 'none' });
      return;
    }
    if (!building) {
      Taro.showToast({ title: '请选择楼栋', icon: 'none' });
      return;
    }
    if (!room) {
      Taro.showToast({ title: '请输入房间号', icon: 'none' });
      return;
    }
    if (!visitStartTime) {
      Taro.showToast({ title: '请选择开始时间', icon: 'none' });
      return;
    }
    if (!visitEndTime) {
      Taro.showToast({ title: '请选择结束时间', icon: 'none' });
      return;
    }

    Taro.showLoading({ title: '创建中...' });
    setTimeout(() => {
      Taro.hideLoading();
      const newInvite: InviteInfo = {
        id: String(Date.now()),
        inviteCode: generateInviteCode(),
        ownerId: 'o1',
        ownerName: '张先生',
        visitorName,
        visitorPhone,
        plateNumber: plateNumber.toUpperCase(),
        building,
        room,
        visitStartTime,
        visitEndTime,
        status: 'approved',
        parkingSpot: generateParkingSpot(),
        createTime: new Date().toISOString(),
        approveTime: new Date().toISOString()
      };
      setInvite(newInvite);
      setIsCreateMode(false);
      Taro.showToast({ title: '邀请创建成功', icon: 'success' });
    }, 1000);
  };

  const handleInvalidate = () => {
    Taro.showModal({
      title: '作废邀请',
      content: '确定要作废这个邀请吗？',
      success: (res) => {
        if (res.confirm) {
          if (invite) {
            setInvite({ ...invite, status: 'expired' });
          }
          Taro.showToast({ title: '邀请已作废', icon: 'success' });
        }
      }
    });
  };

  if (isCreateMode) {
    return (
      <ScrollView scrollY className={styles.container}>
        <View className={styles.formCard}>
          <Text className={styles.cardTitle}>发起访客邀请</Text>
          
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>访客姓名
            </Text>
            <Input
              className={styles.formInput}
              placeholder='请输入访客姓名'
              value={visitorName}
              onInput={(e) => setVisitorName(e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>联系电话
            </Text>
            <Input
              className={styles.formInput}
              type='number'
              placeholder='请输入访客手机号'
              value={visitorPhone}
              onInput={(e) => setVisitorPhone(e.detail.value)}
              maxlength={11}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>车牌号码
            </Text>
            <Input
              className={classnames(styles.formInput, styles.plateInput)}
              placeholder='请输入车牌号，如：京A12345'
              value={plateNumber}
              onInput={(e) => setPlateNumber(e.detail.value.toUpperCase())}
              maxlength={8}
            />
          </View>

          <View className={styles.buildingRow}>
            <View className={styles.buildingItem}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>到访楼栋
              </Text>
              <View className={styles.timePicker} onClick={handleBuildingSelect}>
                <Text className={classnames(styles.pickerText, !building && styles.pickerPlaceholder)}>
                  {building || '请选择'}
                </Text>
                <Text>›</Text>
              </View>
            </View>
            <View className={styles.buildingItem}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>房间号
              </Text>
              <Input
                className={styles.formInput}
                placeholder='如：1502'
                value={room}
                onInput={(e) => setRoom(e.detail.value)}
              />
            </View>
          </View>

          <View className={styles.timeRow}>
            <View className={styles.timeItem}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>开始时间
              </Text>
              <View className={styles.timePicker} onClick={handleStartTimeSelect}>
                <Text className={classnames(styles.pickerText, !visitStartTime && styles.pickerPlaceholder)}>
                  {visitStartTime ? formatTime(visitStartTime) : '请选择'}
                </Text>
                <Text>›</Text>
              </View>
            </View>
            <View className={styles.timeItem}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>结束时间
              </Text>
              <View className={styles.timePicker} onClick={handleEndTimeSelect}>
                <Text className={classnames(styles.pickerText, !visitEndTime && styles.pickerPlaceholder)}>
                  {visitEndTime ? formatTime(visitEndTime) : '请选择'}
                </Text>
                <Text>›</Text>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.bottomActions}>
          <Button className={styles.btnSecondary} onClick={() => Taro.navigateBack()}>
            取消
          </Button>
          <Button className={styles.btnPrimary} onClick={handleCreateInvite}>
            提交邀请
          </Button>
        </View>
      </ScrollView>
    );
  }

  if (!invite) {
    return (
      <View className={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.inviteCodeCard}>
        <Text className={styles.codeLabel}>邀请码</Text>
        <Text className={styles.codeValue}>{invite.inviteCode}</Text>
        
        <View className={styles.qrCodeArea}>
          <Text className={styles.qrIcon}>📱</Text>
        </View>
        
        <View className={styles.statusRow}>
          <Text 
            className={styles.statusTag}
            style={{ color: getStatusColor(invite.status), backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            {getStatusText(invite.status)}
          </Text>
        </View>
        
        <Text className={styles.codeTips}>访客出示此二维码或邀请码即可入场</Text>
      </View>

      <View className={styles.detailCard}>
        <Text className={styles.cardTitle}>访客信息</Text>
        
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>访客姓名：</Text>
          <Text className={styles.infoValue}>{invite.visitorName}</Text>
        </View>
        
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>联系电话：</Text>
          <Text className={styles.infoValue}>{invite.visitorPhone}</Text>
        </View>
        
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>车牌号码：</Text>
          <Text className={styles.infoValue} style={{ color: '#165DFF', fontWeight: 600 }}>{invite.plateNumber}</Text>
        </View>
      </View>

      <View className={styles.detailCard}>
        <Text className={styles.cardTitle}>到访信息</Text>
        
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>业主信息：</Text>
          <Text className={styles.infoValue}>{invite.ownerName} · {invite.building}{invite.room}</Text>
        </View>
        
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>到访时段：</Text>
          <Text className={styles.infoValue}>
            {formatTime(invite.visitStartTime)} - {formatTime(invite.visitEndTime)}
          </Text>
        </View>
        
        {invite.parkingSpot && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>分配车位：</Text>
            <Text className={styles.infoValue} style={{ color: '#00B42A', fontWeight: 600 }}>{invite.parkingSpot}</Text>
          </View>
        )}
        
        {invite.enterTime && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>入场时间：</Text>
            <Text className={styles.infoValue}>{formatTime(invite.enterTime)}</Text>
          </View>
        )}
        
        {invite.exitTime && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>离场时间：</Text>
            <Text className={styles.infoValue}>{formatTime(invite.exitTime)}</Text>
          </View>
        )}
        
        {invite.parkingFee !== undefined && invite.parkingFee > 0 && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>停车费用：</Text>
            <Text className={styles.infoValue} style={{ color: '#F53F3F', fontWeight: 600 }}>¥{invite.parkingFee}</Text>
          </View>
        )}
        
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>创建时间：</Text>
          <Text className={styles.infoValue}>{formatTime(invite.createTime)}</Text>
        </View>
      </View>

      <View className={styles.bottomActions}>
        {invite.status === 'approved' && (
          <>
            <Button className={styles.btnSecondary} onClick={handleInvalidate}>
              作废邀请
            </Button>
            <Button className={styles.btnPrimary} onClick={handleShare}>
              分享邀请
            </Button>
          </>
        )}
        {(invite.status === 'entered' || invite.status === 'exited') && (
          <Button className={styles.btnPrimary} onClick={handleShare}>
            分享邀请
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

export default InviteDetailPage;
