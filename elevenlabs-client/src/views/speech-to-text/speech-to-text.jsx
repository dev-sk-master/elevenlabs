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


  const [formData, setFormData] = useState({ language: "auto", silenceDuration: 1000, chunksDuration: 5000, translateLanguage: "en", userSetDuration: 1000 })
  const formDataRef = useRef(formData);

  // Keep languageRef updated
  useEffect(() => {
    console.log('formData', formData)
    formDataRef.current = formData;
  }, [formData]);

  const [isRecording, setIsRecording] = useState(false);
  const [transcriptions, setTranscriptions] = useState([]);

  const transcriptionsRef = useRef(transcriptions);
  useEffect(() => {
    console.log('transcriptions', transcriptions)
    transcriptionsRef.current = transcriptions;
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

  // Create a generator instance
  const getSnappedDuration = createSteppedDynamicDurationGenerator({
    min: 500,
    max: 2500,
    granularity: 100, // Snap to the nearest 100
    stepAmount: 250,  // Average change per step (before snap)
    randomness: 80    // Randomness per step
  });



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
    clearInterval(chunksTimerRef.current);
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

          const userSetDuration = formDataRef.current.userSetDuration || 1000; // Default user-set duration
          const minDuration = 500; // Minimum allowed duration

          // Progressive scaling: Adjust exponent (0.5-0.9) for smoother scaling
          const reduction = latestItem?.text
            ? Math.pow(latestItem.text.length, 0.8)
            : 0;

          let dynamicDuration = Math.max(userSetDuration - reduction, minDuration);
          // Round to the nearest 
          dynamicDuration = Math.round(dynamicDuration / 50) * 50;

          //const dynamicDuration = getSnappedDuration();
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
        ? prev.map(item => (item.uuid === uuid ? { ...item, status: 'reprocessing', audio: { ...item.audio, url: audioUrl, mimeType } } : item))
        : [...prev, { uuid, timestamp, status: 'processing', audio: { url: audioUrl, mimeType } }];
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

      await translateData(uuid, data)
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

  /**
 * Creates a function that generates dynamic duration values, snapped to a specific granularity.
 * The generated values tend to move towards min/max boundaries and reverse direction,
 * with some randomness added at each step, and the final output is rounded to the nearest
 * multiple of 'granularity'.
 *
 * @param {object} options - Configuration options.
 * @param {number} options.min - The minimum duration value.
 * @param {number} options.max - The maximum duration value.
 * @param {number} [options.granularity=1] - The step value to snap the output to (e.g., 100). Output will be a multiple of this.
 * @param {number} [options.initialValue=(min+max)/2] - The starting duration value (will be snapped initially).
 * @param {number} [options.initialDirection=1 or -1] - The initial direction (1 for increasing, -1 for decreasing). Randomly chosen if not provided.
 * @param {number} [options.stepAmount=(max-min)/10] - The average amount to change the value by in each step (before randomness and snapping). Determines speed of change.
 * @param {number} [options.randomness=stepAmount/2] - The maximum random deviation (+/-) added to each step. Adds variability.
 * @returns {function(): number} A function that, when called, returns the next snapped dynamic duration.
 */
  function createSteppedDynamicDurationGenerator({
    min,
    max,
    granularity = 1, // Default to 1 (no snapping)
    initialValue,
    initialDirection,
    stepAmount,
    randomness
  }) {
    if (typeof min !== 'number' || typeof max !== 'number' || min >= max) {
      throw new Error("Valid 'min' and 'max' numbers required, with min < max.");
    }
    if (typeof granularity !== 'number' || granularity <= 0) {
      throw new Error("Valid 'granularity' number greater than 0 required.");
    }

    // --- Helper function for snapping ---
    const snap = (value, grid) => Math.round(value / grid) * grid;

    // --- Set Defaults ---
    const range = max - min;
    const defaultInitial = min + range / 2;

    // Snap the initial value
    let currentValue = snap(
      (typeof initialValue === 'number')
        ? Math.max(min, Math.min(max, initialValue)) // Clamp initial value
        : defaultInitial,
      granularity
    );
    // Ensure snapped initial value is still within bounds
    currentValue = Math.max(min, Math.min(max, currentValue));

    // Random initial direction if not specified
    let direction = (typeof initialDirection === 'number')
      ? (initialDirection > 0 ? 1 : -1)
      : (Math.random() < 0.5 ? 1 : -1);

    // Average step size, e.g., 1/10th of the range by default
    let avgStep = (typeof stepAmount === 'number' && stepAmount > 0)
      ? stepAmount
      : Math.max(granularity, range / 10); // Ensure step is at least granularity or 1/10th range

    // Random variation around the step, e.g., +/- half the step by default
    let randomFactor = (typeof randomness === 'number' && randomness >= 0)
      ? randomness
      : avgStep / 2;

    // --- The Generator Function (Closure) ---
    return function getNextDuration() {
      // 1. Calculate the intended raw step + randomness
      const randomDeviation = (Math.random() * 2 - 1) * randomFactor; // Range: -randomFactor to +randomFactor
      const currentStep = direction * avgStep + randomDeviation;

      // 2. Calculate the potential next *raw* value
      let potentialNextRawValue = currentValue + currentStep;

      // 3. Check boundaries using the *raw* potential value and reverse if needed
      //    This prevents getting stuck if a snapped value is right at the boundary.
      let hitBoundary = false;
      if (potentialNextRawValue >= max) {
        potentialNextRawValue = max; // Clamp raw value for snapping calculation
        if (direction === 1) { // Only reverse if we were moving towards max
          direction = -1;
          hitBoundary = true;
        }
      } else if (potentialNextRawValue <= min) {
        potentialNextRawValue = min; // Clamp raw value for snapping calculation
        if (direction === -1) { // Only reverse if we were moving towards min
          direction = 1;
          hitBoundary = true;
        }
      }

      // 4. Snap the potential value to the granularity grid
      let nextSnappedValue = snap(potentialNextRawValue, granularity);

      // 5. Ensure the snapped value is strictly within bounds
      nextSnappedValue = Math.max(min, Math.min(max, nextSnappedValue));

      // 6. Avoid getting stuck at a boundary if step size is small relative to granularity
      // If we hit a boundary and the snapped value is the same as the current,
      // force a step away from the boundary in the new direction.
      if (hitBoundary && nextSnappedValue === currentValue) {
        // Calculate a step in the new direction and snap again
        const forcedStep = direction * avgStep + (Math.random() * 2 - 1) * randomFactor;
        potentialNextRawValue = currentValue + forcedStep;
        nextSnappedValue = snap(potentialNextRawValue, granularity);
        // Re-clamp after forced step
        nextSnappedValue = Math.max(min, Math.min(max, nextSnappedValue));
      }


      // 7. Update the state for the *next* call using the snapped value
      currentValue = nextSnappedValue;

      // 8. Return the snapped value
      return currentValue;
    };
  }




  return (
    <div className="container text-center mt-5">
      <h2>Speech Recorder (Send on Pause)</h2>

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



      <div className="mt-4 text-start">
        <div className="row align-items-center mb-2">
          <div className="col-md-6">
            <h4>Transcriptions:</h4>
          </div>

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
          </div>
        </div>
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
        </ul>
      </div>
    </div>
  );
};

export default SpeechToText;
