/* =========================================================================
 * PICKCAT 网页小桌宠 — background service worker (MV3)
 * 作用：桌宠需要在你访问任意网页时都能读取 pickcat.dao3.fun 的“自己的消息”。
 *      由于读取这些接口需要你的 PICKCAT 登录态（cookie），且 content script
 *      在非 pickcat 域上无法同源请求，所以由本后台服务统一发起带凭证的请求，
 *      content script 通过 chrome.runtime.sendMessage 来获取数据。
 * ========================================================================= */
'use strict';

const PICKCAT_ORIGIN = 'https://pickcat.dao3.fun';

/**
 * 带登录凭证（cookie）请求 pickcat 接口。
 * 因为 host_permissions 已声明该域，background 的 fetch 会带上该站点的会话 cookie。
 * 统一返回：
 *   - 成功：解析后的 JSON
 *   - 未登录：{ loggedOut: true }
 *   - 请求失败：{ error: '...' }
 */
async function pickcatFetch(path) {
  try {
    const r = await fetch(PICKCAT_ORIGIN + path, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });
    if (r.status === 401) return { loggedOut: true };
    if (!r.ok) return { error: 'http' + r.status };
    return await r.json();
  } catch (e) {
    return { error: String(e) };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.target === 'pickcat') {
    const path =
      msg.action === 'list'
        ? '/api/v1/notifications?limit=20'
        : '/api/v1/notification-summary';
    pickcatFetch(path).then((data) => sendResponse({ data: data }));
    return true; // 异步响应
  }
});
