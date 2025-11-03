/**
 * Plasma Lab Page
 * Real-time physics simulation of plasma reactor
 */

'use client';

import React from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import PlasmaLabNode from '@/components/nexus/PlasmaLabNode';

export default function PlasmaLabPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen">
        <PlasmaLabNode />
      </div>
    </AuthGuard>
  );
}
