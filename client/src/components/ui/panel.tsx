// @deno-types="npm:@types/react@18.3.1"
import React, { FC, useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";

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

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some(tab => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

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
      <div className="flex-none flex items-center justify-between p-2 bg-grey shadow-sm">
        {tabs.map(tab => (
          <div
            key={tab.id}
            draggable
            onDragStart={e => e.dataTransfer.setData("text/tab-id", tab.id)}
            className={`cursor-pointer p-2 ${
              activeTab === tab.id ? "bg-primary text-white" : "bg-grey text-textPrimary"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.title}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
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

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="mb-4">
      <div
        className="flex items-center justify-between cursor-pointer p-2 bg-grey-200"
        onClick={toggleOpen}
      >
        {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        <h4 className="text-lg font-semibold">{title}</h4>
      </div>
      {isOpen && <div className="p-2">{children}</div>}
    </div>
  );
};
