import { createContext, useContext, useState, ReactNode, FC, useEffect } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";

interface ModalContextProps {
  isOpen: boolean;
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
  content: ReactNode;
}

const ModalContext = createContext<ModalContextProps | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export const ModalProvider: FC<{ children: ReactNode }> = ({ children }: ReactNode) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);

  const openModal = (modalContent: ReactNode) => {
    setContent(modalContent);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setContent(null);
  };

  const handleOutsideClick = (event: MouseEvent) => {
    if ((event.target as Element).classList.contains("modal-backdrop")) {
      closeModal();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closeModal();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <ModalContext.Provider value={{ isOpen, openModal, closeModal, content }}>
      {isOpen &&
        ReactDOM.createPortal(
          <div className="modal-backdrop absolute inset-0 flex items-center justify-center z-50 bg-grey/50">
            <div className="bg-card p-4 rounded shadow-lg w-1/2 max-w-lg relative z-60 border-2 border-primary">
              <button className="absolute text-icon z-70 top-2 right-2" onClick={closeModal}>
                <X className="w-6 h-6" />
              </button>

              {content}
            </div>
          </div>,
          document.body,
        )}
      {children}
    </ModalContext.Provider>
  );
};
