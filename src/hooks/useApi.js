import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

// ============ Dashboard ============
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/').then(r => r.data),
    refetchInterval: 30000, // Refresh every 30s
  });
}

// ============ Auth ============
export function useLoginStatus(id, options = {}) {
  return useQuery({
    queryKey: ['login-status', id],
    queryFn: () => api.get(`/auth/login-status/${id}/`).then(r => r.data),
    enabled: !!id,
    ...options,
  });
}

export function usePendingLogins() {
  return useQuery({
    queryKey: ['pending-logins'],
    queryFn: () => api.get('/auth/pending-logins/').then(r => r.data),
    refetchInterval: 10000, // Check every 10 seconds
  });
}

export function useApproveLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/auth/login-approve/${id}/`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard'] }),
  });
}

export function useRejectLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/auth/login-reject/${id}/`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard'] }),
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (formData) => api.patch('/auth/me/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),
  });
}

export function useDeleteProfilePhoto() {
  return useMutation({
    mutationFn: () => api.delete('/auth/me/photo/').then(r => r.data),
  });
}

// ============ Services (catalog) ============
export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/services/?page_size=100').then(r => r.data),
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/services/', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/services/${id}/`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/services/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

// ============ Service Entries ============
export function useEntries(params = {}) {
  return useQuery({
    queryKey: ['entries', params],
    queryFn: () => api.get('/entries/', { params }).then(r => r.data),
  });
}

export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      // Handle file upload with FormData
      if (data instanceof FormData) {
        return api.post('/entries/', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data);
      }
      return api.post('/entries/', data).then(r => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entries'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateEntryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.patch(`/entries/${id}/status/`, { status }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entries'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/entries/${id}/`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entries'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ============ Customers ============
export function useCustomers(params = {}) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => api.get('/customers/', { params }).then(r => r.data),
  });
}

export function useCustomerDetail(id) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get(`/customers/${id}/`).then(r => r.data),
    enabled: !!id,
  });
}

export function useCustomerLookup() {
  return useMutation({
    mutationFn: (phone) => api.get('/customers/', { params: { search: phone } }).then(r => r.data),
  });
}

// ============ Reports ============
export function useDailyReport(startDate, endDate) {
  return useQuery({
    queryKey: ['report-daily', startDate, endDate],
    queryFn: () => api.get('/reports/daily/', { params: { start_date: startDate, end_date: endDate } }).then(r => r.data),
  });
}

export function useMonthlyReport(month, year) {
  return useQuery({
    queryKey: ['report-monthly', month, year],
    queryFn: () => api.get('/reports/monthly/', { params: { month, year } }).then(r => r.data),
  });
}

export function useStaffDailyReport(startDate, endDate) {
  return useQuery({
    queryKey: ['report-staff-daily', startDate, endDate],
    queryFn: () => api.get('/reports/staff-daily/', { params: { start_date: startDate, end_date: endDate } }).then(r => r.data),
  });
}

export function useYearlyReport(year) {
  return useQuery({
    queryKey: ['report-yearly', year],
    queryFn: () => api.get('/reports/yearly/', { params: { year } }).then(r => r.data),
  });
}

// ============ Staff ============
export function useStaffList() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: () => api.get('/staff/').then(r => r.data),
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/staff/', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/staff/${id}/`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/staff/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useResetStaffPassword() {
  return useMutation({
    mutationFn: ({ id, new_password }) =>
      api.post(`/staff/${id}/reset-password/`, { new_password }).then(r => r.data),
  });
}

export function useForceLogoutStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/staff/${id}/logout/`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

// ============ Attendance ============
export function useTodayAttendance() {
  return useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => api.get('/attendance/today/').then(r => r.data),
    refetchInterval: 60000,
  });
}

export function useAttendance(params = {}) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: () => api.get('/attendance/', { params }).then(r => r.data),
  });
}

// ============ Expenses ============
export function useExpenses(params = {}) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () => api.get('/expenses/', { params }).then(r => r.data),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/expenses/', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/expenses/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ============ Settings ============
export function useOpeningBalance(date) {
  return useQuery({
    queryKey: ['opening-balance', date],
    queryFn: () => api.get('/settings/opening-balance/', { params: { date } }).then(r => r.data),
  });
}

export function useSaveOpeningBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/settings/opening-balance/', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opening-balance'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useStaffPermissions() {
  return useQuery({
    queryKey: ['staff-permissions'],
    queryFn: () => api.get('/settings/permissions/').then(r => r.data),
  });
}

export function useAddStaffPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/settings/permissions/', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-permissions'] }),
  });
}

export function useDeleteStaffPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/settings/permissions/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-permissions'] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data) => api.post('/settings/change-password/', data).then(r => r.data),
  });
}

// ============ Public Site ============
export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: () => api.get('/public-site/settings/').then(r => r.data),
  });
}

export function useUpdateSiteSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      if (data instanceof FormData) {
        return api.put('/public-site/settings/', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).then(r => r.data);
      }
      return api.put('/public-site/settings/', data).then(r => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['site-settings'] }),
  });
}

export function useWhyChooseUsPoints() {
  return useQuery({
    queryKey: ['why-choose-us'],
    queryFn: () => api.get('/public-site/why-choose-us/').then(r => r.data),
  });
}

export function useCreateWhyChooseUsPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/public-site/why-choose-us/', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['why-choose-us'] }),
  });
}

export function useDeleteWhyChooseUsPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/public-site/why-choose-us/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['why-choose-us'] }),
  });
}

export function useUpdateWhyChooseUsPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/public-site/why-choose-us/${id}/`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['why-choose-us'] }),
  });
}

export function usePublicServices() {
  return useQuery({
    queryKey: ['public-services'],
    queryFn: () => api.get('/public-site/services/').then(r => r.data),
  });
}

export function useCreatePublicService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/public-site/services/', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['public-services'] }),
  });
}

export function useUpdatePublicService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/public-site/services/${id}/`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['public-services'] }),
  });
}

export function useDeletePublicService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/public-site/services/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['public-services'] }),
  });
}

export function useJobUpdates() {
  return useQuery({
    queryKey: ['job-updates'],
    queryFn: () => api.get('/public-site/jobs/').then(r => r.data),
  });
}

export function useCreateJobUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      if (data instanceof FormData) {
        return api.post('/public-site/jobs/', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).then(r => r.data);
      }
      return api.post('/public-site/jobs/', data).then(r => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-updates'] }),
  });
}

export function useUpdateJobUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => {
      if (data instanceof FormData) {
        return api.put(`/public-site/jobs/${id}/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).then(r => r.data);
      }
      return api.put(`/public-site/jobs/${id}/`, data).then(r => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-updates'] }),
  });
}

export function useDeleteJobUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/public-site/jobs/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-updates'] }),
  });
}

export function useEducationApps() {
  return useQuery({
    queryKey: ['education-apps'],
    queryFn: () => api.get('/public-site/education/').then(r => r.data),
  });
}

export function useCreateEducationApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      if (data instanceof FormData) {
        return api.post('/public-site/education/', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).then(r => r.data);
      }
      return api.post('/public-site/education/', data).then(r => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['education-apps'] }),
  });
}

export function useUpdateEducationApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => {
      if (data instanceof FormData) {
        return api.put(`/public-site/education/${id}/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).then(r => r.data);
      }
      return api.put(`/public-site/education/${id}/`, data).then(r => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['education-apps'] }),
  });
}

export function useDeleteEducationApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/public-site/education/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['education-apps'] }),
  });
}
