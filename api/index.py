from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

# Import dari file processor.py yang ada di folder yang sama
from processor import identify_food_and_nutrition, get_nutrition_by_text

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/scan-food")
async def scan_food(file: UploadFile = File(...)):
    # Simpan di direktori /tmp/ karena Vercel Serverless Function hanya bisa menulis di folder /tmp/
    temp_path = f"/tmp/temp_{file.filename}"
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        components = identify_food_and_nutrition(temp_path)
        
        if not components:
            return {"status": "error", "message": "Gagal mengenali makanan atau menghitung nutrisi."}

        total_calories = sum(item.get("calories", 0) for item in components)
        
        return {
            "status": "success", 
            "total_calories": total_calories,
            "components": components
        }
            
    except Exception as e:
        print(f"Error Route Gambar: {e}")
        return {"status": "error", "message": str(e)}
        
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass

@app.get("/api/search-food")
async def search_food(query: str):
    try:
        nutrition_data = get_nutrition_by_text(query)
        
        if nutrition_data:
            return {"status": "success", "data": nutrition_data}
        else:
            return {"status": "error", "message": f"AI gagal memproses data untuk {query}"}
            
    except Exception as e:
        return {"status": "error", "message": str(e)}