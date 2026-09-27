import { constants } from "node:fs";
import { mkdtemp, open, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, isAbsolute, join, resolve, sep } from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

const execFileAsync = promisify(execFile);
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const TIMEOUT_MS = 10_000;
const SLICE_TIMEOUT_MS = 40_000;
const MAX_OUTPUT_BYTES = 1_048_576;

const configSchema = Type.Object({
  jobsDirectory: Type.String({ description: "Absolute path to the trusted STL jobs directory." }),
  analyzerScript: Type.String({ description: "Absolute path to experiments/stl-analysis/analyze_stl.py." }),
  persistenceScript: Type.String({ description: "Absolute path to experiments/stl-analysis/persistence.py." }),
  productionEstimateScript: Type.String({ description: "Absolute path to experiments/slicing/openclaw_production_estimate.py." }),
  quoteEngine: Type.String({ description: "Absolute path to experiments/quote-engine/quote.py." }),
  databasePath: Type.String({ description: "Absolute path to the project-local SQLite database." }),
  pythonExecutable: Type.Optional(Type.String({ description: "Python executable path or PATH-resolved name; defaults to python3." })),
  dockerExecutable: Type.Optional(Type.String({ description: "Docker executable path or PATH-resolved name; defaults to docker." })),
}, { additionalProperties: false });

function errorResult(filename: string, error: string) {
  return { success: false, filename, error };
}

export default defineToolPlugin({
  id: "print-farm-stl",
  name: "Print Farm STL Analysis",
  description: "Analyze STL files from a restricted local jobs directory.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "analyze_stl",
      label: "Analyze STL",
      description: "Analyze one STL file already staged in the configured jobs directory. Pass only its filename, never an arbitrary path.",
      parameters: Type.Object({
        filename: Type.String({ description: "STL filename in the configured jobs directory, for example small-box-20mm.stl." }),
      }, { additionalProperties: false }),
      outputSchema: Type.Object({
        success: Type.Boolean(),
        filename: Type.String(),
        error: Type.Optional(Type.String()),
        analysis: Type.Optional(Type.Object({
          format: Type.String(),
          triangle_count: Type.Integer(),
          connected_components_by_shared_vertices: Type.Integer(),
          dimensions_mm: Type.Object({ x: Type.Number(), y: Type.Number(), z: Type.Number() }),
          bounds_mm: Type.Object({
            min: Type.Array(Type.Number()),
            max: Type.Array(Type.Number()),
          }),
          volume_cm3: Type.Union([Type.Number(), Type.Null()]),
          watertight_heuristic: Type.Boolean(),
          boundary_or_nonmanifold_edges: Type.Integer(),
          fits_example_220x220x250mm: Type.Boolean(),
          orientation: Type.String(),
          units_assumption: Type.String(),
        }, { additionalProperties: false })),
        analysis_id: Type.Optional(Type.String()),
      }, { additionalProperties: false }),
      async execute({ filename }, config, context) {
        context.signal?.throwIfAborted();

        if (!filename || filename !== basename(filename) || filename === "." || filename === "..") {
          return errorResult(String(filename ?? ""), "Pass a filename only; directory paths are not accepted.");
        }
        if (extname(filename).toLowerCase() !== ".stl") {
          return errorResult(filename, "Only .stl files are accepted.");
        }
        if (!isAbsolute(config.jobsDirectory) || !isAbsolute(config.analyzerScript)
          || !isAbsolute(config.persistenceScript) || !isAbsolute(config.databasePath)) {
          return errorResult(filename, "The jobs directory, scripts, and database must use absolute paths.");
        }

        const jobsRoot = resolve(config.jobsDirectory);
        const candidate = resolve(jobsRoot, filename);
        if (!candidate.startsWith(`${jobsRoot}${sep}`)) {
          return errorResult(filename, "The requested file is outside the configured jobs directory.");
        }

        let source;
        let privateDirectory: string | undefined;
        try {
          const metadata = await stat(candidate);
          if (!metadata.isFile()) return errorResult(filename, "The requested path is not a regular file.");
          if (metadata.size <= 0) return errorResult(filename, "The STL file is empty.");
          if (metadata.size > MAX_FILE_BYTES) {
            return errorResult(filename, `The STL exceeds the ${MAX_FILE_BYTES} byte limit.`);
          }

          // O_NOFOLLOW rejects a final-component symlink. Recheck the opened
          // descriptor to narrow races before taking the bounded private copy.
          const handle = await open(candidate, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
          try {
            const opened = await handle.stat();
            if (!opened.isFile() || opened.size <= 0 || opened.size > MAX_FILE_BYTES) {
              return errorResult(filename, "The opened file is not a valid regular STL within the size limit.");
            }
            source = await handle.readFile();
          } finally {
            await handle.close();
          }

          privateDirectory = await mkdtemp(join(tmpdir(), "print-farm-stl-"));
          const privateFile = join(privateDirectory, filename);
          await writeFile(privateFile, source, { flag: "wx", mode: 0o600 });

          const python = config.pythonExecutable || "python3";
          const { stdout } = await execFileAsync(python, [config.analyzerScript, privateFile], {
            timeout: TIMEOUT_MS,
            maxBuffer: MAX_OUTPUT_BYTES,
            windowsHide: true,
            signal: context.signal,
          });
          context.signal?.throwIfAborted();
          const parsed = JSON.parse(stdout);
          const { file: _temporaryPath, ...analysis } = parsed;
          const resultFile = join(privateDirectory, "analysis.json");
          await writeFile(resultFile, JSON.stringify(analysis), { flag: "wx", mode: 0o600 });
          const { stdout: storedStdout } = await execFileAsync(config.pythonExecutable || "python3", [
            config.persistenceScript,
            "store",
            "--database",
            config.databasePath,
            "--filename",
            filename,
            "--result-file",
            resultFile,
          ], {
            timeout: TIMEOUT_MS,
            maxBuffer: MAX_OUTPUT_BYTES,
            windowsHide: true,
            signal: context.signal,
          });
          const stored = JSON.parse(storedStdout);
          return { success: true, filename, analysis_id: stored.analysis_id, analysis };
        } catch (error) {
          const failure = error as NodeJS.ErrnoException & { killed?: boolean; stdout?: string };
          if (failure.code === "ENOENT") return errorResult(filename, "The file or configured analyzer was not found.");
          if (failure.code === "ELOOP") return errorResult(filename, "Symbolic links are not accepted as STL inputs.");
          if (failure.killed || failure.code === "ETIMEDOUT") return errorResult(filename, "STL analysis exceeded the 10 second execution limit.");
          if (failure.stdout) return errorResult(filename, "The analyzer returned invalid or oversized structured output.");
          return errorResult(filename, "The file could not be analyzed as a valid STL.");
        } finally {
          if (privateDirectory) await rm(privateDirectory, { recursive: true, force: true });
        }
      },
    }),
    tool({
      name: "get_latest_stl_analysis",
      label: "Get Latest STL Analysis",
      description: "Retrieve the most recent completed STL analysis from the local application database.",
      parameters: Type.Object({}, { additionalProperties: false }),
      async execute(_params, config, context) {
        context.signal?.throwIfAborted();
        if (!isAbsolute(config.persistenceScript) || !isAbsolute(config.databasePath)) {
          return { found: false, message: "The persistence script and database must use absolute paths." };
        }
        try {
          const { stdout } = await execFileAsync(config.pythonExecutable || "python3", [
            config.persistenceScript,
            "latest",
            "--database",
            config.databasePath,
          ], {
            timeout: TIMEOUT_MS,
            maxBuffer: MAX_OUTPUT_BYTES,
            windowsHide: true,
            signal: context.signal,
          });
          return JSON.parse(stdout);
        } catch {
          return { found: false, message: "The saved STL analysis could not be retrieved." };
        }
      },
    }),
    tool({
      name: "slice_stl",
      label: "Slice STL and Estimate Quote",
      description: "Run the approved Cura profile and existing quote engine for a staged STL. First call analyze_stl and pass its analysis_id.",
      parameters: Type.Object({
        filename: Type.String({ description: "STL basename previously analyzed from the configured jobs directory." }),
        analysis_id: Type.String({ description: "analysis_id returned by analyze_stl for this exact filename." }),
        profile: Type.Union([
          Type.Literal("cura-ultimaker2plus-generic-pla-normal"),
        ], { description: "Approved fixed Cura profile identifier." }),
        quantity: Type.Optional(Type.Integer({ minimum: 1, maximum: 20, description: "Number of sequentially estimated copies; defaults to 1." })),
      }, { additionalProperties: false }),
      async execute({ filename, analysis_id, profile, quantity }, config, context) {
        context.signal?.throwIfAborted();
        if (!isAbsolute(config.jobsDirectory) || !isAbsolute(config.productionEstimateScript)
          || !isAbsolute(config.persistenceScript) || !isAbsolute(config.quoteEngine)
          || !isAbsolute(config.databasePath)) {
          return errorResult(filename, "The jobs directory, scripts, and database must use absolute paths.");
        }
        const jobsRoot = resolve(config.jobsDirectory);
        if (!filename || filename !== basename(filename) || filename === "." || filename === ".."
          || filename.includes("\\") || extname(filename).toLowerCase() !== ".stl") {
          return errorResult(String(filename ?? ""), "Pass an STL filename only; directory paths are not accepted.");
        }
        try {
          const candidate = resolve(jobsRoot, filename);
          if (!candidate.startsWith(`${jobsRoot}${sep}`)) {
            return errorResult(filename, "The requested file is outside the configured jobs directory.");
          }
          const metadata = await stat(candidate);
          if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAX_FILE_BYTES) {
            return errorResult(filename, "The requested file must be a nonempty regular STL within the 25 MiB limit.");
          }
          context.signal?.throwIfAborted();
          const { stdout } = await execFileAsync(config.pythonExecutable || "python3", [
            config.productionEstimateScript,
            "--filename", filename,
            "--analysis-id", analysis_id,
            "--profile", profile,
            "--quantity", String(quantity ?? 1),
            "--jobs-directory", config.jobsDirectory,
            "--persistence-script", config.persistenceScript,
            "--database-path", config.databasePath,
            "--quote-engine", config.quoteEngine,
            "--docker-executable", config.dockerExecutable || "docker",
            "--python-executable", config.pythonExecutable || "python3",
          ], {
            timeout: SLICE_TIMEOUT_MS,
            maxBuffer: MAX_OUTPUT_BYTES,
            windowsHide: true,
            signal: context.signal,
          });
          context.signal?.throwIfAborted();
          return JSON.parse(stdout);
        } catch (error) {
          const failure = error as NodeJS.ErrnoException & { killed?: boolean; stdout?: string };
          if (failure.code === "ENOENT") return errorResult(filename, "The STL, configured production runner, or executable was not found.");
          if (failure.killed || failure.code === "ETIMEDOUT") return errorResult(filename, "Cura production estimate exceeded the 40 second tool limit.");
          if (failure.stdout) {
            try {
              return JSON.parse(failure.stdout);
            } catch {
              return errorResult(filename, "The production runner returned invalid or oversized structured output.");
            }
          }
          return errorResult(filename, "The Cura slice or quote calculation failed safely.");
        }
      },
    }),
    tool({
      name: "get_latest_production_estimate",
      label: "Get Latest Production Estimate",
      description: "Retrieve the latest completed Cura estimate and quote from the project SQLite database.",
      parameters: Type.Object({}, { additionalProperties: false }),
      async execute(_params, config, context) {
        context.signal?.throwIfAborted();
        if (!isAbsolute(config.persistenceScript) || !isAbsolute(config.databasePath)) {
          return { found: false, message: "The persistence script and database must use absolute paths." };
        }
        try {
          const { stdout } = await execFileAsync(config.pythonExecutable || "python3", [
            config.persistenceScript,
            "latest-estimate",
            "--database",
            config.databasePath,
          ], {
            timeout: TIMEOUT_MS,
            maxBuffer: MAX_OUTPUT_BYTES,
            windowsHide: true,
            signal: context.signal,
          });
          return JSON.parse(stdout);
        } catch {
          return { found: false, message: "The saved production estimate could not be retrieved." };
        }
      },
    }),
  ],
});
