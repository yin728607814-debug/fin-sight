const auth = require('./utils/auth');

App({
  globalData: {
    user: null
  },

  onLaunch() {
    const session = auth.getStoredSession();
    if (session && session.user) {
      this.globalData.user = session.user;
    }
  }
});
