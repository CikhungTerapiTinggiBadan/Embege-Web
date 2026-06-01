"use client";
import { useState, useEffect } from "react";
import BottomNavNotLog from "@/components/BottomNavNotLog";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [selectedDate] = useState(new Date()); 
  const [activeDay, setActiveDay] = useState(3);
  const weekDays = [
    { label: "Yest", num: 1 },
    { label: "Yest", num: 2 },
    { label: "Today", num: 3 },
    { label: "Tomo", num: 4 },
    { label: "Tomo", num: 5 },
  ];

  return (
   <main className="min-h-screen bg-white pb-24 font-['Nunito']">
      {/* HEADER & SLIDER TANGGAL */}
      <div className="bg-gradient-to-b from-[#6b7fe8] from-5% md:from-20% to-white pb-4">
        <div className="max-w-5xl mx-auto">

        <div className="px-5 pt-6 flex mb-6">
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
        <div className="flex justify-center items-center mb-2 px-5">
          <div>
            <h1 className="text-white text-2xl font-black">Selamat Datang</h1>
            <p className="text-white font-semibold text-sm">Sudah makan apa hari ini?</p>
          </div>
        </div>

        <div className="flex md:hidden justify-between py-8 px-2 gap-1 overflow-x-auto no-scrollbar">
          {weekDays.map((day, idx) => {
            return (
              <button
                key={idx}
                onClick={() => setActiveDay(day.num)}
                className={`flex flex-col items-center min-w-[55px] p-2 rounded-2xl transition-all duration-300 ${
                  activeDay === day.num ? "bg-white text-[#6b7fe8] shadow-lg scale-110" : "bg-[#8b9ceb] text-white/70"
                }`}
              >
                <span className="text-[8px] font-black uppercase mb-1">
                  {day.label}
                </span>
                <span className="text-sm font-black">{day.num}</span>
              </button>
            );
          })}
        </div>

        {/* --- HORIZONTAL DATE SLIDER Buat Desktop--- */}
        <div className="hidden md:flex justify-between py-8 px-8 gap-1 overflow-x-auto no-scrollbar">
        </div>
      
        {/* Tracking Card LOCKED */}
        <div className="mx-4 mb-4 bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(107,127,232,0.12)] relative overflow-hidden">
          {/* Blurred Background */}
          <div className="blur-[4px] select-none pointer-events-none">
            <p className="text-center text-sm font-extrabold text-[#4a4f72] mb-3.5">Tracking Hari ini</p>
            <div className="flex gap-2.5 mb-3.5">
              <div className="flex-1 bg-[#eef1fb] rounded-2xl p-3 flex flex-col items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#4a4f72]">Kalori</span>
                <svg className="w-8 h-8" viewBox="0 0 36 36"><path stroke="#f47c3c" fill="none" strokeWidth="2" strokeLinecap="round" d="M18 31c-6 0-10-4-10-9 0-4 2-7 5-10 0 4 2 5 4 5-1-3 1-7 4-9 0 4 4 6 4 10 2-1 2-4 2-4 2 2 3 5 3 8 0 5-4 9-12 9z"/></svg>
                <span className="text-[11px] font-bold text-[#4a4f72]">0/2000 Kcal</span>
              </div>
              <div className="flex-1 bg-[#eef1fb] rounded-2xl p-3 flex flex-col items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#4a4f72]">Protein</span>
                <svg className="w-8 h-8" viewBox="0 0 36 36"><ellipse stroke="#3cc4c4" fill="none" strokeWidth="2" cx="18" cy="20" rx="9" ry="11"/><circle stroke="#3cc4c4" fill="none" strokeWidth="2" cx="18" cy="20" r="4"/></svg>
                <span className="text-[11px] font-bold text-[#4a4f72]">0/500 Gr</span>
              </div>
              <div className="flex-1 bg-[#eef1fb] rounded-2xl p-3 flex flex-col items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#4a4f72]">Karbo</span>
                <svg className="w-8 h-8" viewBox="0 0 36 36"><path stroke="#c89b3c" fill="none" strokeWidth="2" strokeLinecap="round" d="M8 20 C8 14 10 10 18 10 C26 10 28 14 28 20 L28 26 Q18 28 8 26 Z"/><line stroke="#c89b3c" strokeWidth="2" x1="13" y1="18" x2="23" y2="18"/><line stroke="#c89b3c" strokeWidth="2" x1="13" y1="22" x2="23" y2="22"/></svg>
                <span className="text-[11px] font-bold text-[#4a4f72]">0/500 Gr</span>
              </div>
            </div>
          <button className="w-full bg-gradient-to-br from-[#c4cbf5] to-[#dde2f8] rounded-2xl p-3 text-[13px] font-extrabold text-[#4a5fc4]">Tambah Asupan</button>
        </div>
        

        {/* Lock Overlay */}
        <div 
          onClick={() => router.push("/login")}
          className="absolute inset-0 bg-white/55 backdrop-blur-[2px] rounded-[24px] flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:bg-white/65 transition"
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4a5fc4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="3" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="text-base font-black text-[#4a5fc4]">Login untuk Membuka</span>
        </div>
        </div>
      </div>

    {/* Scan CTA */}
    <button 
      onClick={() => router.push("/scan")}
      className="mx-4 mb-8 md:mt-15 max-w-5xl mx-auto bg-white rounded-xl p-4 flex items-center border border-[#6b7fe8] border-2 gap-3.5 shadow-[0_15px_5px_rgba(107,127,232,0.1)] hover:-translate-y-0.5 transition-all w-[calc(100%-32px)] text-left"    >

      <div className="w-[46px] h-[46px] shrink-0 bg-[#dde2f8] rounded-2xl flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7fe8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
          <circle cx="12" cy="12" r="3" fill="#6b7fe8" stroke="none" />
        </svg>
      </div>
      <span className="flex-1 text-[15px] font-black text-[#1e2240]">Mulai Scan Makananmu</span>
      <span className="text-[#6b7fe8] text-xl font-black">›</span>
    </button>

    {/* History LOCKED */}
    <div className="bg-gradient-to-br from-[#4a5fc4] to-[#6b7fe8] rounded-t-[32px] pt-6 px-5 pb-5 min-h-[240px] relative">
      <p className="text-base font-black text-white mb-4 text-center">Riwayat Makanan kamu</p>

      {/* Blurred Food Card */}
      <div className="bg-white/15 rounded-[18px] p-3.5 flex items-center gap-3 border border-white/20 blur-[3.5px] select-none pointer-events-none">
        <div className="w-10 h-10 shrink-0 bg-white/15 rounded-xl flex items-center justify-center">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <path d="M7 2v20" />
            <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-extrabold text-white mb-0.5">Nasi Goreng & Telur Goreng</p>
          <p className="text-[11px] font-bold text-white/75">🔥 1000 Kcal &nbsp;|&nbsp; ⚪ 18 gr &nbsp;|&nbsp; 🍞 18 gr</p>
        </div>
      </div>

            {/* History Lock Overlay */}
      <div className="absolute top-[70px] left-0 right-0 flex flex-col items-center gap-2.5 pointer-events-none">
        <div className="bg-white/85 rounded-full p-2.5 shadow-[0_4px_16px_rgba(74,95,196,0.2)]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4a5fc4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="3" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <span className="text-base font-black text-white">Login untuk Membuka</span>
      </div>
    </div>
    </div>
      <BottomNavNotLog />
    </main>
  );
}