import * as fs from 'fs';

export function existsSync(filePath){
  try{
    fs.statSync(filePath);
  }catch(err){
    if(err.code == 'ENOENT') return false;
  }
  return true;
};

export function startsWith(array, withArray):boolean {
  if (array.length < withArray.length) return false;
  for (let i = 0; i < withArray.length; i++) {
    if (array[i] !== withArray[i]) return false;
  }
  return true;
}
