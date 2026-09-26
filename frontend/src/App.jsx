import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Welcome from './components/Welcome';
import Questionnaire from './components/Questionnaire';
import Roadmap from './components/Roadmap';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StepDetail from './pages/StepDetail';
import api from './api';

function App() {
  const location = useLocation();
  const isAuthenticated = !!sessionStorage.getItem('access_token');

  const handleLogout = () => {
    sessionStorage.removeItem('access_token');
    api.post('/api/token/logout/').catch(() => {});
    window.location.href = '/';
  };

  return (
    <div className="max-w-[1500px] mx-auto p-4 sm:p-8 min-h-screen flex flex-col">
      <header className="flex justify-between items-center mb-12 py-4">
        <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => window.location.href = '/'}>
          CAREER<span className="text-primary">SEA</span>
        </div>
        <div>
          {isAuthenticated ? (
            <div className="flex gap-4 items-center">
              <a href="/dashboard" className="font-black uppercase text-sm tracking-widest hover:text-primary transition-colors">DASHBOARD</a>
              <button onClick={handleLogout} className="pop-button !px-4 !py-2 text-sm">LOGOUT</button>
            </div>
          ) : (
            <div className="flex gap-6 items-center">
              <a href="/login" className="font-black uppercase text-sm tracking-widest hover:text-primary transition-colors">LOGIN</a>
              <a href="/register" className="pop-button !px-4 !py-2 text-sm">REGISTER</a>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow flex flex-col">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Welcome />} />
            <Route path="/assessment" element={<Questionnaire />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/step/:id" element={<StepDetail />} />
          </Routes>
        </AnimatePresence>
      </main>
      
      <footer className="mt-20 py-8 border-t-pop border-text text-center font-bold uppercase text-xs tracking-widest opacity-60">
        &copy; {new Date().getFullYear()} CareerSea - All Rights Reserved
      </footer>
    </div>
  );
}

export default App;
