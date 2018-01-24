
import t from 'tcomb';

t.BuildingType = t.enums({
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal'
}, 'BuildingType');

t.BuildingState = t.enums({
  BUENO: 'CORRECT',
  MALO: 'INCORRECT'
}, 'BuildingState');
