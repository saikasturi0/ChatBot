import React from 'react'
import Home from './components/Home'
import SlideBar from './components/SlideBar'
import Main from './components/Main'

import { createBrowserRouter, Navigate, RouterProvider, Routes } from "react-router-dom"


const App = () => {

  const routes = createBrowserRouter(
  [
    {
      path:"/",
      element: <Home />
    },
    {
        path: "/chatBot",
        element: <><SlideBar/><Main /></>
    },
  ],
)
  return (
      <RouterProvider router={routes} />
  )
}

export default App
