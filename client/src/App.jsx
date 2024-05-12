import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Setting from './pages/Setting'
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';


export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/setting' element={<Setting />} />
      </Routes>
    </BrowserRouter>
  )
}