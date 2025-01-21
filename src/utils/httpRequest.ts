import axios from 'axios';


async function postRequest(url: string, data: any, headers: { [key: string]: string }): Promise<any> {
  const response = await axios.post(url, data, {
    headers,
  });
  return response.data;
}


async function putRequest(url: string, data: any, headers: { [key: string]: string }): Promise<any> {
  const response = await axios.put(url, data, {
    headers,
  });
  return response.data;
}


async function deleteRequest(url: string, data: any, headers: { [key: string]: string }): Promise<any> {
  const response = await axios.delete(url, {
    headers,
    data,
  });

  return response.data;
}


async function getRequest(url: string, headers: { [key: string]: string }): Promise<any> {
  const response = await axios.get(url, {
    headers,
  });
  return response.data;
}

export { postRequest, putRequest, getRequest, deleteRequest };
