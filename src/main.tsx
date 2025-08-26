import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app.tsx'

const root = document.getElementById('root')!
root.classList.add('dark')

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
