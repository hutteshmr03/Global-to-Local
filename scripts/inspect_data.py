import glob
import os
import re
import json

def main():
    chunks = glob.glob("content-audit/static/chunks/*.js")
    for p in chunks:
        size = os.path.getsize(p)
        with open(p, "r", encoding="utf-8") as f:
            text = f.read()
        fname = os.path.basename(p)
        found = []
        for kw in ["Chutneys & Spreads", "Farsaan", "Kunbi", "Tarcar Mansion", "Fontainhas", "01 / 04", "Hear the street", "Handmade in Goa", "Pineapple Jam", "Tirphal", "Bebinca", "80103"]:
            if kw in text:
                found.append(kw)
        if found:
            print(f"{fname} ({size} bytes): {', '.join(found)}")

if __name__ == "__main__":
    main()
