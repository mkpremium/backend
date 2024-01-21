import * as TE from 'fp-ts/TaskEither'
import { expect } from 'chai'
import { BuildingProps } from '../src/building/building'
import { ContactProps, OwnerProps } from '../src/owner/owner'
import { Flipper } from '../src/flipper/flipper.entity'
import { AddProposalForBuildingService } from '../src/building/service/add-proposal-for-building.service'
import { AddContactService, MaybeFeaturedContact } from '../src/owner/service/add-contact.service'
import { emailContactFactory, phoneContactFactory } from './factories'
import { AddOperatorService } from '../src/user/service/add-operator.service'
import { Factory } from 'rosie'
import { UserProfileProps } from '../src/types/user'
import { AddOwnerCommand, AddOwnerService } from '../src/owner/service/add-owner.service'
import { BuildingsRepository } from "../src/building/repository/buildings.repository";
import { PostgresWorksheetQueueRepository } from "../src/worksheet/repository/postgres-worksheet-queue.repository";
import { PostgresWorksheetRepository } from "../src/worksheet/repository/postgres-worksheet.repository";
import {
  ReleaseUserExtraOpenedWorksheetsInQueueService
} from "../src/worksheet/service/release-user-extra-opened-worksheets-in-queue.service";
import { TakeNextWorksheetService } from "../src/worksheet/service/take-next-worksheet.service";
import { createTestContainer } from "./create-test-container";
import { SearchOwnerOrBuildingService } from "../src/owner/service/search-owner-or-building.service";
import { AddOfferRequestService } from "../src/building/service/add-offer-request.service";
import { ListBuildingsService } from "../src/building/service/list-buildings.service";
import { AddFlipperService } from "../src/flipper/service/add-flipper.service";
import type { ScheduleCallService } from "../src/scheduled-events/service/schedule-call.service";
import { ScheduledCallsService } from "../src/scheduled-events/service/scheduled-calls.service";
import { ScheduledEventsRepository } from "../src/scheduled-events/repository/schedule-events.repository";
import {
  PostgresScheduledEventsRepository
} from "../src/scheduled-events/repository/postgres-schedule-events.repository";
import { CallcenterWorksheetService } from "../src/worksheet/service/callcenter-worksheet.service";
import { BuildingsReadRepository } from "../src/building/repository/buildings-read.repository";

export function orFail() {
  return TE.orElse((error) => {
    expect.fail(String(error))
  })
}

export async function addProposal(testBuilding: BuildingProps, testOwner: {
  id: string
}, testEmailContact: ContactProps & {
  isFeatured: boolean
}, testFlipper: Flipper, {addProposalForBuildingService}) {
  const testAddProposalCommand = {
    buildingId: testBuilding.id,
    ownerId: testOwner.id,
    amount: 1_000,
    contactId: testEmailContact.id,
    createdBy: testFlipper.user.id,
    message: 'test email message'
  }
  await addProposalForBuildingService.add(testBuilding.id, testAddProposalCommand)

  return testAddProposalCommand
}

type CreateOwnerDeps = {
  addOwnerService: AddOwnerService,
}

type CreateOwnerWithPhoneDeps = CreateOwnerDeps & {
  addContactService: AddContactService,
};

export async function createOwnerWithPhoneContact(
  testBuilding: Pick<BuildingProps, 'id'>, deps: CreateOwnerWithPhoneDeps): Promise<[OwnerProps, MaybeFeaturedContact]>
export async function createOwnerWithPhoneContact(
  testBuilding: Pick<BuildingProps, 'id'>, overwrites: Partial<AddOwnerCommand>, deps: CreateOwnerWithPhoneDeps): Promise<[OwnerProps, MaybeFeaturedContact]>
export async function createOwnerWithPhoneContact(
  testBuilding: Pick<BuildingProps, 'id'>,
  overridesOrDeps: Partial<AddOwnerCommand> | CreateOwnerWithPhoneDeps,
  deps?: CreateOwnerWithPhoneDeps): Promise<[OwnerProps, MaybeFeaturedContact]> {
  if (!deps) {
    deps = overridesOrDeps as CreateOwnerWithPhoneDeps
    overridesOrDeps = {}
  }

  const testOwner = await createOwner(testBuilding, overridesOrDeps as Partial<AddOwnerCommand>, deps)
  const testPhoneContact = await deps.addContactService.addContact({
    ...phoneContactFactory.build(),
    isFeatured: true,
    ownerId: testOwner.id,
  }) as MaybeFeaturedContact

  return [testOwner, testPhoneContact] as [OwnerProps, MaybeFeaturedContact]
}

export async function createOwnerWithEmailContact(
  testBuilding: Pick<BuildingProps, 'id'>, {addOwnerService, addContactService}) {
  const testOwner = await createOwner(testBuilding, {addOwnerService})
  const testEmailContact = await addEmailToOwner(testOwner, {addContactService})

  return [testOwner, testEmailContact] as [OwnerProps, MaybeFeaturedContact]
}

export async function addEmailToOwner(testOwner: OwnerProps, {addContactService}) {
  return await addContactService.addContact({
    ...emailContactFactory.build(),
    isFeatured: true,
    ownerId: testOwner.id,
  }) as MaybeFeaturedContact;
}

async function createOwner(testBuilding: Pick<BuildingProps, 'id'>, deps: CreateOwnerDeps): Promise<ReturnType<AddOwnerService['addOwner']>>
async function createOwner(testBuilding: Pick<BuildingProps, 'id'>, overwritesOrDeps: Partial<AddOwnerCommand>, deps: CreateOwnerDeps): Promise<ReturnType<AddOwnerService['addOwner']>>
async function createOwner(
  testBuilding: Pick<BuildingProps, 'id'>,
  overwritesOrDeps: Partial<AddOwnerCommand> | CreateOwnerDeps,
  deps?: CreateOwnerDeps): Promise<ReturnType<AddOwnerService['addOwner']>> {
  if (!deps) {
    deps = overwritesOrDeps as CreateOwnerDeps
    overwritesOrDeps = {}
  }
  return await deps.addOwnerService.addOwner({
    status: 'VERIFICADO',
    buildingId: testBuilding.id,
    note: 'test note',
    type: 'PRINCIPAL',
    person: {
      name: 'Full Name',
      firstName: 'Full',
      firstSurname: 'Name',
      contacts: []
    },
    ...overwritesOrDeps
  }, 'test-requester-id')
}

export async function addCaller({addOperatorService}: { addOperatorService: AddOperatorService }) {
  return addUserWithRole(addOperatorService, 'OPERATOR')
}

export async function addUserWithRole(service: AddOperatorService, role: 'BUSINESS' | 'OPERATOR') {
  const testCommand = {
    ...Factory.build<{ username: string, password: string }>('user-credentials'),
    profile: Factory.build<UserProfileProps>('user-profile'),
    roles: [role],
    enable: true,
  }
  return await service.addOperator(testCommand, {id: 'admin'})
}


export interface ResolvedDeps {
  addContactService: AddContactService,
  addFlipperService: AddFlipperService,
  addOfferRequestService: AddOfferRequestService,
  addOperatorService: AddOperatorService
  addOwnerService: AddOwnerService
  addProposalForBuildingService: AddProposalForBuildingService,
  buildingsReadRepository: BuildingsReadRepository
  buildingsRepository: BuildingsRepository,
  callcenterWorksheetService: CallcenterWorksheetService,
  listBuildingsService: ListBuildingsService

  postgresQueueRepository: PostgresWorksheetQueueRepository,
  postgresScheduledEventsRepository: PostgresScheduledEventsRepository,

  releaseUserOtherActiveWorksheetsInQueueService: ReleaseUserExtraOpenedWorksheetsInQueueService,
  scheduleCallService: ScheduleCallService,
  scheduledCallsService: ScheduledCallsService,

  scheduledEventsRepository: ScheduledEventsRepository,
  searchOwnerOrBuildingService: SearchOwnerOrBuildingService,
  takeNextWorksheetService: TakeNextWorksheetService,

  worksheetRepository: PostgresWorksheetRepository,
}

export async function resolveDependencies(): Promise<ResolvedDeps> {
  const container = await createTestContainer({couchbase: false, postgres: true})

  return {
    addContactService: container.resolve('addContactService'),
    addFlipperService: container.resolve('addFlipperService'),
    addOfferRequestService: container.resolve('addOfferRequestService'),
    addOperatorService: container.resolve('addOperatorService'),
    addOwnerService: container.resolve('addOwnerService'),
    addProposalForBuildingService: container.resolve('addProposalForBuildingService'),
    buildingsReadRepository: container.resolve('buildingsReadRepository'),
    buildingsRepository: container.resolve('buildingsRepository'),
    callcenterWorksheetService: container.resolve('callcenterWorksheetService'),
    listBuildingsService: container.resolve('listBuildingsService'),

    postgresQueueRepository: container.resolve('postgresQueueRepository'),
    postgresScheduledEventsRepository: container.resolve('postgresScheduledEventsRepository'),

    releaseUserOtherActiveWorksheetsInQueueService: container.resolve('releaseUserOtherActiveWorksheetsInQueueService'),
    scheduleCallService: container.resolve('scheduleCall'),
    scheduledCallsService: container.resolve('scheduledCallsService'),
    scheduledEventsRepository: container.resolve('scheduledEventsRepository'),

    searchOwnerOrBuildingService: container.resolve('searchOwnerOrBuildingService'),

    takeNextWorksheetService: container.resolve('takeNextWorksheetService'),

    worksheetRepository: container.resolve('worksheetRepository'),
  }
}
