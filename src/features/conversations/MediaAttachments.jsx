import { useEffect, useState } from 'react';

export default function MediaAttachments({ assets, getMediaContent, onWithdraw, onReport, busy }) {
  const [urls, setUrls] = useState({});
  const readyIds = assets.filter(asset => asset.stage === 'ready').map(asset => asset.id).join(',');
  useEffect(() => {
    let active = true;
    const created = [];
    Promise.all(readyIds.split(',').filter(Boolean).map(async id => {
      try {
        const url = URL.createObjectURL(await getMediaContent(id));
        if (active) { created.push(url); setUrls(value => ({ ...value, [id]: url })); }
        else URL.revokeObjectURL(url);
      } catch { /* A changed parent permission makes the image unavailable. */ }
    }));
    return () => { active = false; created.forEach(URL.revokeObjectURL); };
  }, [readyIds, getMediaContent]);
  if (!assets.length) return <p>No photos attached.</p>;
  return <ul>{assets.map(asset => <li key={asset.id}>
    {asset.kind}: {asset.stage}
    {asset.rejectionReason && ` · ${asset.rejectionReason}`}
    {urls[asset.id] && <img src={urls[asset.id]} alt={`${asset.kind} attachment`} style={{ maxWidth: '100%', maxHeight: 240, display: 'block' }} />}
    {onWithdraw && asset.stage !== 'withdrawn' && <button type="button" className="secondary"
      disabled={busy} onClick={() => onWithdraw(asset.id)}>Withdraw photo</button>}
    {onReport && asset.stage === 'ready' && <button type="button" className="secondary"
      disabled={busy} onClick={() => onReport(asset.id)}>Report photo</button>}
  </li>)}</ul>;
}
