import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AlgorithmPage from './pages/AlgorithmPage'
import SystemDesignPage from './pages/SystemDesignPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/algorithm" element={<AlgorithmPage />} />
        <Route path="/system-design" element={<SystemDesignPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
