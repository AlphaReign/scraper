import save from './save';

export const persist = (data) => {
	setInterval(() => save(data), 10000);
};

export default persist;
