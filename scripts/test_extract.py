import json
import re

def extract_products():
    with open("content-audit/static/chunks/130-118839b689c760d6.js", "r", encoding="utf-8") as f:
        js = f.read()

    # Let's search for the products array
    # Look for patterns like [{id:... or [...,{slug:...
    print("Length of 130 chunk:", len(js))
    
    # Let's find matches for product objects
    # Example: {id:"...",slug:"...",name:"...",...}
    # Let's use Node.js to evaluate or extract the exact array if it's exported or declared!
    
if __name__ == "__main__":
    extract_products()
