import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SessionPage from './pages/SessionPage'
import FriendProfilePage from './pages/FriendProfilePage'
import GroupsPage from './pages/GroupsPage'
import GroupPage from './pages/GroupPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/session/:id" element={<SessionPage />} />
        <Route path="/friend/:friendCode" element={<FriendProfilePage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/group/:id" element={<GroupPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
