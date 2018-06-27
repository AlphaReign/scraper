import log from 'fancy-log';

export const errorLogger = (error) => (error ? log(error) : undefined);

export default { errorLogger };
