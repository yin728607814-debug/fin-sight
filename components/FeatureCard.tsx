import React from 'react';
import { Feature } from '../types';

interface FeatureCardProps {
  feature: Feature;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
      <div className="w-12 h-12 bg-brand-50 rounded-lg flex items-center justify-center text-2xl mb-4">
        {feature.icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        {feature.title}
      </h3>
      <p className="text-slate-600 leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
};