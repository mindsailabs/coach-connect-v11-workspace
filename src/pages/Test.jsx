import React, { useState } from 'react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicButton from '@/components/ui/NeumorphicButton';
import NeumorphicInput from '@/components/ui/NeumorphicInput';
import NeumorphicSelect from '@/components/ui/NeumorphicSelect';
import NeumorphicCheckbox from '@/components/ui/NeumorphicCheckbox';
import NeumorphicToggle from '@/components/ui/NeumorphicToggle';
import NeumorphicRadioGroup from '@/components/ui/NeumorphicRadioGroup';
import NeumorphicTable from '@/components/ui/NeumorphicTable';
import NeumorphicTextarea from '@/components/ui/NeumorphicTextarea';
import { Star, Settings, User } from 'lucide-react';

export default function TestPage() {
  const [selectValue, setSelectValue] = useState('');
  
  const selectOptions = [
    { value: 'option1', label: 'Option One' },
    { value: 'option2', label: 'Option Two' },
    { value: 'option3', label: 'Option Three' },
  ];

  const radioOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];

  const tableData = [
    { id: 1, item: 'Sample Item 1', category: 'Category A', status: 'Active' },
    { id: 2, item: 'Sample Item 2', category: 'Category B', status: 'Pending' },
    { id: 3, item: 'Sample Item 3', category: 'Category C', status: 'Completed' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <NeumorphicCard>
        <h1 className="text-4xl font-normal text-center mb-4">Interaction States Test Page</h1>
        <p className="text-center text-gray-600">
          This page demonstrates all proposed default interaction states (:hover, :active, :focus, :disabled) for neumorphic elements.
          Try hovering, clicking, tabbing, and interacting with all elements below.
        </p>
      </NeumorphicCard>

      {/* Buttons Section */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Buttons - Proposed Interaction States</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Normal States</h3>
            <div className="flex flex-wrap gap-4">
              <NeumorphicButton>Default Button</NeumorphicButton>
              <NeumorphicButton variant="primary">Primary Button</NeumorphicButton>
              <NeumorphicButton icon={Star}>Icon Button</NeumorphicButton>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Disabled States</h3>
            <div className="flex flex-wrap gap-4">
              <button 
                disabled
                className="px-6 py-3 text-base font-normal rounded-[var(--nm-radius)] cursor-not-allowed opacity-60"
                style={{
                  background: 'var(--nm-background)',
                  color: 'var(--nm-text-color)',
                  boxShadow: 'none',
                  border: '1px solid #d1d9e6'
                }}
              >
                Disabled Default
              </button>
              <button 
                disabled
                className="px-6 py-3 text-base font-normal rounded-[var(--nm-radius)] cursor-not-allowed opacity-60"
                style={{
                  background: '#2f949d',
                  color: '#ffffff',
                  boxShadow: 'none',
                  border: '1px solid #d1d9e6'
                }}
              >
                Disabled Primary
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              <strong>Proposed:</strong> Disabled buttons lose their shadow, gain a subtle border, reduced opacity (60%), cursor becomes 'not-allowed'
            </p>
          </div>
        </div>
      </NeumorphicCard>

      {/* Form Inputs Section */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Form Inputs - Proposed Interaction States</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Input Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Normal Input (try focus)</label>
                <NeumorphicInput placeholder="Focus me with Tab or click..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Disabled Input</label>
                <input
                  disabled
                  placeholder="I am disabled"
                  className="w-full px-4 py-3 placeholder-gray-400 cursor-not-allowed opacity-60 rounded-[12px]"
                  style={{
                    background: 'var(--nm-background)',
                    color: 'var(--nm-text-color)',
                    boxShadow: 'none',
                    border: '1px solid #d1d9e6'
                  }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              <strong>Proposed Focus State:</strong> Subtle blue glow ring around input, maintaining inset shadow.
              <br />
              <strong>Proposed Disabled State:</strong> No shadow, subtle border, reduced opacity, disabled cursor.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Textarea</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Normal Textarea</label>
                <NeumorphicTextarea placeholder="Try focusing me..." rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Disabled Textarea</label>
                <textarea
                  disabled
                  placeholder="I am disabled"
                  rows={3}
                  className="w-full px-4 py-3 placeholder-gray-400 cursor-not-allowed opacity-60 rounded-[12px] resize-none"
                  style={{
                    background: 'var(--nm-background)',
                    color: 'var(--nm-text-color)',
                    boxShadow: 'none',
                    border: '1px solid #d1d9e6'
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Select Dropdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Normal Select</label>
                <NeumorphicSelect 
                  placeholder="Try focusing and opening..."
                  options={selectOptions}
                  value={selectValue}
                  onValueChange={setSelectValue}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Disabled Select</label>
                <div
                  className="w-full px-4 py-3 rounded-[12px] cursor-not-allowed opacity-60 flex items-center justify-between"
                  style={{
                    background: 'var(--nm-background)',
                    color: 'var(--nm-text-color)',
                    boxShadow: 'none',
                    border: '1px solid #d1d9e6'
                  }}
                >
                  <span className="text-gray-400">Disabled select...</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              <strong>Proposed Focus State:</strong> Subtle blue glow ring around select trigger.
              <br />
              <strong>Proposed Disabled State:</strong> No shadow, subtle border, reduced opacity, disabled cursor.
            </p>
          </div>
        </div>
      </NeumorphicCard>

      {/* Selection Controls Section */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Selection Controls - Proposed Interaction States</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Checkboxes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <NeumorphicCheckbox label="Normal checkbox (try Tab focus)" />
                <NeumorphicCheckbox label="Another normal checkbox" />
              </div>
              <div>
                <div className="flex items-center gap-3 opacity-60 cursor-not-allowed">
                  <div 
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{
                      boxShadow: 'none',
                      border: '1px solid #d1d9e6',
                      background: 'var(--nm-background)'
                    }}
                  />
                  <span className="font-normal text-gray-400">Disabled checkbox</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              <strong>Proposed Focus State:</strong> Subtle blue glow ring around checkbox.
              <br />
              <strong>Proposed Disabled State:</strong> No shadow, subtle border, reduced opacity, disabled cursor.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Toggle Switches</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <NeumorphicToggle />
                <p className="text-sm mt-1">Normal toggle (try Tab focus)</p>
              </div>
              <div>
                <div 
                  className="w-16 h-8 rounded-full p-1 cursor-not-allowed opacity-60"
                  style={{
                    background: 'var(--nm-background)',
                    boxShadow: 'none',
                    border: '1px solid #d1d9e6'
                  }}
                >
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{
                      background: 'var(--nm-background)',
                      boxShadow: 'none',
                      border: '1px solid #d1d9e6'
                    }}
                  />
                </div>
                <p className="text-sm mt-1 text-gray-400">Disabled toggle</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              <strong>Proposed Focus State:</strong> Subtle blue glow ring around toggle track.
              <br />
              <strong>Proposed Disabled State:</strong> No shadow, subtle border, reduced opacity, disabled cursor.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Radio Groups</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm mb-2">Normal radio group (try Tab focus)</p>
                <NeumorphicRadioGroup options={radioOptions} name="size" />
              </div>
              <div>
                <p className="text-sm mb-2 text-gray-400">Disabled radio group</p>
                <div className="space-y-3 opacity-60 cursor-not-allowed">
                  {radioOptions.map((option) => (
                    <div key={option.value} className="flex items-center gap-3">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{
                          boxShadow: 'none',
                          border: '1px solid #d1d9e6',
                          background: 'var(--nm-background)'
                        }}
                      />
                      <span className="font-normal text-gray-400">{option.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              <strong>Proposed Focus State:</strong> Subtle blue glow ring around focused radio button.
              <br />
              <strong>Proposed Disabled State:</strong> No shadow, subtle border, reduced opacity, disabled cursor.
            </p>
          </div>
        </div>
      </NeumorphicCard>

      {/* Interactive Elements Section */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Interactive Elements - Proposed Interaction States</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Links</h3>
            <div className="space-y-4">
              <div>
                <p>Here is a <a href="#" className="test-link">normal link</a> in text.</p>
                <p>Here is a <a href="#" className="test-link-disabled">disabled link</a> in text.</p>
              </div>
              <p className="text-sm text-gray-500">
                <strong>Proposed States:</strong>
                <br />
                <strong>Default:</strong> Primary color (#2f949d), subtle underline on hover
                <br />
                <strong>Hover:</strong> Slightly darker shade, full underline
                <br />
                <strong>Focus:</strong> Subtle blue glow ring around link text
                <br />
                <strong>Active:</strong> Even darker shade while clicking
                <br />
                <strong>Disabled:</strong> Gray color, no hover effects, cursor not-allowed
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Cards (Clickable)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className="p-4 rounded-[var(--nm-radius)] cursor-pointer transition-all duration-200"
                style={{
                  background: 'var(--nm-background)',
                  boxShadow: 'var(--nm-shadow-main)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--nm-shadow-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--nm-shadow-main)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--nm-shadow-inset)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--nm-shadow-hover)';
                }}
              >
                <h4 className="font-semibold">Interactive Card</h4>
                <p className="text-sm text-gray-600">Hover and click me!</p>
              </div>

              <div 
                className="p-4 rounded-[var(--nm-radius)] cursor-not-allowed opacity-60"
                style={{
                  background: 'var(--nm-background)',
                  boxShadow: 'none',
                  border: '1px solid #d1d9e6'
                }}
              >
                <h4 className="font-semibold text-gray-400">Disabled Card</h4>
                <p className="text-sm text-gray-400">I cannot be clicked</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              <strong>Proposed States:</strong>
              <br />
              <strong>Hover:</strong> Subtle lift (-2px translateY) + enhanced shadow
              <br />
              <strong>Active:</strong> Pressed down (0px translateY) + inset shadow
              <br />
              <strong>Focus:</strong> Subtle blue glow ring (for keyboard navigation)
              <br />
              <strong>Disabled:</strong> No shadow, subtle border, reduced opacity, disabled cursor
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Table Rows (Already Implemented)</h3>
            <NeumorphicTable
              data={tableData}
              columns={[
                { header: 'Item', accessor: 'item' },
                { header: 'Category', accessor: 'category' },
                { header: 'Status', accessor: 'status', align: 'right' }
              ]}
            />
            <p className="text-sm text-gray-500 mt-2">
              <strong>Current Implementation:</strong> Text scales up (1.02) on hover, stays scaled when expanded (collapsible tables)
            </p>
          </div>
        </div>
      </NeumorphicCard>

      {/* Typography Section */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Typography - Proposed Base Styles</h2>
        <div className="space-y-4">
          <div>
            <h1>Heading 1 - Main Page Title</h1>
            <h2>Heading 2 - Section Title</h2>
            <h3>Heading 3 - Subsection Title</h3>
            <h4>Heading 4 - Component Title</h4>
            <h5>Heading 5 - Small Section Title</h5>
            <h6>Heading 6 - Tiny Section Title</h6>
          </div>
          <div>
            <p>This is regular paragraph text. It should be readable and follow the neumorphic color scheme.</p>
            <p><strong>This is bold text</strong> and <em>this is italic text</em>.</p>
            <p><code>This is inline code text</code> with different styling.</p>
          </div>
          <p className="text-sm text-gray-500">
            <strong>Proposed:</strong> All typography inherits neumorphic text color (var(--nm-text-color)) and font family (Lato). 
            Headings maintain proper hierarchy with consistent spacing.
          </p>
        </div>
      </NeumorphicCard>

      <style>{`
        .test-link {
          color: #2f949d;
          text-decoration: none;
          transition: all 200ms ease;
          border-radius: 4px;
          padding: 2px 4px;
          margin: -2px -4px;
        }
        
        .test-link:hover {
          color: #267d84;
          text-decoration: underline;
          transform: scale(1.02);
        }
        
        .test-link:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5);
        }
        
        .test-link:active {
          color: #1e6b72;
        }
        
        .test-link-disabled {
          color: #a0aec0;
          cursor: not-allowed;
          text-decoration: none;
          padding: 2px 4px;
          margin: -2px -4px;
        }
        
        /* Base typography styles for demonstration */
        h1, h2, h3, h4, h5, h6 {
          color: var(--nm-text-color);
          font-family: 'Lato', sans-serif;
          font-weight: normal;
          line-height: 1.2;
          margin: 0 0 0.5em 0;
        }
        
        h1 { font-size: 2.5rem; }
        h2 { font-size: 2rem; }
        h3 { font-size: 1.75rem; }
        h4 { font-size: 1.5rem; }
        h5 { font-size: 1.25rem; }
        h6 { font-size: 1.125rem; }
        
        p {
          color: var(--nm-text-color);
          font-family: 'Lato', sans-serif;
          line-height: 1.6;
          margin: 0 0 1em 0;
        }
        
        strong {
          font-weight: 600;
          color: var(--nm-text-color);
        }
        
        em {
          font-style: italic;
          color: var(--nm-text-color);
        }
        
        code {
          background: rgba(209, 217, 230, 0.3);
          color: #2f949d;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 0.9em;
        }
      `}</style>
    </div>
  );
}