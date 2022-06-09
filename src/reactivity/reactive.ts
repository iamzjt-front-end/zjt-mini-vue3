export function reactive(raw) {
  return new Proxy(raw, {
    
  })
}