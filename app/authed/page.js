"use client";
import { useState, useEffect, useCallback } from "react";
import { auth, db } from "@/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ dailyGoal: 2000 });
  // FIX 3: Added carbs, protein, fat to stats state
  const [stats, setStats] = useState({ eaten: 0, carbs: 0, protein: 0, fat: 0 });
  const [history, setHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const router = useRouter();

  const getDaysInWeek = () => {
    const days = [];
    for (let i = -2; i <= 2; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getDaysInWeekPC = () => {
    const days = [];
    for (let i = -7; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // FIX 1: Use local date formatting to avoid UTC timezone shift
  // toISOString() uses UTC, which can shift the date in UTC+7.
  // This helper builds "YYYY-MM-DD" from local time instead.
  const toLocalDateStr = (dateObj) => {
    const day = dateObj.getDate();             // no padStart, so "17" not "017"
    const month = dateObj.getMonth() + 1;     // no padStart, so "5" not "05"
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;          // "17/5/2026" ✅
  };

  const fetchUserData = useCallback(async (uid) => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) setUserData(docSnap.data());
  }, []);

  const fetchStatsAndHistory = useCallback(async (uid, dateObj) => {
    // FIX 1: Use local date string instead of toISOString()
    const dateStr = toLocalDateStr(dateObj);

    const q = query(
      collection(db, "users", uid, "history"),
      where("dateStr", "==", dateStr),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;
    const list = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      totalCalories += Number(data.totalCalories || 0);

      // FIX 2: Aggregate macros from the `details` array stored per history entry
      const details = data.details || [];
      details.forEach((item) => {
        totalCarbs   += Number(item.carbs   || 0);
        totalProtein += Number(item.protein || 0);
        totalFat     += Number(item.fat     || 0);
      });

      list.push({ id: docSnap.id, ...data });
    });

    // FIX 3: Set all aggregated values into stats
    setStats({
      eaten:   totalCalories,
      carbs:   Math.round(totalCarbs),
      protein: Math.round(totalProtein),
      fat:     Math.round(totalFat),
    });
    setHistory(list);
  }, []);

  // FIX 4: Separate auth listener (runs once) from data fetching (runs on date change)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserData(currentUser.uid);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, []); // Only runs once on mount

  // FIX 4: Fetch history separately whenever user or selectedDate changes
  useEffect(() => {
    if (user) {
      fetchStatsAndHistory(user.uid, selectedDate);
    }
  }, [user, selectedDate, fetchStatsAndHistory]);

  if (!user) return null;

  const remaining = Math.max((userData.dailyGoal || 2000) - stats.eaten, 0);
  const progressWidth = Math.min((stats.eaten / (userData.dailyGoal || 2000)) * 100, 100);

  return (
    <main className="min-h-screen bg-white pb-24 font-['Nunito']">
      {/* HEADER & SLIDER TANGGAL */}
      <div className="bg-gradient-to-b from-[#6b7fe8] from-5% md:from-20% to-white pb-4">

      <div className="max-w-5xl mx-auto">
        <div className="px-5 md:px-0 pt-6 flex mb-6">
          <div className="flex justify-start items-center">
            <img src="/logo.svg" alt="Logo" className="w-10 h-10" />
            <h1 className="text-white text-2xl font-black italic uppercase tracking-tight">MBG</h1>
    
          </div>

          <div className="justify-end items-center ml-auto">
            <p className="text-white font-bold text-sm bg-white/20 px-4 py-1 rounded-full capitalize">
                {selectedDate.toLocaleDateString('id-ID', {day:'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>


        <div className="flex justify-between items-center mb-8 px-5">
          <div>
            <h1 className="text-white text-2xl font-black">
              Halo, {(user.displayName ? user.displayName.split(" ")[0] : "User Baru")} !
            </h1>
            <p className="text-white font-semibold text-sm">Sudah makan apa hari ini?</p>
          </div>
          <div className="w-12 h-12 bg-white rounded-4xl shadow-sm border-2 border-white overflow-hidden">
            <img src={user.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="avatar" />
          </div>
        </div>

        {/* --- HORIZONTAL DATE SLIDER (Mobile) --- */}
        <div className="flex md:hidden justify-between py-8 px-2 gap-1 overflow-x-auto no-scrollbar">
          {getDaysInWeek().map((date, i) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center min-w-[55px] p-2 rounded-2xl transition-all duration-300 ${
                  isSelected ? "bg-white text-[#6b7fe8] shadow-lg scale-110" : "bg-[#8b9ceb] text-white/70"
                }`}
              >
                <span className="text-[8px] font-black uppercase mb-1">
                  {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                </span>
                <span className="text-sm font-black">{date.getDate()}</span>
              </button>
            );
          })}
        </div>

        {/* --- HORIZONTAL DATE SLIDER (Desktop) --- */}
        <div className="hidden md:flex justify-between py-8 px-8 gap-1 overflow-x-auto no-scrollbar">
          {getDaysInWeekPC().map((date, i) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center min-w-[55px] p-2 rounded-2xl transition-all duration-300 ${
                  isSelected ? "bg-white text-[#6b7fe8] shadow-lg scale-110" : "bg-[#8b9ceb] text-white/70"
                }`}
              >
                <span className="text-[8px] font-black uppercase mb-1">
                  {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                </span>
                <span className="text-sm font-black">{date.getDate()}</span>
              </button>
            );
          })}
        </div>

        {/* RINGKASAN KALORI */}
        <div className="md:px-0 px-3 mt-8 mb-4">
          <div className="bg-white rounded-2xl shadow-xl flex flex-col items-center relative overflow-hidden border border-white">
            <div className="grid grid-cols-3 p-4 gap-2 text-center relative overflow-hidden pt-5 w-full">

              {/* CARD KARBO — FIX 2: now shows real aggregated carbs */}
              <div className="border border-white py-2 shadow-[0_0_15px_rgba(0,0,0,0.2)] rounded-2xl flex flex-col items-center justify-center bg-white text-center">
                <p className="text-black text-xs font-bold">Karbo</p>
                <svg viewBox="0 0 36 36" className="w-10 h-10 py-1" fill="none" stroke="#b58141" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 20 C8 14 10 10 18 10 C26 10 28 14 28 20 L28 26 Q18 28 8 26 Z" />
                  <path d="M12 10 Q14 6 18 6 Q22 6 24 10" />
                  <line x1="13" y1="18" x2="23" y2="18" />
                  <line x1="13" y1="22" x2="23" y2="22" />
                </svg>
                <p className="font-black text-sm text-[#d12b15]">{stats.carbs}<span className="text-xs text-black font-semibold"> Gr</span></p>
              </div>

              {/* CARD PROTEIN — FIX 2: now shows real aggregated protein */}
              <div className="border border-white shadow-[0_0_15px_rgba(0,0,0,0.2)] rounded-2xl flex flex-col items-center justify-center bg-white text-center">
                <p className="text-black text-xs font-bold">Protein</p>
                <svg viewBox="0 0 36 36" className="w-10 h-10 py-1" fill="none" stroke="#2fa2ff" strokeWidth="2">
                  <ellipse cx="18" cy="20" rx="9" ry="11" />
                  <circle cx="18" cy="20" r="4" />
                </svg>
                <p className="font-black text-sm text-[#d12b15]">{stats.protein}<span className="text-xs text-black font-semibold"> Gr</span></p>
              </div>

              {/* CARD LEMAK — FIX 2: now shows real aggregated fat */}
              <div className="border border-white shadow-[0_0_15px_rgba(0,0,0,0.2)] rounded-2xl flex flex-col items-center justify-center bg-white text-center">
                <p className="text-black text-xs font-bold">Lemak</p>
                <svg viewBox="0 0 36 36" className="w-10 h-10 py-1" fill="none" stroke="#ff7b30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 31c-6 0-10-4-10-9 0-4 2-7 5-10 0 4 2 5 4 5-1-3 1-7 4-9 0 4 4 6 4 10 2-1 2-4 2-4 2 2 3 5 3 8 0 5-4 9-12 9z" />
                </svg>
                <p className="font-black text-sm text-[#d12b15]">{stats.fat}<span className="text-xs text-black font-semibold"> Gr</span></p>
              </div>

            </div>
            <p className="text-[#8b90b8] text-[10px] font-black uppercase tracking-[0.2em] mb-1 pt-5">Sisa Kalori</p>
            <h2 className="text-[#1e2240] text-5xl font-black mb-1">{remaining}</h2>
            <p className="text-[#6b7fe8] font-bold text-xs">Target: {userData.dailyGoal} kcal</p>

            <div className="w-full h-3 bg-white rounded-full mt-6 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#6b7fe8] to-[#3cc4c4] transition-all duration-500"
                style={{ width: `${progressWidth}%` }}
              ></div>
            </div>

          </div>
        </div>
        </div>
      </div>

      {/* Scan CTA */}
      <button
        onClick={() => router.push("/scan")}
        className="mx-auto mb-8 bg-white max-w-5xl rounded-xl p-4 flex items-center border border-[#6b7fe8] border-2 gap-3.5 shadow-[0_15px_5px_rgba(107,127,232,0.1)] hover:-translate-y-0.5 transition-all w-[calc(100%-32px)] text-left"
      >
        <div className="w-[46px] h-[46px] shrink-0 bg-[#dde2f8] rounded-2xl flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7fe8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
            <circle cx="12" cy="12" r="3" fill="#6b7fe8" stroke="none" />
          </svg>
        </div>
        <span className="flex-1 text-[15px] font-black text-[#1e2240]">Mulai Scan Makananmu</span>
        <span className="text-[#6b7fe8] text-xl font-black">›</span>
      </button>

      {/* RIWAYAT MAKANAN BERDASARKAN TANGGAL */}
      <div className="px-6 mx:px-0 mt-8 max-w-5xl mx-auto">
        <h3 className="text-[#1e2240] font-black text-lg mb-4 flex items-center gap-2">
          <i className="fas fa-history text-[#6b7fe8]"></i> Riwayat Makan
        </h3>
        <div className="flex flex-col gap-3">
          {history.length > 0 ? history.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#dde2f8] rounded-xl flex items-center justify-center text-[#6b7fe8]">
                  <i className="fas fa-utensils"></i>
                </div>
                <div>
                  <p className="text-[#1e2240] font-bold text-sm capitalize">{item.foodNames}</p>
                  <p className="text-[#8b90b8] text-[10px] font-bold">{item.totalCalories} kcal</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[#f47c3c] font-black text-sm">Selesai</p>
              </div>
            </div>
          )) : (
            <div className="text-center p-10 bg-white/50 rounded-2xl border-2 border-dashed border-[#c4cbf5]">
              <p className="text-[#8b90b8] text-sm font-bold italic">Tidak ada data untuk tanggal ini.</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
