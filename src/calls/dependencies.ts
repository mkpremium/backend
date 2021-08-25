import { asClass, asFunction, asValue, AwilixContainer } from 'awilix'
import twilio from 'twilio'
import { VirtualCallsRepository } from './repository/virtual-calls.repository'
import { createCallDoneWebhookController } from './controller/call-done-webhook.controller'
import { VirtualCallerPhone } from './service/virtual-caller-phone'
import { createInputGatheredWebhookController } from './controller/input-gathered-webhook.controller'
import { createMachineDetectionWebhookController } from './controller/machine-detection-webhook.controller'
import { VirtualCallerWorksheetsRepository } from './repository/virtual-caller-worksheets.repository'
import { OwnerResponseProcessorService } from './service/owner-response-processor.service'
import { MachineDetectionResultProcessorService } from './service/machine-detection-result-processor.service'
import { createInputGatheredListener } from './event-listener/input-gathered.listener'
import { createWorksheetDoneListener } from './event-listener/worksheet-done.listener'
import { continueVirtualCallerLoop } from './event-listener/continue-virtual-caller-loop'
import { createStartVirtualCallerController } from './controller/virtual-caller-start.controller'
import { VirtualCallerSupervisorService } from './service/virtual-caller-supervisor.service'
import { VirtualCallerService } from './service/virtual-caller.service'
import RequestClient from 'twilio/lib/base/RequestClient'
import { createTodayStatsController } from './controller/today-stats.controller'
import { VirtualCallersRepository } from './repository/virtual-callers.repository'
import { CreateVirtualCallerService } from './service/create-virtual-caller.service'
import { createCreateVirtualCallerController } from './controller/create-virtual-caller.controller'
import { createListVirtualCallersController } from './controller/list-virtual-callers.controller'
import { createPatchVirtualCallerController } from './controller/patch-virtual-caller.controller'
import { PatchVirtualCallerService } from './service/patch-virtual-caller.service'
import { VirtualCallerPhonesRepository } from './repository/virtual-caller-phones.repository'
import { twilioSMSWebhookController } from './controller/twilio-sms-webhook.controller'
import { SmsMessagesRepository } from './repository/sms-messages.repository'
import { SmsWebhookProcessor } from './service/sms-webhook.processor'
import { sendSmsToOwner } from './event-listener/send-sms-to-owner'
import { SmsMessageSender } from './service/sms-message.service'
import { twilioIncomingCallController } from './controller/twilio-incoming-call.controller'
import { IncomingCallProcessor } from './service/incoming-call.processor'

export interface TwilioCredentials {
  apiKey: string;
  appSid: string;
  secret: string;
  accountSid: string;
  accountAuthToken: string;
}

const sayAttributes = {
  'es-ES': {
    language: 'es-ES' as 'es-ES',
    voice: 'Polly.Enrique' as 'Polly.Enrique',
  },
  'pt-PT': {
    language: 'pt-PT' as 'pt-PT',
    voice: 'Polly.Cristiano' as 'Polly.Cristiano',
  }
}

export const setupCallsDependencies = (container: AwilixContainer) => {
  container.register({
    publicUrl: asValue(process.env.PUBLIC_URL || 'https://api.mkpremium.net'),
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
      ({ twilioCredentials }: { twilioCredentials: TwilioCredentials }) => {
        const twilioUrl = process.env.TWILIO_URL
        const httpClient = twilioUrl ? new TwilioMockClient(twilioUrl, new RequestClient()) : new RequestClient()

        return process.env.NODE_ENV === 'test' ?
          undefined :
          twilio(twilioCredentials.accountSid, twilioCredentials.accountAuthToken, { httpClient })
      }
    ).singleton(),

    ownerTrialPhoneNumber: asValue(process.env.OWNER_TRIAL_PHONE_NUMBER || undefined),

    virtualCaller: asClass(VirtualCallerService).classic().singleton(),
    virtualCallerPhone: asClass(VirtualCallerPhone).classic().singleton(),
    createVirtualCallerService: asClass(CreateVirtualCallerService).classic().singleton(),
    patchVirtualCallerService: asClass(PatchVirtualCallerService).classic().singleton(),
    virtualCallerSupervisor: asClass(VirtualCallerSupervisorService).classic().singleton(),
    ownerResponseProcessor: asClass(OwnerResponseProcessorService).classic().singleton(),
    machineDetectionResultProcessor: asClass(MachineDetectionResultProcessorService).classic().singleton(),
    smsWebhookProcessor: asClass(SmsWebhookProcessor).classic().singleton(),
    smsMessageSender: asClass(SmsMessageSender).classic().singleton(),
    incomingCallProcessor: asClass(IncomingCallProcessor).classic().singleton(),

    inputGatheredWebhookController: asFunction(createInputGatheredWebhookController).singleton(),
    machineDetectionWebhookController: asFunction(createMachineDetectionWebhookController).singleton(),
    startVirtualCallerController: asFunction(createStartVirtualCallerController).singleton(),
    virtualCallerTodayStatsController: asFunction(createTodayStatsController).singleton(),
    twilioSMSWebhookController: asFunction(twilioSMSWebhookController).singleton(),

    createVirtualCallerController: asFunction(createCreateVirtualCallerController).singleton(),
    patchVirtualCallerController: asFunction(createPatchVirtualCallerController).singleton(),
    listVirtualCallersController: asFunction(createListVirtualCallersController).singleton(),
    twilioIncomingCallController: asFunction(twilioIncomingCallController).singleton(),

    virtualCallerInputGatheredListener: asFunction(createInputGatheredListener).singleton(),
    virtualCallerWorksheetDoneListener: asFunction(createWorksheetDoneListener).singleton(),
    continueVirtualCallerLoop: asFunction(continueVirtualCallerLoop).singleton(),
    sendSmsToOwner: asFunction(sendSmsToOwner).singleton(),

    virtualCallsRepository: asClass(VirtualCallsRepository).classic().singleton(),
    virtualCallerWorksheetsRepository: asClass(VirtualCallerWorksheetsRepository).classic().singleton(),
    virtualCallersRepository: asClass(VirtualCallersRepository).classic().singleton(),
    virtualCallerPhonesRepository: asClass(VirtualCallerPhonesRepository).classic().singleton(),
    smsMessagesRepository: asClass(SmsMessagesRepository).classic().singleton(),

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

class TwilioMockClient {
  constructor (
    private mockUrl: string,
    private twilioClient: RequestClient,
  ) {
  }

  request (opts) {
    opts.uri = opts.uri.replace(/^https\:\/\/.*?\.twilio\.com/, this.mockUrl)
    return this.twilioClient.request(opts)
  }
}
