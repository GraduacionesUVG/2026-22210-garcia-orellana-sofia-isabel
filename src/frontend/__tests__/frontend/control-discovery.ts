import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
export interface DiscoveredUiControl { id: string; file: string; line: number; tag: string; accessibleName: string; dynamic: boolean }
export function discoverUiControls(root: string): DiscoveredUiControl[] {
  const found: DiscoveredUiControl[] = [];
  function walk(directory: string) {
    if (!existsSync(directory)) return;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error(`UI discovery rejects symlink: ${entry.name}`);
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) { walk(absolute); continue; }
      if (!/\.(jsx|tsx)$/.test(entry.name)) continue;
      const file = path.relative(root, absolute).replaceAll('\\','/');
      const source = ts.createSourceFile(file, readFileSync(absolute,'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      function visit(node: ts.Node) {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
          const tag = node.tagName.getText(source);
          const attributes = node.attributes.properties.filter(ts.isJsxAttribute);
          const interactive = ['button','input','select','textarea','a','Link','summary'].includes(tag) || attributes.some(attribute => ['onClick','onSubmit','onKeyDown'].includes(attribute.name.getText(source)));
          if (interactive) {
            const label = attributes.find(attribute => ['aria-label','title','placeholder'].includes(attribute.name.getText(source)));
            const text = ts.isJsxElement(node.parent) ? node.parent.children.filter(ts.isJsxText).map(child => child.text.trim()).filter(Boolean).join(' ') : '';
            const accessibleName = label?.initializer && ts.isStringLiteral(label.initializer) ? label.initializer.text : text;
            const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
            const dynamic = !accessibleName || (label?.initializer ? !ts.isStringLiteral(label.initializer) : ts.isJsxElement(node.parent) && node.parent.children.some(ts.isJsxExpression));
            found.push({ id: `source:${file}:${line}:${tag}`, file, line, tag, accessibleName: accessibleName || '<unresolved>', dynamic });
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
  for (const folder of ['app','components','features']) walk(path.join(root,folder));
  return found.sort((a,b) => a.file.localeCompare(b.file) || a.line-b.line);
}
