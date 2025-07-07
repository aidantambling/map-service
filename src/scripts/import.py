import os
import subprocess
from urllib.request import urlretrieve
from zipfile import ZipFile

FIPS_CODES = [
    "01", "02", "04", "05", "06", "08", "09", "10", "11", "12", "13", "15", "16",
    "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29",
    "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42",
    "44", "45", "46", "47", "48", "49", "50", "51", "53", "54", "55", "56", "60",
    "66", "69", "72", "78"
]

BASE_URL = "https://www2.census.gov/geo/tiger/TIGER2022/PLACE/"
WORK_DIR = "place_data"

os.makedirs(WORK_DIR, exist_ok=True)

for fips in FIPS_CODES:
    zip_name = f"tl_2022_{fips}_place.zip"
    zip_path = os.path.join(WORK_DIR, zip_name)
    extract_path = os.path.join(WORK_DIR, fips)

    if not os.path.exists(zip_path):
        print(f"Downloading {zip_name}...")
        urlretrieve(BASE_URL + zip_name, zip_path)

    if not os.path.exists(extract_path):
        print(f"Extracting {zip_name}...")
        with ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)

    OGR2OGR_PATH = r"C:\OSGeo4W\bin\ogr2ogr.exe"
    # Find the correct .shp file in the extracted directory
    shp_files = [f for f in os.listdir(extract_path) if f.endswith(".shp")]
    if not shp_files:
        continue  # Skip if no .shp found

    shp_file = shp_files[0]
    shp_path = os.path.join(extract_path, shp_file)

    # Create a matching geojson filename
    geojson_filename = shp_file.replace(".shp", ".geojson")
    geojson_path = os.path.join(extract_path, geojson_filename)

    # Now run the conversion
    subprocess.run([OGR2OGR_PATH, "-f", "GeoJSON", geojson_path, shp_path])


    # Simplify and convert to TopoJSON
    topojson_path = os.path.join(extract_path, f"{fips}.topo.json")
    npx_path = r"C:\Program Files\nodejs\npx.cmd"  # adjust if different
    subprocess.run([
        npx_path, "mapshaper", geojson_path,
        "-simplify", "5%", "keep-shapes",
        "-o", f"format=topojson", topojson_path
    ], check=True)

print("Done.")
