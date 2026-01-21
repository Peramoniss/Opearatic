import json
from pathlib import Path
from datetime import datetime
from .config import JSON_DIR
ITEMS_PER_PAGE = 50

def get_available_years():
    folder = Path(JSON_DIR)
    years = []
    for f in folder.iterdir():
        if "all" not in f.name:
            years.append(f.name.split('.')[0])
    
    return years

def get_list(year): #2020, 2021,...
    try:
        file = open(f"{JSON_DIR}/{year}.json", "r", encoding="utf-8")
        data = json.load(file) #json funciona como dicionário

        #Used to get from the file the last update, but unfortunately, on deploy, this stops working. Now I change the last update manually
        # file_path = Path(f"{JSON_DIR}/{year}.json")
        # if not file_path.exists():
        #     return None
        # mtime = file_path.stat().st_mtime
        # last_modified = datetime.fromtimestamp(mtime).strftime("%B %d, %Y at %H:%M")
        
        # data["last_modified"] = last_modified
        return data
    except Exception as e:
        return None

def get_pos_value(pos: int, mode = "year-list"): #mode - year-list, decade-list, Surprise, others
    if mode == "Foreign":
        return 0
    elif mode == "year-list":
        if pos > 100:
            return 1
        if pos <= 100 and pos > 75:
            return 2
        elif pos <= 75 and pos > 50:
            return 3
        elif pos <= 50 and pos > 25:
            return 5
        elif pos <= 25 and pos > 15:
            return 7
        elif pos <= 15 and pos > 10:
            return 8
        elif pos <= 10 and pos > 5:
            return 10
        elif pos <= 5 and pos > 3:
            return 12
        elif pos == 3:
            return 14
        elif pos == 2:
            return 16
        else:
            return 20
    elif mode == "Surprise":
        if pos >= 4:
            return 1
        elif pos < 4 and pos >=2:
            return 2
        else:
            return 3
    else:
        if pos >= 4:
            return 1
        elif pos < 4 and pos >=2:
            return 3
        else:
            return 5
        
def position_format(pos: str):
    if pos[-1] == '1':
        return f"{pos}st place"
    elif pos[-1] == '2':
        return f"{pos}nd place"
    elif pos[-1] == '3':
        return f"{pos}rd place"
    else:
        return f"{pos}th place"


def generate_all_time_list(min_year : int | None = None, max_year : int | None = None):        
    pasta = Path(JSON_DIR)
    lists = []
    
    if min_year is None or max_year is None:
        for f in sorted(pasta.iterdir()):
            if "all" not in f.name:
                lists.append(get_list(f.name.split('.')[0]))
    else:
        for f in sorted(pasta.iterdir()):
            if "all" not in f.name and int(f.name.split('.')[0]) <= max_year and int(f.name.split('.')[0]) >= min_year:
                lists.append(get_list(f.name.split('.')[0]))
        
    best_artists = dict()
    for l in lists:
        pos = len(l["list"])
        year = 0
        for i in l["list"]: #item in list
            artists = [a.strip() for a in i["artist"].split('&')]

            for artist in artists:
                if artist not in best_artists:
                    best_artists[artist] = dict()
                    (best_artists[artist])["points"] = 0
                    (best_artists[artist])["awards"] = []
                    # (best_artists[artist])["image"] = artist_image(artist)
                    (best_artists[artist])["image"] = i["cover"]
                    (best_artists[artist])["best_pos"] = pos                   

                curr_points = get_pos_value(pos)
                (best_artists[artist])["awards"].append( (i["album"],f"{position_format(str(pos))} in year-end list in {i['year']}",curr_points) )
                (best_artists[artist])["points"] += curr_points
                if pos < (best_artists[artist])["best_pos"]:
                    (best_artists[artist])["image"] = i["cover"]
                    (best_artists[artist])["best_pos"] = pos                   
            
            pos -= 1
        year = i["year"]
        
        for a in l["awards"]: #award in awards
            if a["title"].startswith("Best Album of"):
                continue #Ignoring for now. It is bad because these prizes are not appearing as titles they've won, but since their country is beside their name, I'll have TODO some adjustments in the logic here                
            else:
                pos = 1
                for i in a["nominees"]:
                    album = i.split(" - ")[0]
                    artists_raw = i.split(" - ")[1]
                    prize = a['title'].split(' ')[1]
                    if prize == "Foreign":
                        artists_raw = artists_raw.split('[')[0] #Remove o país
                    artists = [a.strip() for a in artists_raw.split('&')]
                    for artist in artists:
                        if artist not in best_artists:
                            best_artists[artist] = dict()
                            (best_artists[artist])["points"] = 0
                            (best_artists[artist])["awards"] = []
                            (best_artists[artist])["best_pos"] = 100 + pos
                        
                        curr_points = get_pos_value(pos, prize)
                        (best_artists[artist])["awards"].append( (album,f"{position_format(str(pos))} in {a['title']} in {year}",curr_points) )
                        (best_artists[artist])["points"] += curr_points
                        if pos == 1 and int((best_artists[artist])["best_pos"]) >= 100:
                            (best_artists[artist])["best_pos"] = 100 + pos
                            (best_artists[artist])["image"] = a["prize-picture"]
                    pos += 1
    
    filtered = {}
    for artist, data in best_artists.items():
        if data["points"] > 0:
            filtered[artist] = data
    """
    Could use the comprehension form, but my C brain fries looking at this
    best_artists = {
        artist: data
        for artist, data in best_artists.items()
        if data["points"] > 0
    }
    """
    return filtered
    

def get_all_time_page(page: int):
    with open(f"{JSON_DIR}/all-time-{page}.json", "r", encoding="utf-8") as json_file:
        return json.load(json_file)
    
def get_all_time_page_filtered(page: int, min_year: int, max_year: int):
    data = generate_all_time_list(min_year=min_year, max_year=max_year)
    
    return_data = dict(
        sorted(
            data.items(),
            key=lambda x: x[1]["points"],
            reverse=True
        )
    )

    start = ITEMS_PER_PAGE * (page-1)
    working_items = dict(list(return_data.items())[start:start+ITEMS_PER_PAGE])

    return working_items

def get_available_pages(min_year: int | None = None, max_year: int | None = None):
    pages = []
    if min_year is None or max_year is None:        
        folder = Path(JSON_DIR)
        for f in folder.iterdir():
            if "all" in f.name:
                pages.append(f.name.split('.')[0].split("-")[2])
    else:
        data = generate_all_time_list(min_year=min_year, max_year=max_year)
        total_items = len(data)
        total_pages = -(total_items // -ITEMS_PER_PAGE) #Ceiling. If there's 180 items and 50 per page, result is 3.6, and the returned value is 4 
        for i in range(1, total_pages+1):
            pages.append(str(i))

    return pages

if __name__ == "__main__":
    data = generate_all_time_list()
    data = dict(
            sorted(
                data.items(),
                key=lambda x: x[1]["points"],
                reverse=True
            )
        )
    with open("data.json", "w", encoding="utf-8") as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)