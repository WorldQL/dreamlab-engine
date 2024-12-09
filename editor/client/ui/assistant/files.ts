import { ScriptSession } from "./assistant.ts";

export async function buildScriptMap() {
  const fileUrl = new URL(ScriptSession.httpServer);
  fileUrl.pathname = `/api/v1/edit/${ScriptSession.instance}/files/`;
  
  const fileResponse = await fetch(fileUrl.toString());
  const { files } = await fileResponse.json();

  interface ClassMember {
    name: string;
  }

  interface ClassExport {
    name: string;
    members: ClassMember[];
  }

  interface ArrowFunctionExport {
    kind: 'arrow';
    name: string;
    params: string;    // includes parentheses, e.g. (peepee: string)
    returnType: string;
  }

  interface NormalFunctionExport {
    kind: 'function';
    name: string;
    params: string;    // includes parentheses
    returnType: string;
  }

  interface VariableExport {
    kind: string; 
    name: string; 
    type: string;
  }

  interface FileExports {
    classes?: ClassExport[];
    functions?: NormalFunctionExport[];
    arrowFunctions?: ArrowFunctionExport[];
    interfaces?: string[];
    types?: string[];
    vars?: VariableExport[];
  }

  interface FileStructure {
    path: string;
    imports?: string[];
    exports?: FileExports;
  }

  function extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+(?:[\s\S]*?)from\s+['"]([^'"]+\.ts)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(content)) !== null) {
      const path = match[1];
      if (!path.includes('@dreamlab/engine')) {
        imports.push(path);
      }
    }
    return imports;
  }

  function parseClassMembers(classBody: string): ClassMember[] {
    const classMembers: ClassMember[] = [];
    let braceDepth = 0;
    const lines = classBody.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('//') || line.startsWith('/*')) {
        continue;
      }

      if (braceDepth === 0) {
        const memberRegex = /^((public|protected|private)\s+)?(static\s+)?([A-Za-z0-9_$]+)\s*(\([^)]*\))?\s*(?::\s*([^=;{]+))?([\{=;]|$)/;
        const mm = memberRegex.exec(line);
        if (mm) {
          const visibility = mm[2]; 
          const isStatic = !!mm[3];
          const name = mm[4];
          const paramsRaw = mm[5];     
          const returnType = mm[6] ? mm[6].trim() : undefined;

          if (!visibility || visibility === 'public') {
            const staticStr = isStatic ? 'static ' : '';
            if (paramsRaw !== undefined) {
              const params = paramsRaw.trim();
              const finalParams = (params === '()' || params === '') ? '()' : params;
              const finalReturn = returnType || 'void';
              classMembers.push({ name: `${staticStr}${name}${finalParams}: ${finalReturn}` });
            } else {
              const finalType = returnType || 'any';
              classMembers.push({ name: `${staticStr}${name}: ${finalType}` });
            }
          }
        }
      }

      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '{') {
          braceDepth++;
        } else if (ch === '}') {
          braceDepth--;
        }
      }
    }

    return classMembers;
  }

  function extractExports(content: string): FileExports {
    const result: FileExports = {};

    // Normal functions
    {
      const functions: NormalFunctionExport[] = [];
      const fnRegex = /export\s+function\s+([A-Za-z0-9_$]+)\s*\(([^\)]*)\)(?::\s*([^={]+))?/g;
      let match: RegExpExecArray | null;
      while ((match = fnRegex.exec(content)) !== null) {
        const fnName = match[1];
        const fnParams = match[2].trim();
        const returnType = (match[3] || 'void').trim();
        const finalParams = fnParams === '' ? '()' : `(${fnParams})`;
        functions.push({ kind: 'function', name: fnName, params: finalParams, returnType });
      }
      if (functions.length > 0) {
        result.functions = functions;
      }
    }

    // Arrow functions
    // We treat them as variables with a function type:
    // export const foopoop = (peepee: string) => {};
    // => - const foopoop: (peepee: string) => void
    {
      const arrowFunctions: ArrowFunctionExport[] = [];
      const arrowFnRegex = /export\s+(const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*\(([^\)]*)\)\s*(?::\s*([^=\{]+))?\s*=>/g;
      let match: RegExpExecArray | null;
      while ((match = arrowFnRegex.exec(content)) !== null) {
        const fnName = match[2];
        const fnParams = match[3].trim();
        const returnType = match[4] ? match[4].trim() : 'void';
        const finalParams = fnParams === '' ? '( )' : `(${fnParams})`;
        // We'll keep it as a normal function type:
        // const foopoop: (peepee: string) => void
        // The finalParams already includes parentheses.
        arrowFunctions.push({ kind: 'arrow', name: fnName, params: finalParams, returnType });
      }
      if (arrowFunctions.length > 0) {
        result.arrowFunctions = arrowFunctions;
      }
    }

    // Classes
    {
      const classes: ClassExport[] = [];
      const classRegex = /export\s+(?:default\s+)?class\s+([A-Za-z0-9_$]+)(?:\s+extends\s+[^\{]+)?(?:\s+implements\s+[^\{]+)?\s*\{([\s\S]*?)\}\s*/g;
      let match: RegExpExecArray | null;
      while ((match = classRegex.exec(content)) !== null) {
        const className = match[1];
        const classBody = match[2];
        const members = parseClassMembers(classBody);
        classes.push({ name: className, members });
      }
      if (classes.length > 0) {
        result.classes = classes;
      }
    }

    // Interfaces
    {
      const interfaces: string[] = [];
      const interfaceRegex = /export\s+interface\s+([A-Za-z0-9_$]+)/g;
      let match: RegExpExecArray | null;
      while ((match = interfaceRegex.exec(content)) !== null) {
        interfaces.push(match[1]);
      }
      if (interfaces.length > 0) {
        result.interfaces = interfaces;
      }
    }

    // Types
    {
      const types: string[] = [];
      const typeRegex = /export\s+type\s+([A-Za-z0-9_$]+)/g;
      let match: RegExpExecArray | null;
      while ((match = typeRegex.exec(content)) !== null) {
        types.push(match[1]);
      }
      if (types.length > 0) {
        result.types = types;
      }
    }

    // Variables (non-arrow)
    {
      const vars: VariableExport[] = [];
      const varRegex = /export\s+(const|let|var)\s+([A-Za-z0-9_$]+)(?::\s*([^=;]+))?(?!\s*=.*=>)/g;
      let match: RegExpExecArray | null;
      while ((match = varRegex.exec(content)) !== null) {
        const varType = match[3] ? match[3].trim() : 'any';
        vars.push({ kind: match[1], name: match[2], type: varType });
      }
      if (vars.length > 0) {
        result.vars = vars;
      }
    }

    return result;
  }

  const fileStructures: FileStructure[] = [];
  for (const file of files) {
    fileUrl.pathname = `/api/v1/edit/${ScriptSession.instance}/files/${file}`;
    const fileText = await (await fetch(fileUrl.toString())).text();

    const imports = extractImports(fileText);
    const fileExp = extractExports(fileText);

    const fs: FileStructure = {
      path: file.startsWith('/') ? file.slice(1) : file
    };
    if (imports.length > 0) {
      fs.imports = imports;
    }

    const hasExports = (fileExp.classes && fileExp.classes.length > 0)
      || (fileExp.functions && fileExp.functions.length > 0)
      || (fileExp.arrowFunctions && fileExp.arrowFunctions.length > 0)
      || (fileExp.interfaces && fileExp.interfaces.length > 0)
      || (fileExp.types && fileExp.types.length > 0)
      || (fileExp.vars && fileExp.vars.length > 0);
    if (hasExports) {
      fs.exports = fileExp;
    }

    fileStructures.push(fs);
  }

  function printFileStructure(f: FileStructure): string {
    let out = `- ${f.path}\n`;
    if (f.imports && f.imports.length > 0) {
      out += `  - importsFrom\n`;
      for (const imp of f.imports) {
        out += `    - "${imp}"\n`;
      }
    }

    if (f.exports) {
      const { classes, functions, arrowFunctions, interfaces, types, vars } = f.exports;
      const hasAnything = (classes && classes.length) 
        || (functions && functions.length)
        || (arrowFunctions && arrowFunctions.length)
        || (interfaces && interfaces.length)
        || (types && types.length)
        || (vars && vars.length);
      if (hasAnything) {
        out += `  - exports\n`;
        if (classes && classes.length > 0) {
          for (const c of classes) {
            out += `    - class ${c.name}\n`;
            for (const m of c.members) {
              out += `      - ${m.name}\n`;
            }
          }
        }
        if (functions && functions.length > 0) {
          for (const fn of functions) {
            out += `    - function ${fn.name}${fn.params}: ${fn.returnType}\n`;
          }
        }
        if (arrowFunctions && arrowFunctions.length > 0) {
          // print arrow functions as variables with function types
          for (const afn of arrowFunctions) {
            // e.g. const foopoop: (peepee: string) => void
            // afn.params already has parentheses, so we can directly insert:
            out += `    - const ${afn.name}: ${afn.params} => ${afn.returnType}\n`;
          }
        }
        if (interfaces && interfaces.length > 0) {
          for (const i of interfaces) {
            out += `    - interface ${i}\n`;
          }
        }
        if (types && types.length > 0) {
          for (const t of types) {
            out += `    - type ${t}\n`;
          }
        }
        if (vars && vars.length > 0) {
          for (const v of vars) {
            out += `    - ${v.kind} ${v.name}: ${v.type}\n`;
          }
        }
      }
    }
    return out;
  }

  let output = '';
  for (const f of fileStructures) {
    output += printFileStructure(f);
  }

  console.log(output.trim());
}
