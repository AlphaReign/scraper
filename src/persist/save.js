import fs from 'fs';

const save = (data) => fs.writeFileSync('./data.json', JSON.stringify(data, null, `\t`));

export default save;
