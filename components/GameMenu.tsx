import React from 'react';

interface GameMenuProps {
  onSelectGame: (gameId: number) => void;
}

export const GameMenu: React.FC<GameMenuProps> = ({ onSelectGame }) => {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-cyan-950 to-gray-900"></div>
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}
        ></div>
        {/* Floating Particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

      {/* Title */}
      <div className="relative z-10 mb-12 text-center">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 tracking-wider drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">
          AR OYUNLAR
        </h1>
        <div className="h-1 w-64 mx-auto mt-4 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        <p className="text-cyan-300 mt-4 text-lg tracking-widest uppercase">Bir Oyun Seçin</p>
      </div>

      {/* Game Cards */}
      <div className="relative z-10 flex flex-col md:flex-row gap-6 px-8 flex-wrap justify-center">
        {/* Game 1: JARVIS HUD */}
        <button
          onClick={() => onSelectGame(1)}
          className="group relative w-80 h-96 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-md border border-cyan-500/30 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:border-cyan-400 hover:shadow-[0_0_50px_rgba(34,211,238,0.3)]"
        >
          {/* Card Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Icon Area */}
          <div className="relative h-48 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/30 to-transparent"></div>
            {/* Face Icon */}
            <div className="relative">
              <div className="w-24 h-28 border-2 border-cyan-400 rounded-full relative">
                {/* Eyes */}
                <div className="absolute top-8 left-4 w-4 h-4 border border-cyan-400 rounded-full animate-pulse"></div>
                <div className="absolute top-8 right-4 w-4 h-4 border border-cyan-400 rounded-full animate-pulse"></div>
                {/* Scanning Lines */}
                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 animate-[scanDown_2s_linear_infinite] opacity-50"></div>
              </div>
              {/* Brackets */}
              <div className="absolute -left-4 top-0 w-3 h-8 border-l-2 border-t-2 border-cyan-400"></div>
              <div className="absolute -right-4 top-0 w-3 h-8 border-r-2 border-t-2 border-cyan-400"></div>
              <div className="absolute -left-4 bottom-0 w-3 h-8 border-l-2 border-b-2 border-cyan-400"></div>
              <div className="absolute -right-4 bottom-0 w-3 h-8 border-r-2 border-b-2 border-cyan-400"></div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <div className="text-cyan-400 text-xs tracking-[0.3em] mb-2">OYUN 01</div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">J.A.R.V.I.S. HUD</h2>
            <p className="text-cyan-200/70 text-sm">
              Süper kahraman tarzı yüz tanıma ve el takibi ile artırılmış gerçeklik deneyimi
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="px-2 py-1 text-[10px] bg-cyan-900/50 text-cyan-300 rounded border border-cyan-700">YÜZ TAKİBİ</span>
              <span className="px-2 py-1 text-[10px] bg-cyan-900/50 text-cyan-300 rounded border border-cyan-700">EL TAKİBİ</span>
            </div>
          </div>

          {/* Play Button Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-cyan-400 text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            ▶ OYNA
          </div>
        </button>

        {/* Game 2: THE CLAW */}
        <button
          onClick={() => onSelectGame(2)}
          className="group relative w-80 h-96 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-md border border-green-500/30 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:border-green-400 hover:shadow-[0_0_50px_rgba(34,197,94,0.3)]"
        >
          {/* Card Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Icon Area */}
          <div className="relative h-48 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-green-900/30 to-transparent"></div>
            {/* Claw Icon */}
            <div className="relative">
              {/* Claw Arm */}
              <div className="w-4 h-16 bg-gradient-to-b from-gray-400 to-gray-600 mx-auto rounded-t"></div>
              {/* Claw Fingers */}
              <div className="flex justify-center -mt-1">
                <div className="w-3 h-8 bg-gray-500 transform -rotate-30 origin-top rounded-b mx-1" style={{ transform: 'rotate(-30deg)' }}></div>
                <div className="w-3 h-10 bg-gray-500 rounded-b mx-1"></div>
                <div className="w-3 h-8 bg-gray-500 transform rotate-30 origin-top rounded-b mx-1" style={{ transform: 'rotate(30deg)' }}></div>
              </div>
              {/* Alien */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                <div className="w-12 h-12 bg-green-500 rounded-t-full relative animate-bounce">
                  {/* Eyes */}
                  <div className="absolute top-3 left-2 w-3 h-3 bg-white rounded-full">
                    <div className="w-1.5 h-1.5 bg-black rounded-full mt-0.5 ml-0.5"></div>
                  </div>
                  <div className="absolute top-3 right-2 w-3 h-3 bg-white rounded-full">
                    <div className="w-1.5 h-1.5 bg-black rounded-full mt-0.5 ml-0.5"></div>
                  </div>
                  {/* Antenna */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-4 bg-green-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full -mt-1 -ml-0.5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <div className="text-green-400 text-xs tracking-[0.3em] mb-2">OYUN 02</div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">PENÇE OYUNU</h2>
            <p className="text-green-200/70 text-sm">
              Elinizle uzaylıları yakala ve deliğe at! Süre dolmadan en yüksek puanı topla
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="px-2 py-1 text-[10px] bg-green-900/50 text-green-300 rounded border border-green-700">EL TAKİBİ</span>
              <span className="px-2 py-1 text-[10px] bg-green-900/50 text-green-300 rounded border border-green-700">ZAMANA KARŞI</span>
            </div>
          </div>

          {/* Play Button Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-green-400 text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            ▶ OYNA
          </div>
        </button>

        {/* Game 3: DINOSAUR WORLD */}
        <button
          onClick={() => onSelectGame(3)}
          className="group relative w-80 h-96 bg-gradient-to-br from-orange-900/80 to-amber-800/80 backdrop-blur-md border border-orange-500/30 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:border-orange-400 hover:shadow-[0_0_50px_rgba(251,146,60,0.3)]"
        >
          {/* Card Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Icon Area */}
          <div className="relative h-48 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-green-600/30 via-transparent to-amber-900/30"></div>
            {/* Dinosaur Icon */}
            <div className="relative text-center">
              <div className="text-8xl animate-bounce" style={{ animationDuration: '2s' }}>🦖</div>
              {/* Decorative elements */}
              <div className="absolute -top-2 -left-4 text-2xl animate-pulse">🌿</div>
              <div className="absolute -top-2 -right-4 text-2xl animate-pulse" style={{ animationDelay: '0.5s' }}>🌴</div>
              <div className="absolute -bottom-2 left-0 text-xl">🦕</div>
              <div className="absolute -bottom-2 right-0 text-xl" style={{ transform: 'scaleX(-1)' }}>🦕</div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <div className="text-orange-400 text-xs tracking-[0.3em] mb-2">OYUN 03</div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">DİNOZOR DÜNYASI</h2>
            <p className="text-orange-200/70 text-sm">
              Sevimli dinozorlarla oyna! Onları sev, besle ve mutlu et 🦖❤️
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="px-2 py-1 text-[10px] bg-orange-900/50 text-orange-300 rounded border border-orange-700">ÇOCUKLARA ÖZEL</span>
              <span className="px-2 py-1 text-[10px] bg-orange-900/50 text-orange-300 rounded border border-orange-700">EL TAKİBİ</span>
            </div>
          </div>

          {/* Play Button Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-orange-400 text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            ▶ OYNA
          </div>
        </button>

        {/* Game 4: THE FLOOR IS LAVA */}
        <button
          onClick={() => onSelectGame(4)}
          className="group relative w-80 h-96 bg-gradient-to-br from-red-900/80 to-orange-900/80 backdrop-blur-md border border-red-500/30 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:border-red-400 hover:shadow-[0_0_50px_rgba(239,68,68,0.4)]"
        >
          {/* Card Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Lava animation background */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-600 via-red-500 to-transparent opacity-60 animate-pulse"></div>

          {/* Icon Area */}
          <div className="relative h-48 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-red-900/50"></div>
            {/* Lava Icon */}
            <div className="relative text-center">
              <div className="text-7xl animate-bounce" style={{ animationDuration: '1s' }}>🌋</div>
              {/* Fire effects */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                <span className="text-3xl animate-pulse">🔥</span>
                <span className="text-4xl animate-pulse" style={{ animationDelay: '0.2s' }}>🔥</span>
                <span className="text-3xl animate-pulse" style={{ animationDelay: '0.4s' }}>🔥</span>
              </div>
              {/* Person jumping */}
              <div className="absolute -top-4 -right-6 text-3xl animate-bounce" style={{ animationDuration: '0.5s' }}>🏃</div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center relative z-10">
            <div className="text-red-400 text-xs tracking-[0.3em] mb-2">OYUN 04</div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">YER LAV!</h2>
            <p className="text-red-200/70 text-sm">
              Platformlarda zıpla ve lavlara düşme! Ne kadar dayanabilirsin? 🔥
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="px-2 py-1 text-[10px] bg-red-900/50 text-red-300 rounded border border-red-700">HAREKET</span>
              <span className="px-2 py-1 text-[10px] bg-red-900/50 text-red-300 rounded border border-red-700">HAYATTA KAL</span>
            </div>
          </div>

          {/* Play Button Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-red-400 text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            ▶ OYNA
          </div>
        </button>

        {/* Game 5: MUSIC STUDIO */}
        <button
          onClick={() => onSelectGame(5)}
          className="group relative w-80 h-96 bg-gradient-to-br from-purple-900/80 to-pink-900/80 backdrop-blur-md border border-purple-500/30 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:border-purple-400 hover:shadow-[0_0_50px_rgba(168,85,247,0.4)]"
        >
          {/* Card Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Animated music waves background */}
          <div className="absolute bottom-0 left-0 right-0 h-24 flex items-end justify-center gap-1 opacity-40">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-2 bg-gradient-to-t from-purple-500 to-pink-400 rounded-t animate-pulse"
                style={{
                  height: `${20 + Math.sin(i * 0.5) * 30}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.5s'
                }}
              ></div>
            ))}
          </div>

          {/* Icon Area */}
          <div className="relative h-48 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/50 to-transparent"></div>
            {/* Music Icon */}
            <div className="relative text-center">
              <div className="text-7xl animate-bounce" style={{ animationDuration: '1s' }}>🎵</div>
              {/* Instruments around */}
              <div className="absolute -top-2 -left-8 text-4xl animate-pulse">🎹</div>
              <div className="absolute -top-2 -right-8 text-4xl animate-pulse" style={{ animationDelay: '0.3s' }}>🥁</div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                <span className="text-2xl animate-pulse" style={{ animationDelay: '0.1s' }}>🎸</span>
                <span className="text-2xl animate-pulse" style={{ animationDelay: '0.2s' }}>🎤</span>
                <span className="text-2xl animate-pulse" style={{ animationDelay: '0.3s' }}>🎧</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center relative z-10">
            <div className="text-purple-400 text-xs tracking-[0.3em] mb-2">OYUN 05</div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">MÜZİK STÜDYO</h2>
            <p className="text-purple-200/70 text-sm">
              Vücudunla müzik yap! Dans et, hareket et, melodi yarat 🎶✨
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="px-2 py-1 text-[10px] bg-purple-900/50 text-purple-300 rounded border border-purple-700">VÜCUT TAKİBİ</span>
              <span className="px-2 py-1 text-[10px] bg-purple-900/50 text-purple-300 rounded border border-purple-700">MÜZİK</span>
            </div>
          </div>

          {/* Play Button Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-purple-400 text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            ▶ OYNA
          </div>
        </button>

        {/* Game 6: AR PLAYGROUND */}
        <button
          onClick={() => onSelectGame(6)}
          className="group relative w-80 h-96 bg-gradient-to-br from-indigo-900/80 to-blue-900/80 backdrop-blur-md border border-indigo-500/30 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:border-indigo-400 hover:shadow-[0_0_50px_rgba(99,102,241,0.4)]"
        >
          {/* Card Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Animated Particles Background */}
          <div className="absolute bottom-0 left-0 right-0 h-full overflow-hidden opacity-30">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDuration: `${1 + Math.random() * 2}s`,
                  animationDelay: `${Math.random()}s`
                }}
              ></div>
            ))}
          </div>

          {/* Icon Area */}
          <div className="relative h-48 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/50 to-transparent"></div>
            {/* Hand/Magic Icon */}
            <div className="relative text-center">
              <div className="text-7xl animate-pulse">✨</div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 text-5xl animate-bounce" style={{ animationDuration: '2s' }}>✋</div>
              {/* Floating shapes */}
              <div className="absolute -top-4 -left-8 text-2xl animate-spin" style={{ animationDuration: '3s' }}>💠</div>
              <div className="absolute -bottom-4 -right-8 text-2xl animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>🔷</div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center relative z-10">
            <div className="text-indigo-400 text-xs tracking-[0.3em] mb-2">OYUN 06</div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">AR OYUN ALANI</h2>
            <p className="text-indigo-200/70 text-sm">
              Süper kahraman ol! Işık saçan parçacıklar ve müzikal küplerle etkileşime geç ✨
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="px-2 py-1 text-[10px] bg-indigo-900/50 text-indigo-300 rounded border border-indigo-700">PARÇACIKLAR</span>
              <span className="px-2 py-1 text-[10px] bg-indigo-900/50 text-indigo-300 rounded border border-indigo-700">MÜZİK KÜPLERİ</span>
            </div>
          </div>

          {/* Play Button Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-indigo-400 text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            ▶ OYNA
          </div>
        </button>

        {/* Game 7: MAGIC X-RAY */}
        <button
          onClick={() => onSelectGame(7)}
          className="group relative w-80 h-96 bg-gradient-to-br from-blue-900/80 to-cyan-900/80 backdrop-blur-md border border-blue-500/30 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:border-blue-400 hover:shadow-[0_0_50px_rgba(59,130,246,0.4)]"
        >
          {/* Card Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Skeleton Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-48 h-64 border-4 border-dashed border-blue-400 rounded-full animate-pulse"></div>
          </div>

          {/* Icon Area */}
          <div className="relative h-48 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/50 to-transparent"></div>
            {/* Skeleton Icon */}
            <div className="relative text-center">
              <div className="text-7xl animate-pulse">💀</div>
              <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-4xl animate-bounce">🦴</div>
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-4xl animate-bounce" style={{ animationDelay: '0.5s' }}>🦴</div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center relative z-10">
            <div className="text-blue-400 text-xs tracking-[0.3em] mb-2">OYUN 07</div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">SİHİRLİ X-RAY</h2>
            <p className="text-blue-200/70 text-sm">
              İçindeki iskeleti gör! Eklemlerini tanı ve nasıl çalıştıklarını öğren 🦴✨
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="px-2 py-1 text-[10px] bg-blue-900/50 text-blue-300 rounded border border-blue-700">EĞİTİCİ</span>
              <span className="px-2 py-1 text-[10px] bg-blue-900/50 text-blue-300 rounded border border-blue-700">VÜCUT TAKİBİ</span>
            </div>
          </div>

          {/* Play Button Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-blue-400 text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            ▶ OYNA
          </div>
        </button>

        {/* Game 8: AIR PIANO */}
        <button
          onClick={() => onSelectGame(8)}
          className="group relative w-80 h-96 bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md border border-white/30 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:border-white hover:shadow-[0_0_50px_rgba(255,255,255,0.4)]"
        >
          {/* Card Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Piano Keys Background */}
          <div className="absolute inset-0 flex justify-center opacity-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-8 h-full border-r border-white/20"></div>
            ))}
          </div>

          {/* Icon Area */}
          <div className="relative h-48 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-700/50 to-transparent"></div>
            {/* Piano Icon */}
            <div className="relative text-center">
              <div className="text-7xl animate-bounce">🎹</div>
              <div className="absolute -top-4 -right-8 text-3xl animate-pulse">🎵</div>
              <div className="absolute -bottom-2 -left-8 text-3xl animate-pulse" style={{ animationDelay: '0.3s' }}>🎶</div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center relative z-10">
            <div className="text-slate-400 text-xs tracking-[0.3em] mb-2">OYUN 08</div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">SANAL PİYANO</h2>
            <p className="text-slate-300/70 text-sm">
              Havada piyano çal! Parmaklarını tuşlara dokundur ve müziği hisset 🎹✨
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="px-2 py-1 text-[10px] bg-slate-900/50 text-white rounded border border-slate-600">EL TAKİBİ</span>
              <span className="px-2 py-1 text-[10px] bg-slate-900/50 text-white rounded border border-slate-600">MÜZİK</span>
            </div>
          </div>

          {/* Play Button Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            ▶ OYNA
          </div>
        </button>

        {/* Game 9: LIVE PUZZLE */}
        <button
          onClick={() => onSelectGame(9)}
          className="group relative w-80 h-96 bg-gradient-to-br from-zinc-900/80 to-stone-900/80 backdrop-blur-md border border-[#ccff00]/30 rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:border-[#ccff00] hover:shadow-[0_0_50px_rgba(204,255,0,0.4)]"
        >
          {/* Card Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#ccff00]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Grid Background */}
          <div className="absolute inset-0 flex flex-wrap opacity-20">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-1/4 h-1/4 border border-[#ccff00]/30"></div>
            ))}
          </div>

          {/* Icon Area */}
          <div className="relative h-48 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#ccff00]/10 to-transparent"></div>
            {/* Puzzle Icon */}
            <div className="relative text-center">
              <div className="text-7xl animate-pulse">🧩</div>
              <div className="absolute -top-4 -right-6 text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>🖐️</div>
              <div className="absolute -bottom-2 -left-6 text-3xl animate-bounce" style={{ animationDelay: '0.4s' }}>✨</div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center relative z-10">
            <div className="text-[#ccff00] text-xs tracking-[0.3em] mb-2">OYUN 09</div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">CANLI YAPBOZ</h2>
            <p className="text-zinc-300/70 text-sm">
              Ellerinle yapbozu çöz! Kameranla anı yakala ve parçaları birleştir 🧩📸
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="px-2 py-1 text-[10px] bg-zinc-800 text-[#ccff00] rounded border border-[#ccff00]/30">EL TAKİBİ</span>
              <span className="px-2 py-1 text-[10px] bg-zinc-800 text-[#ccff00] rounded border border-[#ccff00]/30">ZEKA</span>
            </div>
          </div>

          {/* Play Button Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[#ccff00] text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            ▶ OYNA
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-12 text-center">
        <p className="text-cyan-600 text-xs tracking-wider">Kameranıza erişim izni gereklidir</p>
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes scanDown {
          0% { top: 0; }
          100% { top: 100%; }
        }
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>
    </div>
  );
};

