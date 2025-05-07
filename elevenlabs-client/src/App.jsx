import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import "./App.css";


import DefaultLayout from "./layouts/default";
import HomePage from "./views/home";
import SpeechToTextPage from "./views/speech-to-text";
import ConversationalAIPage from "./views/conversational-ai";

function App() {


  return (
    <Routes>
      <Route path="/" element={<DefaultLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/speech-to-text" element={<SpeechToTextPage />} />
        <Route path="/conversational-ai" element={<ConversationalAIPage />} />
      </Route>
    </Routes>
  )
}

export default App
