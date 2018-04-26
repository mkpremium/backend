export function equality(actual, expected) {
  JSON.stringify(actual).should.be.equal(JSON.stringify(expected));
}

export function nonEquality(actual, expected) {
  JSON.stringify(actual).should.be.not.equal(JSON.stringify(expected));
}

export function oldAppResponse(body, error = false) {
  body.should.be.a('object');
  body.should.have.a.property('Error');
  body.should.have.a.property('Message');
  body.Error.should.equal(error);
}
