import { mount } from 'svelte';
// Police des titres, livrée avec l'app (disponible hors ligne).
import '@fontsource-variable/fraunces';
import './app.css';
import App from './App.svelte';

const app = mount(App, { target: document.getElementById('app')! });

export default app;
