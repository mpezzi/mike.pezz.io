import axios from 'axios';

const API_URL = process.env.API_URL;
const API_TOKEN = process.env.API_TOKEN;

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
  },
});

export function getProjects() {
  return client.get('/projects');
}
