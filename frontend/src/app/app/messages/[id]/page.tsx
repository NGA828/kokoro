'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  MoreVertical,
  User,
  HeartCrack,
  Camera,
  Send,
  Check,
  CheckCheck,
  Trash2,
  Ban,
} from 'lucide-react';
import { api, errMessage, mediaUrl } from '@/lib/api';
import { useAuth } from '@/lib/store';
import { useSocket } from '@/lib/socket';
import { EmptyState, VerifiedBadge } from '@/components/ui';
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
        <EmptyState icon={Ban} title={error} />
      </div>
    );
  }

  return (
    <div className="pt-14 lg:pt-0 h-[calc(100vh-6rem)] lg:h-[calc(100vh-7rem)] flex flex-col max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <button
          onClick={() => router.push('/app/messages')}
          className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 lg:hidden"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={() => other && router.push(`/app/discover?u=${other.userId}`)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <span className="relative shrink-0">
            {other?.mainPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(other.mainPhotoUrl)}
                alt={other.name}
                className="w-11 h-11 rounded-full object-cover"
              />
            ) : (
              <span className="w-11 h-11 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold">
                {(other?.name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('')}
              </span>
            )}
            {connected && !typing && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-ink-900" />
            )}
          </span>
          <span className="min-w-0">
            <span className="font-semibold flex items-center gap-1.5 text-[15px]">
              {other?.name ?? '…'}
              {other?.isVerified && <VerifiedBadge className="w-4 h-4" />}
            </span>
            <span className="text-xs block">
              {connected ? (
                typing ? (
                  <span className="text-rose-300">typing…</span>
                ) : (
                  <span className="text-emerald-400">Online</span>
                )
              ) : (
                <span className="text-white/40">connecting…</span>
              )}
            </span>
          </span>
        </button>
        <div className="relative">
          <button
            onClick={() => setShowMenu((s) => !s)}
            className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70"
            aria-label="Conversation options"
          >
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-12 glass-strong rounded-2xl p-2 w-44 z-20 border border-white/10">
              <button
                onClick={() => {
                  setShowMenu(false);
                  if (other) router.push(`/app/discover?u=${other.userId}`);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-sm inline-flex items-center gap-2"
              >
                <User size={15} /> View profile
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  unmatch();
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-sm text-red-400 inline-flex items-center gap-2"
              >
                <HeartCrack size={15} /> Unmatch
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-5 space-y-3 px-1">
        {messages.length === 0 && (
          <div className="text-center text-white/40 text-sm mt-10">
            You matched — say hello!
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
                  className={`relative max-w-[75%] rounded-[22px] px-4 py-2.5 text-[15px] leading-relaxed ${
                    mine
                      ? 'bg-brand-gradient text-white rounded-br-md shadow-glow'
                      : 'bg-white text-ink-900 rounded-bl-md shadow-card'
                  } ${m.type === 'deleted' ? 'italic opacity-50' : ''}`}
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
                          mine ? 'text-white/75' : 'text-ink-900/40'
                        }`}
                      >
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {mine &&
                          (m.status === 'read' ? (
                            <CheckCheck size={13} className="text-white" />
                          ) : (
                            <Check size={13} />
                          ))}
                        {mine && (
                          <button
                            onClick={() => deleteMessage(m.id)}
                            className="opacity-0 group-hover:opacity-70 hover:opacity-100 ml-0.5"
                            title="Delete"
                          >
                            <Trash2 size={12} />
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
      <div className="flex items-center gap-2 pt-3">
        <label className="w-11 h-11 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/70 hover:bg-white/10 cursor-pointer shrink-0 transition">
          <Camera size={20} />
          <input type="file" accept="image/*" className="hidden" onChange={sendImage} />
        </label>
        <textarea
          rows={1}
          className="input !rounded-full !bg-white/5 border-white/10 max-h-32 resize-none flex-1"
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
        <button
          onClick={() => send()}
          disabled={sending || !text.trim()}
          className="shrink-0 w-12 h-12 rounded-full bg-brand-gradient text-white flex items-center justify-center shadow-glow active:scale-90 transition disabled:opacity-40"
          aria-label="Send"
        >
          <Send size={20} className="ml-0.5" />
        </button>
      </div>
    </div>
  );
}
