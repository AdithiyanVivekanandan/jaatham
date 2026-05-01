const AstroChart = ({ planets = {}, title = "Birth Chart" }) => {
  // South Indian Chart Map (Indices 1-12 for Rasis)
  // [12][1][2][3]
  // [11]      [4]
  // [10]      [5]
  // [9] [8][7][6]
  
  const rasiLayout = [
    12, 1, 2, 3,
    11, null, null, 4,
    10, null, null, 5,
    9, 8, 7, 6
  ];

  const RASI_LABELS = {
    1: 'Mesha', 2: 'Rishaba', 3: 'Mithuna', 4: 'Kataka',
    5: 'Simha', 6: 'Kanya', 7: 'Thula', 8: 'Vrischika',
    9: 'Dhanus', 10: 'Makara', 11: 'Kumbha', 12: 'Meena'
  };

  const getPlanetsInSign = (sign) => {
    return Object.entries(planets)
      .filter(([_, data]) => data.sign === sign)
      .map(([name, _]) => name.slice(0, 2).toUpperCase());
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg border border-jatham-gold/10 max-w-sm mx-auto">
      <h3 className="text-center font-serif text-jatham-maroon mb-4">{title}</h3>
      <div className="grid grid-cols-4 gap-0 border-2 border-jatham-maroon/20 aspect-square">
        {rasiLayout.map((rasi, idx) => (
          <div 
            key={idx} 
            className={`
              relative aspect-square border-[0.5px] border-jatham-maroon/10 p-1 flex flex-col items-center justify-center
              ${rasi === null ? 'bg-jatham-cream/20' : 'bg-white hover:bg-jatham-cream/40 transition-colors'}
            `}
          >
            {rasi && (
              <>
                <span className="absolute top-1 left-1 text-[8px] text-jatham-maroon/30 uppercase font-bold">
                  {RASI_LABELS[rasi].slice(0, 3)}
                </span>
                <div className="flex flex-wrap justify-center gap-1">
                  {getPlanetsInSign(rasi).map(p => (
                    <span key={p} className="text-[10px] font-bold text-jatham-maroon">{p}</span>
                  ))}
                </div>
              </>
            )}
            {idx === 5 && <div className="col-span-2 row-span-2 flex items-center justify-center"><div className="w-16 h-16 border border-jatham-gold/10 rounded-full flex items-center justify-center text-[10px] text-jatham-gold/40 rotate-45">Vedic</div></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AstroChart;
