import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Router, Route } from 'wouter'
import { MantineProvider, createTheme } from '@mantine/core'
import './index.css'
import App from './App.tsx'
import { TextSelectionPage } from './TextSelectionPage.tsx'

const theme = createTheme({})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Router>
        <Route path="/" component={App} />
        <Route path="/selection" component={TextSelectionPage} />
      </Router>
    </MantineProvider>
  </StrictMode>,
)
