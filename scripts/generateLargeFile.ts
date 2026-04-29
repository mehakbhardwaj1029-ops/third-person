import fs from "fs";

const sentence =
  "This is a backend engineering stress test for chunk processing. ";

let content = "";

for (let i = 0; i < 50000; i++) {
  content += sentence;
}

fs.writeFileSync("large.txt", content);

console.log("Large test file generated");