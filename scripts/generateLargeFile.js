"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const sentence = "This is a backend engineering stress test for chunk processing. ";
let content = "";
for (let i = 0; i < 50000; i++) {
    content += sentence;
}
fs_1.default.writeFileSync("large.txt", content);
console.log("Large test file generated");
