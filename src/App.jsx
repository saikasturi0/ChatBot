import React from 'react'
import Home from './components/Home'
import SlideBar from './components/SlideBar'
import Main from './components/Main'

import { createBrowserRouter, HashRouter, Navigate, RouterProvider, Routes,Route } from "react-router-dom"


const App = () => {
  

  return (
    <HashRouter>
      <Routes>
        <Route path='/' element={<Home/>} ></Route>
        <Route path='/chatBot' element={<><Main/> <SlideBar/></>} ></Route>
      </Routes>
    </HashRouter>
  )
}

export default App
