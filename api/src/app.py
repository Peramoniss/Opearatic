from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .analyzer import get_list, get_all_time_page, get_available_years, get_available_pages

app = FastAPI(
    title="Music Lists API",
    description="Year-end lists and all-time artist rankings",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://peramoniss.github.io/Opearatic/"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/year/{year}")
def year_list(year: int):
    data = get_list(year)

    if data is None:
        raise HTTPException(
            status_code=404,
            detail=f"List for year {year} not found"
        )

    return data

@app.get("/all-time/")
def all_time(page: int):
    data = get_all_time_page(page)
    return data

@app.get("/years")
def available_years():
    data = get_available_years()
    return sorted(data, key=int)

@app.get("/pages")
def available_pages():
    data = get_available_pages()
    return sorted(data, key=int)

@app.get("/")
def health():
    print("Healthy")
    return {"status": "ok"}