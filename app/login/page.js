"use client";
import { useState, useEffect } from "react";
import { auth, db, googleProvider } from "@/firebase/config";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────
// Shared macro calculator (also used in profile page)
// ─────────────────────────────────────────────
export function calculateMacros({ age, weight, height, gender, dietGoal }) {
  // BMR — Mifflin-St Jeor
  let bmr =
    gender === "Laki-laki"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  // TDEE (sedentary × 1.2)
  let tdee = Math.round(bmr * 1.2);

  // Adjust for goal
  let dailyGoal =
    dietGoal === "bulk" ? tdee + 300 : dietGoal === "cut" ? tdee - 400 : tdee;

  // Macros
  const protein = Math.round(weight * 2);           // 2 g per kg bodyweight
  const fat     = Math.round((dailyGoal * 0.25) / 9); // 25 % of calories from fat
  const carbs   = Math.round((dailyGoal - protein * 4 - fat * 9) / 4);

  return { dailyGoal, protein, fat, carbs };
}

const DIET_GOALS = [
  {
    id: "cut",
    label: "Cut",
    desc: "Turun berat badan",
    icon: "🔥",
    color: "#ef4444",
    bg: "#fef2f2",
  },
  {
    id: "balance",
    label: "Balance",
    desc: "Jaga berat ideal",
    icon: "⚖️",
    color: "#6b7fe8",
    bg: "#eef1fb",
  },
  {
    id: "bulk",
    label: "Bulk",
    desc: "Naikkan massa otot",
    icon: "💪",
    color: "#10b981",
    bg: "#ecfdf5",
  },
];

// ─────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────
function StepDots({ step }) {
  return (
    <div className="flex gap-2 justify-center mb-6">
      {[1, 2].map((s) => (
        <div
          key={s}
          className={`h-2 rounded-full transition-all duration-300 ${
            step === s ? "w-6 bg-[#6b7fe8]" : "w-2 bg-[#c4cbf5]"
          }`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Input helper
// ─────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] font-black text-[#8b90b8] uppercase ml-4 mb-1 block tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-[#f8faff] border border-[#eef1fb] rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-[#6b7fe8] text-[#1e2240] font-semibold transition";

export default function AuthPage() {
  const [authMode, setAuthMode] = useState("login"); // "login" | "signup"
  const [step, setStep] = useState(1);               // 1 = credentials, 2 = profile
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null); // Firebase user after step-1
  const router = useRouter();

  // Step 1 fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 fields (shared between email-signup and Google new users)
  const [profileData, setProfileData] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    gender: "Laki-laki",
    dietGoal: "balance",
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return; // not logged in, stay on page

      const docSnap = await getDoc(doc(db, "users", u.uid));
      if (docSnap.exists()) {
        // Profile already complete → redirect
        router.push("/authed");
      }
      // No profile yet → do nothing, let step 2 render
    });
    return () => unsub();
  }, []);

  // ── save profile to Firestore (step 2) ─────────────────────
  const saveProfile = async (firebaseUser, overrideName) => {
    const { age, weight, height, gender, dietGoal } = profileData;
    const name = overrideName || profileData.name;

    const macros = calculateMacros({
      age: Number(age),
      weight: Number(weight),
      height: Number(height),
      gender,
      dietGoal,
    });

    await setDoc(
      doc(db, "users", firebaseUser.uid),
      {
        displayName: name,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL || "",
        age: Number(age),
        weight: Number(weight),
        height: Number(height),
        gender,
        dietGoal,
        dailyGoal: macros.dailyGoal,
        carbGoal: macros.carbs,
        proteinGoal: macros.protein,
        fatGoal: macros.fat,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  // ── EMAIL LOGIN ─────────────────────────────────────────────
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/authed");
    } catch (err) {
      alert("Login gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── EMAIL SIGNUP step 1 ─────────────────────────────────────
  const handleEmailSignupStep1 = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      setPendingUser(cred.user);
      setStep(2);
    } catch (err) {
      alert("Pendaftaran gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── EMAIL SIGNUP step 2 ─────────────────────────────────────
  const handleEmailSignupStep2 = async (e) => {
    e.preventDefault();
    if (!pendingUser) return;
    setLoading(true);
    try {
      await updateProfile(pendingUser, { displayName: profileData.name });
      await saveProfile(pendingUser);
      router.push("/authed");
    } catch (err) {
      alert("Gagal menyimpan profil: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── GOOGLE LOGIN ────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const firebaseUser = cred.user;
      const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));

      if (docSnap.exists()) {
        // Returning user → go straight home
        router.push("/authed");
      } else {
        // New Google user → collect profile before saving
        setPendingUser(firebaseUser);
        // Pre-fill name from Google account
        setProfileData((prev) => ({ ...prev, name: firebaseUser.displayName || "" }));
        setStep(2);
      }
    } catch (err) {
      alert("Google login gagal.");
    } finally {
      setLoading(false);
    }
  };

  // ── helpers ─────────────────────────────────────────────────
  const setProfile = (field, value) =>
    setProfileData((prev) => ({ ...prev, [field]: value }));

  const goBackToStep1 = () => {
    setStep(1);
    setPendingUser(null);
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#eef1fb] flex flex-col items-center justify-center p-6 font-['Nunito'] py-12">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-500">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#6b7fe8] rounded-[25px] flex items-center justify-center mx-auto shadow-lg shadow-[#6b7fe8]/30 mb-4">
            <img src="/logo.svg" alt="Logo" className="w-15 h-15" />

          </div>
          <h1 className="text-[#1e2240] text-3xl font-black">MGB</h1>
          <p className="text-[#8b90b8] font-bold">Mitra Bantuan Gizi</p>
        </div>

        <div className="bg-white rounded-[35px] p-8 shadow-xl shadow-[#6b7fe8]/10 border border-white">

          {/* ══════════════ STEP 1 ══════════════ */}
          {step === 1 && (
            <>
              {/* Toggle login / daftar */}
              <div className="flex gap-4 mb-8 bg-[#eef1fb] p-1.5 rounded-2xl">
                {["login", "signup"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAuthMode(mode)}
                    className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                      authMode === mode
                        ? "bg-[#6b7fe8] text-white shadow-md"
                        : "text-[#8b90b8]"
                    }`}
                  >
                    {mode === "login" ? "LOGIN" : "DAFTAR"}
                  </button>
                ))}
              </div>

              <div className="text-[10px] font-black text-[#8b90b8] uppercase ml-4 mb-1 block tracking-wider">
                {authMode === "login" ? "login" : "daftar"} dengan
              </div>

              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin} disabled={loading}
                  className="w-full bg-white border-2 border-[#eef1fb] text-[#1e2240] py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-[#f8faff] transition active:scale-95 disabled:opacity-50"
                >
                  <img
                    src="google.svg"
                    className="w-5 h-5" alt="google"
                  />
                  <span className="block sm:hidden">GOOGLE</span>

                  {/* Teks untuk Tablet/Desktop (Teks Lengkap) */}
                  <span className="hidden sm:block">
                  {authMode === "login" ? "MASUK DENGAN GOOGLE" : "DAFTAR DENGAN GOOGLE"}
                  </span>
                </button>
              </div>

              <div className="text-[10px] font-black text-[#8b90b8] uppercase ml-4 mb-1 block tracking-wider">
                Atau
              </div>

              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin} disabled={loading}
                  className="w-full bg-white border-2 border-[#eef1fb] text-[#1e2240] py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-[#f8faff] transition active:scale-95 disabled:opacity-50"
                >
                  <img
                    src="facebook.svg"
                    className="w-5 h-5" alt="facebook"
                  />
                  <span className="block sm:hidden">FACEBOOK</span>

                  {/* Teks untuk Tablet/Desktop (Teks Lengkap) */}
                  <span className="hidden sm:block">
                  {authMode === "login" ? "MASUK DENGAN FACEBOOK" : "DAFTAR DENGAN FACEBOOK"}
                  </span>
                </button>
              </div>
            </>
          )}

          {/* ══════════════ STEP 2 ══════════════ */}
          {step === 2 && (
            <>
              <StepDots step={2} />

              <div className="mb-6">
                <h2 className="text-[#1e2240] text-2xl font-black">Lengkapi Profilmu</h2>
                <p className="text-[#8b90b8] text-sm font-semibold mt-1">
                  Kami pakai data ini untuk menghitung target nutrisi harian yang tepat.
                </p>
              </div>

              <form onSubmit={handleEmailSignupStep2} className="flex flex-col gap-4">

                {/* Name — hide if name was pre-filled from Google and not editable */}
                <Field label="Nama Panggilan">
                  <input
                    type="text" placeholder="Cth: Reyna" required
                    className={inputCls}
                    value={profileData.name}
                    onChange={(e) => setProfile("name", e.target.value)}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Umur">
                    <input
                      type="number" placeholder="22" required min={10} max={100}
                      className={inputCls}
                      value={profileData.age}
                      onChange={(e) => setProfile("age", e.target.value)}
                    />
                  </Field>
                  <Field label="Gender">
                    <select
                      className={inputCls}
                      value={profileData.gender}
                      onChange={(e) => setProfile("gender", e.target.value)}
                    >
                      <option value="Laki-laki">Pria</option>
                      <option value="Perempuan">Wanita</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Berat (kg)">
                    <input
                      type="number" placeholder="60" required min={20} max={300}
                      className={inputCls}
                      value={profileData.weight}
                      onChange={(e) => setProfile("weight", e.target.value)}
                    />
                  </Field>
                  <Field label="Tinggi (cm)">
                    <input
                      type="number" placeholder="165" required min={100} max={250}
                      className={inputCls}
                      value={profileData.height}
                      onChange={(e) => setProfile("height", e.target.value)}
                    />
                  </Field>
                </div>

                {/* Diet Goal selector */}
                <div>
                  <label className="text-[10px] font-black text-[#8b90b8] uppercase ml-4 mb-2 block tracking-wider">
                    Tujuan Diet
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {DIET_GOALS.map((g) => {
                      const active = profileData.dietGoal === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setProfile("dietGoal", g.id)}
                          style={active ? { background: g.bg, borderColor: g.color } : {}}
                          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border-2 transition-all ${
                            active
                              ? "shadow-sm scale-[1.03]"
                              : "border-[#eef1fb] bg-[#f8faff]"
                          }`}
                        >
                          <span className="text-xl">{g.icon}</span>
                          <span
                            className="text-xs font-black"
                            style={{ color: active ? g.color : "#1e2240" }}
                          >
                            {g.label}
                          </span>
                          <span className="text-[9px] text-[#8b90b8] font-semibold leading-tight text-center">
                            {g.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-[#6b7fe8] text-white py-4 rounded-2xl font-black mt-2 shadow-lg shadow-[#6b7fe8]/30 hover:bg-[#5a6dd1] transition active:scale-95 disabled:bg-[#c4cbf5]"
                >
                  {loading ? "MENYIMPAN..." : "BUAT AKUN & PROFIL ✓"}
                </button>

                <button
                  type="button"
                  onClick={goBackToStep1}
                  className="text-[#8b90b8] text-sm font-bold text-center w-full mt-1 hover:text-[#6b7fe8] transition"
                >
                  ← Kembali
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-8 text-[#8b90b8] text-xs font-bold">
          Dengan melanjutkan, kamu menyetujui{" "}
          <span className="text-[#6b7fe8]">Ketentuan Layanan</span> MBG.
        </p>
      </div>
    </main>
  );
}
