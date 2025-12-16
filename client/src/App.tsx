import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SessionPage from './pages/SessionPage'
import FriendProfilePage from './pages/FriendProfilePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/session/:id" element={<SessionPage />} />
        <Route path="/friend/:friendCode" element={<FriendProfilePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
