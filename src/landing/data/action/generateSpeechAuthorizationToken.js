const GENERATE_SPEECH_AUTHORIZATION_TOKEN = 'GENERATE_SPEECH_AUTHORIZATION_TOKEN';

export default function generateSpeechAuthorizationToken() {
  return { type: GENERATE_SPEECH_AUTHORIZATION_TOKEN };
}
