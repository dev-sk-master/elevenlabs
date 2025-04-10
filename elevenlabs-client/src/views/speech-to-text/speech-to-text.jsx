import React, { useState, useRef, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import languages from "../../data/languages.json"; // ✅ Import JSON file
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment'; // Ensure you have moment installed
import { isMobile } from 'react-device-detect';
import { io } from 'socket.io-client';
import isEqual from 'lodash/isEqual'; // npm install lodash
import usePrevious from '../../hooks/usePrevious';


// Socket connection and room management
const socket = io(`${import.meta.env.VITE_SOCKET_URL}`, {
  ///transports: ["websocket"], // force WebSocket (optional)
  //withCredentials: true,     // if your server requires it
});
//const roomId = uuidv4(); // Generate a unique room ID on page load

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

  const [room, setRoom] = useState(null);
  const [formData, setFormData] = useState({ language: "auto", silenceDuration: 1000, chunksDuration: 5000, translateLanguage: "en", userSetDuration: 1000 })
  const formDataRef = useRef(formData);

  // Keep languageRef updated
  useEffect(() => {
    console.log('formData', formData)
    formDataRef.current = formData;
  }, [formData]);

  // Socket connection and room management
  useEffect(() => {
    const hash = window.location.hash.replace('#', '').trim();

    // Connect to socket server
    socket.connect();

    // Handle connection events
    socket.on('connect', () => {
      console.log('Connected to socket server');
      // Create room after successful connection
      //socket.emit('create-room', roomId);
      // if (hash) {
      //   setTimeout(() => {
      //     setRoomFormData((prev) => ({ ...prev, roomId: hash }));
      //     setTimeout(() => {
      //       handleJoinRoom()
      //     }, 1000)
      //   }, 1000)
      // }

      if (hash) {
        // Set roomId from URL hash, then attempt to join the room
        setRoomFormData((prev) => {
          const updated = { ...prev, roomId: hash };
          // Call join immediately after setting roomFormData
          // Assumes handleJoinRoom uses updated roomFormData
          setTimeout(() => {
            handleJoinRoom(hash);
          }, 300);
          return updated;
        });
      }

    });

    // Handle room creation
    // socket.on('room-created', ({ roomId }) => {
    //   console.log(`Room ${roomId} created successfully`);
    //   // Join room after creation
    //   //socket.emit('join-room', roomId);
    // });

    // Handle user join
    /* socket.on('user-joined', ({ userId, roomId }) => {
      console.log(`User ${userId} joined room ${roomId}`);
    }); */

    socket.on('transcriptions', ({ senderId, roomId, transcriptions }) => {
      console.log(`📨 Transcriptions from ${senderId} for room ${roomId}:`, transcriptions);

      setTranscriptions(prev => {
        const map = new Map(prev.map(t => [t.uuid, t]));

        for (const t of transcriptions) {
          if (map.has(t.uuid)) {
            const existing = map.get(t.uuid);
            map.set(t.uuid, {
              ...existing,
              ...t,
              audio: {
                ...existing.audio,
                ...t.audio
              }
            });
          } else {
            map.set(t.uuid, t);
          }
        }

        return Array.from(map.values());
      });

    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Cleanup on component unmount
    return () => {
      if (room && room.roomId) {
        socket.emit('leave-room', room.roomId);
      }
      socket.disconnect();
    };
  }, []);

  const [isRecording, setIsRecording] = useState(false);
  const [transcriptions, setTranscriptions] = useState([]);

  const transcriptionsRef = useRef(transcriptions);
  const prevTranscriptions = usePrevious(transcriptions);
  useEffect(() => {
    console.log('transcriptions', transcriptions)
    transcriptionsRef.current = transcriptions;

    console.log('previous', prevTranscriptions)
    //avoid reset case
    if (transcriptions.length == 0 && prevTranscriptions && prevTranscriptions.length > 0) {
      return;
    }

    if (prevTranscriptions && Array.isArray(prevTranscriptions)) {
      const prevMap = new Map(prevTranscriptions.map(t => [t.uuid, t]));
      const changedTranscriptions = [];

      for (const current of transcriptions) {
        const prev = prevMap.get(current.uuid);
        if (!prev) {
          // New transcription
          changedTranscriptions.push(current);
        } else if (!isEqual(prev, current)) {
          console.log('Prev:', JSON.stringify(prev, null, 2));
          console.log('Curr:', JSON.stringify(current, null, 2));
          // Updated transcription
          changedTranscriptions.push(current);
        }
      }

      if (changedTranscriptions.length > 0) {
        console.log('🔁 Changes:', changedTranscriptions);
        socket.emit('transcriptions', {
          roomId: room?.roomId,
          transcriptions: changedTranscriptions,
        });
      }
    }


  }, [transcriptions]);

  // Refs for managing audio resources and state
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const hasSpokenRef = useRef(false);
  const chunksTimerRef = useRef(null);
  const recordingRef = useRef(null);

  // Audio detection parameters
  const SPEECH_THRESHOLD = 0.02;
  const SILENCE_THRESHOLD = 0.01;
  const SILENCE_DURATION = 1000;


  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsRecording(true);
      setTranscriptions([]);
      setCombinedAudio(null); // Clear combined audio when starting new recording
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
    clearInterval(chunksTimerRef.current);
    setIsRecording(false);
    combineAudioChunks();
  };

  // Generate combined audio when stopping recording
  const combineAudioChunks = async () => {
    let transcriptions = transcriptionsRef.current;
    //if (transcriptions.length === 0) return;

    try {
      // Get all audio chunks from transcriptions in chronological order
      const sortedTranscriptions = [...transcriptions].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      // Get the mimeType from the first valid transcription
      const mimeType = sortedTranscriptions[0]?.audio?.mimeType;

      // Filter out any transcriptions that don't have chunks yet
      const validTranscriptions = sortedTranscriptions.filter(t => t.audio?.chunks?.length > 0);

      if (validTranscriptions.length === 0) return;

      // Create a new blob from all chunks in order
      const allChunks = validTranscriptions.flatMap(t => t.audio.chunks);

      // Create a new blob with all chunks combined
      const combinedBlob = new Blob(allChunks, { type: mimeType });

      // Create new URL
      const newUrl = URL.createObjectURL(combinedBlob);

      // Set new URL
      setCombinedAudio({ url: newUrl, mimeType });
    } catch (error) {
      console.error('Error combining audio chunks:', error);
    }
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
            console.log('User resumes speaking!', hasSpokenRef.current);
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        }
      }
      // Handle silence detection
      else if (volume < SILENCE_THRESHOLD && hasSpokenRef.current) {
        if (!silenceTimerRef.current) {
          const latestItem = transcriptionsRef.current?.at(-1) ?? null;
          console.log('latestItem', latestItem)

          const userSetDuration = formDataRef.current.userSetDuration || 1000;
          const minDuration = 500;

          const reduction = latestItem?.text ? Math.min(Math.pow(latestItem.text.length, 1.2) * 3, userSetDuration - minDuration) : 0;

          let dynamicDuration = Math.max(userSetDuration - reduction, minDuration);
          dynamicDuration = Math.round(dynamicDuration / 50) * 50;


          console.log('Silence duration timeout set: ', dynamicDuration);
          setFormData((prev) => ({
            ...prev,
            silenceDuration: dynamicDuration // Use the generated value here
          }));
          silenceTimerRef.current = setTimeout(() => {
            console.log('Silence detected, sending audio chunk...');
            if (mediaRecorderRef.current?.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
            hasSpokenRef.current = false;
            silenceTimerRef.current = null;
          }, dynamicDuration);
        }
      }

      requestAnimationFrame(checkSilence);
    };

    checkSilence();
  };


  const startNewRecording = () => {
    const uuid = uuidv4(); // Generate a unique ID
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');

    recordingRef.current = { uuid, timestamp };
    // Initialize fresh recorder for each speech segment
    audioChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      //mimeType: 'audio/webm; codecs=opus'      
    });


    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
        console.log('ondataavilable', audioChunksRef.current.length)
        const mimeType = mediaRecorder.mimeType;
        sendAudioToServer(audioChunksRef.current, mimeType);
      }
    };

    mediaRecorder.onstop = () => {
      // const mimeType = mediaRecorder.mimeType;
      // sendAudioToServer(audioChunksRef.current, mimeType);
      if (chunksTimerRef.current) {
        clearInterval(chunksTimerRef.current)
      }
    };

    mediaRecorder.start();


    // Send audio every 'chunksDuration' milliseconds
    chunksTimerRef.current = setInterval(() => {
      if (mediaRecorder.state === "recording") {
        console.log("Sending chunk...");
        mediaRecorder.requestData();
        //const mimeType = mediaRecorder.mimeType;
        //sendAudioToServer(audioChunksRef.current, mimeType);
      }
    }, formDataRef.current.chunksDuration);

  };

  const sendAudioToServer = async (chunks, mimeType) => {
    const audioBlob = new Blob(chunks, { type: mimeType });
    const audioUrl = URL.createObjectURL(audioBlob); // Create a URL for playback


    // const uuid = uuidv4(); // Generate a unique ID
    // const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');

    const { uuid, timestamp } = recordingRef.current;
    // console.log(uuid, timestamp, audioUrl)

    // Step 1: Add the entry with ID before sending the request
    //setTranscriptions(prev => [...prev, { uuid, timestamp, status: 'pending', audio: { url: audioUrl, mimeType } }]);
    setTranscriptions(prev => {
      const exists = prev.some(item => item.uuid === uuid);
      return exists
        ? prev.map(item => (item.uuid === uuid ? { ...item, status: 'reprocessing', audio: { ...item.audio, url: audioUrl, mimeType, chunks } } : item))
        : [...prev, { uuid, timestamp, status: 'processing', audio: { url: audioUrl, mimeType, chunks } }];
    });


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
        prev.map(item => (item.uuid === uuid ? { ...item, ...data, status: 'completed' } : item))
      );

      if (data.text != "") {
        await translateData(uuid, data)
      }
    } catch (error) {
      console.error('Transcription error:', error);
     
      //setTranscriptions(prev => [...prev, { error: error.message, audio: { url: audioUrl, mimeType } }]);
      // Step 2 (Error Case): Update transcription with error message
      setTranscriptions(prev =>
        prev.map(item => (item.uuid === uuid ? { ...item, error: error.message, status: 'failed' } : item))
      );
    }

  }

  const translateData = async (uuid, data) => {

    try {
      setTranscriptions(prev =>
        prev.map(item =>
          item.uuid === uuid
            ? {
              ...item,
              translate: {
                ...(item.translate || {}), // Ensure translate exists
                status: item.translate ? 'reprocessing' : 'processing'
              }
            }
            : item
        )
      );

      const response = await fetch(`${import.meta.env.VITE_API_URL}/translate`, {
        method: 'POST',
        body: JSON.stringify({
          text: data?.text || "",
          target: formDataRef.current.translateLanguage
        }),
        headers: { 'Content-Type': "application/json" }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Translate failed with status ${response.status}`);
      }

      const responseData = await response.json();

      setTranscriptions(prev =>
        prev.map(item => (item.uuid === uuid ? { ...item, translate: { ...item.translate, ...responseData, status: 'completed' } } : item))
      );
    } catch (error) {
      console.error('Translate error:', error);

      //setTranscriptions(prev => [...prev, { error: error.message, audio: { url: audioUrl, mimeType } }]);
      // Step 2 (Error Case): Update transcription with error message
      setTranscriptions(prev =>
        prev.map(item => (item.uuid === uuid ? { ...item, translate: { ...item.translate, error: error.message, status: 'failed' } } : item))
      );
    }

  }

  // Cleanup on component unmount
  useEffect(() => () => handleStopRecording(), []);

  const cleanHtml = (html) => {
    if (!html) return ""; // Return blank if html is undefined or falsy
    const doc = new DOMParser().parseFromString(html, "text/html");
    let decodedHtml = doc.documentElement.textContent;
    //return decodedHtml.replace(/[\[\]{}()<>\s]+/g, " ").trim(); // Remove brackets
    return decodedHtml.replace(/\s*\([^)]*\)\s*/g, " ").trim();// Remove contents from brackets
  };


  const [hoveredIndex, setHoveredIndex] = useState(null); // null means nothing is hovered
  const [combinedAudio, setCombinedAudio] = useState(null);

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };


  // Sort transcriptions once outside the map if possible, for slight optimization
  const listTranscriptions = [...transcriptions].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  const scrollRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // Tolerance for pixel rounding
    setAutoScroll(isAtBottom);
    setShowScrollButtons(scrollHeight > clientHeight); // Show buttons only if content is scrollable
  };

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      setAutoScroll(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setAutoScroll(true);
    }
  };

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [listTranscriptions, autoScroll]);

  const [activeColumn, setActiveColumn] = useState(0); // 0 = transcription, 1 = translation

  const toggleColumn = (direction) => {
    setActiveColumn((prev) => {
      if (direction === 'next') return prev === 0 ? 1 : 0;
      if (direction === 'prev') return prev === 1 ? 0 : 1;
      return prev;
    });
  };

  const [roomFormData, setRoomFormData] = useState({ roomId: null });

  const handleJoinRoom = (roomId) => {
    socket.emit('join-room', roomId || roomFormData.roomId);
    setRoom({ roomId: roomFormData.roomId, role: 'user' })
  }

  const handleCreateRoom = () => {
    let roomId = uuidv4();
    socket.emit('create-room', roomId);
    setRoom({ roomId: roomId, role: 'owner' })
    window.location.hash = roomId;
  }


  if (!room) {
    return (
      <div className="container text-center mt-5">
        <h2>Create or Join a Room</h2>
        <div className="row justify-content-center mt-4">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Enter Room ID"
              value={roomFormData.roomId}
              onChange={(e) => {
                setRoomFormData((prev) => ({
                  ...prev,
                  roomId: e.target.value,
                }));
              }}
            />
            <div className="d-grid gap-2">
              <button
                className="btn btn-primary"
                onClick={() => handleJoinRoom()}
              // disabled={!roomId.trim()}
              >
                Join Room
              </button>

              OR

              <button
                className="btn btn-success"
                onClick={() => handleCreateRoom()}
              // disabled={!roomId.trim()}
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }



  return (
    <div className="container text-center mt-5">
      <h2>Speech Recorder (Send on Pause)</h2>


      {room && room.role == 'owner' && (<>
        <div className="row">
          <div className="col-md-4">
            <div className="mb-3">
              <label className="form-label">Select Language:</label>
              <select
                className="form-select w-50 mx-auto"
                value={formData.language || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, language: e.target.value || null }))
                }
              >
                <option value="auto">Auto Detect</option>
                {languages
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
              </select>
            </div>

          </div>
          <div className="col-md-4">
            <div className="mb-3">
              <label className="form-label">Pause Control (milliseconds):</label>
              <input
                type="number"
                className="form-control w-50 mx-auto"
                value={formData.silenceDuration || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, silenceDuration: Number(e.target.value) || null, userSetDuration: Number(e.target.value) || null }))
                }
                min="0"
              />

            </div>
          </div>
          <div className="col-md-4">
            <div className="mb-3">
              <label className="form-label">Chunks Control (milliseconds):</label>
              <input
                type="number"
                className="form-control w-50 mx-auto"
                value={formData.chunksDuration || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, chunksDuration: Number(e.target.value) || null }))
                }
                min="0"
              />
            </div>
          </div>
        </div>


        <div className="my-4">
          <button
            className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'} btn-lg`}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>


      </>)}



      <div className="mt-4 text-start">
        <div className="row align-items-center mb-2">
          <div className="col-md-6">
            <h4>Transcriptions:</h4>
          </div>

          {room && room.role == 'owner' && (<>
            {/* Right Column: Translate Language Dropdown */}
            <div className="col-md-6 text-md-end">
              <label className="form-label d-block">Translate Language:</label>
              <select
                className="form-select w-50 d-inline-block"
                value={formData.translateLanguage || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, translateLanguage: e.target.value || null }))
                }
              >
                {languages
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
              </select>
            </div></>)}

        </div>


        {listTranscriptions.length > 0 && combinedAudio && (
          <div className="mb-4">
            <h6>Full Audio</h6>
            <audio controls className="w-100" key={combinedAudio?.url}>
              <source src={combinedAudio?.url} />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {listTranscriptions.length > 0 ? (
          <>
            {/* Toggle Buttons (Only show on mobile) */}
            {isMobile && (
              <div className="d-md-none d-flex justify-content-between mb-2">
                <div>
                  {activeColumn === 1 && (
                    <button
                      onClick={() => toggleColumn('prev')}
                      className="btn btn-sm btn-outline-primary"
                    >
                      ← Transcription
                    </button>
                  )}
                </div>

                <div>
                  {activeColumn === 0 && (
                    <button
                      onClick={() => toggleColumn('next')}
                      className="btn btn-sm btn-outline-primary"
                    >
                      Translation →
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className='card h-100 mb-5'>
              <div
                className='card-body overflow-auto position-relative'
                ref={scrollRef}
                onScroll={handleScroll}
                style={{ maxHeight: '400px' }} // You can adjust this max height
              >
                {/* Floating scroll buttons */}
                {showScrollButtons && (
                  <div className="position-sticky d-flex flex-column gap-2"
                    style={{
                      top: '90%',
                      transform: 'translateY(-50%)',
                      right: '5px',
                      float: 'right',
                      zIndex: 1000
                    }}>
                    {scrollRef.current && scrollRef.current.scrollTop + scrollRef.current.clientHeight < scrollRef.current.scrollHeight - 10 ? (
                      <button
                        className="btn btn-sm btn-link rounded-pill shadow-sm"
                        onClick={scrollToBottom}
                        title="Scroll to bottom"
                      >
                        <i class="bi bi-arrow-down"></i>
                      </button>
                    ) : scrollRef.current?.scrollTop > 0 && (
                    <>
                      {/* // <button
                      //   className="btn btn-primary shadow-sm"
                      //   onClick={scrollToTop}
                      //   title="Scroll to top"
                      // >
                      //   Scroll to top
                      // </button> */}
                      </>
                    )}
                  </div>
                )}
                <div className='row'>
                  {(activeColumn === 0 || !isMobile) && (
                    <div className="col-md-6 mb-2">

                      {listTranscriptions
                        .map((transcription, idx) => (
                          <div
                            key={`transcription-${idx}`}
                            onMouseEnter={() => handleMouseEnter(idx)}
                            onMouseLeave={handleMouseLeave}
                            className={`mb-2 ${hoveredIndex === idx ? 'bg-warning px-1' : ''}`}
                          >
                            {transcription.status === 'processing' ? (
                              'Processing...'
                            ) : (
                              <>
                                <div
                                  contenteditable={room.role == 'owner' && !transcription?.error ? "true" : "false"}
                                  onBlur={(e) => {
                                    if (room.role === 'owner' && !transcription?.error) {
                                      const newText = e.target.textContent;
                                      setTranscriptions(prev =>
                                        prev.map(item =>
                                          item.uuid === transcription.uuid
                                            ? { ...item, text: newText }
                                            : item
                                        )
                                      );
                                    }
                                  }}
                                >
                                  {cleanHtml(transcription?.text || transcription?.error)}
                                </div>
                                {transcription?.status === 'reprocessing' && <span> ....Reprocessing...</span>}
                                {transcription?.audio?.url && hoveredIndex === idx && (
                                  <div className="mt-2">
                                    <audio controls className="w-100">
                                      <source src={transcription.audio.url} type={transcription.audio.mimeType} />
                                      Your browser does not support the audio element.
                                    </audio>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}

                    </div>
                  )}

                  {(activeColumn === 1 || !isMobile) && (
                    <div className="col-md-6 mb-2">

                      {listTranscriptions
                        .map((transcription, idx) => (
                          <div
                            key={`translation-${idx}`}
                            onMouseEnter={() => handleMouseEnter(idx)}
                            onMouseLeave={handleMouseLeave}
                            className={`mb-2 ${hoveredIndex === idx ? 'bg-warning px-1' : ''}`}
                          >
                            {transcription?.translate?.status === 'processing' ? (
                              'Processing...'
                            ) : (
                              <>
                                <div
                                  contenteditable={room.role == 'owner' && !transcription?.translate?.error ? "true" : "false"}
                                  onBlur={(e) => {
                                    if (room.role === 'owner' && !transcription?.translate?.error) {
                                      const newText = e.target.textContent;
                                      setTranscriptions(prev =>
                                        prev.map(item =>
                                          item.uuid === transcription.uuid
                                            ? { ...item, translate: { ...item.translate, text: newText } }
                                            : item
                                        )
                                      );
                                    }
                                  }}
                                >
                                  {cleanHtml(transcription?.translate?.text || transcription?.translate?.error)}
                                </div>
                                {transcription?.translate?.status === 'reprocessing' && <span> ....Reprocessing...</span>}
                              </>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* <h6>Debug</h6>
        <ul className="list-group">
          {[...transcriptions]
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map((transcription, idx) => (
              <li key={idx} className="list-group-item">
                <div className='row'>
                  <div className="col-md-6">
                    {transcription?.status === 'processing' ? (
                      <p>Processing...</p>
                    ) : (
                      <p>
                        {cleanHtml(transcription?.text || transcription?.error)}
                        {transcription?.status === 'reprocessing' && <span> ....Reprocessing...</span>}
                      </p>
                    )}


                    {transcription.audio && (<>
                      <audio controls key={transcription.audio.url}>
                        <source src={transcription.audio.url} type={transcription.audio.mimeType} />
                        Your browser does not support the audio element.
                      </audio>
                      <p>MimeType: {transcription.audio.mimeType} </p>
                    </>
                    )}
                  </div>
                  <div className="col-md-6">
                    {transcription?.translate?.status === 'processing' ? (
                      <p>Processing...</p>
                    ) : (
                      <p>
                        {cleanHtml(transcription?.translate?.text || transcription?.translate?.error)}
                        {transcription?.translate?.status === 'reprocessing' && <span> ....Reprocessing...</span>}
                      </p>
                    )}

                  </div>
                </div>
              </li>
            ))}
        </ul> */}
      </div>
    </div>
  );
};

export default SpeechToText;
