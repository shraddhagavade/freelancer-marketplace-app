import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlinePaperAirplane, HiOutlineChatAlt2 } from 'react-icons/hi';
import { getConversations, getThread, sendMessage } from '../services/messageService';
import Avatar from '../components/Avatar';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [thread, setThread] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const messagesRef = useRef(null);

  const withParam = searchParams.get('with');

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await getConversations());
    } catch {
      setConversations([]);
    }
  }, []);

  const loadThread = useCallback(async (otherId) => {
    if (!otherId) return;
    try {
      setThread(await getThread(otherId));
    } catch {
      setThread([]);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Open the thread from ?with= param (e.g. clicked "Message" on a profile)
  useEffect(() => {
    if (withParam) setActiveId(Number(withParam));
  }, [withParam]);

  // Load + poll the active thread
  useEffect(() => {
    if (!activeId) return;
    loadThread(activeId);
    const interval = setInterval(() => {
      loadThread(activeId);
      loadConversations();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeId, loadThread, loadConversations]);

  // Scroll the messages CONTAINER to its bottom (not the whole page) when the thread updates
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread]);

  const activeConversation = conversations.find((c) => c.otherUserId === activeId);

  function openConversation(otherId) {
    setActiveId(otherId);
    setSearchParams({ with: String(otherId) }, { replace: true });
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeId) return;
    setSending(true);
    // Optimistic append
    const optimistic = {
      id: `tmp-${Date.now()}`,
      content: text,
      mine: true,
      createdAt: new Date().toISOString(),
    };
    setThread((prev) => [...prev, optimistic]);
    setDraft('');
    try {
      await sendMessage(activeId, text);
      await loadThread(activeId);
      await loadConversations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="section py-8">
      <h1 className="text-2xl font-bold text-brand-ink mb-6">Messages</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-gray-100 rounded-lg overflow-hidden bg-white" style={{ height: 'min(70vh, 560px)' }}>
        {/* Conversation list */}
        <div className="border-r border-gray-100 md:col-span-1 h-full overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center py-16 px-4">
              <HiOutlineChatAlt2 className="w-10 h-10 text-brand-muted mx-auto mb-2" />
              <p className="text-sm text-brand-muted">No conversations yet</p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.otherUserId}
                onClick={() => openConversation(c.otherUserId)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-100 hover:bg-brand-hover transition-colors ${
                  activeId === c.otherUserId ? 'bg-brand-hover' : ''
                }`}
              >
                <Avatar src={c.otherUserAvatarUrl} name={c.otherUserName} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-brand-ink text-sm truncate">{c.otherUserName}</p>
                    <span className="text-xs text-brand-muted shrink-0 ml-2">{timeAgo(c.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-brand-muted truncate">{c.lastMessage}</p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-brand-primary rounded-full">
                    {c.unreadCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Thread */}
        <div className="md:col-span-2 flex flex-col h-full min-h-0">
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center text-brand-muted text-sm">
              Select a conversation to start messaging
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                <Avatar src={activeConversation?.otherUserAvatarUrl} name={activeConversation?.otherUserName || 'User'} size={36} />
                <p className="font-semibold text-brand-ink">{activeConversation?.otherUserName || 'Conversation'}</p>
              </div>

              {/* Messages */}
              <div ref={messagesRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-brand-hover/30">
                {thread.length === 0 ? (
                  <p className="text-center text-sm text-brand-muted py-8">No messages yet. Say hello!</p>
                ) : (
                  thread.map((m) => (
                    <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                          m.mine
                            ? 'bg-brand-primary text-white rounded-br-sm'
                            : 'bg-white border border-gray-100 text-brand-ink rounded-bl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        <p className={`text-[10px] mt-1 ${m.mine ? 'text-white/70' : 'text-brand-muted'}`}>
                          {timeAgo(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Composer */}
              <form onSubmit={handleSend} className="border-t border-gray-100 p-3 flex items-center gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  className="input-field flex-1"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="btn-primary !px-4 flex items-center gap-1 disabled:opacity-50"
                >
                  <HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
