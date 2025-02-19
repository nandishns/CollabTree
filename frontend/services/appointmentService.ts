import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export type AppointmentStatus = 'BOOKED' | 'CANCELLED' | 'COMPLETED';

export type AppointmentDoctor = {
  id: number;
  name: string;
  specialization: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

export type AppointmentPatient = {
  id: number;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone_number: string | null;
  created_at: string;
}

export type Appointment = {
  id: number;
  appointmentDate: string;
  time: string;
  status: AppointmentStatus;
  metadata: any;
  createdAt: string;
  updatedAt: string | null;
  doctor: AppointmentDoctor;
  patient: AppointmentPatient;
}

export const appointmentService = {
  async createAppointment(data: {
    doctorId: number;
    patientName: string;
    appointmentDate: string;
    time: string;
  }) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.post<Appointment>(
      `${API_URL}/appointments/create`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  async getAppointments(params?: {
    doctorId?: number;
    patientId?: number;
    status?: AppointmentStatus;
  }) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get<Appointment[]>(
      `${API_URL}/appointments/get`,
      {
        params,
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  async updateAppointment(id: number, updates: Partial<Appointment>) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.put<Appointment>(
      `${API_URL}/appointments/update/${id}`,
      {
        appointmentDate: updates.appointmentDate,
        time: updates.time
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  async cancelAppointment(id: number) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.delete<Appointment>(
      `${API_URL}/appointments/cancel/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  async getAllAppointments() {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get<Appointment[]>(
      `${API_URL}/appointments/admin/all`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  async getAppointmentsByDoctor(doctorId: number) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get<Appointment[]>(
      `${API_URL}/appointments/admin/doctor/${doctorId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  async getAppointmentsByPatient(patientId: number) {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get<Appointment[]>(
      `${API_URL}/appointments/admin/patient/${patientId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  }
};