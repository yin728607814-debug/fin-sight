const config = require('./config');
const { request } = require('./request');

const SESSION_KEY = 'finsight_supabase_session';

function ensureSupabaseConfig() {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('请先在 miniprogram/utils/config.js 配置 Supabase');
  }
}

function authHeaders(accessToken) {
  const headers = {
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${accessToken || config.supabaseAnonKey}`,
    'Content-Type': 'application/json'
  };

  return headers;
}

function normalizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    createdAt: user.created_at || user.createdAt
  };
}

function saveSession(session) {
  wx.setStorageSync(SESSION_KEY, session);
}

function getStoredSession() {
  try {
    return wx.getStorageSync(SESSION_KEY) || null;
  } catch (error) {
    return null;
  }
}

function clearSession() {
  wx.removeStorageSync(SESSION_KEY);
}

async function login(email, password) {
  ensureSupabaseConfig();

  const data = await request({
    url: `${config.supabaseUrl}/auth/v1/token?grant_type=password`,
    method: 'POST',
    header: authHeaders(),
    data: { email, password },
    timeout: 30000
  });

  const session = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    user: normalizeUser(data.user)
  };

  saveSession(session);
  return session;
}

async function register(email, password) {
  ensureSupabaseConfig();

  const data = await request({
    url: `${config.supabaseUrl}/auth/v1/signup`,
    method: 'POST',
    header: authHeaders(),
    data: { email, password },
    timeout: 30000
  });

  if (data.access_token) {
    const session = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
      user: normalizeUser(data.user)
    };
    saveSession(session);
    return session;
  }

  return {
    accessToken: '',
    refreshToken: '',
    expiresAt: 0,
    user: normalizeUser(data.user),
    needsEmailConfirmation: true
  };
}

async function logout() {
  const session = getStoredSession();

  if (session && session.accessToken && config.supabaseUrl && config.supabaseAnonKey) {
    try {
      await request({
        url: `${config.supabaseUrl}/auth/v1/logout`,
        method: 'POST',
        header: authHeaders(session.accessToken),
        timeout: 15000
      });
    } catch (error) {
      // 即使服务端退出失败，也清理本地会话，避免用户被卡住。
    }
  }

  clearSession();
}

function requireLogin() {
  const session = getStoredSession();
  if (!session || !session.user) {
    wx.reLaunch({ url: '/pages/login/login' });
    return null;
  }
  return session;
}

module.exports = {
  login,
  register,
  logout,
  requireLogin,
  getStoredSession,
  clearSession
};
