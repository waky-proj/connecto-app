import Header from '../../shared/ui/Header.jsx';
import Empty from '../../shared/ui/Empty.jsx';
export default function InboxPage({ offers, messages, setSelected, navigate }) {
  return (
    <>
      <Header title="Inbox" />
      {Object.keys(messages).length ? (
        Object.keys(messages).map((id) => {
          const o = offers.find((o) => o.id === id);
          return (
            o && (
              <button
                className="activity-card"
                key={id}
                onClick={() => {
                  setSelected(o);
                  navigate('chat');
                }}
              >
                <b>{o.name}</b>
                <p>{messages[id].at(-1)?.text}</p>
              </button>
            )
          );
        })
      ) : (
        <Empty text="No conversations yet. Find a neighbor and tap Discuss & Coordinate." />
      )}
    </>
  );
}
