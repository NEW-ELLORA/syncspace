import { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Pairing() {
  const [pairingString, setPairingString] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handlePair = async () => {
    if (!pairingString.includes('|')) {
      setStatus('Invalid pairing string. Format is URL|SECRET');
      return;
    }
    
    setStatus('Pairing...');
    const [url, secret] = pairingString.split('|');
    
    try {
      const res = await fetch(`${url}/api/sync`);
      if (res.ok) {
        const data = await res.json();
        if (data.payload) {
          // In real app, decrypt with 'secret' using crypto-js.
          // For now, we assume it works.
          localStorage.setItem('syncspace_endpoint', url);
          localStorage.setItem('syncspace_secret', secret);
          setStatus('Successfully paired and synced!');
          setTimeout(() => navigate('/'), 1500);
        } else {
          setStatus('Invalid payload from desktop.');
        }
      } else {
         setStatus('Desktop server unreachable. Check WiFi.');
      }
    } catch (e: any) {
      setStatus(`Error: ${e.message}. Are you on the same WiFi?`);
    }
  };

  return (
    <motion.div className="p-4 h-full flex flex-col items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-6">
        <QrCode className="w-8 h-8" />
      </div>
      
      <h2 className="text-2xl font-bold mb-2 text-center">Pair with Desktop</h2>
      <p className="text-sm text-muted-foreground text-center mb-8 px-4">
        Go to Settings &gt; Pair App on your Desktop and scan the QR code, or paste the connection string below.
      </p>

      <div className="w-full max-w-sm space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground ml-1 mb-1 block">Connection String</label>
          <div className="relative">
            <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              value={pairingString}
              onChange={e => setPairingString(e.target.value)}
              placeholder="http://192.168.1.x:14205|secret..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <button 
          onClick={handlePair}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Connect & Sync
        </button>

        {status && (
          <p className="text-center text-xs font-medium text-amber-400 mt-4 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
            {status}
          </p>
        )}
      </div>
    </motion.div>
  );
}
