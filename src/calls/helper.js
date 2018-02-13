import {newHttpError} from '../lib/http-error';
import {Operator} from '../operator/models';

export const getAgentNumber = async(req) => {
  const repo = new Operator();
  const id = req.user.id;
  const operator = await repo.findById(id);

  if (operator) {
    return operator.agentNumber;
  }
  throw newHttpError(401);
};
