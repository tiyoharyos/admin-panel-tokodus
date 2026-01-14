'use client';

import { useCallback } from 'react';

// Import dinamis SweetAlert
const loadSweetAlert = async () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const module = await import('@/components/UI/SweetAlert');
    return module.default;
  } catch (error) {
    console.error('Failed to load SweetAlert:', error);
    return null;
  }
};

export const useSweetAlert = () => {
  const showAlert = useCallback(async (type, options = {}) => {
    try {
      const SweetAlert = await loadSweetAlert();
      if (!SweetAlert) {
        // Fallback ke alert biasa
        switch (type) {
          case 'error':
            alert(`Error: ${options.title || ''} - ${options.text || ''}`);
            return { isConfirmed: true };
          case 'confirm':
          case 'confirmDelete':
            const result = confirm(`${options.title || 'Confirm'}: ${options.text || ''}`);
            return { isConfirmed: result };
          default:
            alert(`${options.title || ''}: ${options.text || ''}`);
            return { isConfirmed: true };
        }
      }

      // Panggil fungsi SweetAlert sesuai type
      switch (type) {
        case 'success':
          return await SweetAlert.success(options);
        case 'error':
          return await SweetAlert.error(options);
        case 'warning':
          return await SweetAlert.warning(options);
        case 'info':
          return await SweetAlert.info(options);
        case 'confirm':
          return await SweetAlert.confirm(options);
        case 'confirmDelete':
          return await SweetAlert.confirmDelete(options);
        case 'loading':
          return await SweetAlert.loading(options);
        case 'toastSuccess':
          return await SweetAlert.toastSuccess(options);
        case 'toastError':
          return await SweetAlert.toastError(options);
        default:
          return await SweetAlert.success(options);
      }
    } catch (error) {
      console.error('SweetAlert error:', error);
      // Fallback sederhana
      if (type === 'confirm' || type === 'confirmDelete') {
        const result = confirm(`${options.title || 'Confirm'}: ${options.text || ''}`);
        return { isConfirmed: result };
      }
      alert(`${options.title || ''}: ${options.text || ''}`);
      return { isConfirmed: true };
    }
  }, []);

  const closeAlert = useCallback(async () => {
    try {
      const SweetAlert = await loadSweetAlert();
      if (SweetAlert && SweetAlert.close) {
        SweetAlert.close();
      }
    } catch (error) {
      console.error('Error closing alert:', error);
    }
  }, []);

  return {
    showAlert,
    closeAlert
  };
};