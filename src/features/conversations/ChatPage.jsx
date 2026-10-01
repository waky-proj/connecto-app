import { Send } from 'lucide-react';
import Header from '../../shared/ui/Header.jsx';
export default function ChatPage({ messages, setMessages, selected, navigate }) {
  return (
    <>
      <Header title={selected.name} back={() => navigate('inbox')} />
      <div className="chat-context">
        <span className="tag">{selected.title}</span>
        <b>${selected.rate}/hr</b>
        <p>Coordinate timing, tools, and the scope of your request here.</p>
      </div>
      <div className="chat-messages">
        <div className="bubble">
          Hi! Let’s discuss what you need and find a time that works.
        </div>
        {(messages[selected.id] || []).map((m) => (
          <div className="bubble sent" key={m.id}>
            {m.text}
          </div>
        ))}
      </div>
      <form
        className="message-form"
        onSubmit={(e) => {
          e.preventDefault();
          const text = new FormData(e.currentTarget).get('message').trim();
          if (!text) return;
          setMessages({
            ...messages,
            [selected.id]: [
              ...(messages[selected.id] || []),
              { id: crypto.randomUUID(), text },
            ],
          });
          e.currentTarget.reset();
        }}
      >
        <input
          name="message"
          aria-label="Message neighbor"
          placeholder={`Message ${selected.name.split(' ')[0]}…`}
          required
          maxLength={1000}
        />
        <button aria-label="Send message">
          <Send size={20} />
        </button>
      </form>
      <p className="muted">Local demo conversation. Messages stay on this device.</p>
    </>
  );
}
