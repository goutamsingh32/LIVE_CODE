import { decryptData, encryptData } from './utils/helper.js';
import axios from 'axios';

export const submitCode = async ({ language_id, sourceCode, stdin, token }) => {
  try {
    const payload = {
      language_id,
      sourceCode: encryptData(sourceCode),
      stdin: stdin ? encryptData(stdin) : null,
      token: token ? token : null
    }
    return await axios.request({
      method: 'POST',
      url: 'http://localhost:5000/compile:',
      data: payload
    })
  } catch (err) {
    console.log('[submitCode]', err);
    return null
  }
}



/**
 * Get data from localstorage (stored in encrypted format) 
 * @param {string} key 
 */
export const getFromLocalStorage = function (key) {
  if (!key) return null;

  const keyEncrypted = encryptData(typeof key == 'string' ? key : key?.toString());

  return decryptData(localStorage.getItem(keyEncrypted));
}

/**
 * Remove data from localstorage (stored in encrypted format) 
 * @param {string} key 
 */
export const removeFromLocalStorage = function (key) {
  if (!key) return null;

  const keyEncrypted = encryptData(typeof key == 'string' ? key : key?.toString());

  return localStorage.removeItem(keyEncrypted);
}

/**
 * Set data in localstorage in encrypted format
 * @param {string} key 
 * @param {string} value 
 */
export const setLocalStorage = function (key, value) {
  if (!(key && value)) return;
  const keyEncrypted = encryptData(typeof key == 'string' ? key : key?.toString());
  const valueEncrypted = encryptData(typeof value == 'string' ? key : key?.toString());

  localStorage.setItem(keyEncrypted, valueEncrypted);
}