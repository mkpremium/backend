interface VirtualCallerWorksheetProps {
  worksheetId: string;
  callerId: string;
  status: 'PROCESSING';
  lastContactId?: string;
}

export class VirtualCallerWorksheetsRepository {
  save (worksheet: VirtualCallerWorksheetProps) {
    return Promise.reject('Not implemented')
  }
}
