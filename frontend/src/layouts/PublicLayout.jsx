import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'
import AssistantWidget from '../components/AssistantWidget/AssistantWidget'

const PublicLayout = () => {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
      <AssistantWidget />
    </div>
  )
}

export default PublicLayout
