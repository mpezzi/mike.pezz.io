/**
 * Virtual filesystem mapping site content to a unix-like tree rooted at
 * the home directory "~". Directories and files may carry a `urlPath`
 * linking them to a router route (dirs = index pages, files = detail pages).
 */

export interface VfsFileMeta {
  title?: string;
  date?: Date;
  tags?: string[];
}

export interface VfsFile {
  kind: "file";
  name: string;
  read(): string;
  meta?: VfsFileMeta;
  urlPath?: string;
}

export interface VfsDir {
  kind: "dir";
  name: string;
  children: Map<string, VfsNode>;
  urlPath?: string;
}

export type VfsNode = VfsFile | VfsDir;

export interface Vfs {
  root: VfsDir; // "~"
  normalize(cwd: string, path: string): string;
  resolve(cwd: string, path: string): VfsNode | undefined;
  list(cwd: string, path?: string): VfsNode[] | undefined;
  urlForPath(vfsPath: string): string | undefined;
  pathForUrl(urlPath: string): string | undefined;
}

export function dir(
  name: string,
  children: VfsNode[] = [],
  urlPath?: string,
): VfsDir {
  const d: VfsDir = { kind: "dir", name, children: new Map() };
  if (urlPath !== undefined) d.urlPath = urlPath;
  for (const child of children) d.children.set(child.name, child);
  return d;
}

export function file(
  name: string,
  content: string | (() => string),
  opts: { meta?: VfsFileMeta; urlPath?: string } = {},
): VfsFile {
  const f: VfsFile = {
    kind: "file",
    name,
    read: typeof content === "function" ? content : () => content,
  };
  if (opts.meta) f.meta = opts.meta;
  if (opts.urlPath !== undefined) f.urlPath = opts.urlPath;
  return f;
}

/** Split a canonical "~/a/b" path into segments below ~. */
function segmentsOf(canonical: string): string[] {
  if (canonical === "~") return [];
  return canonical.slice(2).split("/");
}

export function createVfs(root: VfsDir): Vfs {
  function normalize(cwd: string, path: string): string {
    let start: string[];
    let rest: string;
    if (path === "" || path === "~") {
      return "~";
    }
    if (path.startsWith("~/")) {
      start = [];
      rest = path.slice(2);
    } else if (path.startsWith("/")) {
      // Accept absolute paths; "/home/mike/..." aliases to "~".
      const stripped = path.replace(/^\/home\/mike\/?/, "").replace(/^\//, "");
      start = [];
      rest = stripped;
    } else {
      start = segmentsOf(normalize("~", cwd));
      rest = path;
    }
    const segs = [...start];
    for (const part of rest.split("/")) {
      if (part === "" || part === ".") continue;
      if (part === "..") {
        segs.pop(); // clamp at ~
      } else {
        segs.push(part);
      }
    }
    return segs.length === 0 ? "~" : `~/${segs.join("/")}`;
  }

  function nodeAt(canonical: string): VfsNode | undefined {
    let node: VfsNode = root;
    for (const seg of segmentsOf(canonical)) {
      if (node.kind !== "dir") return undefined;
      const next = node.children.get(seg);
      if (!next) return undefined;
      node = next;
    }
    return node;
  }

  function resolve(cwd: string, path: string): VfsNode | undefined {
    return nodeAt(normalize(cwd, path));
  }

  function list(cwd: string, path = "."): VfsNode[] | undefined {
    const node = resolve(cwd, path);
    if (node?.kind !== "dir") return undefined;
    return [...node.children.values()].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  const urlByPath = new Map<string, string>();
  const pathByUrl = new Map<string, string>();
  (function index(node: VfsNode, path: string) {
    if (node.urlPath !== undefined) {
      urlByPath.set(path, node.urlPath);
      if (!pathByUrl.has(node.urlPath)) pathByUrl.set(node.urlPath, path);
    }
    if (node.kind === "dir") {
      for (const child of node.children.values()) {
        index(child, path === "~" ? `~/${child.name}` : `${path}/${child.name}`);
      }
    }
  })(root, "~");

  return {
    root,
    normalize,
    resolve,
    list,
    urlForPath: (p) => urlByPath.get(p),
    pathForUrl: (u) => pathByUrl.get(u),
  };
}
