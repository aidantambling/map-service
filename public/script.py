import json
import topojson as tp

# Load the TopoJSON files
with open('CT_Planning_Regions_1.topojson') as f:
    ct_planning_regions_topo = json.load(f)

with open('counties.json') as f:
    counties_topo = json.load(f)

# Convert TopoJSON to GeoJSON
ct_planning_regions_geo = tp.topojson_to_geojson(ct_planning_regions_topo)
counties_geo = tp.topojson_to_geojson(counties_topo)

# Extract the planning regions geometries
planning_regions = ct_planning_regions_geo['features']

# Find and replace Connecticut counties in the counties_geo
new_counties_features = []

for feature in counties_geo['features']:
    # Assuming Connecticut counties have a specific property to identify them
    # Modify this condition based on your data
    if feature['properties']['STATE'] == 'Connecticut':
        # Replace with planning regions
        new_counties_features.extend(planning_regions)
    else:
        # Keep other counties
        new_counties_features.append(feature)

# Create a new GeoJSON with the merged data
merged_geojson = {
    'type': 'FeatureCollection',
    'features': new_counties_features
}

# Convert the merged GeoJSON to TopoJSON
merged_topojson = tp.geojson_to_topojson(merged_geojson)

# Save the final TopoJSON file
with open('merged.topojson', 'w') as f:
    print('recognition')
    json.dump(merged_topojson, f)
