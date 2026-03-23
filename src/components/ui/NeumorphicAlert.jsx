import React from 'react';
import NeumorphicCard from './NeumorphicCard';
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const alertTypes = {
  info: { icon: Info, color: 'text-blue-500' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500' },
  success: { icon: CheckCircle, color: 'text-green-500' },
  error: { icon: XCircle, color: 'text-red-500' },
};

const NeumorphicAlert = ({ type = 'info', children }) => {
  const { icon: Icon, color } = alertTypes[type];
  
  return (
    <NeumorphicCard className="!shadow-inner-neumorphic">
      <div className="flex items-center gap-4">
        <Icon className={`w-6 h-6 ${color}`} />
        <div className="font-medium">{children}</div>
      </div>
    </NeumorphicCard>
  );
};

export default NeumorphicAlert;