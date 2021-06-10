import { asFunction, asValue, AwilixContainer } from 'awilix'
import AccessToken, { VoiceGrant } from 'twilio/lib/jwt/AccessToken'
import { Logger } from 'winston'
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'

interface TwilioCredentials {
  apiKey: string;
  appSid: string;
  secret: string;
  accountSid: string;
  accountAuthToken: string;
}

export const setupCallsDependencies = (container: AwilixContainer) => {
  container.register({
    twilioCredentials: asValue({
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      accountAuthToken: process.env.TWILIO_ACCOUNT_TOKEN,
      apiKey: process.env.TWILIO_API_KEY,
      appSid: process.env.TWILIO_APP_SID,
      secret: process.env.TWILIO_TOKEN_SECRET,
    } as TwilioCredentials),
    outgoingCallWebhookController: asFunction(({ logger }) => (req, res) => {
      const twiml = new VoiceResponse()
      twiml.dial({ callerId: '+56976675541' })
        .number({}, req.body.phoneNumber)

      const response = twiml.toString()
      logger.info('Twilio voice response', { response })
      res.send(response)
    }),
    callTokenGeneratorController: asFunction(({
                                                twilioCredentials: credentials,
                                                logger
                                              }: { twilioCredentials: TwilioCredentials, logger: Logger }) => {
      logger.info('Twilio credentials', credentials)
      return (req, res) => {
        const accessToken = new AccessToken(credentials.accountSid, credentials.apiKey, credentials.secret)
        accessToken.identity = 'callcenter'

        const grant = new VoiceGrant({
          outgoingApplicationSid: credentials.appSid,
          incomingAllow: true,
        })
        accessToken.addGrant(grant)

        res.setHeader('Content-Type', 'application/json')
        res.send(JSON.stringify({ token: accessToken.toJwt() }))
      }
    }).inject(() => ({
      credentials: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        apiKey: process.env.TWILIO_API_KEY,
        appSid: process.env.TWILIO_APP_SID,
        secret: process.env.TWILIO_TOKEN_SECRET,
      }
    }))
  })
}
