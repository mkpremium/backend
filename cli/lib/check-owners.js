import debug from 'debug';
import {WorksheetRepository} from '../../src/worksheet/models/worksheet';

const debugMigrate = debug('app:migration:check-owners');

export async function checkWorksheetOwners() {
  debugMigrate('--------------------------------------------------\nStart process to check owners of worksheets...');
  let quantityOfOwnersChecked = 0;
  const ownersWithBuildingNull = [];
  const ownersWithWronglyAssignedBuilding = [];
  const ownersOK = [];
  const worksheetRepository = new WorksheetRepository();
  const worksheets = await worksheetRepository.findAllWorksheetsWithOwners();
  
  worksheets.map((worksheet) => {
    const relatedOwners = worksheet.relatedOwners;
    quantityOfOwnersChecked += relatedOwners.length;
    
    relatedOwners.map((owner) => {
      if (owner.buildingId === null) {
        ownersWithBuildingNull.push({
          owner: owner,
          worksheet: worksheet
        });
      } else if (owner.buildingId !== worksheet.relatedBuildingIds[0]) {
        ownersWithWronglyAssignedBuilding.push({
          owner: owner,
          worksheet: worksheet
        });
      } else {
        ownersOK.push({
          worksheetId: worksheet.id,
          ownerId: owner.id,
          ownerBuildingId: owner.buildingId,
          worksheetRelatedBuildingIds: worksheet.relatedBuildingIds
        });
      }
    });
  });
  debugMigrate('Quantity of worksheets checked: ', worksheets.length);
  debugMigrate('Quantity of owners checked: ', quantityOfOwnersChecked);
  debugMigrate('-------------------------------------------------');
  debugMigrate('Quantity owners OK:', ownersOK.length);
  debugMigrate('-------------------------------------------------');
  debugMigrate('Quantity Of owners With Building id Null:', ownersWithBuildingNull.length);
  debugMigrate('Owners With Building id Null:\n', ownersWithBuildingNull);
  debugMigrate('-------------------------------------------------');
  debugMigrate('Quantity Of Owners With Wrongly Assigned Building:', ownersWithWronglyAssignedBuilding.length);
  debugMigrate('Owners With Wrongly Assigned Building:\n', ownersWithWronglyAssignedBuilding);
  debugMigrate('Process ended.');
}
