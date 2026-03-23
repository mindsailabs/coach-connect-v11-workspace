import React from 'react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicJourneyDesignerV11 from '@/components/journey-designer-v11/NeumorphicJourneyDesignerV11';

export default function V11Page() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <NeumorphicCard>
        <h1 className="text-4xl font-normal text-center">Journey Designer V11</h1>
        <p className="text-center mt-2 text-gray-600">Clone of V9 for independent development</p>
      </NeumorphicCard>

      <NeumorphicCard>
        <NeumorphicJourneyDesignerV11
          onJourneyChange={(journey) => console.log('Journey V11 updated:', journey)}
          startDate={new Date()}
          timelineLength={45}
        />
      </NeumorphicCard>
    </div>
  );
}