// @deno-types="npm:@types/react@18.3.1"
import React, { FC, useEffect, useState, useRef, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip.tsx";
import * as portals from "react-reverse-portal";

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

export const Panel: FC<PanelProps> = ({ className, tabs, onDropTab, panelId }) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");
  const tabsRef = useRef<HTMLDivElement>(null);
  const portalNodes = useMemo(() => {
    return tabs.reduce((nodes, tab) => {
      const node = portals.createHtmlPortalNode({
        attributes: { class: "h-full" },
      });
      nodes[tab.id] = node;
      return nodes;
    }, {} as Record<string, ReturnType<typeof portals.createHtmlPortalNode>>);
  }, [tabs]);

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
      <div className="flex-1 overflow-y-auto custom-scrollbar h-full">
        {tabs.map(
          tab =>
            tab.id === activeTab && (
              <React.Fragment key={tab.id}>
                <portals.InPortal node={portalNodes[tab.id]}>{tab.content}</portals.InPortal>
                <portals.OutPortal node={portalNodes[tab.id]} />
              </React.Fragment>
            ),
        )}
      </div>
    </div>
  );
};

interface Icon {
  id: string;
  element: JSX.Element;
  onClick: (event: React.MouseEvent) => void;
  tooltip: string;
}

interface CategoryProps {
  title: string;
  titleIcon?: JSX.Element;
  icons?: Icon[];
  children: React.ReactNode;
}

export const Category: FC<CategoryProps> = ({
  title,
  titleIcon,
  icons = [],
  children,
}: CategoryProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleOpen = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsOpen(!isOpen);
  };

  return (
    <div className="mb-4 border-b border-grey select-none">
      <div
        className="flex items-center justify-between cursor-pointer bg-grey hover:bg-grey-dark"
        onClick={toggleOpen}
        style={{ userSelect: "none" }}
      >
        <div className="flex items-center">
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-icon" />
          ) : (
            <ChevronRight className="w-4 h-4 text-icon" />
          )}
          <h4 className="text-md ml-4 text-textPrimary flex items-center">
            {titleIcon && <span className="mr-2">{titleIcon}</span>}
            {title}
          </h4>
        </div>
        <div className="flex space-x-2 px-3">
          {icons.map(icon => (
            <div
              key={icon.id}
              onClick={event => {
                event.stopPropagation();
                icon.onClick(event);
              }}
              className="cursor-pointer"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-icon">{icon.element}</div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{icon.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      </div>
      {isOpen && (
        <div className="p-2 rounded bg-card" style={{ userSelect: "none" }}>
          {children}
        </div>
      )}
    </div>
  );
};
