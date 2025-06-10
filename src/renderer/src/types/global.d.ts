// Global types for renderer process with node integration enabled

interface Window {
  require: NodeRequire
}

declare const require: NodeRequire
