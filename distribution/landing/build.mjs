import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.join(root, "public");
const outputDirectory = path.join(root, "dist");

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await cp(publicDirectory, outputDirectory, { recursive: true });
console.log("Built static landing page in distribution/landing/dist");
