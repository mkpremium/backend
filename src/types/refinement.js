import t from 'tcomb';

t.Positive = t.refinement(t.union([t.Number, t.String]), n => parseFloat(n) >= 0, 'Positive');
