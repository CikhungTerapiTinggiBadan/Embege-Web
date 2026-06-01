"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import BottomNav from "@/components/BottomNav";

export default function Dashboard() {
  const [calories, setCalories] = useState(0);
  const goal = 2000;

  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const today = new Date().toLocaleDateString('id-ID');
      const q = query(collection(db, "users", user.uid, "history"), where("dateStr", "==", today));
      const snap = await getDocs(q);
      let total = 0;
      snap.forEach(doc => total += doc.data().totalCalories);
      setCalories(total);
    };
      const fetchUserHistory = async (uid) => {
      const q = query(
        collection(db, "users", uid, "history"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(data);
    };
  
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-[#eef1fb] p-6 pb-24 font-['Nunito']">
      {/* Header Profile */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[#1e2240] text-2xl font-black">Halo, Reyna!</h1>
          <p className="text-[#8b90b8] font-semibold text-sm">Sudah makan apa hari ini?</p>
        </div>
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border-2 border-white overflow-hidden">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Reyna" alt="avatar" />
        </div>
      </div>

      {/* Main Card (Progress) */}
      <div className="bg-[#6b7fe8] rounded-[35px] p-8 text-white shadow-xl shadow-[#6b7fe8]/20 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-blue-100 font-bold text-sm mb-1 uppercase tracking-wider">Kalori Harian</p>
          <h2 className="text-4xl font-black mb-6">{calories.toFixed(0)} <span className="text-xl font-medium opacity-70">/ {goal} kcal</span></h2>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min((calories/goal)*100, 100)}%` }}
            ></div>
          </div>
        </div>
        {/* Dekorasi lingkaran di background card */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full"></div>
      </div>

      {/* Grid Menu Lainnya */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-white p-5 rounded-[25px] shadow-sm">
          <div className="w-10 h-10 bg-orange-100 text-[#f47c3c] rounded-xl flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2"/></svg>
          </div>
          <p className="text-[#8b90b8] text-xs font-bold">Protein</p>
          <p className="text-[#1e2240] font-black">45.2g</p>
        </div>
        <div className="bg-white p-5 rounded-[25px] shadow-sm">
          <div className="w-10 h-10 bg-teal-100 text-[#3cc4c4] rounded-xl flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 3v19M5 8h14M5 16h14" strokeWidth="2"/></svg>
          </div>
          <p className="text-[#8b90b8] text-xs font-bold">Karbohidrat</p>
          <p className="text-[#1e2240] font-black">120g</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
          {history.length > 0 ? history.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-[25px] flex justify-between items-center shadow-sm border border-[#eef1fb]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#dde2f8] rounded-xl flex items-center justify-center text-[#6b7fe8]">
                  <i className="fas fa-utensils"></i>
                </div>
                <div>
                  <p className="text-[#1e2240] font-bold text-sm line-clamp-1 capitalize">{item.foodNames}</p>
                  <p className="text-[#8b90b8] text-[10px] font-bold uppercase">{item.dateStr}</p>
                </div>
              </div>
              <p className="text-[#f47c3c] font-black text-sm">{item.totalCalories} kcal</p>
            </div>
          )) : (
            <p className="text-center text-[#8b90b8] text-sm py-8 bg-white rounded-[25px] border border-dashed border-[#c4cbf5]">Belum ada riwayat makan.</p>
          )}
        </div>

      <BottomNav />
    </main>
  );
}