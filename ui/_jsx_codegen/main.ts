import ts from "npm:typescript";

const program = ts.createProgram(["./main.ts"], {
  target: ts.ScriptTarget.Latest,
  lib: ["lib.dom.d.ts", "lib.esnext.d.ts"],
});
const checker = program.getTypeChecker();

const sourceFile = program.getSourceFiles().find(sf => !sf.isDeclarationFile);
if (!sourceFile) throw new Error("bwah");

const htmlMap = checker.resolveName(
  "HTMLElementTagNameMap",
  sourceFile,
  ts.SymbolFlags.Interface,
  false,
)!;

const getTypeName = (ty: ts.Type) => {
  if (ty.getCallSignatures().length > 0) return checker.typeToString(ty);
  if (ty.aliasSymbol) return ty.aliasSymbol.getName();
  if (ty.symbol) return ty.symbol.getName();
  return checker.typeToString(ty);
};

const isReadonly = (symbol: ts.Symbol) => {
  for (const decl of symbol.declarations ?? []) {
    if (ts.isPropertyDeclaration(decl) || ts.isPropertySignature(decl)) {
      const flags = ts.getCombinedModifierFlags(decl);
      if ((flags & ts.ModifierFlags.Readonly) !== 0) return true;
    }
  }
  return false;
};

console.log("export type ElementPropertyMap = {");

for (const [key, htmlElem] of htmlMap.members!.entries()) {
  const htmlElemType = checker.getTypeOfSymbol(htmlElem);

  console.log(" ", `[${JSON.stringify(key)}]:`, "{");

  for (const propSymbol of htmlElemType.getProperties()) {
    // we only want writable props
    if (isReadonly(propSymbol)) continue;

    // skip functions (ie event listeners)
    const propType = checker.getTypeOfSymbol(propSymbol);
    if (propType.getCallSignatures().length > 0) continue;

    const propName = propSymbol.name;
    console.log("   ", `[${JSON.stringify(propName)}]:`, getTypeName(propType) + ";");
  }

  console.log("  }");
}

console.log("}");
