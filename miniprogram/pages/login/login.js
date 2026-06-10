const auth = require('../../utils/auth');

Page({
  data: {
    mode: 'login',
    email: '',
    password: '',
    loading: false
  },

  onLoad() {
    const session = auth.getStoredSession();
    if (session && session.user) {
      wx.reLaunch({ url: '/pages/home/home' });
    }
  },

  switchMode(event) {
    this.setData({ mode: event.currentTarget.dataset.mode });
  },

  onEmailInput(event) {
    this.setData({ email: event.detail.value.trim() });
  },

  onPasswordInput(event) {
    this.setData({ password: event.detail.value });
  },

  async submit() {
    if (this.data.loading) return;

    const { email, password, mode } = this.data;

    if (!email || !email.includes('@')) {
      wx.showToast({ title: '请输入有效邮箱', icon: 'none' });
      return;
    }

    if (!password || password.length < 6) {
      wx.showToast({ title: '密码至少 6 位', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const session = mode === 'login'
        ? await auth.login(email, password)
        : await auth.register(email, password);

      if (session && session.needsEmailConfirmation) {
        wx.showToast({ title: '请先完成邮箱确认', icon: 'none', duration: 2600 });
        return;
      }

      if (!session || !session.user) {
        wx.showToast({ title: '请检查邮箱确认状态', icon: 'none' });
        return;
      }

      getApp().globalData.user = session.user;
      wx.reLaunch({ url: '/pages/home/home' });
    } catch (error) {
      wx.showToast({ title: error.message || '操作失败', icon: 'none', duration: 2600 });
    } finally {
      this.setData({ loading: false });
    }
  }
});
