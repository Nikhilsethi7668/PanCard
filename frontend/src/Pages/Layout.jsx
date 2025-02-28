import React from 'react'
import Navbar from '../Components/Navbar'
import { Outlet } from 'react-router-dom'

const Layout = () => {
  return (
    <div className=''>
      <Navbar />
      <Outlet />
    </div>




  )
}

export default Layout
