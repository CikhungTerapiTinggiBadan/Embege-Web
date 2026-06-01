"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/firebase/config"; // Pastikan config ini benar ya Bang
import { signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from "firebase/auth";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import BottomNavNotLog from "@/components/BottomNavNotLog";

export default function ScanPage() {
  // --- STATES ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [components, setComponents] = useState([]); // Menggantikan 'result'
  const [errorMsg, setErrorMsg] = useState(null);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // State untuk Pop-up Kustom
  const [popup, setPopup] = useState({
    isOpen: false,
    type: "success", // 'success' atau 'error'
    message: ""
  });

  const googleProvider = new GoogleAuthProvider();

  // --- EFFECTS ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchTodayData(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- HELPER UNTUK POP-UP ---
  const triggerPopup = (type, message) => {
    setPopup({ isOpen: true, type, message });
  };

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, isOpen: false }));
  };

  // --- FIREBASE LOGIC ---
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
      triggerPopup("error", "Gagal Login ke akun Google-mu!");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setDailyCalories(0);
    setComponents([]);
  };

  const fetchTodayData = async (userId) => {
    try {
      const today = new Date().toLocaleDateString('id-ID');
      const q = query(
        collection(db, "users", userId, "history"),
        where("dateStr", "==", today)
      );

      const querySnapshot = await getDocs(q);
      let total = 0;
      querySnapshot.forEach((doc) => {
        total += doc.data().totalCalories;
      });
      setDailyCalories(total);
    } catch (error) {
      console.error("Error fetching daily data:", error);
    }
  };

  const handleSaveToCloud = async () => {
    if (!user) return triggerPopup("error", "Silakan login dulu bos!");
    if (components.length === 0) return triggerPopup("error", "Belum ada data makanan di piringmu!");
    if (isSaving) return; // Mencegah klik berkali-kali

    setIsSaving(true);
    try {
      const totalCal = components.reduce((sum, item) => sum + item.calories * item.portion, 0);
      const today = new Date().toLocaleDateString('id-ID');

      await addDoc(collection(db, "users", user.uid, "history"), {
        foodNames: components.map(c => c.name).join(", "),
        totalCalories: totalCal,
        details: components,
        createdAt: serverTimestamp(),
        dateStr: today
      });

      triggerPopup("success", "Data makananmu berhasil disimpan ke jurnal.");
      fetchTodayData(user.uid); // Refresh angka kalori harian
      setComponents([]); // Bersihkan piring setelah simpan
    } catch (e) {
      triggerPopup("error", "Gagal menyimpan data ke cloud server.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- SCAN & MANUAL LOGIC ---
  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setErrorMsg(null);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      // PERBAIKAN: Menggunakan relative path untuk Vercel API
      const res = await fetch("/api/scan-food", { method: "POST", body: formData });
      const data = await res.json();
      
      const items = data.components || []; 
      if (items.length > 0) {
        setComponents(items.map((c) => ({ ...c, portion: 1 })));
      } else {
        setErrorMsg(data.message || "Tidak ada makanan terdeteksi.");
      }
    } catch (err) {
      setErrorMsg("Gagal konek ke server API!");
    } finally {
      setLoading(false);
    }
  };

  const handleAddManual = async () => {
    if (!searchQuery) return;
    setSearchLoading(true);
    try {
      // PERBAIKAN: Menggunakan relative path untuk Vercel API
      const response = await fetch(`/api/search-food?query=${searchQuery}`);
      const result = await response.json();
      if (result.status === "success" || result.data) {
        const newItem = result.data || result;
        setComponents((prev) => [...prev, { ...newItem, portion: 1 }]);
        setSearchQuery("");
      }
    } catch (error) {
      triggerPopup("error", "Gagal mencari makanan. Coba cek koneksi atau keyword-mu.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUpdatePortion = (index, delta) => {
    // PERBAIKAN: Cara update state array di React yang lebih aman (tidak mutate langsung)
    setComponents((prev) => {
      const newComponents = [...prev];
      const currentItem = newComponents[index];
      const newPortion = currentItem.portion + delta;
      
      if (newPortion <= 0) return newComponents.filter((_, i) => i !== index);
      
      newComponents[index] = { ...currentItem, portion: newPortion };
      return newComponents;
    });
  };

  const currentTotal = components.reduce((sum, item) => sum + item.calories * item.portion, 0);

  return (
    <main className="min-h-screen bg-[#eef1fb] pb-24 font-['Nunito'] relative">
      
      {/* Top Header with Auth */}
      <div className="bg-white p-6 rounded-b-[40px] shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-[#1e2240] font-black text-xl">Scan Makanan</h2>
          {user ? (
            <p className="text-[#8b90b8] text-xs font-bold">Hari ini: <span className="text-[#6b7fe8]">{dailyCalories.toFixed(0)} kcal</span></p>
          ) : (
            <p className="text-[#8b90b8] text-xs font-semibold">AI akan menganalisis piringmu</p>
          )
        }
        </div>
        
        {user ? (
          <div className="flex flex-col items-end gap-1">
            <img src={user.photoURL} className="w-9 h-9 rounded-full border-2 border-[#dde2f8]" alt="profile" />
            <button onClick={handleLogout} className="text-[10px] font-black text-red-500 hover:opacity-75 transition">Logout</button>
          </div>
        ) : (
          <button 
          onClick={() => router.push("/login")}
          className="bg-[#dde2f8] text-[#4a5fc4] px-4 py-2 rounded-xl text-xs font-black shadow-sm active:scale-95 transition">
            Login Dulu
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Upload Box */}
        {components.length === 0 ? (
          <div className="bg-white border-4 border-dashed border-[#c4cbf5] rounded-[35px] p-12 flex flex-col items-center justify-center mt-6">
            <div className="w-20 h-20 bg-[#dde2f8] rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-[#6b7fe8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeWidth="2"/>
                <circle cx="12" cy="13" r="4" strokeWidth="2"/>
              </svg>
            </div>
            <label className="bg-[#6b7fe8] text-white px-8 py-3 rounded-2xl font-bold cursor-pointer shadow-lg shadow-[#6b7fe8]/30 hover:bg-[#4a5fc4] active:scale-95 transition">
              {loading ? "Menganalisis..." : "Pilih Foto"}
              <input type="file" className="hidden" onChange={handleScan} accept="image/*" disabled={loading} />
            </label>
            {errorMsg && <p className="text-red-500 mt-4 text-center text-xs font-bold">{errorMsg}</p>}
          </div>
        ) : (
          
          /* Hasil UI */
          <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#6b7fe8] p-6 rounded-t-[30px] text-white text-center shadow-md">
              <p className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1">Total Kalori Piringmu</p>
              <h3 className="text-5xl font-black">{currentTotal.toFixed(0)} <span className="text-xl">kcal</span></h3>
            </div>
            
            <div className="bg-white p-6 rounded-b-[30px] shadow-lg flex flex-col gap-4">
              {components.map((item, index) => (
                <div key={index} className="bg-[#f8fafe] border border-[#eef1fb] p-4 rounded-2xl">
                  
                  {/* Nama Makanan & Kalori */}
                  <div className="flex justify-between items-center mb-3 border-b border-[#eef1fb] pb-3">
                    <span className="font-black text-[#1e2240] capitalize">{item.name}</span>
                    <span className="text-[#6b7fe8] font-black text-sm">{(item.calories * item.portion).toFixed(0)} kcal</span>
                  </div>

                  {/* Kontrol Porsi */}
                  <div className="flex items-center justify-between bg-white border border-[#eef1fb] rounded-xl p-2 mb-3">
                    <span className="text-[11px] font-extrabold text-[#8b90b8] uppercase ml-2">Porsi</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleUpdatePortion(index, -0.5)} className="w-8 h-8 flex items-center justify-center bg-[#ffe6e6] text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition font-black">-</button>
                      <span className="w-8 text-center font-black text-sm text-[#1e2240]">{item.portion}x</span>
                      <button onClick={() => handleUpdatePortion(index, 0.5)} className="w-8 h-8 flex items-center justify-center bg-[#eef1fb] text-[#6b7fe8] rounded-lg hover:bg-[#6b7fe8] hover:text-white transition font-black">+</button>
                    </div>
                  </div>
                  
                  {/* Macros Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="bg-white border border-[#eef1fb] p-2 rounded-xl font-bold text-[#8b90b8]">
                      <span className="text-[#1e2240] font-black block text-sm">{(item.carbs * item.portion).toFixed(1)}g</span> Karbo
                    </div>
                    <div className="bg-white border border-[#eef1fb] p-2 rounded-xl font-bold text-[#8b90b8]">
                      <span className="text-[#1e2240] font-black block text-sm">{(item.protein * item.portion).toFixed(1)}g</span> Protein
                    </div>
                    <div className="bg-white border border-[#eef1fb] p-2 rounded-xl font-bold text-[#8b90b8]">
                      <span className="text-[#1e2240] font-black block text-sm">{(item.fat * item.portion).toFixed(1)}g</span> Lemak
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2 flex flex-col gap-3">
                {/* Manual Add */}
                <div className="flex ">
                  <input 
                    type="text" 
                    placeholder="Tambah manual"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-[#f8fafe] border-none rounded-xl pl-4 py-3 text-sm font-semibold text-[#1e2240] placeholder-[#8b90b8] focus:ring-2 focus:ring-[#c4cbf5] outline-none"
                  />
                  <button onClick={handleAddManual} disabled={searchLoading} className="bg-[#dde2f8] text-[#4a5fc4] px-4 rounded-xl font-black text-lg active:scale-95 transition">
                    {searchLoading ? "..." : "+"}
                  </button>
                </div>

                {/* Save Button */}
                <button 
                  onClick={handleSaveToCloud}
                  className={`w-full py-4 rounded-2xl font-extrabold mt-2 transition shadow-lg ${
                    user 
                      ? "bg-[#6b7fe8] text-white shadow-[#6b7fe8]/20 hover:bg-[#4a5fc4] active:scale-95" 
                      : "bg-[#eef1fb] text-[#8b90b8] shadow-none cursor-not-allowed"
                  }`}
                >
                  {user ? "SIMPAN KE JURNAL" : "LOGIN UNTUK SIMPAN"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- BOTTOM NAV --- */}
      <div className="block md:hidden">
        {user ? <BottomNav /> : <BottomNavNotLog />}
      </div>

      {/* --- CUSTOM POP-UP COMPONENT (SUCCESS / ERROR) --- */}
      {popup.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[30px] p-6 max-w-sm w-full shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200">
            
            {/* Bagian Konten Maskot + Teks */}
            <div className="flex items-center gap-4">
              <img 
                src={popup.type === "success" ? "/bisa.svg" : "/gagal.svg"}
                alt="Maskot" 
                className="md:w-40 md:h-40 w-25 h-25 object-contain shrink-0" 
              />
              <div className="flex-1">
                <h4 className={`font-black text-xl text-base ${popup.type === "success" ? "text-green-500" : "text-red-500"}`}>
                  {popup.type === "success" ? "BERHASIL !" : "Oops, Ada Masalah!"}
                </h4>
                <p className="text-[#4a5fc4] text-xs font-bold mt-0.5 leading-relaxed">
                  {popup.message}
                </p>
              </div>
            </div>

            {/* Tombol Close */}
            <button
              onClick={closePopup}
              className={`w-full py-3 rounded-xl font-black text-xs text-white transition active:scale-95 ${
                popup.type === "success" 
                  ? "bg-[#6b7fe8] hover:bg-[#4a5fc4] shadow-md shadow-[#6b7fe8]/20" 
                  : "bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20"
              }`}
            >
              Oke
            </button>
          </div>
        </div>
      )}

    </main>
  );
}