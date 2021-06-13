import { asClass, asFunction, asValue, AwilixContainer } from 'awilix'
import AccessToken, { VoiceGrant } from 'twilio/lib/jwt/AccessToken'
import { Logger } from 'winston'
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'
import twilio from 'twilio'
import { VirtualCallsRepository } from './virtual-calls.repository'
import { createCallDoneWebhookController } from './controller/call-done-webhook.controller'
import { VirtualCallerPhone } from './service/virtual-caller-phone'
import { createInputGatheredWebhookController } from './controller/input-gathered-webhook.controller'
import { createMachineDetectionWebhookController } from './controller/machine-detection-webhook.controller'
import { VirtualCallerWorksheetsRepository } from './repository/virtual-caller-worksheets.repository'

export interface TwilioCredentials {
  apiKey: string;
  appSid: string;
  secret: string;
  accountSid: string;
  accountAuthToken: string;
}

const sayAttributes = {
  language: 'es-ES' as 'es-ES',
  voice: 'Polly.Enrique',
} as VoiceResponse.SayAttributes

export const setupCallsDependencies = (container: AwilixContainer) => {
  container.register({
    publicUrl: asValue(process.env.PUBLIC_URL),
    twilioSayAttributes: asValue(sayAttributes),
    twilioCredentials: asValue({
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      accountAuthToken: process.env.TWILIO_ACCOUNT_TOKEN,
      apiKey: process.env.TWILIO_API_KEY,
      appSid: process.env.TWILIO_APP_SID,
      secret: process.env.TWILIO_TOKEN_SECRET,
    } as TwilioCredentials),

    callDoneWebhook: asFunction(createCallDoneWebhookController),
    twilioClient: asFunction(
      ({ twilioCredentials }: { twilioCredentials: TwilioCredentials }) =>
        twilio(twilioCredentials.accountSid, twilioCredentials.accountAuthToken)
    ).singleton(),
    virtualCaller: asClass(VirtualCallerPhone).classic().singleton(),
    inputGatheredWebhookController: asFunction(createInputGatheredWebhookController).singleton(),
    machineDetectionWebhookController: asFunction(createMachineDetectionWebhookController),

    virtualCallsRepository: asClass(VirtualCallsRepository).classic().singleton(),
    virtualCallerWorksheetsRepository: asClass(VirtualCallerWorksheetsRepository).classic().singleton(),

    // needed for calls from web (aka callcenter)
    // outgoingCallWebhookController: asFunction(({ logger }) => async (req, res) => {
    //   const twiml = new VoiceResponse()
    //   twiml.dial({ callerId: '+56976675541' })
    //     .number({}, req.body.phoneNumber)
    //
    //   const response = twiml.toString()
    //   logger.info('Twilio voice response', { response })
    //   res.send(response)
    // }),
    // callTokenGeneratorController: asFunction(({
    //                                             twilioCredentials: credentials,
    //                                             logger
    //                                           }: { twilioCredentials: TwilioCredentials, logger: Logger }) => {
    //   return async (req, res) => {
    //     const accessToken = new AccessToken(credentials.accountSid, credentials.apiKey, credentials.secret)
    //     accessToken.identity = 'callcenter'
    //
    //     const grant = new VoiceGrant({
    //       outgoingApplicationSid: credentials.appSid,
    //       incomingAllow: true,
    //     })
    //     accessToken.addGrant(grant)
    //
    //     res.setHeader('Content-Type', 'application/json')
    //     res.send(JSON.stringify({ token: accessToken.toJwt() }))
    //   }
    // }).inject(() => ({
    //   credentials: {
    //     accountSid: process.env.TWILIO_ACCOUNT_SID,
    //     apiKey: process.env.TWILIO_API_KEY,
    //     appSid: process.env.TWILIO_APP_SID,
    //     secret: process.env.TWILIO_TOKEN_SECRET,
    //   }
    // })),
  })
}
