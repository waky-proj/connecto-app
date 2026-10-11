import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import Header from '../../shared/ui/Header.jsx';

export default function ChatPage({
  messages,
  setMessages,
  selected,
  navigate,
  apiMode,
  profileId,
  getMessages,
  sendMessage,
  acknowledge,
}) {
  const persistent = apiMode && selected.source === 'agreement';
  const [history, setHistory] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [otherReceipt, setOtherReceipt] = useState({
    deliveredThrough: 0,
    readThrough: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const pending = useRef(null);
  const historyRef = useRef([]);
  const fetchedThrough = useRef(0);
  const active = useRef(0);

  useEffect(() => {
    if (!persistent) return undefined;
    const generation = ++active.current;
    historyRef.current = [];
    fetchedThrough.current = 0;
    setHistory([]);
    setHasMore(false);
    setError('');
    pending.current = null;
    setDraft('');
    let refreshing = false;
    async function refresh(initial = false) {
      if (refreshing || document.visibilityState === 'hidden') return;
      refreshing = true;
      try {
        if (initial) setLoading(true);
        let result;
        let cursor;
        do {
          cursor = fetchedThrough.current ? { after: fetchedThrough.current } : {};
          result = await getMessages(selected.id, cursor);
          if (active.current !== generation) return;
          const previous = historyRef.current;
          const merged = [
            ...previous,
            ...result.messages.filter(
              (item) => !previous.some((old) => old.id === item.id),
            ),
          ].sort((a, b) => a.id - b.id);
          historyRef.current = merged;
          setHistory(merged);
          if (!fetchedThrough.current) setHasMore(result.hasMore);
          if (result.messages.length)
            fetchedThrough.current = result.messages.at(-1).id;
          setOtherReceipt(
            profileId === selected.requesterId ? result.provider : result.requester,
          );
          // Latest pages use hasMore for older history; after pages use it for catch-up.
        } while (cursor.after !== undefined && result.hasMore && result.messages.length);
        if (fetchedThrough.current)
          await acknowledge(selected.id, fetchedThrough.current, fetchedThrough.current);
        if (active.current === generation) setError('');
      } catch (failure) {
        if (active.current === generation) setError(failure.message);
      } finally {
        refreshing = false;
        if (active.current === generation) setLoading(false);
      }
    }
    refresh(true);
    const timer = setInterval(() => refresh(), 5000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (active.current === generation) active.current = generation + 1;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [
    persistent,
    selected.id,
    selected.requesterId,
    profileId,
    getMessages,
    acknowledge,
  ]);

  async function loadOlder() {
    if (!historyRef.current.length) return;
    const generation = active.current;
    setLoading(true);
    try {
      const result = await getMessages(selected.id, { before: historyRef.current[0].id });
      if (active.current !== generation) return;
      const merged = [
        ...result.messages.filter(
          (item) => !historyRef.current.some((old) => old.id === item.id),
        ),
        ...historyRef.current,
      ].sort((a, b) => a.id - b.id);
      historyRef.current = merged;
      setHistory(merged);
      setHasMore(result.hasMore);
      setError('');
    } catch (failure) {
      if (active.current === generation) setError(failure.message);
    } finally {
      if (active.current === generation) setLoading(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    if (!persistent) {
      setMessages({
        ...messages,
        [selected.id]: [
          ...(messages[selected.id] || []),
          { id: crypto.randomUUID(), text },
        ],
      });
      setDraft('');
      return;
    }
    const generation = active.current;
    if (!pending.current || pending.current.text !== text)
      pending.current = { text, key: crypto.randomUUID() };
    setSending(true);
    setError('');
    try {
      const item = await sendMessage(selected.id, text, pending.current.key);
      if (active.current !== generation) return;
      const merged = historyRef.current.some((old) => old.id === item.id)
        ? historyRef.current
        : [...historyRef.current, item].sort((a, b) => a.id - b.id);
      historyRef.current = merged;
      setHistory(merged);
      setDraft('');
      pending.current = null;
    } catch (failure) {
      if (active.current === generation)
        setError(`${failure.message} Retry sends the same message key.`);
    } finally {
      if (active.current === generation) setSending(false);
    }
  }

  const title = persistent
    ? `${selected.needTitle} → ${selected.offeringTitle}`
    : selected.name;
  const rows = persistent ? history : messages[selected.id] || [];
  return (
    <>
      <Header title={title} back={() => navigate('inbox')} />
      <div className="chat-context">
        {persistent ? (
          <>
            <span className="tag">Accepted agreement</span>
            <p>{selected.terms}</p>
            <p>
              Coordinate timing and practical details. Messages do not change the agreed
              terms.
            </p>
          </>
        ) : (
          <>
            <span className="tag">{selected.title}</span>
            <b>${selected.rate}/hr</b>
            <p>Local demo conversation.</p>
          </>
        )}
      </div>
      {persistent && hasMore && (
        <button
          className="secondary"
          type="button"
          disabled={loading}
          onClick={loadOlder}
        >
          Load older messages
        </button>
      )}
      {loading && <p role="status">Loading messages…</p>}
      {error && <p role="alert">{error}</p>}
      <div className="chat-messages" aria-live="polite">
        {rows.length === 0 && <p className="muted">No messages yet.</p>}
        {rows.map((item) => {
          const own = persistent ? item.senderId === profileId : true;
          return (
            <div className={`bubble${own ? ' sent' : ''}`} key={item.id}>
              {item.text}
              {persistent && (
                <small className="message-meta">
                  {new Date(item.sentAt).toLocaleString()}
                  {own &&
                    ` · ${otherReceipt.readThrough >= item.id ? 'Read' : otherReceipt.deliveredThrough >= item.id ? 'Delivered' : 'Sent'}`}
                </small>
              )}
            </div>
          );
        })}
      </div>
      <form className="message-form" onSubmit={submit}>
        <input
          name="message"
          aria-label="Message neighbor"
          placeholder="Write a message…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          required
          maxLength={2000}
        />
        <button aria-label="Send message" disabled={sending || !draft.trim()}>
          <Send size={20} />
        </button>
      </form>
      {!persistent && <p className="muted">Demo messages stay in this session.</p>}
    </>
  );
}
