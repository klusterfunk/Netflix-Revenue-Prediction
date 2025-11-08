"""
Helper script to convert JSON files to JavaScript variable assignments
for use in the GitHub Pages deployment.
"""
import json
import os

def convert_json_to_js(json_file, js_file, var_name):
    """Convert a JSON file to a JavaScript variable assignment"""
    if not os.path.exists(json_file):
        print(f"Warning: {json_file} not found. Skipping...")
        return
    
    with open(json_file, 'r') as f:
        data = json.load(f)
    
    with open(js_file, 'w') as f:
        f.write(f"// Auto-generated from {json_file}\n")
        f.write(f"const {var_name} = ")
        json.dump(data, f, indent=2)
        f.write(";\n")
    
    print(f"✓ Converted {json_file} -> {js_file}")

if __name__ == "__main__":
    print("Converting JSON files to JavaScript...")
    convert_json_to_js('model_params.json', 'model_params.js', 'modelParams')
    convert_json_to_js('data_ranges.json', 'data_ranges.js', 'dataRanges')
    print("\nConversion complete!")

