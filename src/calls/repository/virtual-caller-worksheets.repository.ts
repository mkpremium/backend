export interface VirtualCallerWorksheetProps {
  worksheetId: string;
  callerId: string;
  status: 'CALLING' | 'DONE';
  lastContactId?: string;
}

export class VirtualCallerWorksheetsRepository {
  save (worksheet: VirtualCallerWorksheetProps) {
    return Promise.reject('Not implemented')
  }

  async inProgressWorksheetFor (callerId: string): Promise<VirtualCallerWorksheetProps> {
    return Promise.reject('Not implemented')
  }
}
