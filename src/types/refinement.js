import t from 'tcomb';
import _isNil from 'lodash/isNil';

const passwordRegex = new RegExp('^(?=.*[A-Za-z])(?=.*\\d).{8,}$');

t.Positive = t.refinement(t.union([t.Number, t.String]), n => parseFloat(n) >= 0, 'Positive');
t.StringNotEmpty = t.refinement(t.String, n => !_isNil(n), 'StringNotEmpty');
t.StringSplitList = t.refinement(t.String, n => /,/.test(n), 'StringSplitList');
t.Password = t.refinement(t.String, n => passwordRegex.test(n), 'Password');
