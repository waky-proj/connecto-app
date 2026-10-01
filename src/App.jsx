import useConnecto from './app/useConnecto.js';
import AppShell from './app/AppShell.jsx';
export default function App() {
  const model = useConnecto();
  return <AppShell model={model} />;
}
