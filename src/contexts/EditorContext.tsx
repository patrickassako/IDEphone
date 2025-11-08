import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TabItem, FileItem, Repository } from '../types';

interface EditorContextType {
  tabs: TabItem[];
  activeTabId: string | null;
  currentRepository: Repository | null;
  rootPath: string | null;
  addTab: (tab: TabItem) => void;
  removeTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<TabItem>) => void;
  setActiveTab: (id: string) => void;
  setCurrentRepository: (repo: Repository | null) => void;
  setRootPath: (path: string | null) => void;
  getActiveTab: () => TabItem | undefined;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [currentRepository, setCurrentRepository] = useState<Repository | null>(null);
  const [rootPath, setRootPath] = useState<string | null>(null);

  const addTab = (tab: TabItem) => {
    const existingTab = tabs.find((t) => t.path === tab.path);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }
    setTabs([...tabs, tab]);
    setActiveTabId(tab.id);
  };

  const removeTab = (id: string) => {
    const index = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);

    if (activeTabId === id) {
      if (newTabs.length > 0) {
        const newActiveIndex = Math.min(index, newTabs.length - 1);
        setActiveTabId(newTabs[newActiveIndex].id);
      } else {
        setActiveTabId(null);
      }
    }
  };

  const updateTab = (id: string, updates: Partial<TabItem>) => {
    setTabs(tabs.map((tab) => (tab.id === id ? { ...tab, ...updates } : tab)));
  };

  const setActiveTab = (id: string) => {
    setActiveTabId(id);
  };

  const getActiveTab = () => {
    return tabs.find((t) => t.id === activeTabId);
  };

  return (
    <EditorContext.Provider
      value={{
        tabs,
        activeTabId,
        currentRepository,
        rootPath,
        addTab,
        removeTab,
        updateTab,
        setActiveTab,
        setCurrentRepository,
        setRootPath,
        getActiveTab,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};
