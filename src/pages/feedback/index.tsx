import React, { useState } from 'react';
import { View, Text, Button, Textarea, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { FeedbackInfo } from '@/types';
import { useApp } from '@/store/appStore';
import { formatTime, getStatusText, getStatusColor } from '@/utils';

const FeedbackPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('submit');
  const { feedbacks, currentRole, submitFeedback, replyFeedback } = useApp();
  
  const [feedbackType, setFeedbackType] = useState('');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');

  const types = ['车位问题', '收费问题', '系统问题', '服务态度', '设施故障', '其他'];

  const handleSubmit = () => {
    if (!feedbackType) {
      Taro.showToast({ title: '请选择反馈类型', icon: 'none' });
      return;
    }
    if (!content.trim()) {
      Taro.showToast({ title: '请输入反馈内容', icon: 'none' });
      return;
    }
    if (!contact) {
      Taro.showToast({ title: '请输入联系方式', icon: 'none' });
      return;
    }

    Taro.showLoading({ title: '提交中...' });
    setTimeout(() => {
      Taro.hideLoading();
      submitFeedback({
        type: feedbackType,
        content: content,
        contact: contact
      });
      Taro.showToast({ title: '提交成功', icon: 'success' });
      setFeedbackType('');
      setContent('');
      setContact('');
      setActiveTab('list');
    }, 800);
  };

  const handleReply = (feedback: FeedbackInfo) => {
    Taro.showActionSheet({
      itemList: ['标记处理中', '标记已解决并回复'],
      success: (res) => {
        if (res.tapIndex === 0) {
          replyFeedback(feedback.id, '物业正在处理您的反馈，请耐心等待', 'processing');
          Taro.showToast({ title: '已标记处理中', icon: 'success' });
        } else if (res.tapIndex === 1) {
          Taro.showModal({
            title: '回复反馈',
            editable: true,
            placeholderText: '请输入回复内容',
            success: (modalRes) => {
              if (modalRes.confirm && modalRes.content) {
                replyFeedback(feedback.id, modalRes.content, 'resolved');
                Taro.showToast({ title: '回复成功', icon: 'success' });
              }
            }
          });
        }
      }
    });
  };

  const pendingCount = feedbacks.filter(f => f.status === 'pending').length;

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.tabs}>
        <View
          className={classnames(styles.tabItem, activeTab === 'submit' && styles.active)}
          onClick={() => setActiveTab('submit')}
        >
          我要反馈
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'list' && styles.active)}
          onClick={() => setActiveTab('list')}
        >
          反馈记录
          {pendingCount > 0 && (
            <Text className={styles.tabBadge}>{pendingCount}</Text>
          )}
        </View>
      </View>

      {activeTab === 'submit' ? (
        <View className={styles.formCard}>
          <Text className={styles.formTitle}>提交反馈</Text>
          
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>反馈类型
            </Text>
            <View className={styles.typeSelect}>
              {types.map((type) => (
                <View
                  key={type}
                  className={classnames(styles.typeTag, feedbackType === type && styles.active)}
                  onClick={() => setFeedbackType(type)}
                >
                  {type}
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>问题描述
            </Text>
            <Textarea
              className={styles.textarea}
              placeholder='请详细描述您遇到的问题，以便我们更好地为您解决...'
              value={content}
              onInput={(e) => setContent(e.detail.value)}
              maxlength={500}
            />
            <Text className={styles.wordCount}>{content.length}/500</Text>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>联系方式
            </Text>
            <Input
              className={styles.contactInput}
              placeholder='请输入手机号，方便我们联系您'
              type='number'
              value={contact}
              onInput={(e) => setContact(e.detail.value)}
              maxlength={11}
            />
          </View>

          <Button className={styles.submitBtn} onClick={handleSubmit}>
            提交反馈
          </Button>
        </View>
      ) : (
        feedbacks.length > 0 ? (
          feedbacks.map((feedback) => (
            <View key={feedback.id} className={styles.feedbackCard}>
              <View className={styles.cardHeader}>
                <View className={styles.headerLeft}>
                  <Text className={styles.feedbackType}>{feedback.type}</Text>
                  {currentRole === 'property' && (
                    <Text className={styles.feedbackUser}>{feedback.userName}</Text>
                  )}
                </View>
                <Text 
                  className={styles.statusTag}
                  style={{ color: getStatusColor(feedback.status), backgroundColor: `${getStatusColor(feedback.status)}15` }}
                >
                  {getStatusText(feedback.status)}
                </Text>
              </View>
              
              <Text className={styles.feedbackContent}>{feedback.content}</Text>
              {feedback.contact && (
                <Text className={styles.feedbackContact}>联系方式：{feedback.contact}</Text>
              )}
              <Text className={styles.feedbackTime}>{formatTime(feedback.createTime)}</Text>
              
              {feedback.reply && (
                <View className={styles.replySection}>
                  <Text className={styles.replyLabel}>📩 物业回复</Text>
                  <Text className={styles.replyContent}>{feedback.reply}</Text>
                  {feedback.replyTime && (
                    <Text className={styles.replyTime}>{formatTime(feedback.replyTime)}</Text>
                  )}
                </View>
              )}
              
              {currentRole === 'property' && feedback.status !== 'resolved' && (
                <View className={styles.propertyActions}>
                  <Button 
                    className={classnames(styles.replyBtn, feedback.status === 'processing' && styles.active)}
                    onClick={() => handleReply(feedback)}
                  >
                    {feedback.status === 'pending' ? '处理反馈' : '回复并完成'}
                  </Button>
                </View>
              )}
            </View>
          ))
        ) : (
          <View className={styles.emptyState}>
            <View className={styles.emptyIcon}>💬</View>
            <Text className={styles.emptyText}>暂无反馈记录</Text>
          </View>
        )
      )}
    </ScrollView>
  );
};

export default FeedbackPage;
