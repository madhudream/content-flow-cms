import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PageSidebar } from './components/PageSidebar';
import { FormPage } from './components/FormPage';

function App() {
  return (
    <BrowserRouter basename="/bwo">
      <div className="flex min-h-screen bg-gray-50">
        <PageSidebar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<FormPage pageId="home" />} />
            <Route path="/personal-info" element={<FormPage pageId="personal-info" />} />
            <Route path="/income" element={<FormPage pageId="income" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
