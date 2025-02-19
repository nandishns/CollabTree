import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export type DoctorScheduleSlot = {
  time: string;
  status: 'Available' | 'Booked';
}

export type DoctorSchedule = {
  id: number;
  slots: DoctorScheduleSlot[];
  metadata: any;
  createdAt: string;
  updatedAt: string | null;
}

export type Doctor = {
  id: number;
  name: string;
  specialization: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  schedules: DoctorSchedule[];
}

export const doctorService = {
  async getDoctors() {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get<Doctor[]>(`${API_URL}/doctors`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async getDoctorSchedule(doctorId: number, date: string) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get<DoctorSchedule>(`${API_URL}/doctors/${doctorId}/schedule/${date}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async bookAppointment(doctorId: number, date: string, time: string, patientName: string) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.post(`${API_URL}/appointments`, {
      doctorId,
      date,
      time,
      patientName
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
}; 