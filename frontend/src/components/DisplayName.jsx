import { useEffect, useState } from 'react';
import { shortAddr } from '../utils/eth';

export default function DisplayName({ wallet }) {
  const [name, setName] = useState(null);

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!wallet) return;
      try {
        const res = await fetch(`/api/users/${wallet}`);
        if (res.ok) {
          const data = await res.json();
          if (alive) setName(data?.username || data?.name || null);
        }
      } catch {/* ignore */}
    }
    run();
    return () => { alive = false; };
  }, [wallet]);

  return <>{name || shortAddr(wallet)}</>;
}