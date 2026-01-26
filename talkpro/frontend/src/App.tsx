import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AlgorithmPage from './pages/AlgorithmPage'
import SystemDesignPage from './pages/SystemDesignPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import HistoryPage from './pages/HistoryPage'
import AbilitiesPage from './pages/AbilitiesPage'
import GrowthPage from './pages/GrowthPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/algorithm" element={<AlgorithmPage />} />
        <Route path="/system-design" element={<SystemDesignPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/abilities" element={<AbilitiesPage />} />
        <Route path="/growth" element={<GrowthPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
