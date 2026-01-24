// components/UI/Tabs.jsx
'use client'

import CustomIcon from './Icon'

const Tabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.icon && (
              <CustomIcon
                icon={tab.icon}
                className={`
                  mr-2 h-5 w-5
                  ${activeTab === tab.id
                    ? 'text-blue-500'
                    : 'text-gray-400 group-hover:text-gray-500'
                  }
                `}
              />
            )}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default Tabs