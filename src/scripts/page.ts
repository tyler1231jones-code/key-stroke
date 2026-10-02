// Pages with no 3D: today's figures, the quiet reveals and the rolling figures.
import { refreshFigures } from './live';
import { initSite } from './site';

refreshFigures();
initSite();
document.documentElement.classList.add('run');
