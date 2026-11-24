import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Router, Route } from 'wouter'
import { MantineProvider, createTheme } from '@mantine/core'
import { ChatProvider } from '../lib'
import './index.css'
import App from './App.tsx'
import { TextSelectionPage } from './TextSelectionPage.tsx'

const theme = createTheme({})

// GitHub Pages serves the demo from /chat-ui/, so routes resolve against Vite's base.
const base = import.meta.env.BASE_URL.replace(/\/$/, "")

// The provider sits above the routes so the transcript survives navigation and layout changes.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <ChatProvider endpoint="/agent">
        <Router base={base}>
          <Route path="/" component={App} />
          <Route path="/selection" component={TextSelectionPage} />
        </Router>
      </ChatProvider>
    </MantineProvider>
  </StrictMode>,
)
