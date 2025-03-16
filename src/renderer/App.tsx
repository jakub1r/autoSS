import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import { useEffect, useRef, useState } from 'react';
import WordsList from '../components/WordsList';

function Hello() {
  const [listeningStatus, setListeningStatus] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [userData, setUserData] = useState({
    email: '',
    password: '',
  });
  const [selectedOption, setSelectedOption] = useState<boolean>(true);
  const emialRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const setEmail = (email: string) => {
    setUserData((prev) => ({ ...prev, email: email }));
  };
  const setPassword = (password: string) => {
    setUserData((prev) => ({ ...prev, password: password }));
  };
  const buttonClick = () => {
    if (listeningStatus) {
      window.electron.ipcRenderer.stopSelenium();
    } else {
      setError('');
      window.electron.ipcRenderer.startSelenium(
        userData,
        words,
        selectedOption,
      );
    }
    setListeningStatus((prev) => !prev);
  };

  useEffect(() => {
    if (error !== '') {
      setListeningStatus(false);
      window.electron.ipcRenderer.stopSelenium();
    }
  }, [error]);
  return (
    <div>
      {/* Email / Passwor inputs */}
      <div
        style={{
          justifySelf: 'center',
          display: 'block',
          backgroundColor: 'rgba(163, 159, 158,0.7)',
          borderRadius: '1rem',
          padding: '1rem', // Daje odstęp od krawędzi
          marginBottom: '1rem',
        }}
      >
        <input
          onChange={(e) => setEmail(e.target.value)}
          value={userData.email}
          disabled={listeningStatus}
          type="email"
          placeholder="email"
          style={{ fontSize: '1.5rem', margin: '0.5rem' }}
        ></input>
        <input
          onChange={(e) => setPassword(e.target.value)}
          value={userData.password}
          disabled={listeningStatus}
          placeholder="hasło"
          type="password"
          style={{ fontSize: '1.5rem', margin: '0.5rem' }}
        ></input>
        <div
          style={{ display: 'block', textAlign: 'center', fontSize: '2rem' }}
        >
          <span style={{ display: 'block' }}>
            <strong>Przeglądarka</strong>
          </span>
          <label>
            <input
              disabled={listeningStatus}
              style={{ fontSize: '1.5rem', margin: '1rem' }}
              type="radio"
              name="radioGroup"
              value="false"
              checked={selectedOption === false}
              onChange={(e) => setSelectedOption(e.target.value === 'true')}
            />
            Aktywna
          </label>

          <label>
            <input
              disabled={listeningStatus}
              style={{ fontSize: '1.5rem', margin: '1rem' }}
              type="radio"
              name="radioGroup"
              value="true"
              checked={selectedOption === true}
              onChange={(e) => setSelectedOption(e.target.value === 'true')}
            />
            Nieaktywna
          </label>
        </div>
      </div>

      {/* WordsList */}
      <WordsList
        listeningStatus={listeningStatus}
        words={words}
        setWords={setWords}
      />

      {/* Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          disabled={
            words.length == 0 || userData.email == '' || userData.password == ''
          }
          style={{
            borderColor: listeningStatus ? 'red' : 'green',
          }}
          onClick={buttonClick}
        >
          {listeningStatus
            ? 'Zatrzymaj nasłuchiwanie'
            : 'Uruchom nasłuchiwanie'}
        </button>
      </div>
      <div
        style={{
          marginTop: '1rem',
          textAlign: 'center',
          fontSize: '1rem',
          marginBottom: '1rem',
        }}
      >
        {listeningStatus ? 'Nasłuchiwanie jest uruchomione ...' : ''}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
