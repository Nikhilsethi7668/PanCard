import { useState } from 'react'
import './App.css'
import { Router, Routes } from 'react-router-dom'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes path="/login" element={<Login />} />
    </Router>
  )
}

export default App
