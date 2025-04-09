
import { useConversation } from "@11labs/react";
import { useCallback } from "react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";

const ConversationalAI = () => {
  const [messages, setMessages] = useState([]);

  async function requestMicrophonePermission() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.log(error);
      console.error("Microphone permission denied");
      return false;
    }
  }


  const conversation = useConversation({
    onConnect: () => console.log("Connected"),
    onDisconnect: () => console.log("Disconnected"),
    onMessage: message => {
      setMessages(prevMessages => [...prevMessages, message]);
    },
    onError: error => console.error("Error:", error),
  });

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        alert("No permission");
        return;
      }

      // Start the conversation with your agent
      console.log("calling startSession");
      await conversation.startSession({
        agentId: "I8mXypBLVapN4STt22PD",//orQpg0d8k3qnIealQBEw
        dynamicVariables: {
          user_id: 2          
        },
        clientTools: {
          log_message: async (parameters) => {
            const { message } = parameters;
            console.log('tool log_message', parameters);
            return 'Message logged successfully';
          },
          fetch_documentation: async (parameters) => {
            const { query } = parameters;
            console.log('tool fetch_documentation', parameters)
            // Example API call to search documentation
            const response = await fetch(
              `https://api.elevenlabs.io/docs/search?q=${encodeURIComponent(query)}`
            );
            const data = await response.json();

            return data.results.length
              ? `Here’s what I found: ${data.results[0].title} - ${data.results[0].url}`
              : "I couldn't find anything specific, but you can browse our docs at elevenlabs.io/docs.";
          },
          send_message: async (parameters) => {
            const { email, message } = parameters;
            console.log('tool send_message', parameters);
            return 'Message sent successfully';
          },
        },
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <>
      <Helmet>
        <title>Conversational AI</title>
      </Helmet>
      <div className="container text-center mt-5">
        <h2>Conversational AI</h2>
        <div className="my-4">
          <button
            className={`btn ${conversation.status === "connected" ? 'btn-danger' : 'btn-primary'} btn-lg`}
            onClick={conversation.status === "connected" ? stopConversation : startConversation}
          >
            {conversation.status === "connected" ? 'Stop Call' : 'Start Call'}
          </button>

          {conversation.status === "connected" ? <>
            {conversation.isSpeaking ? " - Talk to interrupt" : " - Listening"}
          </> : null}

        </div>



        <div className="mt-4 text-start">
          <h4>Messages:</h4>
          <ul className="list-group">
            {messages.map((message, idx) => (
              <li key={idx} className="list-group-item">
                {message.source}: {message.message}
              </li>
            ))}
          </ul>
        </div>
      </div>


    </>
  );
};

export default ConversationalAI;
