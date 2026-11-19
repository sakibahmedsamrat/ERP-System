'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ReconnectButtonProps {
  className?: string;
  label?: string;
  iconSize?: number;
}

export default function ReconnectButton({
  className = 'text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer',
  label = 'Reconnect',
  iconSize = 13,
}: ReconnectButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        window.location.reload();
      }}
      className={className}
    >
      <RotateCcw size={iconSize} /> {label}
    </button>
  );
}
