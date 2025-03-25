import React, { useState, useRef, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import languages from "../../data/languages.json"; // ✅ Import JSON file
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment'; // Ensure you have moment installed



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


  const [formData, setFormData] = useState({ language: "auto", silenceDuration: 2000 })
  const formDataRef = useRef(formData);

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

      // Handle speech detection (both initial and resumed speech)
      if (volume >= SPEECH_THRESHOLD) {
        if (!hasSpokenRef.current) {
          console.log('User started speaking!');
          hasSpokenRef.current = true;
          startNewRecording();
        } else {
          // Clear silence timer if user resumes speaking
          if (silenceTimerRef.current) {
            console.log('User resumes speaking!');
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        }
      }
      // Handle silence detection
      else if (volume < SILENCE_THRESHOLD && hasSpokenRef.current) {
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            console.log('Silence detected, sending audio chunk...');
            if (mediaRecorderRef.current?.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
            hasSpokenRef.current = false;
            silenceTimerRef.current = null;
          }, formData.silenceDuration || SILENCE_DURATION);
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
      //mimeType: 'audio/webm; codecs=opus'      
    });

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const mimeType = mediaRecorder.mimeType;

      sendAudioToServer(audioChunksRef.current, mimeType);
    };

    mediaRecorder.start();
  };

  const sendAudioToServer = async (chunks, mimeType) => {
    const audioBlob = new Blob(chunks, { type: mimeType });
    const audioUrl = URL.createObjectURL(audioBlob); // Create a URL for playback

    const uuid = uuidv4(); // Generate a unique ID
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');

    // Step 1: Add the entry with ID before sending the request
    setTranscriptions(prev => [...prev, { uuid, timestamp, status: 'pending', audio: { url: audioUrl, mimeType } }]);


    try {

      const response = await fetch(`${import.meta.env.VITE_API_URL}/speechToText?language=${formDataRef.current.language}`, {
        method: 'POST',
        body: audioBlob,
        headers: { 'Content-Type': mimeType }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Transcription failed with status ${response.status}`);
      }

      const data = await response.json();
      //setTranscriptions(prev => [...prev, { ...data, audio: { url: audioUrl, mimeType } }]);
      // Step 2: Update transcription with server response
      setTranscriptions(prev =>
        prev.map(item => (item.uuid === uuid ? { ...item, ...data, status: 'done' } : item))
      );
    } catch (error) {
      console.error('Transcription error:', error);
      //setTranscriptions(prev => [...prev, { error: error.message, audio: { url: audioUrl, mimeType } }]);
      // Step 2 (Error Case): Update transcription with error message
      setTranscriptions(prev =>
        prev.map(item => (item.uuid === uuid ? { ...item, error: error.message, status: 'error' } : item))
      );
    }
  }

  // Cleanup on component unmount
  useEffect(() => () => handleStopRecording(), []);

  // Keep languageRef updated
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  return (
    <div className="container text-center mt-5">
      <h2>Speech Recorder (Send on Pause)</h2>

      <div className="mb-3">
        <label className="form-label">Select Language:</label>
        <select
          className="form-select w-25 mx-auto"
          value={formData.language || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, language: e.target.value || null }))
          }
        >
          <option value="auto">Auto Detect</option>
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Pause Control (milliseconds):</label>
        <select
          className="form-select w-25 mx-auto"
          value={formData.silenceDuration || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, silenceDuration: e.target.value || null }))
          }
        >
          {Array.from({ length: 10 }, (_, i) => (i + 1) * 1000).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>



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
          {[...transcriptions]
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map((transcription, idx) => (
              <li key={idx} className="list-group-item">
                {transcription?.status == 'pending' ? <p>Processing...</p> : <p>{transcription?.text || transcription?.error}</p>}
                {transcription.audio && (<>
                  <audio controls>
                    <source src={transcription.audio.url} type={transcription.audio.mimeType} />
                    Your browser does not support the audio element.
                  </audio>
                  <p>MimeType: {transcription.audio.mimeType}</p>
                </>
                )}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default SpeechToText;
