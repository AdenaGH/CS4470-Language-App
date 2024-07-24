import { useEffect, useState } from "react";

let recognition;
if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";
}

const SpeechRecognition = ({ onSpeechResult }) => {
    const [speechText, setSpeechText] = useState("");
    const [isListening, setIsListening] = useState(false);

    useEffect(() => {
        if (!recognition) return;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setSpeechText(transcript);
            onSpeechResult(transcript);
            recognition.stop();
            setIsListening(false);
        }
    }, [ onSpeechResult ]);

    const startListening = () => {
        setSpeechText("");
        setIsListening(true);
        recognition.start();
    }

    const stopListening = () => {
        setIsListening(false);
        recognition.stop();
    }

    return {
        isListening,
        startListening,
        stopListening,
    }
};

export default SpeechRecognition;
