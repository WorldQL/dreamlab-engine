export interface ClientUIManager {
  add(node: Node): void
  remove(node: Node): void
  styles(): CSSStyleSheet[]
  makeInteractable(element: HTMLElement): void
}

export function createClientUI(canvasContainer: Element): ClientUIManager {
  const shadowRootContainer = Object.assign(document.createElement('div'), {
    id: 'client-ui-container',
  })

  // always on top, mouse click-through:
  shadowRootContainer.style.pointerEvents = 'none'
  shadowRootContainer.style.userSelect = 'none'
  shadowRootContainer.style.position = 'absolute'
  shadowRootContainer.style.width = '100%'
  shadowRootContainer.style.height = '100%'
  shadowRootContainer.style.top = '0'
  shadowRootContainer.style.left = '0'

  canvasContainer.appendChild(shadowRootContainer)
  const shadowRoot = shadowRootContainer.attachShadow({ mode: 'closed' })

  return {
    add(node) {
      shadowRoot.appendChild(node)
    },

    remove(node) {
      shadowRoot.removeChild(node)
    },

    styles() {
      return shadowRoot.adoptedStyleSheets
    },

    makeInteractable(element) {
      element.style.userSelect = 'auto'
      element.style.pointerEvents = 'auto'
    },
  }
}
