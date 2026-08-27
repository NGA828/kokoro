/* Realtime test: two sockets (Vanessa & Amara) exchange a message live. */
const { io } = require('socket.io-client');

const BASE_HTTP = 'http://localhost:4000/api';
const SOCKET = 'http://localhost:4000';

async function post(path, body, token) {
  const res = await fetch(BASE_HTTP + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return res.json();
}
async function get(path, token) {
  const res = await fetch(BASE_HTTP + path, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

function connect(token) {
  return new Promise((resolve, reject) => {
    const s = io(SOCKET, { auth: { token }, transports: ['websocket'] });
    s.on('connect', () => resolve(s));
    s.on('error', (e) => reject(new Error(e.message || String(e))));
    setTimeout(() => reject(new Error('connect timeout')), 8000);
  });
}

(async () => {
  const v = await post('/auth/login', { email: 'vanessa@kokoro.test', password: 'Password123' });
  const a = await post('/auth/login', { email: 'amara@kokoro.test', password: 'Password123' });
  const vTok = v.accessToken, aTok = a.accessToken;
  const vId = v.user.id, aId = a.user.id;

  // Ensure match
  await post(`/likes/${aId}`, {}, vTok);
  const likeRes = await post(`/likes/${vId}`, {}, aTok);
  if (!likeRes.matched) {
    // might already be matched from prior run
    const convs = await get('/conversations', vTok);
    var convId = convs[0]?.id;
  } else {
    var convId = likeRes.match.conversationId;
  }

  const sv = await connect(vTok);
  const sa = await connect(aTok);
  console.log('both sockets connected');

  const received = new Promise((resolve) => {
    sa.on('message:new', (payload) => {
      if (payload.conversationId === convId) resolve(payload.message);
    });
  });

  const typingPromise = new Promise((resolve) => {
    sa.on('typing', (t) => resolve(t));
  });

  sv.emit('conversation:join', convId);
  sa.emit('conversation:join', convId);
  await new Promise((r) => setTimeout(r, 400));

  sv.emit('typing', { conversationId: convId, isTyping: true });
  const typing = await Promise.race([typingPromise, new Promise((r) => setTimeout(() => r(null), 3000))]);
  console.log('typing indicator received by Amara:', !!typing);

  const sent = await post(`/conversations/${convId}/messages`, { body: 'Real-time hello ❤️' }, vTok);
  const live = await Promise.race([received, new Promise((r) => setTimeout(() => r(null), 4000))]);
  console.log('message persisted id:', sent.id);
  console.log('Amara received LIVE via socket:', live ? `YES — "${live.body}"` : 'NO');

  console.log('socket test result:', live && typing ? 'PASS' : 'FAIL');
  sv.close(); sa.close();
  process.exit(live && typing ? 0 : 1);
})().catch((e) => { console.error('ERROR', e); process.exit(1); });
