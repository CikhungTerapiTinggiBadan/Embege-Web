"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/firebase/config";
import { signOut, deleteUser, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import { useRouter } from "next/navigation";

// ── Import the shared calculator from the login page ──────────
// Adjust the path to match your project structure
import { calculateMacros } from "@/app/login/page";

// ─────────────────────────────────────────────
// Diet goal meta (same as login page)
// ─────────────────────────────────────────────
const DIET_GOALS = [
  { id: "cut",     label: "Cut",     desc: "Turun berat",   icon: "🔥", color: "#ef4444", bg: "#fef2f2" },
  { id: "balance", label: "Balance", desc: "Jaga berat",    icon: "⚖️", color: "#6b7fe8", bg: "#eef1fb" },
  { id: "bulk",    label: "Bulk",    desc: "Naikkan otot",  icon: "💪", color: "#10b981", bg: "#ecfdf5" },
];

// ─────────────────────────────────────────────
// Macro card
// ─────────────────────────────────────────────
function MacroCard({ label, value, unit, color }) {
  return (
    <div className="border border-[#eef1fb] rounded-xl p-3 text-center">
      <p className="text-[#8b90b8] text-[8px] font-black uppercase tracking-widest mb-1">{label}</p>
      <p className="font-black text-xl" style={{ color }}>{value}</p>
      <p className="text-[#8b90b8] text-[9px] font-semibold">{unit}</p>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({
    age: 0, weight: 0, height: 0, gender: "Laki-laki",
    dietGoal: "balance",
    dailyGoal: 2000, carbGoal: 250, proteinGoal: 120, fatGoal: 55,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    age: "", weight: "", height: "", gender: "Laki-laki", dietGoal: "balance",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  // ── auth + fetch ──────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserData(currentUser.uid);
      } else {
        router.push("/login");
      }
    });
    return () => unsub();
  }, []);

  const fetchUserData = async (uid) => {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const data = snap.data();
      setUserData(data);
      setFormData({
        age:      data.age      || "",
        weight:   data.weight   || "",
        height:   data.height   || "",
        gender:   data.gender   || "Laki-laki",
        dietGoal: data.dietGoal || "balance",
      });
    }
  };

  // ── save edited profile ───────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    const { age, weight, height, gender, dietGoal } = formData;
    const macros = calculateMacros({
      age: Number(age), weight: Number(weight),
      height: Number(height), gender, dietGoal,
    });

    const newData = {
      displayName: user.displayName || "User",
      email:       user.email,
      photoURL:    user.photoURL || "",
      age:         Number(age),
      weight:      Number(weight),
      height:      Number(height),
      gender,
      dietGoal,
      dailyGoal:   macros.dailyGoal,
      carbGoal:    macros.carbs,
      proteinGoal: macros.protein,
      fatGoal:     macros.fat,
      updatedAt:   serverTimestamp(),
    };

    try {
      await setDoc(doc(db, "users", user.uid), newData, { merge: true });
      setUserData((prev) => ({ ...prev, ...newData }));
      setIsEditing(false);
    } catch {
      alert("Gagal menyimpan data.");
    }
  };

  // ── delete account ────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await deleteUser(user); // removes from Firebase Auth
      router.push("/login");
    } catch (err) {
      // deleteUser requires a recent sign-in; prompt re-auth if needed
      alert("Gagal hapus akun. Coba login ulang terlebih dahulu lalu coba lagi.");
    }
  };

  const setField = (k, v) => setFormData((p) => ({ ...p, [k]: v }));

  const inputCls =
    "w-full bg-[#f8faff] border border-[#eef1fb] rounded-2xl px-4 py-3 font-bold text-[#1e2240] focus:outline-none focus:border-[#6b7fe8] transition text-sm";

  const activeDietGoal = DIET_GOALS.find((g) => g.id === userData.dietGoal) || DIET_GOALS[1];

  if (!user) return null;

  return (
    <main className="min-h-screen bg-white pb-24 font-['Nunito'] relative">
      <div className="bg-gradient-to-b from-[#6b7fe8] from-70% to-white pb-4">
        <div className="max-w-5xl mx-auto ">

        {/* ── HEADER ─────────────────────────────────── */}
        <div className="pb-4 rounded relative flex flex-col items-center pt-12 text-white">
          <h2 className="text-xl font-black mb-6 tracking-wide">
            Selamat Datang, {user.displayName || "User Baru"} !
          </h2>
          <img
            src={user.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
            className="w-16 h-16 mb-20 rounded-[18px] border-2 border-[#eef1fb] bg-slate-50"
            alt="avatar"
          />

          {/* Floating info card */}
          <div className="bg-white w-[85%] rounded-xl p-6 absolute -bottom-16 shadow-xl shadow-[#6b7fe8]/10 flex items-center justify-between border border-white">
            <div>
              <h3 className="text-[#1e2240] font-black text-lg">{user.displayName || "User Baru"}</h3>
              <p className="text-[#8b90b8] text-[11px] font-bold uppercase tracking-tight">{user.email}</p>
              {/* Diet goal badge */}
              <span
                className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full"
                style={{ background: activeDietGoal.bg, color: activeDietGoal.color }}
              >
                {activeDietGoal.icon} {activeDietGoal.label.toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="w-10 h-10 flex items-center justify-center active:scale-95 transition"
            >
              <img src="/edit.svg" className="hover:scale-110" alt="edit" />
            </button>
          </div>
        </div>
      </div>

        {/* ── BODY INFO ──────────────────────────────── */}
        <div className="mt-24 px-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#eef1fb]">
            <h2 className="text-xl font-black text-[#1e2240] mb-6 text-center">INFORMASI TUBUH</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-black text-[10px] font-bold uppercase tracking-widest mb-1">Berat</p>
                <p className="text-black text-xl font-black">{userData.weight || "-"} <span className="text-xs font-semibold">kg</span></p>
              </div>
              <div>
                <p className="text-black text-[10px] font-bold uppercase tracking-widest mb-1">Tinggi</p>
                <p className="text-black text-xl font-black">{userData.height || "-"} <span className="text-xs font-semibold">cm</span></p>
              </div>
              <div>
                <p className="text-black text-[10px] font-bold uppercase tracking-widest mb-1">Gender</p>
                <div className="flex items-center justify-center pt-1">
                  {userData.gender === "Laki-laki" ? (
                    <img src="/cowo.svg" alt="Pria" className="w-10 h-10 object-contain drop-shadow-sm" />
                  ) : userData.gender === "Perempuan" ? (
                    <img src="/cewe.svg" alt="Wanita" className="w-10 h-10 object-contain drop-shadow-sm" />
                  ) : (
                    <p className="font-black text-xl text-[#3cc4c4]">-</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MACRO TARGETS ──────────────────────────── */}
        <div className="mt-6 px-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#eef1fb]">
            <h2 className="text-xl font-black text-[#1e2240] mb-1 text-center">TARGET HARIAN</h2>
            <p className="text-[#8b90b8] text-[11px] font-bold text-center mb-5">
              Berdasarkan tujuan{" "}
              <span style={{ color: activeDietGoal.color }} className="font-black">
                {activeDietGoal.icon} {activeDietGoal.label}
              </span>
            </p>

            {/* 2-col top row: weight + height (context only) */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="border border-[#eef1fb] rounded-2xl p-3 text-center">
                <p className="text-[10px] font-bold text-[#8b90b8] uppercase tracking-widest mb-1">Berat</p>
                <p className="font-black text-sm text-[#1e2240]">{userData.weight || "-"} <span className="text-xs font-semibold">kg</span></p>
              </div>
              <div className="border border-[#eef1fb] rounded-2xl p-3 text-center">
                <p className="text-[10px] font-bold text-[#8b90b8] uppercase tracking-widest mb-1">Tinggi</p>
                <p className="font-black text-sm text-[#1e2240]">{userData.height || "-"} <span className="text-xs font-semibold">cm</span></p>
              </div>
            </div>

            {/* 4-col macro targets — all showing REAL values now */}
            <div className="grid grid-cols-2 gap-3">
              <MacroCard label="Karbohidrat Max/Day" value={userData.carbGoal    || "-"} unit="gram" color="#d12b15" />
              <MacroCard label="Protein Max/Day"     value={userData.proteinGoal || "-"} unit="gram" color="#5e47f6" />
              <MacroCard label="Lemak Max/Day"       value={userData.fatGoal     || "-"} unit="gram" color="#ff914d" />
              <MacroCard label="Kalori Max/Day"      value={userData.dailyGoal   || "-"} unit="kcal" color="#00bf63" />
            </div>
          </div>
        </div>

        {/* ── ACTIONS ────────────────────────────────── */}
        <div className="mt-6 px-6 flex flex-col gap-3">
          <button
            onClick={() => signOut(auth)}
            className="w-full bg-white border-2 border-red-100 text-red-500 py-4 rounded-[20px] font-bold flex items-center justify-center gap-3 hover:bg-red-50 transition active:scale-95"
          >
            <i className="fas fa-sign-out-alt" /> Keluar Akun
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full bg-red-500 text-white py-4 rounded-[20px] font-bold flex items-center justify-center gap-3 hover:bg-red-600 transition active:scale-95"
          >
            <i className="fas fa-trash" /> Hapus Akun
          </button>
        </div>

        {/* ── EDIT MODAL ─────────────────────────────── */}
        {isEditing && (
          <div className="fixed inset-0 bg-[#1e2240]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white w-full max-w-md rounded-[35px] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 my-4">

              <button
                onClick={() => setIsEditing(false)}
                className="absolute top-6 right-6 w-8 h-8 bg-[#eef1fb] text-[#8b90b8] rounded-full flex items-center justify-center font-bold"
              >
                <i className="fas fa-times" />
              </button>

              <h3 className="text-2xl font-black text-[#1e2240] mb-1">Edit Profil</h3>
              <p className="text-[#8b90b8] text-sm font-semibold mb-6">
                Target nutrisimu akan dihitung ulang secara otomatis.
              </p>

              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-[#8b90b8] uppercase ml-2 mb-1 block">Usia (Thn)</label>
                    <input type="number" required className={inputCls}
                      value={formData.age} onChange={(e) => setField("age", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-[#8b90b8] uppercase ml-2 mb-1 block">Gender</label>
                    <select className={inputCls}
                      value={formData.gender} onChange={(e) => setField("gender", e.target.value)}>
                      <option value="Laki-laki">Pria</option>
                      <option value="Perempuan">Wanita</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-[#8b90b8] uppercase ml-2 mb-1 block">Berat (kg)</label>
                    <input type="number" required className={inputCls}
                      value={formData.weight} onChange={(e) => setField("weight", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-[#8b90b8] uppercase ml-2 mb-1 block">Tinggi (cm)</label>
                    <input type="number" required className={inputCls}
                      value={formData.height} onChange={(e) => setField("height", e.target.value)} />
                  </div>
                </div>

                {/* Diet Goal */}
                <div>
                  <label className="text-[10px] font-black text-[#8b90b8] uppercase ml-2 mb-2 block">Tujuan Diet</label>
                  <div className="grid grid-cols-3 gap-2">
                    {DIET_GOALS.map((g) => {
                      const active = formData.dietGoal === g.id;
                      return (
                        <button
                          key={g.id} type="button"
                          onClick={() => setField("dietGoal", g.id)}
                          style={active ? { background: g.bg, borderColor: g.color } : {}}
                          className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${
                            active ? "shadow-sm scale-[1.03]" : "border-[#eef1fb] bg-[#f8faff]"
                          }`}
                        >
                          <span className="text-xl">{g.icon}</span>
                          <span className="text-xs font-black" style={{ color: active ? g.color : "#1e2240" }}>
                            {g.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#6b7fe8] text-white py-4 rounded-2xl font-black mt-2 shadow-lg shadow-[#6b7fe8]/30 active:scale-95 transition"
                >
                  SIMPAN PROFIL
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── DELETE CONFIRM MODAL ───────────────────── */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-[#1e2240]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[30px] p-8 shadow-2xl text-center animate-in zoom-in-95 duration-200">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-xl font-black text-[#1e2240] mb-2">Hapus Akun?</h3>
              <p className="text-[#8b90b8] text-sm font-semibold mb-6">
                Tindakan ini permanen dan tidak bisa dibatalkan. Semua data kamu akan hilang.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-2xl border-2 border-[#eef1fb] text-[#8b90b8] font-black text-sm hover:bg-[#f8faff] transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black text-sm hover:bg-red-600 transition active:scale-95"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="block md:hidden">
          <BottomNav />
        </div>
      </div>
    </main>
  );
}
