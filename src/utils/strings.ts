const SHORT_STR_SIZE = 31;

export function shortStrToFelt(str: string): string {
  let res = '0x';
  if (str.length > SHORT_STR_SIZE) throw 'String too big';
  for (let i = 0; i < str.length; i++) {
    let toAdd = str.charCodeAt(i).toString(16);
    // If value is < 10, prefix with a 0
    if (toAdd.length % 2 !== 0) toAdd = `0${toAdd}`;
    res += toAdd;
  }
  return res;
}

export function strToShortStringArr(str: string): string[] {
  const res: string[] = [];
  for (let i = 0; i < str.length; i += SHORT_STR_SIZE) {
    const temp = str.slice(i, i + SHORT_STR_SIZE);
    res.push(shortStrToFelt(temp));
  }
  return res;
}

export function shortStringToStr(shortStringArr: string): string {
  let res = '';
  const hexForm = shortStringArr.toString();
  const chunkSize = 2;
  if (hexForm.length % chunkSize !== 0) throw 'Error in Parsing';
  for (let i = 0; i < hexForm.length; i += chunkSize) {
    const s = parseInt(hexForm.slice(i, i + chunkSize), 16);
    res += String.fromCharCode(s);
  }
  return res;
}

export function shortStringArrToStr(shortStringArr: string[]): string {
  let res = '';
  for (const shortStr of shortStringArr) {
    res += shortStringToStr(shortStr);
  }
  return res;
}
