export interface ClientUIManager {
  /**
   * Add a DOM node to the UI overlay
   *
   * @param node - HTML Node
   */
  add(node: Node): void

  /**
   * Remove a DOM node from the UI overlay
   *
   * @param node - HTML Node
   */
  remove(node: Node): void

  /**
   * Get a list of CSS Style Sheets for the UI root
   */
  styles(): CSSStyleSheet[]

  /**
   * Enable `user-select` and `pointer-events` on a UI element
   *
   * @param element - HTML Element
   */
  makeInteractable(element: HTMLElement): void
}

export const createClientUI = (
  canvasContainer: Element,
  id = 'client-ui-container',
): ClientUIManager => {
  const rootElement = document.createElement('div')
  rootElement.id = id

  // always on top, mouse click-through:
  rootElement.style.pointerEvents = 'none'
  rootElement.style.userSelect = 'none'
  rootElement.style.position = 'absolute'
  rootElement.style.width = '100%'
  rootElement.style.height = '100%'
  rootElement.style.top = '0'
  rootElement.style.left = '0'

  canvasContainer.appendChild(rootElement)
  const shadowRoot = rootElement.attachShadow({ mode: 'closed' })

  const ui: ClientUIManager = {
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

  return Object.freeze(ui)
}
