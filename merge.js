const fs = require("fs");
const path = require("path");

const INDEX_FILE = "URI/index.json";
const OUTPUT_FILE = "URI/merged.json";

async function mergeJsonFiles() {
  try {
    const indexData = JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8"));
    let mergedData = {};

    for (const category in indexData) {
      console.log(category);
      if (category === "CEX") {
        continue;
      }
      mergedData[category] = {};
      for (const key in indexData[category]) {
        const filePath = path.resolve(__dirname, indexData[category][key]);
        if (fs.existsSync(filePath)) {
          const fileData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          if (fileData?.CEX) {
            fileData.CEX = fileData.CEX.map((item) => {
              const filePath = path.resolve(__dirname, indexData["CEX"][item]);
              if (fs.existsSync(filePath)) {
                const fileData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
                const token = fileData?.tokens.find(
                  (token) => token.symbol === key
                );
                if (token) {
                  return { [item]: token };
                }
              }
            });
          }
          mergedData[category][key] = fileData;
        } else {
          console.warn(`File not found: ${filePath}`);
        }
      }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mergedData, null, 2), "utf-8");
    console.log("Merged JSON saved to", OUTPUT_FILE);
  } catch (error) {
    console.error("Error merging JSON files:", error);
  }
}

mergeJsonFiles();
