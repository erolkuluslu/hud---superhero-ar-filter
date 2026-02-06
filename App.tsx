import React from 'react';
import { TheClawGame } from './components/TheClawGame';

// Main App - Direkt Pençe Oyunu açılır
function App() {
  // Menü yok, direkt oyun başlar
  const handleBack = () => {
    // Sayfa yenilenir (tek oyun olduğu için)
    window.location.reload();
  };

  return <TheClawGame onBack={handleBack} />;
}

export default App;
