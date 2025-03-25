import express from "express";
import cors from "cors";
import "dotenv/config";
import { ElevenLabsClient } from "elevenlabs";



// Create an Express app
const app = express();

// Set a port
const PORT = 3000;

// Middleware example (optional)
app.use(express.json());
// Enable CORS for development
app.use(cors());

app.get('/api/v1/hello', (req, res) => {
  res.json({ message: 'Hello from ESM Express on Netlify!' });
});


// Another route (optional)
app.post('/api/v1/speechToText',
  express.raw({ type: '*/*', limit: '50mb' }),
  async (req, res) => {
    try {
      // Get MIME type from request headers
      const mimeType = req.headers['content-type'];

      // req.body is a Buffer containing the raw audio data
      const audioBuffer = req.body;
      const language = req.query.language || null; // Get language from URL params

      console.log('Received audio buffer size:', audioBuffer.length);
      console.log('Language:', language);
      console.log('MIME Type:', mimeType); // Log MIME type for debugging


      // If you want to log the first few bytes for debugging:
      console.log('Buffer preview:', audioBuffer.slice(0, 20));

      const client = new ElevenLabsClient();

      // Convert the buffer into a Blob
      const audioBlob = new Blob([audioBuffer], { type: mimeType }); // Or "audio/webm" depending on your frontend format

      const transcription = await client.speechToText.convert({
        file: audioBlob,
        model_id: "scribe_v1", // Model to use, for now only "scribe_v1" is support.
        tag_audio_events: false, // Tag audio events like laughter, applause, etc.
        language_code: language, // Language of the audio file. If set to null, the model will detect the language automatically.
        diarize: false, // Whether to annotate who is speaking
      });



      res.json({ text: transcription.text });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

export default app;

