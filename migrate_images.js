const fs = require("fs");
const path = require("path");

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith(".tsx")) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync("./src");
let totalReplaced = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  
  if (content.includes("<img ")) {
    // Check if Image from next/image is already imported
    let hasImport = content.includes("import Image from");
    if (!hasImport) {
      // Find the last import
      const importMatches = [...content.matchAll(/^import .+;?$/gm)];
      if (importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];
        const index = lastImport.index + lastImport[0].length;
        content = content.substring(0, index) + "\nimport Image from \"next/image\";" + content.substring(index);
      } else {
        content = "import Image from \"next/image\";\n" + content;
      }
    }
    
    // Replace <img ... /> or <img ...>...</img > with <Image width={800} height={800} ... />
    // We use a regex to match <img ... /> or <img ...>
    const imgRegex = /<img\s+([^>]+)>/g;
    content = content.replace(imgRegex, (match, p1) => {
      // check if it is self closing
      let inner = p1.trim();
      if (inner.endsWith("/")) {
        inner = inner.substring(0, inner.length - 1).trim();
      }
      totalReplaced++;
      // If it contains blob:, add unoptimized
      const unoptimized = /src=\{[^}]*blob:/i.test(inner) || /src=\{[^}]*m\.url\}/i.test(inner) ? " unoptimized" : "";
      return `<Image width={800} height={800}${unoptimized} ${inner} />`;
    });
    
    fs.writeFileSync(file, content, "utf8");
  }
}
console.log("Total images replaced:", totalReplaced);

