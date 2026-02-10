import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './CSS/App.css'
import Home from './Pages/Home.jsx'
import AppLayout from './Layouts/AppLayout.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className='maincontent'>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />}/>
        </Route>
      </Routes>
    </main>
  )
}

export default App
