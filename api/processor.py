import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
import os
import json
from PIL import Image

# 1. Hapus load_dotenv() murni untuk mencegah Vercel membaca file .env lokal yang mungkin nyasar di GitHub.
# Kita pakai try-except untuk load_dotenv agar tetap aman saat di-run di localhost
try:
    from dotenv import load_dotenv
    load_dotenv(override=False) # override=False memastikan environment variable Vercel TIDAK tertimpa
except ImportError:
    pass

# 2. Kumpulkan API Keys
API_KEYS = [
    os.getenv("GOBLOK_API_KEYZ"),
    os.getenv("GOBLOK_API_KEYB"),
]
# Bersihkan dari nilai kosong (None)
API_KEYS = [key for key in API_KEYS if key] 

current_key_index = 0
json_config = {"response_mime_type": "application/json"}

def generate_with_fallback(prompt, image=None):
    global current_key_index
    
    for _ in range(len(API_KEYS)):
        try:
            genai.configure(api_key=API_KEYS[current_key_index])
            model = genai.GenerativeModel('gemini-2.5-flash', generation_config=json_config)
            
            if image:
                response = model.generate_content([prompt, image])
            else:
                response = model.generate_content(prompt)
                
            return json.loads(response.text)
            
        except Exception as e:
            error_msg = str(e)
            print(f"Error pada API Key ke-{current_key_index + 1}: {error_msg}")
            
            # CEK ERROR: Ganti kunci jika error karena Limit (429) ATAU Kunci Invalid/Kadaluarsa (400)
            if "429" in error_msg or "ResourceExhausted" in error_msg or "400" in error_msg or "API_KEY_INVALID" in error_msg:
                print("Mengalihkan ke API Key berikutnya...")
                current_key_index = (current_key_index + 1) % len(API_KEYS)
            else:
                # Jika error lain (misal: koneksi putus), langsung berhenti agar tidak looping sia-sia
                return None
                
    print("GAWAT: Semua API Key gagal atau habis limit!")
    return None

def identify_food_and_nutrition(image_path):
    prompt = """
    Anda adalah ahli gizi. Analisis gambar makanan ini dan identifikasi semua komponennya secara mendetail.
    Berikan estimasi nutrisi untuk setiap komponen berdasarkan porsi yang terlihat di gambar.
    
    TUGAS ANDA:
    Kembalikan array of JSON objects. GUNAKAN FORMAT INI SECARA KETAT:
    [
      {
        "name": "nama makanan (contoh: nasi putih)",
        "calories": angka kalori (integer),
        "protein": angka protein (float),
        "carbs": angka karbohidrat (float),
        "fat": angka lemak (float),
        "serving_size": "estimasi porsi (contoh: 1 mangkuk, 100 gram)",
        "status": "success"
      }
    ]
    Jika ada beberapa komponen makanan di piring, buat beberapa object di dalam array tersebut.
    """
    try:
        with Image.open(image_path) as img:
            img_copy = img.copy() 
            
        hasil = generate_with_fallback(prompt, image=img_copy)
        return hasil if hasil else []
    except Exception as e:
        print(f"Error buka gambar: {e}")
        return []

def get_nutrition_by_text(food_name):
    prompt = f"""
    Anda adalah ahli gizi. Berikan estimasi nutrisi standar untuk makanan ini: "{food_name}". JANGAN TERIMA GAMBAR APAPUN SELAIN MAKANAN, JIKA TIDAK TAHU MAKA BALAS DENGAN NULL.
    Kembalikan HANYA 1 JSON object dengan format KETAT ini:
    {{
      "name": "{food_name}",
      "calories": angka kalori (integer),
      "protein": angka protein (float),
      "carbs": angka karbohidrat (float),
      "fat": angka lemak (float),
      "serving_size": "porsi standar (contoh: 1 porsi, 100 gram)",
      "status": "success"
    }}
    """
    return generate_with_fallback(prompt)
