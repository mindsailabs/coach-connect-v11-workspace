import React from 'react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicJourneyDesignerV7 from '@/components/ui/NeumorphicJourneyDesignerV7';
import NeumorphicJourneyDesignerV8 from '@/components/ui/NeumorphicJourneyDesignerV8';
import NeumorphicJourneyDesignerV9 from '@/components/journey-designer-v9/NeumorphicJourneyDesignerV9';
import NeumorphicJourneyDesignerV10 from '@/components/journey-designer-v10/NeumorphicJourneyDesignerV10';
import NeumorphicJourneyDesigner from '@/components/ui/NeumorphicJourneyDesigner';
import NeumorphicJourneyDesignerV3 from '@/components/ui/NeumorphicJourneyDesignerV3';
import NeumorphicJourneyDesignerV4 from '@/components/ui/NeumorphicJourneyDesignerV4';
import NeumorphicJourneyDesignerV5 from '@/components/ui/NeumorphicJourneyDesignerV5';
import NeumorphicJourneyDesignerV6 from '@/components/ui/NeumorphicJourneyDesignerV6';

export default function ArchivePage() {
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <NeumorphicCard>
        <h1 className="text-4xl font-normal text-center">Journey Designer Archive</h1>
        <p className="text-center mt-2 text-gray-600">All previous journey designer versions and iterations.</p>
      </NeumorphicCard>

      {/* Journey Designer V10 */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Journey Designer V10</h2>
        <NeumorphicJourneyDesignerV10
          onJourneyChange={(journey) => console.log('Journey V10 updated:', journey)}
          startDate={new Date()}
          timelineLength={45}
        />
      </NeumorphicCard>

      {/* Journey Designer V9 */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Journey Designer V9</h2>
        <NeumorphicJourneyDesignerV9
          onJourneyChange={(journey) => console.log('Journey V9 updated:', journey)}
          startDate={new Date()}
          timelineLength={45}
        />
      </NeumorphicCard>

      {/* Journey Designer V8 */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Journey Designer V8</h2>
        <NeumorphicJourneyDesignerV8
          onJourneyChange={(journey) => console.log('Journey V8 updated:', journey)}
          startDate={new Date()}
          timelineLength={45}
        />
      </NeumorphicCard>

      {/* Journey Designer V7 */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Journey Designer V7</h2>
        <NeumorphicJourneyDesignerV7
          onJourneyChange={(journey) => console.log('Journey V7 updated:', journey)}
          startDate={new Date()}
          timelineLength={45}
        />
      </NeumorphicCard>

      {/* Journey Designer V6 */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Journey Designer V6</h2>
        <NeumorphicJourneyDesignerV6
          onJourneyChange={(journey) => console.log('Journey V6 updated:', journey)}
          startDate={new Date()}
          timelineLength={45}
        />
      </NeumorphicCard>

      {/* Journey Designer V5 */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Journey Designer V5</h2>
        <NeumorphicJourneyDesignerV5
          onJourneyChange={(journey) => console.log('Journey V5 updated:', journey)}
          startDate={new Date()}
          timelineLength={45}
        />
      </NeumorphicCard>

      {/* Journey Designer V4 */}
      <div className="section">
        <h3 className="text-xl font-medium text-gray-700 mb-4">Journey Designer V4</h3>
        <NeumorphicJourneyDesignerV4 />
      </div>

      {/* Journey Designer V3 */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Journey Designer V3 (Week View)</h2>
        <NeumorphicJourneyDesignerV3
          onJourneyChange={(journey) => console.log('Journey V3 updated:', journey)}
          startDate={new Date()}
          timelineLength={45}
        />
      </NeumorphicCard>

      {/* Journey Designer (Interactive) */}
      <NeumorphicCard>
        <h2 className="text-2xl font-normal mb-6">Journey Designer (Interactive)</h2>
        <NeumorphicJourneyDesigner
          onJourneyChange={(journey) => console.log('Journey updated:', journey)}
          startDate={new Date()}
          timelineLength={45}
        />
      </NeumorphicCard>
    </div>
  );
}