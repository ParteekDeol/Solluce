import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './preferences.css';
class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="fatal"><h1>Let’s get you back to your field.</h1><p>Solluce couldn’t open this view. Your saved account data is unchanged.</p><button onClick={() => window.location.reload()}>Reload Solluce</button></main>;
    return this.props.children;
  }
}
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>);
