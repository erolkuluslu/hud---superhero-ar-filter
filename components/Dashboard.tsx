import React, { useState, useEffect } from 'react';

interface DashboardProps {
  faceBlendshapesRef: React.MutableRefObject<any[]>;
}

export const Dashboard: React.FC<DashboardProps> = ({ faceBlendshapesRef }) => {
  const [time, setTime] = useState(new Date());
  const [cpu, setCpu] = useState(12);
  const [memory, setMemory] = useState(45);
  const [isSmiling, setIsSmiling] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setCpu(prev => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 10)));
      setMemory(prev => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 5)));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Polling loop for smile detection from the shared ref
  useEffect(() => {
    let animationFrameId: number;

    const checkSmile = () => {
      if (faceBlendshapesRef.current && faceBlendshapesRef.current.length > 0) {
        const shapes = faceBlendshapesRef.current[0].categories;
        // Helper to safe get shape score
        const getShape = (name: string) => shapes.find((s: any) => s.categoryName === name)?.score || 0;
        
        const smileLeft = getShape('mouthSmileLeft');
        const smileRight = getShape('mouthSmileRight');
        
        // Threshold for smile detection (0.0 to 1.0)
        if ((smileLeft + smileRight) / 2 > 0.5) {
           setIsSmiling(true);
        } else {
           setIsSmiling(false);
        }
      }
      animationFrameId = requestAnimationFrame(checkSmile);
    };

    checkSmile();
    return () => cancelAnimationFrame(animationFrameId);
  }, [faceBlendshapesRef]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-20">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <h1 className="text-cyan-400 text-4xl font-bold tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
            J.A.R.V.I.S.
          </h1>
          <div className="h-1 w-32 bg-cyan-500 animate-pulse"></div>
          <div className="text-cyan-200 text-xs tracking-widest">SİSTEM: ÇEVRİMİÇİ</div>
          <div className="text-cyan-200 text-xs tracking-widest">MOD: YÜZ_TANIMA</div>
        </div>
        
        <div className="flex flex-col items-end">
           <div className="text-cyan-400 text-2xl font-mono">
             {time.toLocaleTimeString('tr-TR')}
           </div>
           <div className="text-cyan-600 text-sm">
             {time.toLocaleDateString('tr-TR')}
           </div>
        </div>
      </div>

      {/* Center Reticle Area / Alert Area */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full text-center">
         {isSmiling && (
            <div className="flex flex-col items-center justify-center animate-pulse">
                <div className="border-y-4 border-red-600 bg-black/70 backdrop-blur-md py-6 px-12 shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                    <h1 className="text-5xl md:text-7xl font-black text-red-500 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]" style={{ textShadow: '0 0 20px red' }}>
                      DÜNYA HÂKİMİYETİ
                    </h1>
                    <h2 className="text-3xl md:text-4xl font-bold text-red-100 tracking-[0.5em] mt-2 uppercase">
                      mod [etkinleştirildi]
                    </h2>
                </div>
                <div className="mt-4 text-red-500 font-mono text-xl tracking-widest blink">
                   UYARI: AŞIRI GÜÇ SEVİYESİ TESPİT EDİLDİ
                </div>
            </div>
         )}
      </div>
      
      {/* Bottom Bar */}
      <div className="flex justify-between items-end">
        <div className="bg-black/40 backdrop-blur-sm border border-cyan-900/50 p-4 rounded-lg w-64">
          <div className="text-cyan-400 text-xs mb-2 uppercase tracking-widest border-b border-cyan-900 pb-1">Sistem Metrikleri</div>
          
          <div className="flex justify-between items-center mb-1">
            <span className="text-cyan-600 text-xs">CPU YÜKÜ</span>
            <span className="text-cyan-300 text-xs font-mono">{cpu.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-cyan-900/30 h-1 mb-2">
            <div className={`h-full transition-all duration-500 ${isSmiling ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${isSmiling ? 99.9 : cpu}%` }}></div>
          </div>

          <div className="flex justify-between items-center mb-1">
            <span className="text-cyan-600 text-xs">BELLEK</span>
            <span className="text-cyan-300 text-xs font-mono">{memory.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-cyan-900/30 h-1">
            <div className={`h-full transition-all duration-500 ${isSmiling ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${isSmiling ? 99.9 : memory}%` }}></div>
          </div>
        </div>

        <div className="flex gap-4">
           <div className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded-full border-2 ${isSmiling ? 'border-red-500' : 'border-cyan-500'} border-t-transparent animate-spin`}></div>
              <span className={`${isSmiling ? 'text-red-500' : 'text-cyan-500'} text-[10px] tracking-widest`}>
                {isSmiling ? 'HEDEF KİLİTLENDİ' : 'TARANIYOR'}
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};
