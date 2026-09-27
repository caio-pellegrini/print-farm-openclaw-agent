---
name: analyze-stl
description: Analyze a staged STL file using the local project analyzer and explain its measured dimensions.
---

# Analyze an STL

When a user asks to inspect an STL that has already been staged in the farm's
jobs directory:

1. Ask which filename to inspect if it is not clear.
2. Call `analyze_stl` with the filename only. Never invent or pass an absolute
   path, directory path, shell command, or file from outside the configured
   jobs directory.
3. Report the returned XYZ dimensions in millimetres, triangle count, and
   whether the analyzer's watertight heuristic passed. State that STL units are
   not encoded and the analyzer assumes millimetres.
4. If the tool returns an error, explain that error and do not estimate missing
   geometry from the filename or prompt.
5. Describe volume as unavailable when the returned value is null. The mesh
   checks are heuristics and do not prove that the model is printable.
