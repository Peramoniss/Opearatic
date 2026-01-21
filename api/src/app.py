from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .analyzer import get_list, get_all_time_page, get_all_time_page_filtered, get_available_years, get_available_pages
from .config import ENV

app = FastAPI(
    title="Music Lists API",
    description="Year-end lists and all-time artist rankings",
    version="1.0.0"
)

origins = ["https://peramoniss.github.io"]
if ENV == "DEV":
    new_origins = [
        "http://localhost:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://127.0.0.1:8000",
    ]
    for no in new_origins: #origins.extend(new_origins), but my brain is too low-level to allow something like that
        origins.append(no)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
def all_time(page: int, min_year: int | None = None, max_year: int | None = None):
    if min_year is None and max_year is None:
        data = get_all_time_page(page)
    else:
        data = get_all_time_page_filtered(page, min_year, max_year)
    return data

@app.get("/years")
def available_years():
    data = get_available_years()
    return sorted(data, key=int)

@app.get("/pages")
def available_pages(min_year: int | None = None, max_year: int | None = None):
    data = get_available_pages(min_year, max_year)
    return sorted(data, key=int)

@app.get("/")
def health():
    print("Healthy")
    return {"status": "ok"}