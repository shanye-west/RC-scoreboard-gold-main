import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { ShanyewestTheme } from '@shanyewest/best-ball-scorecard.shanyewest-theme';
import { GolfScorecard } from "./golf-scorecard.js";

if (import.meta.hot) {
  import.meta.hot.accept();
}

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <BrowserRouter>
    <ShanyewestTheme>
      <GolfScorecard />
    </ShanyewestTheme>
  </BrowserRouter>
);