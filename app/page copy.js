"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/firebase/config"; // Pastikan config Firebase sudah benar
import { signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from "firebase/auth";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

export default function ScanPage() {
  // --- STATES ---
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [dailyCalories, setDailyCalories] = useState(0);

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

  // --- FIREBASE LOGIC ---
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
      alert("Gagal Login!");
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
    if (!user) return alert("Silakan login dulu bos!");
    if (components.length === 0) return alert("Belum ada data makanan!");

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

      alert("Data berhasil disimpan!");
      fetchTodayData(user.uid); // Refresh angka kalori harian
      setComponents([]); // Bersihkan piring setelah simpan
    } catch (e) {
      alert("Gagal menyimpan data.");
    }
  };

  // --- SCAN & MANUAL LOGIC ---
  const handleUpload = async () => {
    if (!file) return alert("Pilih foto dulu!");
    setLoading(true);
    setErrorMsg(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/scan-food", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.status === "success") {
        setComponents(data.components.map((c) => ({ ...c, portion: 1 })));
      } else {
        setErrorMsg(data.message);
      }
    } catch (error) {
      setErrorMsg("Gagal konek ke server API!");
    } finally {
      setLoading(false);
    }
  };

  const handleAddManual = async () => {
    if (!searchQuery) return;
    setSearchLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/search-food?query=${searchQuery}`);
      const result = await response.json();
      if (result.status === "success") {
        setComponents((prev) => [...prev, { ...result.data, portion: 1 }]);
        setSearchQuery("");
      }
    } catch (error) {
      alert("Gagal mencari makanan.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUpdatePortion = (index, delta) => {
    setComponents((prev) => {
      const newComponents = [...prev];
      const newPortion = newComponents[index].portion + delta;
      if (newPortion <= 0) return newComponents.filter((_, i) => i !== index);
      newComponents[index].portion = newPortion;
      return newComponents;
    });
  };

  const currentTotal = components.reduce((sum, item) => sum + item.calories * item.portion, 0);

  return (
    <main className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* NAVBAR */}
      <nav className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="font-bold text-indigo-600 text-xl tracking-tight">EEEMBEGE V.0.9.1</h1>
          {user && <p className="text-[10px] text-slate-500">Hari ini: <b>{dailyCalories.toFixed(0)} kcal</b> terdata</p>}
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <img src={user.photoURL} className="w-8 h-8 rounded-full border" alt="profile" />
            <button onClick={handleLogout} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1 rounded-full transition">Logout</button>
          </div>
        ) : (
          <button onClick={handleLogin} className="bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-md">
            Login ke Profil
          </button>
        )}
      </nav>

      <div className="max-w-md mx-auto px-4 mt-8 flex flex-col items-center">
        {/* KOTAK UPLOAD */}
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full border border-slate-100">
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])}
            className="mb-4 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600"
          />
          <button 
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold disabled:bg-slate-300 shadow-lg active:scale-95 transition"
          >
            {loading ? "Analisis AI..." : "Scan Makanan"}
          </button>
          {errorMsg && <p className="text-red-500 mt-4 text-center text-xs font-bold">{errorMsg}</p>}
        </div>

        {/* KOTAK HASIL */}
        {components.length > 0 && (
          <div className="mt-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-2xl text-center shadow-lg">
              <h2 className="text-sm font-medium opacity-90">Kalori Terdeteksi</h2>
              <p className="text-5xl font-black mt-1">{currentTotal.toFixed(0)} <span className="text-lg">kcal</span></p>
            </div>

            <div className="bg-white p-5 rounded-b-2xl shadow-xl border border-t-0 border-slate-100 flex flex-col gap-4">
              {components.map((item, index) => (
                <div key={index} className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-slate-800 capitalize">{item.name}</span>
                    <span className="text-indigo-600 font-bold">{(item.calories * item.portion).toFixed(0)} kcal</span>
                  </div>

                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2 mb-3 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase ml-2">Porsi</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleUpdatePortion(index, -0.5)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-600 rounded-lg hover:bg-red-100 hover:text-red-600 transition">-</button>
                      <span className="w-8 text-center font-bold text-sm">{item.portion}x</span>
                      <button onClick={() => handleUpdatePortion(index, 0.5)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-600 rounded-lg hover:bg-green-100 hover:text-green-600 transition">+</button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="bg-white border p-2 rounded-lg font-bold text-slate-600">{(item.carbs * item.portion).toFixed(1)}g<br/>Karb</div>
                    <div className="bg-white border p-2 rounded-lg font-bold text-slate-600">{(item.protein * item.portion).toFixed(1)}g<br/>Prot</div>
                    <div className="bg-white border p-2 rounded-lg font-bold text-slate-600">{(item.fat * item.portion).toFixed(1)}g<br/>Lemak</div>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Tambah manual..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button onClick={handleAddManual} disabled={searchLoading} className="bg-slate-200 text-slate-700 px-4 rounded-xl font-bold text-sm">
                    {searchLoading ? "..." : "+"}
                  </button>
                </div>

                <button 
                  onClick={handleSaveToCloud}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-indigo-200 shadow-lg hover:bg-indigo-700 transition"
                >
                  <i className="fas fa-cloud-upload-alt mr-2"></i>
                  {user ? "Simpan ke Profil" : "Login untuk Simpan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}