from src.analyzer import generate_all_time_list
import json

ITEMS_PER_PAGE = 50

data = generate_all_time_list()
return_data = dict(
    sorted(
        data.items(),
        key=lambda x: x[1]["points"],
        reverse=True
    )
)

total_items = len(return_data)
curr_items = 0
page = 1

while curr_items < total_items:
    working_items = dict(list(return_data.items())[curr_items:curr_items+ITEMS_PER_PAGE])
    with open(f"json/all-time-{page}.json", "w", encoding="utf-8") as json_file:
        json.dump(working_items, json_file, indent=4, ensure_ascii=False)
    
    curr_items += ITEMS_PER_PAGE
    page += 1