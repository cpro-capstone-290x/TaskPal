import React from 'react'
import { Routes, Route } from "react-router-dom"
import Home from './pages/AuthPage/home'
import AuthPage from './pages/AuthPage/AuthPage'

function App() {
  return (
  <>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<AuthPage />} />
    </Routes>
  </>
  );
}

export default App
