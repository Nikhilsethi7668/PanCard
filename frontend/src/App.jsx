import { useState } from 'react'
import './App.css'
import { Route, Router, Routes } from 'react-router-dom'
import UploadPage from './Pages/UploadPage'
import Login from './Pages/Login'

function App() {


  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<UploadPage />} />
    </Routes>
  )
}

export default App
