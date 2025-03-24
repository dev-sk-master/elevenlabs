import React, { useState, useRef, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const SpeechToText = () => {
  // const [isRecording, setIsRecording] = useState(false);
  // const [transcriptions, setTranscriptions] = useState([]);

  // const mediaRecorderRef = useRef(null);
  // const audioChunksRef = useRef([]);
  // const streamRef = useRef(null);
  // const audioContextRef = useRef(null);
  // const analyserRef = useRef(null);
  // const silenceTimerRef = useRef(null);
  // const hasSpokenRef = useRef(false);

  // const SPEECH_THRESHOLD = 0.02;
  // const SILENCE_THRESHOLD = 0.01; // Volume threshold for silence
  // const SILENCE_DURATION = 2000; // Time in ms to wait before considering "paused"

  // const handleStartRecording = async () => {
  //   try {
  //     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  //     streamRef.current = stream;

  //     const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  //     mediaRecorderRef.current = mediaRecorder;

  //     audioChunksRef.current = [];

  //     mediaRecorder.ondataavailable = (event) => {
  //       console.log('ondataavailable', event.data)
  //       if (event.data.size > 0) {
  //         audioChunksRef.current.push(event.data);

  //         if (audioChunksRef.current.length) {
  //           sendAudioToServer(audioChunksRef.current.slice());
  //           audioChunksRef.current = [];
  //         }

  //       }
  //     };

  //     mediaRecorder.onstart = () => console.log('Recording started');
  //     mediaRecorder.onstop = () => console.log('Recording stopped');


  //     mediaRecorder.start();
  //     console.log('MediaRecorder started:', mediaRecorder.state);
  //     setIsRecording(true);


  //     setupAudioAnalysis(stream);

  //   } catch (error) {
  //     console.error('Microphone error:', error);
  //   }
  // };

  // const handleStopRecording = () => {
  //   if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
  //     mediaRecorderRef.current.stop();
  //   }

  //   if (streamRef.current) {
  //     streamRef.current.getTracks().forEach((track) => track.stop());
  //   }

  //   if (audioContextRef.current) {
  //     audioContextRef.current.close();
  //   }

  //   clearTimeout(silenceTimerRef.current);

  //   setIsRecording(false);


  // };

  // const setupAudioAnalysis = (stream) => {
  //   audioContextRef.current = new AudioContext();
  //   const source = audioContextRef.current.createMediaStreamSource(stream);

  //   analyserRef.current = audioContextRef.current.createAnalyser();
  //   analyserRef.current.fftSize = 2048;

  //   source.connect(analyserRef.current);

  //   console.log('detectSilence')
  //   detectSilence();


  // };

  // const detectSilence = () => {
  //   const analyser = analyserRef.current;
  //   const dataArray = new Uint8Array(analyser.fftSize);



  //   const checkSilence = () => {
  //     analyser.getByteTimeDomainData(dataArray);

  //     // Normalize and calculate volume
  //     const amplitude = dataArray.reduce((acc, val) => acc + Math.abs(val - 128), 0) / dataArray.length;
  //     const volume = amplitude / 128;

  //     // --- User started speaking ---
  //     if (volume >= SPEECH_THRESHOLD) {
  //       if (!hasSpokenRef.current) {
  //         console.log('User started speaking!');
  //         hasSpokenRef.current = true;
  //       }

  //       // Clear any pending silence timer if speaking again
  //       if (silenceTimerRef.current) {
  //         clearTimeout(silenceTimerRef.current);
  //         silenceTimerRef.current = null;
  //         console.log('Speaking again, canceling silence timer.');
  //       }

  //       // --- User is silent (but only react if they have spoken before) ---
  //     } else if (volume < SILENCE_THRESHOLD && hasSpokenRef.current) {
  //       if (!silenceTimerRef.current) {
  //         silenceTimerRef.current = setTimeout(() => {
  //           console.log('Silence detected, sending audio chunk...');

  //           if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
  //             console.log('requesting data')
  //             mediaRecorderRef.current.requestData(); // This triggers ondataavailable


  //             // Now we handle sending *after* requestData triggers ondataavailable:
  //             // if (audioChunksRef.current.length) {
  //             //   sendAudioToServer(audioChunksRef.current);
  //             //   audioChunksRef.current = [];
  //             // }
  //           }

  //           // Reset for the next round: wait for speaking again
  //           hasSpokenRef.current = false;
  //           silenceTimerRef.current = null;
  //         }, SILENCE_DURATION);
  //       }
  //     }
  //     // else {
  //     //   clearTimeout(silenceTimerRef.current);
  //     //   silenceTimerRef.current = null;
  //     // }

  //     requestAnimationFrame(checkSilence);
  //   };

  //   checkSilence();
  // };

  // const sendAudioToServer = async (audioChunks) => {
  //   console.log('audioChunks.length', audioChunks.length)
  //   if (!audioChunks.length) return;


  //   const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
  //   const formData = new FormData();
  //   formData.append('audio', audioBlob, 'speech.webm');

  //   try {
  //     const response = await fetch(`${import.meta.env.VITE_API_URL}/speechToText`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'audio/webm' // or audio/mpeg (should match your MediaRecorder)
  //       },
  //       body: audioBlob,
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to upload audio');
  //     }

  //     const data = await response.json();
  //     console.log('Transcription received:', data);

  //     setTranscriptions((prev) => [...prev, data]);
  //   } catch (error) {
  //     console.error('Error sending audio:', error);
  //   }
  // };

  // useEffect(() => {
  //   return () => {
  //     handleStopRecording();
  //   };
  // }, []);

  const [isRecording, setIsRecording] = useState(false);
  const [transcriptions, setTranscriptions] = useState([]);

  // Refs for managing audio resources and state
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const hasSpokenRef = useRef(false);

  // Audio detection parameters
  const SPEECH_THRESHOLD = 0.02;
  const SILENCE_THRESHOLD = 0.01;
  const SILENCE_DURATION = 2000;

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsRecording(true);
      setupAudioAnalysis(stream);
    } catch (error) {
      console.error('Microphone access error:', error);
    }
  };

  const handleStopRecording = () => {
    // Cleanup all resources
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    clearTimeout(silenceTimerRef.current);
    setIsRecording(false);
  };

  const setupAudioAnalysis = (stream) => {
    // Set up Web Audio API for volume analysis
    audioContextRef.current = new AudioContext();
    const source = audioContextRef.current.createMediaStreamSource(stream);

    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 2048;
    source.connect(analyserRef.current);

    detectSilence();
  };

  const detectSilence = () => {
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.fftSize);

    const checkSilence = () => {
      analyser.getByteTimeDomainData(dataArray);
      const amplitude = dataArray.reduce((acc, val) => acc + Math.abs(val - 128), 0) / dataArray.length;
      const volume = amplitude / 128;

      // Speech detection logic
      if (volume >= SPEECH_THRESHOLD && !hasSpokenRef.current) {
        console.log('User started speaking!');
        hasSpokenRef.current = true;
        startNewRecording();
      }
      // Silence detection logic
      else if (volume < SILENCE_THRESHOLD && hasSpokenRef.current) {
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            console.log('Silence detected, sending audio chunk...');
            if (mediaRecorderRef.current?.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
            hasSpokenRef.current = false;
            silenceTimerRef.current = null;
          }, SILENCE_DURATION);
        }
      }

      requestAnimationFrame(checkSilence);
    };

    checkSilence();
  };




  const startNewRecording = () => {
    // Initialize fresh recorder for each speech segment
    audioChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'audio/webm; codecs=opus'
    });

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      sendAudioToServer(audioChunksRef.current);
    };

    mediaRecorder.start();
  };

  const sendAudioToServer = async (chunks) => {
    try {
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/speechToText`, {
        method: 'POST',
        body: audioBlob,
        headers: { 'Content-Type': 'audio/webm' }
      });

      if (!response.ok) throw new Error('Transcription failed');

      const data = await response.json();
      setTranscriptions(prev => [...prev, data]);
    } catch (error) {
      console.error('Transcription error:', error);
    }
  };

  // Cleanup on component unmount
  useEffect(() => () => handleStopRecording(), []);

  return (
    <div className="container text-center mt-5">
      <h2>Speech Recorder (Send on Pause)</h2>
      <div className="my-4">
        <button
          className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'} btn-lg`}
          onClick={isRecording ? handleStopRecording : handleStartRecording}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>



      <div className="mt-4 text-start">
        <h4>Transcriptions:</h4>
        <ul className="list-group">
          {transcriptions.map((transcription, idx) => (
            <li key={idx} className="list-group-item">
              {transcription.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SpeechToText;
