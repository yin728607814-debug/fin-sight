const auth = require('../../utils/auth');

Page({
  data: {
    user: {}
  },

  onShow() {
    const session = auth.requireLogin();
    if (session) {
      this.setData({ user: session.user });
    }
  },

  openAsset(event) {
    const asset = event.currentTarget.dataset.asset;
    wx.navigateTo({ url: `/pages/analysis/analysis?asset=${asset}` });
  },

  async logout() {
    wx.showModal({
      title: '退出登录',
      content: '确认退出当前账号吗？',
      success: async (result) => {
        if (!result.confirm) return;
        await auth.logout();
        wx.reLaunch({ url: '/pages/login/login' });
      }
    });
  }
});
