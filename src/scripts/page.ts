// Pages with no 3D: today's figures, the forms, the demonstrations, the quiet reveals and the rolling figures.
import { refreshFigures } from './live';
import { initForms } from './forms';
import { initSite } from './site';
import { initDemos } from './demos';

refreshFigures();
initForms();
initDemos();
initSite();
document.documentElement.classList.add('run');
