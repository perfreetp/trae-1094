export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/plate-register/index',
    'pages/message/index',
    'pages/mine/index',
    'pages/audit-list/index',
    'pages/entry/index',
    'pages/parking-fee/index',
    'pages/feedback/index',
    'pages/invite-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#165DFF',
    navigationBarTitleText: '社区访客停车',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#165DFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/plate-register/index',
        text: '车牌登记'
      },
      {
        pagePath: 'pages/message/index',
        text: '消息'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
