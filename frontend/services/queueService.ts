import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export type QueuePatient = {
  id: number;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone_number: string;
  created_at: string;
}

export type QueueItem = {
  id: number;
  queueNumber: number;
  status: 'WAITING' | 'WITH_DOCTOR' | 'COMPLETED';
  priority: 'NORMAL' | 'URGENT';
  arrived_at: string;
  patient: QueuePatient;
  doctor: any; // You can type this properly based on your doctor structure
}

export const queueService = {
  async addToQueue(patientData: {
    patientName: string;
    age: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    mobileNumber: string;
  }) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.post(`${API_URL}/queue/addQueue`, patientData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async getQueue() {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(`${API_URL}/queue/getQueue`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async updateQueue(id: number, updates: Partial<QueueItem>) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.patch(`${API_URL}/queue/${id}`, updates, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async removeFromQueue(id: number) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.delete(`${API_URL}/queue/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
}; 