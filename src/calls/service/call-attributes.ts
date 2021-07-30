import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'

export type TwilioSayAttributes = Record<'es-ES' | 'pt-PT', VoiceResponse.SayAttributes>
export type CallLanguage = 'es-ES' | 'pt-PT'
