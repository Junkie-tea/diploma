import React, { useState, useEffect } from 'react';
import './App.css';

const NOTES = [
  { name: 'C4', frequency: 261.63 },
  { name: 'C#4', frequency: 277.18 },
  { name: 'D4', frequency: 293.66 },
  { name: 'D#4', frequency: 311.13 },
  { name: 'E4', frequency: 329.63 },
  { name: 'F4', frequency: 349.23 },
  { name: 'F#4', frequency: 369.99 },
  { name: 'G4', frequency: 392.00 },
  { name: 'G#4', frequency: 415.30 },
  { name: 'A4', frequency: 440.00 },
  { name: 'A#4', frequency: 466.16 },
  { name: 'B4', frequency: 493.88 },
];

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [soundTrack, setSoundTrack] = useState([]);

  useEffect(() => {
    // Очистка интервала при размонтировании
    return () => clearInterval(intervalId);
  }, [intervalId]);

  const playSound = (frequency) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine'; // Тип волны: 'sine', 'square', 'sawtooth', 'triangle'
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5); // Длительность звука
  };

  useEffect(() => {
    if (isPlaying) {
      const id = setInterval(() => {
        setCurrentStep((prevStep) => {
          const nextStep = (prevStep + 1) % soundTrack.length;
          const note = soundTrack[nextStep];
          const noteData = NOTES.find(n => n.name === note);
          if (noteData) playSound(noteData.frequency);
          return nextStep;
        });
      }, 1000); // Время между нотами

      setIntervalId(id);
    } else {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [isPlaying]);

  const handlePlay = () => {
    setIsPlaying(true);
    setCurrentStep(0); // Сброс к первому элементу
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const recordNote = (note) => {
    setSoundTrack(prev => [...prev, note]);
    playSound(NOTES.find(n => n.name === note).frequency); // сразу воспроизводим записанную ноту
  };

  // Обработчик MIDI
  useEffect(() => {
    const handleMIDIMessage = (event) => {
      const [status, noteNumber] = event.data;
      if (status === 144) { // Note On
        const noteName = NOTES[noteNumber - 60]?.name; // Преобразуем номер в название
        if (noteName) recordNote(noteName);
      }
    };
  
    let midiInputs = [];
  
    navigator.requestMIDIAccess().then((midiAccess) => {
      midiInputs = midiAccess.inputs.values();
      for (let input of midiInputs) {
        input.onmidimessage = handleMIDIMessage;
      }
    });
  
    return () => {
      // Очистка MIDI-соединений
      if (midiInputs) {
        for (let input of midiInputs) {
          input.onmidimessage = null;
        }
      }
    };
  }, []);
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Sequencer</h1>
        <div className="controls">
          <button onClick={handlePlay} disabled={isPlaying}>Play</button>
          <button onClick={handleStop} disabled={!isPlaying}>Stop</button>
          <button onClick={handleReset} disabled={!soundTrack.length}>Reset</button>
        </div>
        <div>Current step: {currentStep + 1}</div>
        <div className="sound-track">
          Sound Track:
          {soundTrack.map((note, index) => (
            <div key={index} className={`sequence ${index === currentStep ? "active" : ""}`}>{note}</div>
          ))}
        </div>
        <div className="midi-keyboard">
          <h2>MIDI Keyboard</h2>
          {NOTES.map((note, index) => (
            <button key={index} onClick={() => recordNote(note.name)}>{note.name}</button>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;
