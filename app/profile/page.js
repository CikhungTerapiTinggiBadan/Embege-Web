/* ... di dalam komponen ScanPage ... */

return (
  <main className="...">
    {/* JIKA BELUM SCAN (TAMPILAN SCAN.HTML) */}
    {!result && (
      <div className="p-6">
        <h2 className="text-2xl font-black text-[#1e2240] mb-2">Scan Makanan</h2>
        <div className="upload-box-style-teman-kamu">
           {/* Input file di sini */}
        </div>
      </div>
    )}

    {/* JIKA SUDAH SCAN (TAMPILAN OUTPUT.HTML) */}
    {result && (
      <div className="p-6 animate-in fade-in zoom-in duration-300">
        <div className="bg-[#6b7fe8] rounded-t-[30px] p-6 text-white relative overflow-hidden">
          <p className="text-xs font-bold opacity-75 uppercase">Analisis AI Selesai</p>
          <h3 className="text-2xl font-black">Informasi Nutrisi</h3>
          <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-xl">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">...</svg>
          </div>
        </div>
        
        <div className="bg-white rounded-b-[30px] p-6 shadow-xl border border-t-0 border-white">
          {result.map((item, i) => (
            <div key={i} className="flex justify-between items-center py-4 border-b border-[#eef1fb] last:border-0">
               <div>
                 <p className="font-black text-[#1e2240] capitalize text-lg">{item.name}</p>
                 <div className="flex gap-2 text-[10px] font-bold text-[#8b90b8]">
                   <span>{item.calories} kcal</span>
                   <span>•</span>
                   <span>{item.carbs}g Karbo</span>
                 </div>
               </div>
               <div className="bg-[#6b7fe8]/10 px-4 py-2 rounded-2xl text-[#6b7fe8] font-black text-sm">
                 {item.protein}g Prot
               </div>
            </div>
          ))}
          
          <button 
            onClick={handleSaveToCloud} 
            className="w-full bg-[#6b7fe8] text-white py-4 rounded-2xl font-black mt-8 shadow-lg shadow-[#6b7fe8]/30 active:scale-95 transition"
          >
            SIMPAN KE JURNAL
          </button>
        </div>
      </div>
    )}
    
    <BottomNav />
  </main>
);