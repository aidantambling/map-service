import os
import shutil

root_dir = "place_data"
output_dir = "merged_places"
os.makedirs(output_dir, exist_ok=True)

for fips in os.listdir(root_dir):
    fips_path = os.path.join(root_dir, fips)
    if not os.path.isdir(fips_path):
        continue
    for file in os.listdir(fips_path):
        if file.endswith(".topo.json"):
            src = os.path.join(fips_path, file)
            dst = os.path.join(output_dir, f"{fips}.topo.json")
            shutil.copy(src, dst)

print("Copied all .topo.json files to merged_topojson/")
