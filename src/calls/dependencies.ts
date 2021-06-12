import { asClass, asFunction, asValue, AwilixContainer } from 'awilix'
import AccessToken, { VoiceGrant } from 'twilio/lib/jwt/AccessToken'
import { Logger } from 'winston'
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'
import twilio from 'twilio'
import { VirtualAgentCall, VirtualAgentCallProps } from './virtual-agent-call'
import { VirtualCallsRepository } from './virtual-calls.repository'

interface TwilioCredentials {
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
    twilioCredentials: asValue({
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      accountAuthToken: process.env.TWILIO_ACCOUNT_TOKEN,
      apiKey: process.env.TWILIO_API_KEY,
      appSid: process.env.TWILIO_APP_SID,
      secret: process.env.TWILIO_TOKEN_SECRET,
    } as TwilioCredentials),
    outgoingCallWebhookController: asFunction(({ logger }) => async (req, res) => {
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
      return async (req, res) => {
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
    })),
    callDoneController: asFunction(({
                                      logger,
                                      virtualCallsRepository
                                    }: {
      logger: Logger,
      virtualCallsRepository: VirtualCallsRepository
    }) => async (req, res) => {
      console.log('call done', req.body)
      const { callId } = req.params


      // const call = await virtualCallsRepository.get(callId)
      // const updatedCall = VirtualAgentCall.update(call, {
      //   status: ''
      // })


      res.sendStatus(200)
    }),
    virtualCaller: asFunction(({
                                 twilioCredentials,
                                 publicUrl,
                                 virtualCallsRepository,
                               }: {
      twilioCredentials: TwilioCredentials,
      publicUrl: string,
      virtualCallsRepository: VirtualCallsRepository
    }) => {
      const client = twilio(twilioCredentials.accountSid, twilioCredentials.accountAuthToken)

      return async (from, to) => {
        const twiml = new VoiceResponse()
        const call = VirtualAgentCall({} as VirtualAgentCallProps)
        await virtualCallsRepository.save(call)

        twiml.pause({
          length: 1,
        })
        twiml.gather({
          action: `${publicUrl}/calls/twilio/${call.id}/gather`,
          method: 'POST',
          language: 'es-ES',
          numDigits: 1,
        }).say(sayAttributes,
          'Buenos dias, le contactamos por su propiedad de la calle Espaseria 2 de ' +
          'Barcelona, nos dedicamos a la compra patrimonial de inmuebles, estaria usted interesado en vender?' +
          'Si desea vender marque 1, si no desea vender marque 2 y si no es el propietario marque 3.'
      )

        return client.calls.create({
          twiml: twiml.toString(),
          callerId: from,
          from,
          to,
          machineDetection: 'Enable',
          asyncAmd: 'true',
          asyncAmdStatusCallbackMethod: 'POST',
          asyncAmdStatusCallback: `${publicUrl}/calls/twilio/${call.id}/machine-detection`,
          statusCallback: `${publicUrl}/calls/twilio/${call.id}/done`
        })
          .catch(error => {
            const updatedCall = VirtualAgentCall.update(call, {
              status: {
                $set: 'FAILED'
              },
              error: {
                $set: error.message
              }
            })
            virtualCallsRepository.save(updatedCall)
            throw error
          })
      }
    }),
    gatheredInputController: asFunction(({ virtualCallsRepository }: { virtualCallsRepository: VirtualCallsRepository }) =>
      async (req, res) => {
        const { callId } = req.params
        console.log('gathered input', req.body)

        const call = await virtualCallsRepository.get(callId)
        const updatedCall = VirtualAgentCall.update(call, {
          status: {
            $set: 'INPUT_GATHERED'
          },
          finishedAt: {
            $set: new Date()
          }
        })
        await virtualCallsRepository.save(updatedCall)

        const selectedOption = req.body.Digits
        const twiml = new VoiceResponse()
        if (selectedOption === '1') {
          // VENDE
          twiml.say(
            sayAttributes,
            'Perfecto "nombre", tomamos nota de que tiene intención de vender y en un plazo maximo de 24h le contactara el director de "ciudad" para hablar con usted sobre su propiedad.  Gracias y buenos dias.'
          )
        } else if (selectedOption === '2') {
          // NO VENDE
          twiml.say(
            sayAttributes,
            'Perfecto "nombre", tomamos nota de que no tiene intención de vender, disculpe las molestias, buenos dias.'
          )
        } else if (selectedOption === '3') {
          // BORRAR CONTACTO
          twiml.say(
            sayAttributes,
            'Gracias por su respuesta y perdón por las molestias.'
          )
        } else {
          twiml.say(
            sayAttributes,
            'Ha seleccionado una opción no valida, gracias por su respuesta y perdón por las molestias.'
          )
        }

        res.send(twiml.toString())
      }),
    machineDetectionController: asFunction(() => (req, res) => {
      console.log('Machine detection result', req.body)
      if (req.body.AnsweredBy !== 'human') {
        const twiml = new VoiceResponse()
        twiml.hangup()
        res.send(twiml.toString())
      } else {
        res.sendStatus(200)
      }
    }),

    virtualCallsRepository: asClass(VirtualCallsRepository).classic().singleton(),
  })
}
