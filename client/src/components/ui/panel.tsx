// @deno-types="npm:@types/react@18.3.1"
import React, { FC, useEffect, useState, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface Tab {
  id: string;
  title: string;
  content: JSX.Element;
}

interface PanelProps {
  className?: string;
  tabs: Tab[];
  onDropTab?: (tabId: string, targetPanelId: string) => void;
  panelId: string;
}

export const Panel: FC<PanelProps> = ({ className, tabs, onDropTab, panelId }: PanelProps) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some(tab => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    const activeTabElement = document.getElementById(`tab-${activeTab}`);
    if (activeTabElement && tabsRef.current) {
      activeTabElement.scrollIntoView({ behavior: "smooth", inline: "center" });
    }
  }, [activeTab]);

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const tabId = event.dataTransfer.getData("text/tab-id");
    onDropTab && onDropTab(tabId, panelId);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div
      className={
        "bg-card border-4 border-grey rounded-lg shadow-md flex flex-col h-full" +
        (className ? ` ${className}` : "")
      }
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div
        className="flex-none flex text-sm overflow-x-auto items-center justify-between bg-grey custom-scrollbar"
        ref={tabsRef}
      >
        <div className="flex">
          {tabs.map(tab => (
            <div
              key={tab.id}
              id={`tab-${tab.id}`}
              draggable
              onDragStart={e => e.dataTransfer.setData("text/tab-id", tab.id)}
              className={`cursor-pointer px-2 py-1 whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-textPrimary bg-card rounded-t"
                  : "text-textPrimary bg-grey"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.title}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {tabs.map(tab => (
          <div key={tab.id} className={`${activeTab === tab.id ? "block" : "hidden"}`}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

interface CategoryProps {
  title: string;
  children: React.ReactNode;
}

export const Category: FC<CategoryProps> = ({ title, children }: CategoryProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleOpen = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsOpen(!isOpen);
  };

  return (
    <div className="mb-4 border-b border-grey select-none">
      <div
        className="flex items-center cursor-pointer bg-grey hover:bg-grey-dark rounded"
        onClick={toggleOpen}
        style={{ userSelect: "none" }}
      >
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-textSecondary" />
        ) : (
          <ChevronRight className="w-5 h-5 text-textSecondary" />
        )}
        <h4 className="text-md ml-2 font-semibold text-textPrimary flex-grow">{title}</h4>
      </div>
      {isOpen && (
        <div className="p-2 rounded bg-card" style={{ userSelect: "none" }}>
          {children}
        </div>
      )}
    </div>
  );
};
