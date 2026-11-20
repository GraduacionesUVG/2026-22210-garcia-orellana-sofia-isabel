import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../..");

test("details marker hiding uses a Tailwind-safe global utility", () => {
  const css = readFileSync(resolve(root, "app/globals.css"), "utf8");
  expect(css).toContain(".hide-details-marker::-webkit-details-marker");
  expect(css).toContain("display: none");

  const components = [
    "features/projects/analysis/components/AnalysisCodebookPanel.jsx",
    "features/projects/analysis/components/AnalysisCodingQueue.jsx",
    "features/projects/analysis/components/AnalysisActiveSegment.jsx",
    "features/projects/analysis/components/AnalysisDocumentSegmentsList.jsx",
  ];

  for (const component of components) {
    const source = readFileSync(resolve(root, component), "utf8");
    expect(source).toContain("hide-details-marker");
  }
});

test("Tailwind scans only UI source directories", () => {
  const css = readFileSync(resolve(root, "app/globals.css"), "utf8");

  expect(css).toContain('@import "tailwindcss" source(none);');
  expect(css).toContain('@source "../app";');
  expect(css).toContain('@source "../components";');
  expect(css).toContain('@source "../features";');
});
