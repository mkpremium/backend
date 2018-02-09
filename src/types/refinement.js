import t from 'tcomb';

t.Positive = t.refinement(t.union([t.Number, t.String]), n => parseFloat(n) >= 0, 'Positive');

t.StringSplitList = t.refinement(t.String, n => /,/.test(n), 'StringSplitList');
