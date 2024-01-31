import squel from 'squel'

class SelectLetQuery extends squel.cls.QueryBuilder {
  constructor (options, block) {
    super(options, block || [
      new squel.cls.StringBlock(options, 'SELECT'),
      new squel.cls.GetFieldBlock(options),
      new squel.cls.TargetTableBlock(options),
      new squel.cls.FromTableBlock(options),
      new LetBlock(options),
      new squel.cls.WhereBlock(options),
      new squel.cls.OrderByBlock(options),
      new squel.cls.OffsetBlock(options),
      new squel.cls.LimitBlock(options)
    ])
  }
}

class SelectUseKeyQuery extends squel.cls.QueryBuilder {
  constructor (options, block) {
    super(options, block || [
      new squel.cls.StringBlock(options, 'SELECT'),
      new squel.cls.GetFieldBlock(options),
      new squel.cls.TargetTableBlock(options),
      new squel.cls.FromTableBlock(options),
      new UseKeyBlock(options),
      new squel.cls.WhereBlock(options),
      new squel.cls.OrderByBlock(options),
      new squel.cls.OffsetBlock(options),
      new squel.cls.LimitBlock(options)
    ])
  }
}

class UseKeyBlock extends squel.cls.Block {
  useKey (name) {
    this._keyName = name
  }

  _toParamString () {
    if (!this._keyName) {
      return {
        text: '',
        values: []
      }
    }
    return {
      text: `USE KEYS ${this._keyName}`,
      values: []
    }
  }
}

class LetBlock extends squel.cls.Block {
  constructor (options) {
    super(options)
    this._exprs = []
  }

  letQuery (name, expr) {
    this._exprs.push({ name, expr })
  }

  _toParamString () {
    if (!this._exprs.length === 0) {
      return {
        text: '',
        values: []
      }
    }

    const text = this._exprs.map(({ name, expr }) => `${name} = (${expr})`).join(', ')
    const values = []
    this._exprs.forEach(({ expr }) => {
      values.concat(expr.toParam().values)
    })
    return {
      text: `LET ${text}`,
      values
    }
  }
}

squel.let = function (options) {
  return new SelectLetQuery(options)
}

squel.useKey = function (options) {
  return new SelectUseKeyQuery(options)
}
