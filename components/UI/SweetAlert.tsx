// components/UI/SweetAlert.tsx
'use client'

import Swal from 'sweetalert2'

const SweetAlert = {
  success: (title: string, text: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonColor: '#10B981',
      confirmButtonText: 'OK',
      timer: 3000,
      timerProgressBar: true,
    });
  },

  error: (title: string, text: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'OK',
    });
  },

  warning: (title: string, text: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      confirmButtonColor: '#F59E0B',
      confirmButtonText: 'OK',
    });
  },

  info: (title: string, text: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'info',
      confirmButtonColor: '#3B82F6',
      confirmButtonText: 'OK',
    });
  },

  confirmDelete: (text?: string) => {
    return Swal.fire({
      title: 'Are you sure?',
      text: text || "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });
  },

  confirmAction: (title: string, text: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, proceed',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });
  },

  loading: (title: string) => {
    Swal.fire({
      title,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  },

  close: () => {
    Swal.close();
  },

  // For form validation errors
  validationError: (title: string, errors: string[]) => {
    return Swal.fire({
      title,
      html: `<div class="text-left"><ul class="list-disc pl-4 space-y-1">${errors.map(error => `<li>${error}</li>`).join('')}</ul></div>`,
      icon: 'error',
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'OK',
    });
  },

  // For success with custom button
  successCustom: (title: string, text: string, confirmButtonText?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonColor: '#10B981',
      confirmButtonText: confirmButtonText || 'OK',
    });
  }
};

export default SweetAlert;