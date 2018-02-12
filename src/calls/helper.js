import {newHttpError} from '../lib/http-error';

export const getAgentNumber = (req) => {
  if (req.user && req.user.agentNumber) {
    return req.user.agentNumber;
  }
  throw newHttpError(401);
};
