function buildQuery(params) {
  return Object.keys(params || {})
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

function request(options) {
  return new Promise((resolve, reject) => {
    const query = buildQuery(options.data || {});
    const url = options.method === 'GET' && query
      ? `${options.url}${options.url.includes('?') ? '&' : '?'}${query}`
      : options.url;

    wx.request({
      url,
      method: options.method || 'GET',
      data: options.method === 'GET' ? undefined : options.data,
      header: options.header || {},
      timeout: options.timeout || 30000,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }

        reject(new Error((res.data && (res.data.error || res.data.message)) || `请求失败：${res.statusCode}`));
      },
      fail(error) {
        reject(new Error(error.errMsg || '网络请求失败'));
      }
    });
  });
}

module.exports = {
  request
};
