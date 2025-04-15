import React, { useState, useRef, useEffect, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import languages from "../../data/languages.json";
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { isMobile } from 'react-device-detect';
import { io } from 'socket.io-client';
import isEqual from 'lodash/isEqual';
import usePrevious from '../../hooks/usePrevious';
import ReactAudioPlayer from 'react-audio-player';

// Socket connection
const socket = io(`${import.meta.env.VITE_SOCKET_URL}`, {
  autoConnect: false
});

const SpeechToText = () => {
  // --- State ---
  const [room, setRoom] = useState(null);
  const [formData, setFormData] = useState({
    userId: null,
    language: "auto",
    silenceDuration: 1000,
    chunksDuration: 5000,
    translateLanguage: "en",
    userSetDuration: 1000,
    moderation: false,
    disableSharing: false
  });
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptions, setTranscriptions] = useState([]);
  const [fullRecordingData, setFullRecordingData] = useState({
    blob: null, mimeType: null, url: null, key: null
  });
  const [showSettings, setShowSettings] = useState(false);
  const [roomFormData, setRoomFormData] = useState({ roomId: '' });
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [activeColumn, setActiveColumn] = useState(1);

  // --- Refs ---
  const formDataRef = useRef(formData);
  const transcriptionsRef = useRef(transcriptions);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const hasSpokenRef = useRef(false);
  const chunksTimerRef = useRef(null);
  const recordingRef = useRef(null);
  const scrollRef = useRef(null);
  const isRecordingRef = useRef(isRecording); // Ref synced via useEffect

  const fullMediaRecorderRef = useRef(null);
  const fullAudioChunksRef = useRef([]);
  const fullAudioMimeTypeRef = useRef(null); // To store the mimeType used
  // --- Constants ---
  const SPEECH_THRESHOLD = 0.05;
  const SILENCE_THRESHOLD = 0.01;

  // --- Hooks ---
  const prevTranscriptions = usePrevious(transcriptions);

  // Load formData from sessionStorage on component mount
  useEffect(() => {
    // Load saved form data on initial mount
    const savedFormData = sessionStorage.getItem('speechToTextFormData');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(prev => ({ ...prev, ...parsedData, userId: parsedData.userId || uuidv4() }));
        // formDataRef is updated via its own useEffect
      } catch (e) { console.error("Failed to parse saved form data:", e); }
    } else {
      setFormData(prev => ({ ...prev, userId: uuidv4() }));
    }

  }, []);

  // Update Refs when State changes
  useEffect(() => {
    formDataRef.current = formData;
    sessionStorage.setItem('speechToTextFormData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    console.log('transcriptions', transcriptions)
    transcriptionsRef.current = transcriptions;
  }, [transcriptions]);

  // Keep isRecordingRef synced with isRecording state
  useEffect(() => {
    isRecordingRef.current = isRecording;
    // This log confirms the sync happens, but might be *after* the loop starts
    // console.log("useEffect sync: isRecording state updated, ref is now:", isRecordingRef.current);
  }, [isRecording]);

  // --- Socket IO Setup & Room Management ---
  useEffect(() => {
    // ... (socket connection and event handlers - unchanged) ...
    const hash = window.location.hash.replace('#', '').trim();

    if (hash && !socket.connected) {
      console.log("Socket not connected, connecting before joining...");
      socket.connect();
    }

    //socket.connect();

    socket.on('connect', () => {
      console.log('Connected to socket server', socket.id);
      if (hash) {
        setRoomFormData((prev) => {
          const updated = { ...prev, roomId: hash };
          setTimeout(() => handleJoinRoom(hash), 300);
          return updated;
        });
      }
    });

    socket.on('transcriptions', ({ senderId, roomId, transcriptions: receivedTranscriptions }) => {
      //if (socket.id === senderId && formDataRef.current.disableSharing) return;
      //if (socket.id === senderId && room?.role !== 'owner') return;

      console.log(`📨 Transcriptions from ${senderId} for room ${roomId}:`, receivedTranscriptions.length, receivedTranscriptions);

      setTranscriptions(prev => {
        const map = new Map(prev.map(t => [t.uuid, t]));
        for (const t of receivedTranscriptions) {
          const existing = map.get(t.uuid);
          if (existing) {
            map.set(t.uuid, {
              ...existing, ...t,
              audio: { ...(existing.audio || {}), ...(t.audio || {}) },
              translate: { ...(existing.translate || {}), ...(t.translate || {}) },
            });
          } else {
            map.set(t.uuid, t);
          }
        }
        // Sort only once after processing all items
        return Array.from(map.values()).sort((a, b) => moment(a.timestamp, 'YYYY-MM-DD HH:mm:ss.SSS').valueOf() - moment(b.timestamp, 'YYYY-MM-DD HH:mm:ss.SSS').valueOf());
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('created-room', ({ roomId, role }) => {
      console.log(`Created room ${roomId} as ${role}`);
      setRoom({ roomId, role });
      window.location.hash = roomId;
    });

    socket.on('joined-room', ({ roomId, role }) => {
      console.log(`Joined room ${roomId} as ${role}`);
      setRoom({ roomId, role });
    });

    socket.on('room-error', ({ error, roomId }) => {
      alert(`Failed to join room ${roomId}: ${error}`);
    });

    // Cleanup on component unmount
    return () => {
      console.log("Component unmounting, cleaning up...");
      if (room?.roomId) {
        socket.emit('leave-room', room.roomId);
      }
      socket.disconnect();
      // Ensure handleStopRecording is defined when cleanup runs
      if (typeof handleStopRecording === 'function') {
        handleStopRecording(); // Ensure resources are cleaned up
      } else {
        console.warn("handleStopRecording not defined during unmount cleanup.");
      }
    };

  }, []); // Run only once on mount

  // --- Send Transcription Changes (Owner Only) ---
  useEffect(() => {
    // ... (sending logic - unchanged) ...
    if (!room || !room.roomId || room.role !== 'owner' || formDataRef.current.disableSharing) return;
    if (!prevTranscriptions || transcriptions.length === 0 && prevTranscriptions.length === 0) return;
    if (transcriptions.length === 0 && prevTranscriptions && prevTranscriptions.length > 0) return;

    const prevMap = new Map(prevTranscriptions.map(t => [t.uuid, t]));
    const changedTranscriptions = [];

    for (const current of transcriptions) {
      if (current.moderation_status !== 'approved') continue;
      if (current.status !== 'completed') continue;//only send if the transcription is completed
      const prev = prevMap.get(current.uuid);
      if (!prev || !isEqual(prev.text, current.text) || !isEqual(prev.translate?.text, current.translate?.text) || prev.moderation_status !== current.moderation_status) {
        const { /*audio,*/ ...rest } = current;
        const payload = { ...rest };
        changedTranscriptions.push(payload);
      }
    }

    if (changedTranscriptions.length > 0) {
      console.log('🔁 Sending changed transcriptions:', changedTranscriptions.length);
      socket.emit('transcriptions', {
        roomId: room.roomId,
        transcriptions: changedTranscriptions,
      });
    }
  }, [transcriptions, room, prevTranscriptions]);

  function generateFriendlyCode(length = 6) { // Default to 6 for better uniqueness
    // Exclude confusing characters (0, O, 1, l, I)
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      // Use crypto.getRandomValues for better randomness if available in the environment
      // For browsers:
      const randomValue = window.crypto.getRandomValues(new Uint32Array(1))[0];
      result += characters.charAt(randomValue % charactersLength);
      // Fallback for environments without crypto (less secure randomness)
      // result += characters.charAt(Math.floor(Math.random() * charactersLength));

      result = result.toLowerCase();
    }
    return result;
  }

  // --- Audio Recording Logic ---

  const handleStartRecording = async () => {
    console.log("Attempting to start recording...");
    if (isRecordingRef.current) {
      console.warn("Recording is already active.");
      return;
    }
    try {
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log("Microphone access granted.");
      streamRef.current = stream;

      // --- Update state AND ref immediately ---
      setIsRecording(true);
      isRecordingRef.current = true;

      setTranscriptions([]);
      hasSpokenRef.current = false;

      // Reset full recording data
      setFullRecordingData(prevData => {
        if (prevData.url) { URL.revokeObjectURL(prevData.url); }
        return { blob: null, mimeType: null, url: null, key: null };
      });
      fullAudioChunksRef.current = []; // Clear previous full chunks

      // --- Setup Full Audio Recorder ---
      const options = getSupportedMimeTypeOptions();
      if (options === null) {
        throw new Error('No supported audio format found for recording.');
      }
      // Determine the actual mimeType being used
      let effectiveMimeType = 'application/octet-stream'; // Fallback
      if (options?.mimeType) {
        effectiveMimeType = options.mimeType;
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        effectiveMimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        effectiveMimeType = 'audio/webm';
      }
      fullAudioMimeTypeRef.current = effectiveMimeType; // Store for later use
      console.log(`Setting up full recorder with type: ${effectiveMimeType}`);

      try {
        const fullRecorder = new MediaRecorder(stream, options);
        fullMediaRecorderRef.current = fullRecorder;

        fullRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            // console.log(`Full recorder data: ${event.data.size} bytes`);
            fullAudioChunksRef.current.push(event.data);
          }
        };

        fullRecorder.onstop = () => {
          console.log(`Full recorder stopped. Processing ${fullAudioChunksRef.current.length} chunks.`);
          if (fullAudioChunksRef.current.length > 0 && fullAudioMimeTypeRef.current) {
            const combinedBlob = new Blob(fullAudioChunksRef.current, { type: fullAudioMimeTypeRef.current });
            const newUrl = URL.createObjectURL(combinedBlob);
            const uniqueKey = `${Date.now()}-${combinedBlob.size}`;
            console.log(`Full recording generated. Size: ${combinedBlob.size}, Type: ${fullAudioMimeTypeRef.current}`);
            setFullRecordingData({
              blob: combinedBlob,
              mimeType: fullAudioMimeTypeRef.current,
              url: newUrl,
              key: uniqueKey
            });
            // Don't clear fullAudioChunksRef here, might be needed if stop fails? Clear in start instead.
          } else {
            console.warn("Full recorder stopped but no chunks or mimeType available.");
            setFullRecordingData({ blob: null, mimeType: null, url: null, key: null });
          }
          // Clean up the ref after stopping
          if (fullMediaRecorderRef.current === fullRecorder) {
            fullMediaRecorderRef.current = null;
          }
        };

        fullRecorder.onerror = (event) => {
          console.error("Full MediaRecorder error:", event.error);
          // Attempt to process any chunks collected so far? Maybe not reliable.
          setFullRecordingData({ blob: null, mimeType: null, url: null, key: null });
          if (fullMediaRecorderRef.current === fullRecorder) {
            fullMediaRecorderRef.current = null;
          }
        };

        // Start the full recorder. No timeslice = dataavailable only on stop.
        fullRecorder.start();
        console.log("Full duration recorder started.");

      } catch (err) {
        console.error("Error creating full MediaRecorder:", err);
        alert(`Failed to start full recording: ${err.message}`);
        // Clean up if full recorder setup failed
        if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
        setIsRecording(false);
        isRecordingRef.current = false;
        return; // Stop further execution
      }

      // --- Setup Audio Analysis for Chunks (as before) ---
      console.log("Setting up audio analysis for transcription chunks...");
      setupAudioAnalysis(stream);

    } catch (error) {
      console.error('Microphone access or recorder setup error:', error);
      alert(`Could not start recording: ${error.message}`);
      // Ensure state/ref consistency on error
      if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
      if (fullMediaRecorderRef.current?.state === 'recording') { fullMediaRecorderRef.current.stop(); /* onstop handles cleanup */ }
      else { fullMediaRecorderRef.current = null; }
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  // Use useCallback as it's used in useEffect cleanup
  const handleStopRecording = useCallback(() => {
    console.log("Attempting to stop recording. Current isRecordingRef:", isRecordingRef.current);
    // Check ref first for most up-to-date status
    if (!isRecordingRef.current && !mediaRecorderRef.current && !streamRef.current && !audioContextRef.current) {
      console.log("Stop recording called, but nothing seems active. Aborting cleanup.");
      // Ensure UI state is correct if somehow out of sync
      if (isRecording) setIsRecording(false); // Ensure state matches reality if needed
      return;
    }

    // --- Stop Full Recorder First ---
    let fullRecorderNeedsStopping = fullMediaRecorderRef.current?.state === 'recording';
    console.log("Full recorder needs stopping:", fullRecorderNeedsStopping);
    if (fullRecorderNeedsStopping) {
      try {
        console.log("Calling fullMediaRecorder.stop()...");
        fullMediaRecorderRef.current.stop(); // Its onstop handler will generate the final blob/URL
      } catch (e) {
        console.error("Error explicitly stopping Full MediaRecorder:", e);
        if (fullMediaRecorderRef.current) fullMediaRecorderRef.current = null; // Force cleanup ref
        setFullRecordingData({ blob: null, mimeType: null, url: null, key: null }); // Reset data on error
      }
    } else {
      console.log('Full MediaRecorder was not recording or already stopped.');
      if (fullMediaRecorderRef.current) fullMediaRecorderRef.current = null; // Ensure ref is cleared if stopped prematurely
    }


    // --- Stop Chunk Recorder (if active) ---
    let chunkRecorderNeedsStopping = mediaRecorderRef.current?.state === 'recording';
    console.log("Chunk recorder needs stopping:", chunkRecorderNeedsStopping);
    if (chunkRecorderNeedsStopping) {
      // Define onstop locally if needed, or rely on the one in startNewRecordingSegment
      mediaRecorderRef.current.onstop = () => {
        console.log('Chunk MediaRecorder stopped successfully (onstop event).');
        // If last segment had chunks, ensure they are sent (already handled in startNewRecordingSegment's onstop)
        // sendAudioToServer([...audioChunksRef.current], /* need mimeType */); // Might be redundant
        if (chunksTimerRef.current) { clearInterval(chunksTimerRef.current); chunksTimerRef.current = null; }
        mediaRecorderRef.current = null; // Clear ref
      };
      mediaRecorderRef.current.onerror = (event) => {
        console.error("Chunk MediaRecorder error during stop:", event.error);
        if (chunksTimerRef.current) { clearInterval(chunksTimerRef.current); chunksTimerRef.current = null; }
        mediaRecorderRef.current = null; // Clear ref
      };
      try {
        console.log("Calling chunk mediaRecorder.stop()...");
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Error explicitly stopping chunk MediaRecorder:", e);
        if (chunksTimerRef.current) { clearInterval(chunksTimerRef.current); chunksTimerRef.current = null; }
        mediaRecorderRef.current = null; // Force cleanup ref
      }
    } else {
      console.log('Chunk MediaRecorder was not recording or already stopped.');
      if (chunksTimerRef.current) { clearInterval(chunksTimerRef.current); chunksTimerRef.current = null; } // Clear timer anyway
      mediaRecorderRef.current = null; // Ensure ref is clear
    }

    // --- General Cleanup ---
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      console.log("MediaStream tracks stopped.");
    } else { console.log("No active MediaStream to stop."); }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().then(() => { console.log("AudioContext closed."); })
        .catch(e => console.warn("Error closing AudioContext:", e));
      audioContextRef.current = null;
      analyserRef.current = null;
    } else { console.log("No active AudioContext to close."); }

    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
    hasSpokenRef.current = false;

    // --- SOLUTION: Update state AND ref immediately on stop ---
    console.log("Setting isRecording state and ref to false.");
    setIsRecording(false);
    isRecordingRef.current = false; // <-- Set ref manually

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencies: combineAudioChunks (add if it uses state directly, otherwise ref is fine)


  const setupAudioAnalysis = (stream) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        console.log("Creating new AudioContext...");
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        console.log("Resuming suspended AudioContext...");
        audioContextRef.current.resume().catch(e => console.error("Error resuming AudioContext", e));
      }

      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
      analyserRef.current.smoothingTimeConstant = 0.85;
      source.connect(analyserRef.current);
      console.log("Analyser connected.");

      detectSilenceLoop();

    } catch (error) {
      console.error('Error setting up audio analysis:', error);
      alert(`Failed to setup audio analysis: ${error.message}`);
      handleStopRecording();
    }
  };

  // --- Main loop checking for silence using requestAnimationFrame ---
  const detectSilenceLoop = () => {
    // Initial log now happens *after* ref is manually set in handleStartRecording
    console.log('Starting detectSilenceLoop. isRecordingRef is now:', isRecordingRef.current);

    if (!analyserRef.current) {
      console.warn("detectSilenceLoop called without analyser. Stopping.");
      return;
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationFrameId; // To potentially cancel if needed, though returning is usually enough

    const check = () => {
      // *** Check the ref inside the loop ***
      if (!analyserRef.current || !isRecordingRef.current) {
        console.log('Stopping detectSilenceLoop check. Analyser:', !!analyserRef.current, 'Recording:', isRecordingRef.current);
        // cancelAnimationFrame(animationFrameId); // Optional: Explicitly cancel
        return; // Stop the loop
      }

      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) { sum += dataArray[i]; }
      let average = sum / bufferLength;
      let volume = average / 128.0;

      console.log('volume', volume, SPEECH_THRESHOLD, SILENCE_THRESHOLD, hasSpokenRef.current)

      // --- Speech Detected ---
      if (volume >= SPEECH_THRESHOLD) {
        if (!hasSpokenRef.current) {
          console.log('User started speaking! (from detectSilenceLoop)');
          hasSpokenRef.current = true;
          startNewRecordingSegment(); // Start segment recorder
        }
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }
      // --- Silence Detected ---
      else if (volume < SILENCE_THRESHOLD && hasSpokenRef.current) {
        console.log('inside Silence Detected', silenceTimerRef.current)
        if (!silenceTimerRef.current) {
          // ... (dynamic duration calculation - unchanged) ...
          const latestItem = transcriptionsRef.current?.at(-1);
          const userSetDuration = formDataRef.current.userSetDuration || 1000;
          const minDuration = 500;
          const reduction = latestItem?.text ? Math.min(Math.pow(latestItem.text.length, 1.1) * 5, userSetDuration - minDuration) : 0;
          let dynamicDuration = Math.max(userSetDuration - reduction, minDuration);
          dynamicDuration = Math.round(dynamicDuration / 50) * 50;

          console.log(`Silence detected. Setting timeout: ${dynamicDuration}ms (from detectSilenceLoop)`);
          setFormData((prev) => ({
            ...prev,
            silenceDuration: dynamicDuration // Use the generated value here
          }));
          silenceTimerRef.current = setTimeout(() => {
            console.log('Silence duration exceeded, stopping current segment... (from detectSilenceLoop)');
            if (mediaRecorderRef.current?.state === 'recording') {
              mediaRecorderRef.current.stop(); // This triggers onstop
            } else {
              console.warn("Silence timeout: Recorder wasn't running or already stopped.");
            }
            hasSpokenRef.current = false;
            silenceTimerRef.current = null;
          }, dynamicDuration);
        }
      }

      // Continue the loop ONLY if still recording (checked at the top)
      animationFrameId = requestAnimationFrame(check);
    };

    // Start the first check
    animationFrameId = requestAnimationFrame(check);
    console.log("detectSilenceLoop initial check scheduled.");
  };


  const startNewRecordingSegment = () => {
    // ... (logic for starting a MediaRecorder segment - largely unchanged) ...
    // Ensure checks use isRecordingRef.current if needed
    if (!streamRef.current || mediaRecorderRef.current?.state === 'recording' || !isRecordingRef.current) {
      console.warn("Cannot start new segment: No stream, already recording, or isRecordingRef is false.", { hasStream: !!streamRef.current, recorderState: mediaRecorderRef.current?.state, isRecording: isRecordingRef.current });
      return;
    }
    console.log("Starting new recording segment...");

    const uuid = uuidv4();
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    recordingRef.current = { uuid, timestamp };
    audioChunksRef.current = [];

    const options = getSupportedMimeTypeOptions();
    // Allow undefined (browser default) but handle null (nothing supported)
    if (options === null) {
      console.error('No supported MIME type found for MediaRecorder.');
      alert('Your browser does not support common audio recording formats.');
      handleStopRecording(); // Stop overall recording
      return;
    }
    // Determine the actual mimeType being used (could be browser default)
    let mimeType = 'application/octet-stream'; // Fallback
    if (options?.mimeType) {
      mimeType = options.mimeType;
    } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      mimeType = 'audio/webm';
    }
    console.log(`Attempting to start segment recorder with options:`, options, `Effective mimeType: ${mimeType}`);


    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, options); // Pass options object or undefined
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`Chunk received: ${event.data.size} bytes, type: ${event.data.type || mimeType}`);
          audioChunksRef.current.push(event.data);
          //const currentUuid = recordingRef.current?.uuid;
          //if (currentUuid) {
          // setTranscriptions(prev =>
          //   prev.map(item =>
          //     item.uuid === currentUuid
          //       ? { ...item, audio: { ...(item.audio || {}), chunks: [...audioChunksRef.current], mimeType: mimeType } } // Store effective mimeType
          //       : item
          //   )
          // );
          sendAudioToServer(audioChunksRef.current, mimeType);
          //}
        }
      };

      mediaRecorder.onstop = () => {
        const segmentUuid = recordingRef.current?.uuid;
        console.log(`Segment ${segmentUuid} stopped. Final chunks: ${audioChunksRef.current.length}`);
        // if (audioChunksRef.current.length > 0) {
        //   sendAudioToServer([...audioChunksRef.current], mimeType);
        // }
        if (chunksTimerRef.current) { clearInterval(chunksTimerRef.current); chunksTimerRef.current = null; }
        if (mediaRecorderRef.current === mediaRecorder) { mediaRecorderRef.current = null; }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder segment error:", event.error);
        const segmentUuid = recordingRef.current?.uuid;
        if (audioChunksRef.current.length > 0) { sendAudioToServer([...audioChunksRef.current], mimeType); }
        if (chunksTimerRef.current) { clearInterval(chunksTimerRef.current); chunksTimerRef.current = null; }
        if (mediaRecorderRef.current === mediaRecorder) { mediaRecorderRef.current = null; }
        hasSpokenRef.current = false;
        if (segmentUuid) { setTranscriptions(prev => prev.map(item => item.uuid === segmentUuid ? { ...item, status: 'failed', error: `Recorder error: ${event.error.name}` } : item)); }
      };

      mediaRecorder.start();
      console.log(`Segment ${uuid} started recording.`);

      setTranscriptions(prev => {
        if (prev.some(item => item.uuid === uuid)) return prev;
        return [...prev, {
          uuid, timestamp, status: 'processing', text: null,
          audio: { mimeType: mimeType, chunks: [] },
          moderation_status: formDataRef.current.moderation ? 'pending' : 'approved'
        }];
      });

      if (formDataRef.current.chunksDuration > 0) {
        if (chunksTimerRef.current) clearInterval(chunksTimerRef.current);
        chunksTimerRef.current = setInterval(() => {
          if (mediaRecorder?.state === "recording") { // Check specific instance
            //  console.log(`Requesting data for segment ${recordingRef.current?.uuid}...`);
            try { mediaRecorder.requestData(); } catch (e) { console.error("Error requesting data:", e) }
          } else {
            //  console.log("Chunk interval: Recorder no longer recording, clearing interval.");
            if (chunksTimerRef.current) clearInterval(chunksTimerRef.current);
            chunksTimerRef.current = null;
          }
        }, formDataRef.current.chunksDuration);
      }

    } catch (err) {
      console.error("Error creating MediaRecorder for segment:", err);
      alert(`Failed to start recording segment: ${err.message}`);
      if (chunksTimerRef.current) clearInterval(chunksTimerRef.current); chunksTimerRef.current = null;
      // Check instance before clearing ref
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream === streamRef.current) { mediaRecorderRef.current = null; }
      hasSpokenRef.current = false;
      // Maybe stop fully?
      // handleStopRecording();
    }
  };

  // const sendAudioToServer = async (chunks, mimeType) => {
  //   // ... (sending logic - unchanged) ...
  //   if (!chunks || chunks.length === 0) { console.warn("sendAudioToServer: empty chunks."); return; }
  //   if (!recordingRef.current) { console.error("sendAudioToServer: recordingRef is missing."); return; }

  //   const { uuid } = recordingRef.current;
  //   const audioBlob = new Blob(chunks, { type: mimeType });
  //   console.log(`Sending audio for segment ${uuid}, Size: ${audioBlob.size}, Type: ${mimeType}`);

  //   setTranscriptions(prev =>
  //     prev.map(item => (item.uuid === uuid ? { ...item, status: ['completed', 'failed'].includes(item.status) ? 'reprocessing' : 'processing', error: null } : item))
  //   );

  //   try {
  //     const apiUrl = `${import.meta.env.VITE_API_URL}/speechToText?language=${formDataRef.current.language}`;
  //     const response = await fetch(apiUrl, { method: 'POST', body: audioBlob, headers: { 'Content-Type': mimeType } });

  //     if (!response.ok) {
  //       let errorMsg = `Transcription failed (${response.status})`;
  //       try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch { /* Ignore */ }
  //       throw new Error(errorMsg);
  //     }

  //     const data = await response.json();
  //     console.log(`Transcription received for ${uuid}: "${data.text}"`);
  //     setTranscriptions(prev =>
  //       prev.map(item => (item.uuid === uuid ? { ...item, ...data, status: 'completed' } : item))
  //     );

  //     if (data.text && formDataRef.current.translateLanguage) {
  //       translateData(uuid, data.text);
  //     }

  //   } catch (error) {
  //     console.error(`Transcription error for ${uuid}:`, error);
  //     setTranscriptions(prev =>
  //       prev.map(item => (item.uuid === uuid ? { ...item, error: error.message, status: 'failed' } : item))
  //     );
  //   }
  // };

  // const translateData = async (uuid, textToTranslate) => {
  //   // ... (translation logic - unchanged) ...
  //   if (!textToTranslate || !formDataRef.current.translateLanguage) { return; }
  //   console.log(`Translating for ${uuid} to ${formDataRef.current.translateLanguage}`);

  //   setTranscriptions(prev =>
  //     prev.map(item => item.uuid === uuid ? { ...item, translate: { ...(item.translate || {}), status: item.translate?.status === 'completed' ? 'reprocessing' : 'processing', error: null } } : item) // Clear previous error
  //   );

  //   try {
  //     const response = await fetch(`${import.meta.env.VITE_API_URL}/translate`, {
  //       method: 'POST', body: JSON.stringify({ text: textToTranslate, target: formDataRef.current.translateLanguage }),
  //       headers: { 'Content-Type': "application/json" }
  //     });

  //     if (!response.ok) {
  //       let errorMsg = `Translation failed (${response.status})`;
  //       try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch { /* Ignore */ }
  //       throw new Error(errorMsg);
  //     }

  //     const responseData = await response.json();
  //     console.log(`Translation received for ${uuid}: "${responseData.text}"`);
  //     setTranscriptions(prev =>
  //       prev.map(item => (item.uuid === uuid ? { ...item, translate: { ...responseData, status: 'completed' } } : item))
  //     );

  //   } catch (error) {
  //     console.error(`Translation error for ${uuid}:`, error);
  //     setTranscriptions(prev =>
  //       prev.map(item => (item.uuid === uuid ? { ...item, translate: { ...(item.translate || {}), error: error.message, status: 'failed' } } : item))
  //     );
  //   }
  // };

  const sendAudioToServer = async (chunks, mimeType) => {
    console.log('sendAudioToServer chunks:', chunks)
    if (!chunks || chunks.length === 0) { console.warn("sendAudioToServer: empty chunks."); return; }
    if (!recordingRef.current) { console.error("sendAudioToServer: recordingRef is missing."); return; }

    const { uuid } = recordingRef.current;
    const audioBlob = new Blob(chunks, { type: mimeType });

    console.log(`Sending audio for segment ${uuid}, Size: ${audioBlob.size}, Type: ${mimeType}`);

    // Set initial processing/reprocessing status for both transcription and translation
    setTranscriptions(prev =>
      prev.map(item => {
        if (item.uuid === uuid) {
          return {
            ...item,
            // Set transcription status
            status: ['reprocessing', 'completed', 'failed'].includes(item.status) ? 'reprocessing' : 'processing',
            //error: null, // Clear previous transcription error
            // Set translation status - assuming it might be needed
            // translate: {
            //   ...(item.translate || {}),
            //   status: ['completed', 'failed'].includes(item.translate?.status) ? 'reprocessing' : 'processing',
            //   error: null // Clear previous translation error
            // },
            audio: { ...(item.audio || {}), chunks: chunks, mimeType: mimeType }
          };
        }
        return item;
      })
    );


    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/speechToText?language=${formDataRef.current.language}`;
      const response = await fetch(apiUrl, { method: 'POST', body: audioBlob, headers: { 'Content-Type': mimeType } });

      if (!response.ok) {
        let errorMsg = `Transcription failed (${response.status})`;
        try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch { /* Ignore */ }
        throw new Error(errorMsg); // Go to catch block
      }

      const data = await response.json();
      console.log(`Transcription received for ${uuid}: "${data.text}"`);

      const transcriptionText = data.text.trim();

      // Update transcription status to completed first
      // Required before potentially calling translateData or setting translation failure
      setTranscriptions(prev =>
        prev.map(item => (item.uuid === uuid ? { ...item, text: transcriptionText, status: 'completed' } : item))
      );

      // --- Translation Handling ---
      // Assuming translation is always intended if transcription succeeds
      if (transcriptionText != "") {
        // Proceed with translation if text exists
        translateData(uuid, transcriptionText);
      } else {
        // Transcription succeeded but text is empty, fail the translation step
        console.warn(`Setting translation to failed for ${uuid}: Transcription text is empty.`);
        setTranscriptions(prev =>
          prev.map(item => {
            if (item.uuid === uuid) {
              // Keep completed transcription data, update translation status
              return {
                ...item,
                translate: {
                  ...(item.translate || {}),
                  //status: 'failed',
                  //error: 'Translation skipped: Empty transcription text.'
                }
              };
            }
            return item;
          })
        );
      }
      // --- End Translation Handling ---

    } catch (error) {
      console.error(`Transcription error for ${uuid}:`, error);
      // Update transcription AND translation status to failed
      setTranscriptions(prev =>
        prev.map(item => {
          if (item.uuid === uuid) {
            return {
              ...item,
              status: 'failed',
              error: error.message, // Set transcription error
              translate: {
                ...(item.translate || {}),
                //status: 'failed',
                //error: 'Translation skipped: Transcription failed.' // Set translation error
              }
            };
          }
          return item;
        })
      );
    }
  };

  // The translateData function remains unchanged
  // The check for translateLanguage inside it still provides a safety layer
  const translateData = async (uuid, textToTranslate) => {
    // Keep this check for robustness within translateData itself
    if (!textToTranslate || !formDataRef.current.translateLanguage) {
      console.warn(`translateData skipped for ${uuid}: Empty text or missing target language.`);
      // Optionally set status to failed here too, though sendAudioToServer should cover most cases
      setTranscriptions(prev =>
        prev.map(item => item.uuid === uuid ? { ...item, translate: { ...(item.translate || {}), status: 'failed', error: 'Missing text or target language.' } } : item)
      );
      return;
    }

    console.log(`Translating for ${uuid} to ${formDataRef.current.translateLanguage}`);

    // Set translation status (handles reprocessing automatically)
    setTranscriptions(prev =>
      prev.map(item => {
        if (item.uuid === uuid) {
          // Ensure translate object exists before setting status
          const currentTranslate = item.translate || {};
          return {
            ...item,
            translate: {
              ...currentTranslate,
              status: ['reprocessing', 'completed', 'failed'].includes(currentTranslate.status) ? 'reprocessing' : 'processing',
              //error: null // Clear previous error
            }
          };
        }
        return item;
      })
    );


    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/translate`, {
        method: 'POST', body: JSON.stringify({ text: textToTranslate, target: formDataRef.current.translateLanguage }),
        headers: { 'Content-Type': "application/json" }
      });

      if (!response.ok) {
        let errorMsg = `Translation failed (${response.status})`;
        try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch { /* Ignore */ }
        throw new Error(errorMsg);
      }

      const responseData = await response.json();
      console.log(`Translation received for ${uuid}: "${responseData.text}"`);

      const translatedText = responseData.text.trim();

      setTranscriptions(prev =>
        prev.map(item => (item.uuid === uuid ? { ...item, translate: { text: translatedText, status: 'completed' } } : item))
      );

    } catch (error) {
      console.error(`Translation error for ${uuid}:`, error);
      setTranscriptions(prev =>
        prev.map(item => (item.uuid === uuid ? { ...item, translate: { ...(item.translate || {}), error: error.message, status: 'failed' } } : item))
      );
    }
  };

  // --- REMOVED: combineAudioChunks function ---
  // The full audio is now generated directly by fullMediaRecorderRef's onstop handler.

  // --- Cleanup Object URLs ---
  useEffect(() => {
    // This effect now cleans up the URL generated by the full recorder
    const currentUrl = fullRecordingData.url;
    return () => {
      if (currentUrl) {
        // console.log("Revoking full recording URL:", currentUrl);
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [fullRecordingData.url]); // Depend on the URL in state

  // --- Helper Functions ---
  const getSupportedMimeTypeOptions = () => { /* ... (same as before) ... */
    const types = [
      'audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg',
      'audio/mp4', // Less commonly supported for recording
    ];
    for (const type of types) { if (MediaRecorder.isTypeSupported(type)) return { mimeType: type }; }
    console.warn("No preferred MIME type supported. Trying default (might be audio/webm).");
    // Let browser choose if '' is supported, otherwise return null
    return MediaRecorder.isTypeSupported('') ? undefined : null;
  };
  const cleanHtml = (html) => { /* ... (same as before) ... */
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent || "").trim();
  };
  const createAudioUrl = (chunks, mimeType) => { /* ... (same as before, including warning) ... */
    if (!chunks || !chunks.length || !mimeType) return null;
    try {
      const blob = new Blob(chunks, { type: mimeType });
      return URL.createObjectURL(blob); // WARNING: Needs manual cleanup if used heavily
    } catch (error) { console.error("Error creating blob URL:", error); return null; }
  };

  // --- UI Event Handlers ---
  // ... (handleMouseEnter, handleMouseLeave, handleScroll, scrollToBottom, toggleColumn - unchanged) ...
  const handleMouseEnter = (index) => { setTimeout(() => { setHoveredIndex(index); }, 500) };
  const handleMouseLeave = () => {
    if (isMobile) return;
    setHoveredIndex(null);
  };

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
    setAutoScroll(isAtBottom);
    setShowScrollButtons(scrollHeight > clientHeight + 5);
  }, []);
  const scrollToBottom = () => {
    if (scrollRef.current) { scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); setAutoScroll(true); }
  };
  const toggleColumn = (direction) => {
    setActiveColumn(direction === 'next' ? 1 : 0);
  };
  const handleJoinRoom = (roomIdToJoin) => { /* ... (same as before) ... */
    const targetRoomId = roomIdToJoin || roomFormData.roomId;
    if (!targetRoomId) { alert("Please enter a Room ID."); return; }

    if (!socket.connected) {
      console.log("Socket not connected, connecting before joining...");
      socket.connect();
    }

    console.log(`Attempting to join room: ${targetRoomId}`);
    socket.emit('join-room', { roomId: targetRoomId, userId: formDataRef.current.userId });
    //setRoom({ roomId: targetRoomId, role: 'user' });
    window.location.hash = targetRoomId;
  };
  const handleCreateRoom = () => { /* ... (same as before) ... */
    if (!socket.connected) {
      console.log("Socket not connected, connecting before creating...");
      socket.connect();
    }

    //const newRoomId = uuidv4();
    const newRoomId = generateFriendlyCode();
    console.log(`Creating room: ${newRoomId}`);
    socket.emit('create-room', { roomId: newRoomId, userId: formDataRef.current.userId });
    //setRoom({ roomId: newRoomId, role: 'owner' });
    //window.location.hash = newRoomId;
  };

  const handleQuickStart = () => {
    //const newRoomId = generateFriendlyCode();
    setRoom({ roomId: null, role: 'owner' });
    //window.location.hash = newRoomId;

  };
  const handleTextEdit = (uuid, field, newText) => { /* ... (same as before) ... */
    setTranscriptions(prev => prev.map(item => {
      if (item.uuid !== uuid) return item;
      if (field === 'transcription') { if (item.text !== newText && formDataRef.current.translateLanguage) { translateData(uuid, newText); } return { ...item, text: newText }; }
      if (field === 'translation') { return { ...item, translate: { ...(item.translate || {}), text: newText } }; } return item;
    }));
  };
  const handleModeration = (uuid, newStatus) => { /* ... (same as before) ... */
    setTranscriptions(prev => prev.map(item => item.uuid === uuid ? { ...item, moderation_status: newStatus } : item));
  };

  // Auto-scroll effect
  useEffect(() => { /* ... (same as before) ... */
    if (autoScroll && scrollRef.current) { setTimeout(() => { if (scrollRef.current) { scrollRef.current.scrollTop = scrollRef.current.scrollHeight; } }, 100); }
  }, [transcriptions, autoScroll]);

  // --- Render ---

  // Room Selection/Creation UI
  if (!room) {
    return ( /* ... (same JSX as before) ... */
      <div className="container mt-5">
        <div className="row justify-content-center g-4">
          {/* Join Room Card */}
          <div className="col-md-5">
            <div className="card shadow-sm h-100">
              <div className="card-body p-4">
                <h4 className="card-title text-center mb-4">Join Existing Room</h4>
                <div className="mb-3">
                  <label htmlFor="roomIdInput" className="form-label">Room ID</label>
                  <input
                    id="roomIdInput"
                    type="text"
                    className="form-control"
                    placeholder="Enter Room ID from URL or shared link"
                    value={roomFormData.roomId}
                    onChange={(e) => setRoomFormData({ roomId: e.target.value.trim() })}
                  />
                </div>
                <button
                  className="btn btn-primary w-100"
                  onClick={() => handleJoinRoom()}
                  disabled={!roomFormData.roomId.trim()}
                >
                  Join Room
                </button>
              </div>
            </div>
          </div>

          {/* Create Room Card */}
          <div className="col-md-5">
            <div className="card shadow-sm h-100">
              <div className="card-body p-4">
                <h4 className="card-title text-center mb-4">Create New Room</h4>
                {/* Settings integrated into create card */}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Speech Language:</label>
                    <select
                      className="form-select"
                      value={formData.language}
                      onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    >
                      <option value="auto">Auto Detect</option>
                      {languages.sort((a, b) => a.name.localeCompare(b.name)).map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Translate Language:</label>
                    <select
                      className="form-select"
                      value={formData.translateLanguage}
                      onChange={(e) => setFormData(prev => ({ ...prev, translateLanguage: e.target.value }))}
                    >
                      {/* Add a "None" option maybe? */}
                      {languages.sort((a, b) => a.name.localeCompare(b.name)).map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <div className="form-check form-switch d-flex justify-content-center align-items-center pt-2">
                      <input
                        className="form-check-input me-2"
                        type="checkbox"
                        role="switch"
                        id="moderationSwitchCreate"
                        checked={formData.moderation}
                        onChange={(e) => setFormData(prev => ({ ...prev, moderation: e.target.checked }))}
                      />
                      <label className="form-check-label" htmlFor="moderationSwitchCreate">
                        Enable Moderation
                      </label>
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-success w-100"
                  onClick={handleCreateRoom}
                >
                  Create Room & Start
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="row justify-content-center g-4">
          <div className="col-md-5">
            <div className="card shadow-sm mt-2">
              <div className="card-body p-4">
                <h4 className="card-title text-center mb-4">Quick Start</h4>
                {/* Settings integrated into create card */}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Speech Language:</label>
                    <select
                      className="form-select"
                      value={formData.language}
                      onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    >
                      <option value="auto">Auto Detect</option>
                      {languages.sort((a, b) => a.name.localeCompare(b.name)).map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Translate Language:</label>
                    <select
                      className="form-select"
                      value={formData.translateLanguage}
                      onChange={(e) => setFormData(prev => ({ ...prev, translateLanguage: e.target.value }))}
                    >
                      {/* Add a "None" option maybe? */}
                      {languages.sort((a, b) => a.name.localeCompare(b.name)).map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  className="btn btn-success w-100"
                  onClick={handleQuickStart}
                >
                  Quick Start
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // Main Recorder UI
  const sortedTranscriptions = [...transcriptions].sort(
    (a, b) => moment(a.timestamp, 'YYYY-MM-DD HH:mm:ss.SSS').valueOf() - moment(b.timestamp, 'YYYY-MM-DD HH:mm:ss.SSS').valueOf()
  );

  return ( /* ... (Rest of the JSX, unchanged from previous version) ... */
    <div className="container-fluid mt-3 mb-5">
      {/* Header Row */}


      {!isMobile && (<div className="d-flex flex-column flex-md-row justify-content-md-between align-items-md-center mb-3 p-2 bg-light border rounded">
        <h2 className="m-0 mb-md-0 w-100 w-md-auto text-start">Speech Recorder</h2>
        <div className='d-flex flex-column flex-sm-row align-items-end align-items-sm-center justify-content-sm-between w-100 w-md-auto mt-2 mt-md-0'>

          {room.roomId ? (<span className="badge bg-secondary mb-2 mb-sm-0 me-sm-3">Room: {room.roomId} ({room.role})  </span>) : <span>&nbsp;</span>}

          {room.role === 'owner' && (
            <button
              className={`btn btn-sm ${showSettings ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              <i className={`bi bi-gear${showSettings ? '-fill' : ''}`}></i>
              {/* Hide text on xs, show on sm and up */}
              <span className="d-none d-sm-inline ms-1">Settings</span>
            </button>
          )}
        </div>
      </div>)}

      {isMobile && room.role === 'owner' && (
        <div className='d-flex flex-column flex-sm-row align-items-end align-items-sm-center justify-content-sm-between w-100 w-md-auto mt-2 mt-md-0'>
          <button
            className={`btn btn-sm ${showSettings ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <i className={`bi bi-gear${showSettings ? '-fill' : ''}`}></i>
            {/* Hide text on xs, show on sm and up */}
            <span className="d-none d-sm-inline ms-1">Settings</span>
          </button></div>)}



      {/* Settings Panel (Owner Only) */}
      {room.role === 'owner' && showSettings && (
        <div className="card mb-4 shadow-sm">
          <div className="card-header"> <h4 className="m-0">Settings</h4> </div>
          <div className="card-body"> {/* ... Settings form JSX ... */}
            <div className="row g-3">
              {/* Language Settings */}
              <div className="col-md-4 border-end">
                <h5>Language</h5>
                <div className="mb-3">
                  <label className="form-label">Speech Language:</label>
                  <select className="form-select" value={formData.language} onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}>
                    <option value="auto">Auto Detect</option>
                    {languages.sort((a, b) => a.name.localeCompare(b.name)).map(lang => (<option key={lang.code} value={lang.code}>{lang.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Translate Language:</label>
                  <select className="form-select" value={formData.translateLanguage} onChange={(e) => setFormData(prev => ({ ...prev, translateLanguage: e.target.value }))}>
                    {languages.sort((a, b) => a.name.localeCompare(b.name)).map(lang => (<option key={lang.code} value={lang.code}>{lang.name}</option>))}
                  </select>
                </div>
              </div>
              {/* Timing Controls */}
              <div className="col-md-4 border-end">
                <h5>Timing</h5>
                <div className="mb-3">
                  <label className="form-label">Pause Duration (ms): <small>(Timeout after silence)</small></label>
                  <input type="number" className="form-control" value={formData.userSetDuration} onChange={(e) => setFormData(prev => ({ ...prev, userSetDuration: Number(e.target.value) || 1000 }))} min="500" step="100" />
                </div>
                <div>
                  <label className="form-label">Chunk Interval (ms): <small>(Send data every X ms, 0=off)</small></label>
                  <input type="number" className="form-control" value={formData.chunksDuration} onChange={(e) => setFormData(prev => ({ ...prev, chunksDuration: Number(e.target.value) || 0 }))} min="0" step="500" />
                </div>
              </div>
              {/* Additional Options */}
              <div className="col-md-4">
                <h5>Options</h5>
                <div className="form-check form-switch mb-2">
                  <input className="form-check-input" type="checkbox" role="switch" id="moderationSwitch" checked={formData.moderation} onChange={(e) => setFormData(prev => ({ ...prev, moderation: e.target.checked }))} />
                  <label className="form-check-label" htmlFor="moderationSwitch">Enable Moderation</label>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="disableSharingSwitch" checked={formData.disableSharing} onChange={(e) => setFormData(prev => ({ ...prev, disableSharing: e.target.checked }))} />
                  <label className="form-check-label" htmlFor="disableSharingSwitch">Disable Sharing Transcriptions</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recording Controls (Owner Only) */}
      {room.role === 'owner' && (
        <div className="text-center mb-1">
          <button
            className={`btn btn-sm ${isRecording ? 'btn-danger' : 'btn-primary'} `}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={!room}
          >
            <i className={`bi ${isRecording ? 'bi-stop-circle-fill' : 'bi-mic-fill'} me-2`}></i>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          {isRecording && <div className="spinner-grow spinner-grow-sm text-danger ms-2" role="status"><span className="visually-hidden">Recording...</span></div>}
        </div>
      )}

      {/* Combined Audio Player - Uses fullRecordingData now */}
      {/* Display only after recording stops and data is available */}
      {!isRecording && sortedTranscriptions.length > 0 && fullRecordingData.url && (
        <div className="mb-2 p-2 border rounded bg-light">
          <h5 className="mb-2">Full Recording</h5>
          <ReactAudioPlayer
            key={fullRecordingData.key} // Use key to force re-render when URL changes
            src={fullRecordingData.url}
            controls
            preload="metadata"
            style={{ width: '100%' }}
            onError={(e) => console.error("Error playing full recording:", e)}
          />
          {/* Download Link */}
          {fullRecordingData.blob && (
            <a
              href={fullRecordingData.url}
              // Construct filename using stored mimeType
              download={`full_recording_${room.roomId}_${Date.now()}.${fullRecordingData.mimeType?.split(';')[0]?.split('/')[1] || 'webm'}`}
              className="btn btn-sm btn-outline-secondary mt-2"
            >
              <i className="bi bi-download me-1"></i> Download Full Audio
            </a>
          )}
        </div>
      )}

      {/* Transcription Area */}
      <div className="mt-2"> {/* ... Transcription list JSX ... */}
        {/* <h4 className="mb-3">Transcriptions {sortedTranscriptions.length > 0 ? `(${sortedTranscriptions.length})` : ''}</h4> */}

        {/* Placeholder when no transcriptions */}
        {sortedTranscriptions.length === 0 && (
          <div className="text-center text-muted p-4 border rounded">
            {room.role === 'owner' ? (isRecording ? "Listening..." : "Start recording to see transcriptions.") : "Waiting for transcriptions from the owner..."}
          </div>
        )}

        {/* Transcription List */}
        {sortedTranscriptions.length > 0 && (
          <>
            {/* Mobile Toggle Buttons */}
            {isMobile && (
              <div className="d-md-none d-flex justify-content-center nav nav-pills mb-2" role="tablist" style={{ position: 'absolute', top: '5px' }}>
                <button className={`btn-sm nav-link ${activeColumn === 0 ? 'active' : ''}`} onClick={() => toggleColumn('prev')} role="tab">Transcription</button>
                <button className={`btn-sm nav-link ${activeColumn === 1 ? 'active' : ''}`} onClick={() => toggleColumn('next')} role="tab">Translation</button>
              </div>
            )}

            {/* Transcription Container */}
            <div className={`card shadow-sm ${isMobile ? 'mt-5' : ''}`}>
              <div
                className='card-body overflow-auto position-relative'
                ref={scrollRef}
                onScroll={handleScroll}
                style={{ maxHeight: room.role == 'owner' ? '72vh' : '83vh' }} // Adjust height as needed
              >
                {/* Scroll to Bottom Button */}
                {showScrollButtons && !autoScroll && (
                  <button
                    className="btn btn-sm btn-light rounded-circle position-sticky shadow-sm"
                    onClick={scrollToBottom}
                    title="Scroll to bottom"
                    style={{ top: '90%', left: '100%', transform: 'translate(-50%, -50%)', zIndex: 1050 }}
                  >
                    <i className="bi bi-arrow-down"></i>
                  </button>
                )}

                <div className='row gx-3' onMouseLeave={handleMouseLeave} >
                  {/* Transcription Column */}
                  {(activeColumn === 0 || !isMobile) && (
                    <div className="col-md-6 mb-2">
                      <h5 className='text-center text-muted mb-2 d-none d-md-block'>Transcription</h5>

                      {room.role === 'owner' && (<>
                        {sortedTranscriptions.map((item, idx) => (
                          <div
                            key={`transcription-${item.uuid}`}
                            onMouseEnter={() => handleMouseEnter(idx)}
                            className={`p-2 ${room.role === 'owner' ? 'mb-2 border rounded' : ''} position-relative ${hoveredIndex === idx ? 'bg-light shadow-sm' : ''} ${item.status === 'failed' ? 'border-danger' : ''}`}
                            style={{ transition: 'background-color 0.2s ease-in-out' }}
                          >
                            {room.role === 'owner' && (
                              <div className='d-flex justify-content-between align-items-center mb-1'>
                                <small className="text-muted">{moment(item.timestamp, 'YYYY-MM-DD HH:mm:ss.SSS').format('HH:mm:ss')}</small>
                                {/* Status Indicators */}
                                <span>
                                  {item.status === 'processing' && <span className="badge bg-info me-1">Processing...</span>}
                                  {item.status === 'reprocessing' && <span className="badge bg-warning text-dark me-1">Reprocessing...</span>}
                                  {item.status === 'failed' && <span className="badge bg-danger me-1">Failed</span>}
                                  {item.status == 'completed' && item.moderation_status === 'rejected' && <span className="badge bg-danger me-1">Rejected</span>}
                                  {item.status == 'completed' && item.moderation_status === 'pending' && formData.moderation && <span className="badge bg-secondary me-1">Pending</span>}
                                </span>
                              </div>
                            )}

                            <div
                              contentEditable={room.role === 'owner' && item.status == 'completed'}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => { if (room.role === 'owner' && item.status == 'completed') handleTextEdit(item.uuid, 'transcription', e.target.textContent || '') }}
                              className={`editable-text p-1 ${room.role === 'owner' ? 'form-control-plaintext' : ''}`}
                              style={{ minHeight: '1.5em' }}
                            >
                              {cleanHtml(item.text)}
                              {item.error ? <span className='text-danger'>{item.error}</span> : null}
                            </div>

                            {/* Individual Audio Player (uses segment chunks) */}
                            {hoveredIndex === idx && item.audio?.chunks?.length > 0 && item.audio?.mimeType && (
                              <div className={`mt-2 border-top pt-2 collapse ${hoveredIndex === idx && item.audio?.chunks?.length > 0 && item.audio?.mimeType ? 'show' : ''}`}>
                                {(() => {
                                  const audioUrl = createAudioUrl(item.audio.chunks, item.audio.mimeType);
                                  if (!audioUrl) return <small className="text-danger">Could not load audio preview.</small>;
                                  return <ReactAudioPlayer
                                    key={audioUrl}
                                    src={audioUrl}
                                    controls
                                    preload="none" // Don't preload segment previews
                                    style={{ height: '40px', width: '100%' }}
                                    onError={(e) => console.error("Individual audio error", e)}
                                  //onCanPlay={e => { if (e.target.src) URL.revokeObjectURL(e.target.src); }} // Attempt cleanup
                                  //onAbort={e => { if (e.target.src) URL.revokeObjectURL(e.target.src); }} // Attempt cleanup
                                  />;
                                })()}
                              </div>
                            )}
                          </div>
                        ))}
                      </>)}

                      {room.role === 'user' && (<>
                        {sortedTranscriptions.map((item, idx) => (<>
                          {item.text != "" && !item.error && (
                            <span
                              key={`transcription-${item.uuid}`}
                              onMouseEnter={() => handleMouseEnter(idx)}
                              className={`pe-1 ${hoveredIndex === idx ? 'bg-info' : ''}`}
                              style={{ transition: 'background-color 0.2s ease-in-out', minHeight: '5em' /* Ensure consistent height */ }}
                            >
                              {cleanHtml(item.text)}
                            </span>
                          )}
                        </>
                        ))}
                      </>)}


                    </div>
                  )}

                  {/* Translation Column */}
                  {(activeColumn === 1 || !isMobile) && (
                    <div className="col-md-6 mb-2">
                      <h5 className='text-center text-muted mb-2 d-none d-md-block'>Translation ({formData.translateLanguage})</h5>
                      {room.role === 'owner' && (<>
                        {sortedTranscriptions.map((item, idx) => (
                          <div
                            key={`translation-${item.uuid}`}
                            onMouseEnter={() => handleMouseEnter(idx)}
                            className={`p-2 ${room.role === 'owner' ? 'mb-2 border rounded' : ''} position-relative ${hoveredIndex === idx ? 'bg-light shadow-sm' : ''} ${item.translate?.status === 'failed' ? 'border-danger' : ''}`}
                            style={{ transition: 'background-color 0.2s ease-in-out', minHeight: '5em' /* Ensure consistent height */ }}
                          >
                            {room.role === 'owner' && (
                              <div className='d-flex justify-content-between align-items-center mb-1'>
                                <small className="text-muted">{moment(item.timestamp, 'YYYY-MM-DD HH:mm:ss.SSS').format('HH:mm:ss')}</small>
                                {/* Status Indicators */}
                                <span>
                                  {!item.translate && <span className="badge bg-info me-1">Pending...</span>}
                                  {item.translate?.status === 'processing' && <span className="badge bg-info me-1">Translating...</span>}
                                  {item.translate?.status === 'reprocessing' && <span className="badge bg-warning text-dark me-1">Retranslating...</span>}
                                  {item.translate?.status === 'failed' && <span className="badge bg-danger me-1">Failed</span>}
                                </span>
                              </div>
                            )}

                            <div
                              contentEditable={room.role === 'owner' && item.translate?.status === 'completed'}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => { if (room.role === 'owner' && item.translate?.status === 'completed') handleTextEdit(item.uuid, 'translation', e.target.textContent || '') }}
                              className={`editable-text p-1 ${room.role === 'owner' ? 'form-control-plaintext' : ''}`}
                              style={{ minHeight: '1.5em' }}
                            >
                              {cleanHtml(item.translate?.text)}
                              {item.translate?.error ? <span className='text-danger'>{item.translate.error}</span> : null}
                            </div>

                            {/* Moderation Controls on Hover (Owner Only) */}
                            {/* {room.role === 'owner' && hoveredIndex === idx && formData.moderation && item.translate?.status === 'completed' && ['pending', 'approved', 'rejected'].includes(item.moderation_status) && ( */}
                            <div className={`mt-2 pt-2 border-top text-center moderation-controls collapse ${room.role === 'owner' && hoveredIndex === idx && formData.moderation && item.translate?.status === 'completed' && ['pending', /*'approved', 'rejected'*/].includes(item.moderation_status) ? 'show' : ''}`}>
                              <small className='text-muted me-2'>Moderation:</small>
                              <div className="btn-group btn-group-sm" role="group">
                                <button type="button" className={`btn ${item.moderation_status === 'approved' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => handleModeration(item.uuid, 'approved')} disabled={item.moderation_status === 'approved'}>Approve</button>
                                <button type="button" className={`btn ${item.moderation_status === 'rejected' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => handleModeration(item.uuid, 'rejected')} disabled={item.moderation_status === 'rejected'}>Reject</button>
                                {/* {item.moderation_status !== 'pending' && (
                                  <button type="button" className="btn btn-outline-secondary" onClick={() => handleModeration(item.uuid, 'pending')}>Reset</button>
                                )} */}
                              </div>
                            </div>
                            {/*} )}*/}
                          </div>
                        ))}
                      </>)}

                      {room.role === 'user' && (<>
                        {sortedTranscriptions.map((item, idx) => (<>
                          {item.translate?.text != "" && !item.translate?.error && (
                            <span
                              key={`translation-${item.uuid}`}
                              onMouseEnter={() => handleMouseEnter(idx)}
                              className={`pe-1 ${hoveredIndex === idx ? 'bg-info' : ''}`}
                              style={{ transition: 'background-color 0.2s ease-in-out', minHeight: '5em' /* Ensure consistent height */ }}
                            >
                              {cleanHtml(item.translate?.text)}
                            </span>
                          )}
                        </>))}
                      </>)}

                    </div>
                  )}
                </div>
              </div> {/* End card-body */}
            </div> {/* End card */}
          </>
        )}
      </div>
    </div>
  );
};

export default SpeechToText;