import { asFunction, asValue, AwilixContainer } from 'awilix'
import AccessToken, { VoiceGrant } from 'twilio/lib/jwt/AccessToken'

export const setupCallsDependencies = (container: AwilixContainer) => {
  container.register({
    callTokenGeneratorController: asFunction(({ credentials }) => (req, res) => {
      const accessToken = new AccessToken(credentials.accountSid, credentials.apiKey, credentials.secret)
      accessToken.identity = 'callcenter'

      const grant = new VoiceGrant({
        outgoingApplicationSid: credentials.appSid,
        // incomingAllow: true,
      })
      accessToken.addGrant(grant)

      res.setHeader('Content-Type', 'application/json')
      res.send(JSON.stringify({ token: accessToken.toJwt() }))
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
