import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Link as LinkIcon, RefreshCw, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function Pairing() {
  const [pairingString, setPairingString] = useState('');
  const [status, setStatus] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isScanning) return;
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    
    scanner.render((decodedText) => {
      setPairingString(decodedText);
      scanner.clear();
      setIsScanning(false);
      handlePair(decodedText);
    }, (error) => {
      // Ignore routine scan frame errors
    });

    return () => {
      scanner.clear().catch(e => console.error(e));
    };
  }, [isScanning]);

  const handlePair = async (overrideString?: string) => {
    let str = overrideString || pairingString;
    
    // Smart formatting
    if (str && !str.startsWith('http://') && !str.startsWith('https://')) {
       str = 'http://' + str;
    }
    
    if (str.includes('|') && !str.match(/:\d+\|/)) {
       str = str.replace('|', ':14205|');
    }

    if (!str.includes('|')) {
      setStatus('Invalid pairing string. Format is IP|SECRET (e.g. 192.168.1.6|secret)');
      return;
    }
    
    setStatus('Pairing...');
    const [url, secret] = str.split('|');
    
    try {
      const res = await fetch(`${url}/api/sync`);
      if (res.ok) {
        const data = await res.json();
        if (data.payload) {
          localStorage.setItem('syncspace_endpoint', url);
          localStorage.setItem('syncspace_secret', secret);
          localStorage.setItem('syncspace_db', data.payload);
          localStorage.removeItem('syncspace_outbox');
          setStatus('Successfully paired and synced!');
          setTimeout(() => {
             navigate('/');
             window.location.reload();
          }, 1500);
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
    <motion.div className="p-4 h-full flex flex-col items-center justify-center overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-6">
        <QrCode className="w-8 h-8" />
      </div>
      
      <h2 className="text-2xl font-bold mb-2 text-center">Pair with Desktop</h2>
      <p className="text-sm text-muted-foreground text-center mb-8 px-4">
        Go to Settings &gt; Pair App on your Desktop and scan the QR code, or paste the IP address below.
      </p>

      {isScanning ? (
        <div className="w-full max-w-sm mb-6 rounded-2xl overflow-hidden glass-card p-2 flex flex-col items-center">
          <div id="reader" className="w-full rounded-xl overflow-hidden bg-black min-h-[300px]"></div>
          <button onClick={() => setIsScanning(false)} className="w-full mt-4 btn-secondary justify-center py-2">Cancel Scan</button>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-4">
          <button 
            onClick={() => setIsScanning(true)}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mb-2"
          >
            <Camera className="w-4 h-4" /> Scan QR Code
          </button>
          
          <div className="relative flex items-center justify-center">
             <div className="border-t border-white/10 w-full"></div>
             <span className="absolute bg-[#050a12] px-3 text-xs text-muted-foreground">OR</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground ml-1 mb-1 block">Manual IP & Secret</label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                value={pairingString}
                onChange={e => setPairingString(e.target.value)}
                placeholder="192.168.1.6|secret" 
                className="input-field pl-10"
              />
            </div>
          </div>

          <button 
            onClick={() => handlePair()}
            className="w-full btn-secondary justify-center py-3"
          >
            <RefreshCw className="w-4 h-4" /> Connect & Sync
          </button>

          {status && (
            <p className="text-center text-xs font-medium text-amber-400 mt-4 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
              {status}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
