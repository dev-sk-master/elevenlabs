import "dotenv/config";
import { ElevenLabsClient } from "elevenlabs";

const client = new ElevenLabsClient();

const response = await fetch(
    "https://storage.googleapis.com/eleven-public-cdn/audio/marketing/nicole.mp3"
);
const audioBlob = new Blob([await response.arrayBuffer()], { type: "audio/mp3" });

const transcription = await client.speechToText.convert({
    file: audioBlob,
    model_id: "scribe_v1", // Model to use, for now only "scribe_v1" is support.
    tag_audio_events: true, // Tag audio events like laughter, applause, etc.
    language_code: "eng", // Language of the audio file. If set to null, the model will detect the language automatically.
    diarize: true, // Whether to annotate who is speaking
});

console.log(transcription.text);

