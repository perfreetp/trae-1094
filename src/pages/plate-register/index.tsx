import React, { useState } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { VehicleInfo } from '@/types';
import { mockVehicles } from '@/data/vehicles';
import { validatePlateNumber } from '@/utils';

const PlateRegisterPage: React.FC = () => {
  const [plateNumber, setPlateNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [plateError, setPlateError] = useState('');
  
  const [quickVehicles] = useState<VehicleInfo[]>(
    mockVehicles.filter(v => !v.isBlacklist && v.visitCount >= 3)
  );

  const handlePlateChange = (e: any) => {
    const value = e.detail.value.toUpperCase();
    setPlateNumber(value);
    if (value && !validatePlateNumber(value)) {
      setPlateError('请输入正确的车牌号格式');
    } else {
      setPlateError('');
    }
  };

  const handleQuickSelect = (vehicle: VehicleInfo) => {
    setPlateNumber(vehicle.plateNumber);
    setOwnerName(vehicle.ownerName);
    setPhone(vehicle.ownerPhone);
    Taro.showToast({
      title: '已快捷填充',
      icon: 'success'
    });
  };

  const handleBuildingSelect = () => {
    Taro.showActionSheet({
      itemList: ['1栋', '2栋', '3栋', '5栋', '8栋', '10栋'],
      success: (res) => {
        const buildings = ['1栋', '2栋', '3栋', '5栋', '8栋', '10栋'];
        setBuilding(buildings[res.tapIndex]);
      }
    });
  };

  const handleSubmit = () => {
    if (!plateNumber) {
      Taro.showToast({ title: '请输入车牌号', icon: 'none' });
      return;
    }
    if (!validatePlateNumber(plateNumber)) {
      Taro.showToast({ title: '请输入正确的车牌号', icon: 'none' });
      return;
    }
    if (!ownerName) {
      Taro.showToast({ title: '请输入车主姓名', icon: 'none' });
      return;
    }
    if (!phone) {
      Taro.showToast({ title: '请输入联系电话', icon: 'none' });
      return;
    }
    if (!building) {
      Taro.showToast({ title: '请选择到访楼栋', icon: 'none' });
      return;
    }

    const isBlacklist = mockVehicles.some(v => v.plateNumber === plateNumber && v.isBlacklist);
    if (isBlacklist) {
      Taro.showModal({
        title: '黑名单提醒',
        content: '该车辆在黑名单中，是否继续登记？',
        success: (res) => {
          if (res.confirm) {
            submitRegistration();
          }
        }
      });
    } else {
      submitRegistration();
    }
  };

  const submitRegistration = () => {
    Taro.showLoading({ title: '提交中...' });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showToast({
        title: '登记成功',
        icon: 'success'
      });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    }, 1000);
  };

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.formCard}>
        <Text className={styles.formTitle}>车辆信息登记</Text>
        
        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.required}>*</Text>车牌号码
          </Text>
          <View className={styles.inputWrapper}>
            <Input
              className={classnames(styles.formInput, styles.plateInput)}
              placeholder='请输入车牌号，如：京A12345'
              value={plateNumber}
              onInput={handlePlateChange}
              maxlength={8}
            />
          </View>
          {plateError ? (
            <Text className={styles.errorText}>{plateError}</Text>
          ) : (
            <Text className={styles.tipText}>请输入完整车牌号，支持新能源车牌</Text>
          )}
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.required}>*</Text>车主姓名
          </Text>
          <Input
            className={styles.formInput}
            placeholder='请输入车主姓名'
            value={ownerName}
            onInput={(e) => setOwnerName(e.detail.value)}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.required}>*</Text>联系电话
          </Text>
          <Input
            className={styles.formInput}
            type='number'
            placeholder='请输入联系电话'
            value={phone}
            onInput={(e) => setPhone(e.detail.value)}
            maxlength={11}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.required}>*</Text>到访楼栋
          </Text>
          <View className={styles.buildingPicker} onClick={handleBuildingSelect}>
            <Text className={classnames(styles.pickerText, !building && styles.pickerPlaceholder)}>
              {building || '请选择到访楼栋'}
            </Text>
            <Text className={styles.pickerArrow}>›</Text>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>房间号（选填）</Text>
          <Input
            className={styles.formInput}
            placeholder='请输入房间号，如：1502'
            value={room}
            onInput={(e) => setRoom(e.detail.value)}
          />
        </View>

        <Button className={styles.submitBtn} onClick={handleSubmit}>
          提交登记
        </Button>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>常用车辆（快捷登记）</Text>
        </View>
        
        {quickVehicles.length > 0 ? (
          <View className={styles.quickList}>
            {quickVehicles.map((vehicle) => (
              <View key={vehicle.id} className={styles.quickItem}>
                <Text className={styles.quickPlate}>{vehicle.plateNumber}</Text>
                <View className={styles.quickInfo}>
                  <Text className={styles.quickName}>{vehicle.ownerName}</Text>
                  <Text className={styles.quickTime}>到访 {vehicle.visitCount} 次</Text>
                </View>
                <Button 
                  className={styles.quickBtn} 
                  onClick={() => handleQuickSelect(vehicle)}
                >
                  快捷登记
                </Button>
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <View className={styles.emptyIcon}>🚗</View>
            <Text className={styles.emptyText}>暂无常用车辆</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default PlateRegisterPage;
