import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './pages/AddFace';
import Verify from './pages/Verify';
import Index from './pages/Index';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/register" element={<Register />} />
        <Route path="/add-face" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
      </Routes>
    </BrowserRouter>
  );
}