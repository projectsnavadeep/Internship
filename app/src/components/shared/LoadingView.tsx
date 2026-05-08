import React from 'react';
import { PremiumLoader } from './PremiumLoader';

interface LoadingViewProps {
  message?: string;
}

export const LoadingView: React.FC<LoadingViewProps> = ({ message = 'Loading...' }) => {
  return <PremiumLoader message={message} size="md" />;
};
