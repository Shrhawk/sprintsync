// Main layout component that wraps the entire application

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container-app py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
