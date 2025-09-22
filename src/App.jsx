import { useState } from 'react'
import { Routes, Route } from "react-router-dom"
import Home from './pages/Home'
import SignIn from './pages/login-and-register/SignIn'
import SignUp from './pages/login-and-register/SignUp'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/register" element={<SignUp />} />
    </Routes>
    </>
  )
}

export default App
