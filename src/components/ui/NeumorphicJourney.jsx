import React, { useState } from 'react';
import NeumorphicCard from './NeumorphicCard';
import NeumorphicBadge from './NeumorphicBadge';
import { Circle, ClipboardList, Phone, MessageSquare, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NeumorphicJourney = ({ milestones }) => {
  const [expandedMilestones, setExpandedMilestones] = useState(
    milestones.reduce((acc, _, index) => ({ ...acc, [index]: true }), {})
  );
  
  const [expandedSteps, setExpandedSteps] = useState({});

  const toggleMilestone = (index) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleStep = (milestoneIndex, stepIndex) => {
    const stepKey = `${milestoneIndex}-${stepIndex}`;
    setExpandedSteps(prev => ({
      ...prev,
      [stepKey]: !prev[stepKey]
    }));
  };

  const getMilestoneIcon = (status, index) => {
    const number = index + 1;
    // All numbers are now white
    return <span className="font-bold text-lg text-white">{number}</span>;
  };

  const getMilestoneStyle = (status) => {
    let styles = {
      base: 'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0',
      completed: 'bg-[#2f949d] shadow-[var(--nm-shadow-main)]',
      current: 'bg-[#2f949d] shadow-[var(--nm-shadow-main)] animate-pulse',
      pending: 'bg-gray-400 shadow-[var(--nm-shadow-main)]', // Updated bg and shadow for pending
    };
    return `${styles.base} ${styles[status] || styles.pending}`;
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'overdue':
        return 'danger';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStepIcon = (type) => {
    const iconProps = { className: "w-4 h-4 flex-shrink-0", style: { color: '#2f949d' } };
    switch (type) {
      case 'assignment':
        return <ClipboardList {...iconProps} />;
      case 'session':
        return <Phone {...iconProps} />;
      case 'check-in':
        return <MessageSquare {...iconProps} />;
      default:
        return <Circle {...iconProps} />;
    }
  };

  const getMilestoneDuration = (milestone) => {
    if (!milestone.steps || milestone.steps.length === 0) return '';
    
    const dates = milestone.steps.map(step => new Date(step.date)).sort((a, b) => a - b);
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    
    if (startDate.getTime() === endDate.getTime()) {
      return `1 day`;
    }
    
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} days`;
  };

  return (
    <div className="flex flex-col gap-8">
      {milestones.map((milestone, index) => (
        <div key={index} className="flex gap-6 items-baseline relative">
          {/* Vertical Line & Notches - connects all milestones */}
          {index < milestones.length - 1 && (
            <div className="absolute top-5 left-5 w-0.5 bg-slate-300" style={{ height: 'calc(100% + 2rem)' }}>
              {/* Notches for steps */}
              {milestone.steps && milestone.steps.length > 0 && expandedMilestones[index] && (
                <div className="absolute w-full">
                  {milestone.steps.map((step, stepIndex) => {
                    const stepKey = `${index}-${stepIndex}`;
                    const baseTop = 7.25 + stepIndex * 2.5;
                    const expandedHeight = expandedSteps[stepKey] ? 2.5 : 0;
                    return (
                      <div key={stepIndex}>
                        <div style={{ top: `${baseTop}rem`}} className="absolute left-[-4px] w-2.5 h-0.5 bg-slate-400" />
                        {expandedSteps[stepKey] && (
                          <div style={{ top: `${baseTop + 2.5}rem`}} className="absolute left-[-4px] w-2.5 h-0.5 bg-slate-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Milestone Icon */}
          <div className={`z-10 ${getMilestoneStyle(milestone.status)}`}>
            {getMilestoneIcon(milestone.status, index)}
          </div>

          {/* Milestone Content */}
          <NeumorphicCard 
            className={`flex-1 transition-opacity duration-300 cursor-pointer ${milestone.status !== 'current' ? 'opacity-60' : 'opacity-100'}`}
            onClick={() => toggleMilestone(index)}
          >
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <div className="flex items-baseline gap-3">
                <h3 className="text-xl font-semibold">{`Milestone ${index + 1}: ${milestone.title}`}</h3>
                <div className="flex items-center gap-2">
                  {milestone.date && (
                    <span className="text-sm text-slate-500 font-medium">{milestone.date}</span>
                  )}
                  <NeumorphicBadge variant={getStatusVariant(milestone.status)} size="sm">
                    {milestone.status}
                  </NeumorphicBadge>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedMilestones[index] ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </motion.div>
            </div>

            {!expandedMilestones[index] && (
              <div className="text-sm text-slate-500">
                {milestone.steps && milestone.steps.length > 0 && (
                  <span>{milestone.steps.length} steps • {getMilestoneDuration(milestone)}</span>
                )}
              </div>
            )}

            <AnimatePresence>
              {expandedMilestones[index] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  {milestone.description && (
                    <p className="text-slate-600 mb-4">{milestone.description}</p>
                  )}
                  
                  {milestone.steps && milestone.steps.length > 0 && (
                    <div className="space-y-2 pt-2 mt-4 border-t border-slate-200">
                      {milestone.steps.map((step, stepIndex) => {
                        const stepKey = `${index}-${stepIndex}`;
                        return (
                          <div key={stepIndex} className="space-y-2">
                            <div 
                              className="flex items-center gap-3 p-2 rounded-lg neumorphic-step-hover cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStep(index, stepIndex);
                              }}
                            >
                              {getStepIcon(step.type)}
                              <span className="text-sm flex-1">{step.title}</span>
                              {step.date && (
                                <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-2">{step.date}</span>
                              )}
                              {step.status && (
                                <NeumorphicBadge variant={getStatusVariant(step.status)} size="sm">
                                  {step.status}
                                </NeumorphicBadge>
                              )}
                              <motion.div
                                animate={{ rotate: expandedSteps[stepKey] ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="ml-2"
                              >
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              </motion.div>
                            </div>
                            
                            <AnimatePresence>
                              {expandedSteps[stepKey] && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                                  className="overflow-hidden ml-7 mr-2"
                                >
                                  <NeumorphicCard className="!shadow-inner-neumorphic">
                                    <div className="text-sm text-slate-600">
                                      <p className="mb-2">Detailed information about <strong>{step.title}</strong></p>
                                      <p className="text-xs text-slate-500">
                                        Type: {step.type} • Date: {step.date} • Status: {step.status}
                                      </p>
                                      <p className="mt-2 text-xs">
                                        This is additional context and details that would be specific to this step. 
                                        It could include instructions, notes, or any other relevant information.
                                      </p>
                                    </div>
                                  </NeumorphicCard>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </NeumorphicCard>
        </div>
      ))}
    </div>
  );
};

export default NeumorphicJourney;