import re
import torch
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from transformers import T5ForConditionalGeneration, T5Tokenizer

app = FastAPI(title="Betsimisaraka Translation API", version="2.6")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranslationRequest(BaseModel):
    text: str

# --- Configuration des Modèles ---
MODELS_CONFIG = {
    "bmm_to_plt": "Amboara001/bmm-to-plt-t5-norm-aug",
    "mg_to_plt": "Amboara001/plt-to-bmm-t5-v3"
}

TASK_PREFIX_BMM_MG = "translate Betsimisaraka to Malagasy: "
TASK_PREFIX_MG_BMM = "translate Malagasy to Betsimisaraka: "

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

models = {}
tokenizers = {}

try:
    for key, repo in MODELS_CONFIG.items():
        tokenizers[key] = T5Tokenizer.from_pretrained(repo)
        models[key] = T5ForConditionalGeneration.from_pretrained(repo).to(device)
        models[key].eval()
    print("Modèles chargés avec succès.")
except Exception as e:
    print(f"Erreur de chargement : {e}")

# --- Fonctions de Traitement Améliorées ---

def normalize_sentence_case(text: str) -> str:
    """
    Force une majuscule :
    - au début du texte
    - après . ? ! ...
    - après les sauts de ligne
    """
    text = text.strip()

    if not text:
        return text

    # 1.Majuscule au tout début de la phrase
    text = text[0].upper() + text[1:]

    # 2. Majuscule après ponctuation forte ou saut de ligne
    def capitalize_match(match):
        return match.group(1) + match.group(2).upper()

    text = re.sub(
        r'([.!?…]+[\s\n]+)([a-zàâäçéèêëîïôöùûü])',
        capitalize_match,
        text,
        flags=re.UNICODE
    )

    # 3. Majuscule après saut de ligne seul
    text = re.sub(
        r'(\n+)([a-zàâäçéèêëîïôöùûü])',
        capitalize_match,
        text,
        flags=re.UNICODE
    )

    return text


def clean_bmm_line(line: str) -> str:
    """Nettoyage par ligne pour préserver la structure globale."""
    if not line.strip():
        return line
    line = line.lower()
    line = line.replace('ô', 'o').replace('ñ', 'gn')
    replacements = {"zagny": "zegny", "zany": "zegny", "ôlogno": "olo", "olona": "olo", "tragno": "trano"}
    words = [replacements.get(w, w) for w in line.split()]
    return " ".join(words)

@torch.inference_mode()
def translate_batch(sentences: List[str], model_key: str, prefix: str) -> List[str]:
    if not sentences: return []
    
    model = models[model_key]
    tokenizer = tokenizers[model_key]
    prompts = [f"{prefix}{s}" for s in sentences]
    
    inputs = tokenizer(prompts, return_tensors="pt", padding=True, truncation=True).to(device)
    outputs = model.generate(**inputs, max_new_tokens=128, num_beams=5)
    
    return [tokenizer.decode(o, skip_special_tokens=True) for o in outputs]

async def process_translation(text: str, mode: str, prefix: str):
    """
    Gère le découpage en préservant strictement les sauts de lignes 
    et la ponctuation pour les deux sens de traduction.
    """
    
    parts = re.split(r'([.!?;]+|\n+)', text)
    
    segments_to_translate = []
    structure = [] # Garde la trace de quoi est un texte (ID) et quoi est un séparateur (STR)

    for part in parts:
        if not part: continue
        
        # Si la partie ne contient que de la ponctuation ou des sauts de ligne
        if re.match(r'^[.!?; \n\r]+$', part):
            structure.append({'type': 'sep', 'content': part})
        else:
            # C'est du texte à traduire
            clean_text = part.strip()
            if mode == "bmm_to_plt":
                clean_text = clean_bmm_line(clean_text)
            
            if clean_text:
                segments_to_translate.append(clean_text)
                structure.append({'type': 'text', 'id': len(segments_to_translate) - 1})
            else:
                structure.append({'type': 'sep', 'content': part})

    # 2. Traduction par lot
    if segments_to_translate:
        loop = asyncio.get_event_loop()
        translated_list = await loop.run_in_executor(
            None, translate_batch, segments_to_translate, mode, prefix
        )
    else:
        translated_list = []

    # 3. Reconstruction fidèle
    final_output = []
    for item in structure:
        if item['type'] == 'sep':
            final_output.append(item['content'])
        else:
            final_output.append(translated_list[item['id']])

    final_text = "".join(final_output)
    
    final_text = normalize_sentence_case(final_text)

    return final_text

# --- Endpoints ---

@app.post("/translate-bmm-to-plt")
async def bmm_to_plt(request: TranslationRequest):
    if not request.text: raise HTTPException(status_code=400, detail="Texte vide")
    try:
        translated = await process_translation(request.text, "bmm_to_plt", TASK_PREFIX_BMM_MG)
        return {"translated_text": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate-plt-to-bmm")
async def mg_to_bmm(request: TranslationRequest):
    if not request.text: raise HTTPException(status_code=400, detail="Texte vide")
    try:
        translated = await process_translation(request.text, "mg_to_plt", TASK_PREFIX_MG_BMM)
        return {"translated_text": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)