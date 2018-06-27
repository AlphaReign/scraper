import log from './log';

export const errorLogger = (error) => (error ? log(error, true) : undefined);

export default { errorLogger };
