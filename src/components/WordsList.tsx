import { Dispatch, SetStateAction, useRef, useState } from 'react';
type WordsListProp = {
  listeningStatus: boolean;
  words: string[];
  setWords: Dispatch<SetStateAction<string[]>>;
};
export default function WordsList({
  listeningStatus,
  words,
  setWords,
}: WordsListProp) {
  const inputRef = useRef<HTMLInputElement>(null);
  const removeWordFromList = (word: string) => {
    const updatedList = words.filter((value) => value !== word);
    setWords((prev) => updatedList);
  };
  const addWord = () => {
    const word: string = String(inputRef.current?.value).toLowerCase();
    if (word !== '' && !words.includes(word)) {
      setWords((prev) => [...prev, word]);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };
  return (
    <div
      style={{
        justifyItems: 'center',
        alignItems: 'center',
        justifySelf: 'center',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '5rem',
        backgroundColor: 'rgba(163, 159, 158,0.7)',
        borderRadius: '1rem',
        padding: '1rem', // Daje odstęp od krawędzi
        marginBottom: '1rem',
      }}
    >
      <span style={{ display: 'block', textAlign: 'center', fontSize: '2rem' }}>
        <strong>Słowa do wyszukiwania towaru</strong>
      </span>
      <div style={{ fontSize: '2rem' }}>
        {words.map((word, index) => (
          <div key={index}>
            {word.toLowerCase()}
            <button
              disabled={listeningStatus}
              onClick={() => removeWordFromList(word)}
              style={{
                padding: 0,
                color: listeningStatus ? 'gray' : 'red',
                marginLeft: '10px',
                border: 'none',
                backgroundColor: 'transparent',
              }}
            >
              X
            </button>
          </div>
        ))}
      </div>
      <div style={{ justifyContent: 'center' }}>
        <input
          disabled={listeningStatus}
          style={{ fontSize: '1.5rem' }}
          ref={inputRef}
          onKeyDown={(e) => {
            // Jeśli naciśnięty klawisz to Enter (kod 13), wywołaj addWord
            if (e.key === 'Enter') {
              addWord();
            }
          }}
        ></input>
        <button
          onClick={addWord}
          disabled={listeningStatus}
          style={{
            margin: '1rem',
            padding: '0.3rem 1rem',
            border: 'none',
            backgroundColor: '#007bff',
            color: 'white',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
        >
          Dodaj słowo
        </button>
      </div>
      <div>(Wielkość liter nie ma znaczenia)</div>
    </div>
  );
}
