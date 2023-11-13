const applyStyles = (element: HTMLElement, interactable: boolean) => {
  element.style.position = 'absolute'
  element.style.width = '100%'
  element.style.height = '100%'
  element.style.top = '0'
  element.style.left = '0'

  element.style.pointerEvents = interactable ? 'auto' : 'none'
  element.style.userSelect = interactable ? 'auto' : 'none'
}

export interface UIManager {
  /**
   * Create and attach a new DOM root in the UI system
   *
   * @param interactable - Set to `true` to allow `pointer-events` and `user-select`
   */
  create(this: void, interactable?: boolean): ShadowRoot

  /**
   * Remove a DOM root from the UI system
   *
   * @param root - UI DOM root
   */
  remove(this: void, root: ShadowRoot): void
}

export const createClientUI = (
  canvasContainer: Element,
  id = 'dreamlab-ui',
): UIManager => {
  const uiRoot = document.createElement('div')
  uiRoot.id = id
  applyStyles(uiRoot, false)

  canvasContainer.appendChild(uiRoot)
  const shadowRoot = uiRoot.attachShadow({ mode: 'closed' })

  const ui: UIManager = {
    create: (interactable = false) => {
      const div = document.createElement('div')
      applyStyles(div, interactable)

      shadowRoot.appendChild(div)
      return div.attachShadow({ mode: 'closed' })
    },

    remove: root => {
      shadowRoot.removeChild(root.host)
    },
  }

  return Object.freeze(ui)
}
