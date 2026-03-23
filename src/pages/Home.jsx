import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicButton from '@/components/ui/NeumorphicButton';
import { Sun, Moon, Star, PenSquare } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <NeumorphicCard className="text-center">
        <h1 className="text-4xl font-bold mb-2">Evolve Well</h1>
        <p className="text-lg text-gray-600">Your Neumorphic Personal Growth Companion</p>
      </NeumorphicCard>

      <div className="mt-12">
        <NeumorphicCard>
          <h2 className="text-2xl font-semibold mb-6">UI Component Showcase</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-medium mb-4">Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <NeumorphicButton>Default</NeumorphicButton>
                <NeumorphicButton icon={Sun}>With Icon</NeumorphicButton>
                <NeumorphicButton icon={Moon}></NeumorphicButton>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-4">Cards</h3>
              <p className="mb-2">This container is also a Neumorphic Card.</p>
              <NeumorphicCard className="flex items-center gap-4">
                <Star className="w-6 h-6 text-yellow-500" />
                <p>Nested cards work beautifully too.</p>
              </NeumorphicCard>
            </div>
          </div>
           <div className="mt-8 border-t-2 border-gray-300/50 pt-8 flex justify-center">
             <Link to={createPageUrl("Styling")}>
                <NeumorphicButton icon={PenSquare}>
                  View Full Style Guide
                </NeumorphicButton>
              </Link>
           </div>
        </NeumorphicCard>
      </div>
    </div>
  );
}