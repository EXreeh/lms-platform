export function getFileExtensionFromName(name: string): string {
  const clean = name.split("?")[0] ?? name;
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot).toLowerCase() : "";
}
