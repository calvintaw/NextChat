const SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continous = true;
recognition.lang = "en-US";
