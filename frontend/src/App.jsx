import React from 'react'
import { Routes, Route } from "react-router-dom"
import Home from './pages/home'
import AuthPage from './pages/AuthPage/AuthPage'

function App() {
  return (
  <div>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<AuthPage />} />
    </Routes>
  </div>
  );
}

export default App
