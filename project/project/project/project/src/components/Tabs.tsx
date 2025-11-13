interface TabsProps {
  tabs: Array<{
    label: string;
    id: string;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="border-b border-slate-200">
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-6 py-3 font-medium text-sm transition-colors duration-200 border-b-2 ${
              activeTab === tab.id
                ? 'border-slate-700 text-slate-700'
                : 'border-transparent text-slate-600 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
