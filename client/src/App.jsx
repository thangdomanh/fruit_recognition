import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Setting from './pages/Setting'


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/setting' element={<Setting />} />
      </Routes>
    </BrowserRouter>
  )
}
