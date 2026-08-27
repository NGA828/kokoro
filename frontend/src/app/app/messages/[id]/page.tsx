'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { api, errMessage, mediaUrl } from '@/lib/api';
import { useAuth } from '@/lib/store';
import { useSocket } from '@/lib/socket';
import { Avatar, Button, EmptyState, VerifiedBadge } from '@/components/ui';
import type { ChatMessage, Conversation, ProfileCard } from '@/lib/types';

export default function ChatRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [other, setOther] = useState<ProfileCard | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const joinedRef = useRef(false);

  // Load conversation + history
  useEffect(() => {
    Promise.all([
      api.get('/conversations'),
      api.get(`/conversations/${conversationId}/messages`),
    ])
      .then(([c, m]) => {
        const conv = (c.data as Conversation[]).find((x) => x.id === conversationId);
        setOther(conv?.other ?? null);
        setMessages(m.data.items ?? []);
        api.post(`/conversations/${conversationId}/read`).catch(() => {});
      })
      .catch(() => setError('Conversation not available.'));
  }, [conversationId]);

  // Socket setup
  useEffect(() => {
    if (!socket) return;
    socket.emit('conversation:join', conversationId);
    joinedRef.current = true;

    const onNew = (payload: { conversationId: string; message: ChatMessage }) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.some((m) => m.id === payload.message.id)
          ? prev
          : [...prev, payload.message],
      );
      api.post(`/conversations/${conversationId}/read`).catch(() => {});
    };
    const onTyping = (t: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      if (t.conversationId === conversationId && t.userId !== user?.id) {
        setTyping(t.isTyping);
      }
    };
    const onRead = () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === user?.id ? { ...m, status: 'read' } : m,
        ),
      );
    };
    const onDeleted = (p: { conversationId: string; messageId: string }) => {
      if (p.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === p.messageId
            ? { ...m, type: 'deleted', body: null, attachments: [] }
            : m,
        ),
      );
    };

    socket.on('message:new', onNew);
    socket.on('typing', onTyping);
    socket.on('message:read', onRead);
    socket.on('message:deleted', onDeleted);
    return () => {
      socket.emit('conversation:leave', conversationId);
      socket.off('message:new', onNew);
      socket.off('typing', onTyping);
      socket.off('message:read', onRead);
      socket.off('message:deleted', onDeleted);
    };
  }, [socket, conversationId, user?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = useCallback(
    async (body?: string, attachment?: { url: string; kind: 'image' | 'voice'; mime?: string; durationSec?: number }) => {
      const content = (body ?? text).trim();
      if ((!content && !attachment) || sending) return;
      setSending(true);
      try {
        const { data } = await api.post(
          `/conversations/${conversationId}/messages`,
          attachment
            ? {
                attachmentUrl: attachment.url,
                attachmentKind: attachment.kind,
                attachmentMime: attachment.mime,
                durationSec: attachment.durationSec,
              }
            : { body: content },
        );
        setMessages((prev) =>
          prev.some((m) => m.id === data.id) ? prev : [...prev, data],
        );
        setText('');
      } catch (e) {
        setError(errMessage(e));
      } finally {
        setSending(false);
      }
    },
    [text, sending, conversationId],
  );

  function onType(v: string) {
    setText(v);
    if (socket) {
      socket.emit('typing', { conversationId, isTyping: true });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('typing', { conversationId, isTyping: false });
      }, 1500);
    }
  }

  async function sendImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('km_access');
      const res = await fetch(
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api') +
          `/media/upload?kind=message`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      await send(undefined, { url: data.url, kind: 'image', mime: file.type });
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(id: string) {
    try {
      await api.delete(`/messages/${id}`);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, type: 'deleted', body: null, attachments: [] } : m,
        ),
      );
    } catch (e) {
      setError(errMessage(e));
    }
  }

  async function unmatch() {
    if (!other) return;
    if (!confirm(`Unmatch ${other.name}? This closes the conversation.`)) return;
    const matches = await api.get('/matches');
    const m = (matches.data as { id: string; conversationId: string }[]).find(
      (x) => x.conversationId === conversationId,
    );
    if (m) await api.post(`/matches/${m.id}/unmatch`);
    router.push('/app/matches');
  }

  if (error && !other) {
    return (
      <div className="pt-14 lg:pt-0">
        <EmptyState icon="🚫" title={error} />
      </div>
    );
  }

  return (
    <div className="pt-14 lg:pt-0 h-[calc(100vh-5rem)] lg:h-[calc(100vh-6rem)] flex flex-col max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <button onClick={() => router.push('/app/messages')} className="text-2xl lg:hidden">
          ‹
        </button>
        <Avatar src={other?.mainPhotoUrl} name={other?.name ?? '?'} size={44} />
        <div className="flex-1">
          <div className="font-semibold flex items-center gap-1.5">
            {other?.name ?? '…'}
            {other?.isVerified && <VerifiedBadge className="w-4 h-4 text-[9px]" />}
          </div>
          <div className="text-xs">
            {connected ? (
              typing ? (
                <span className="text-rose-300">typing…</span>
              ) : (
                <span className="text-emerald-400">● online</span>
              )
            ) : (
              <span className="text-white/40">connecting…</span>
            )}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu((s) => !s)}
            className="w-10 h-10 rounded-full hover:bg-white/10 text-xl"
          >
            ⋯
          </button>
          {showMenu && (
            <div className="absolute right-0 top-12 glass-strong rounded-2xl p-2 w-44 z-20">
              <button
                onClick={() => {
                  setShowMenu(false);
                  if (other) router.push(`/app/discover?u=${other.userId}`);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-sm"
              >
                👤 View profile
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  unmatch();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-sm text-red-400"
              >
                💔 Unmatch
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-5 space-y-3 px-1">
        {messages.length === 0 && (
          <div className="text-center text-white/40 text-sm mt-10">
            You matched! Say hello 👋
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${mine ? 'justify-end' : 'justify-start'} group`}
              >
                <div
                  className={`max-w-[75%] rounded-3xl px-4 py-2.5 ${
                    mine
                      ? 'bg-brand-gradient text-white rounded-br-md shadow-glow'
                      : 'glass rounded-bl-md'
                  } ${m.type === 'deleted' ? 'italic text-white/40' : ''}`}
                >
                  {m.type === 'deleted' ? (
                    'Message deleted'
                  ) : (
                    <>
                      {m.attachments?.map((a) =>
                        a.url?.match(/\.(png|jpe?g|webp|gif)(\?|$)/i) || m.type === 'image' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={a.id}
                            src={mediaUrl(a.url)}
                            alt="shared"
                            className="rounded-2xl max-w-full mb-1 max-h-72 object-cover"
                          />
                        ) : m.type === 'voice' ? (
                          <audio key={a.id} controls src={mediaUrl(a.url)} className="max-w-[220px]" />
                        ) : null,
                      )}
                      {m.body && <div className="whitespace-pre-wrap break-words">{m.body}</div>}
                      <div
                        className={`text-[10px] mt-1 flex items-center gap-1 justify-end ${
                          mine ? 'text-white/70' : 'text-white/40'
                        }`}
                      >
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {mine && (
                          <span>{m.status === 'read' ? '✓✓' : m.status === 'delivered' ? '✓✓' : '✓'}</span>
                        )}
                        {mine && (
                          <button
                            onClick={() => deleteMessage(m.id)}
                            className="opacity-0 group-hover:opacity-60 hover:opacity-100 ml-1"
                            title="Delete"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {typing && (
          <div className="flex justify-start">
            <div className="glass rounded-3xl rounded-bl-md px-4 py-3 flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-white/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <div className="text-red-300 text-sm text-center mb-2">{error}</div>
      )}

      {/* Composer */}
      <div className="flex items-end gap-2 pt-3 border-t border-white/10">
        <label className="btn-ghost !p-3 !rounded-full cursor-pointer shrink-0">
          📷
          <input type="file" accept="image/*" className="hidden" onChange={sendImage} />
        </label>
        <textarea
          rows={1}
          className="input !rounded-3xl max-h-32 resize-none"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => onType(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button
          onClick={() => send()}
          disabled={sending || (!text.trim() && true)}
          className="shrink-0 !rounded-full !w-12 !h-12 !p-0"
        >
          ➤
        </Button>
      </div>
    </div>
  );
}
