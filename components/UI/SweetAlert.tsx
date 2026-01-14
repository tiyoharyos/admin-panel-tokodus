'use client';

// Import dinamis untuk menghindari SSR issues
let Swal = null;

if (typeof window !== 'undefined') {
  import('sweetalert2').then(module => {
    Swal = module.default;
  });
}

const SweetAlert = {
  // Helper function untuk memastikan Swal sudah loaded
  ensureSwalLoaded: () => {
    return new Promise((resolve) => {
      if (Swal) {
        resolve();
      } else {
        const checkInterval = setInterval(() => {
          if (Swal) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      }
    });
  },

  // Success Alert
  success: async (options = {}) => {
    await SweetAlert.ensureSwalLoaded();
    if (!Swal) return { isConfirmed: true };
    
    return Swal.fire({
      icon: 'success',
      title: options.title || 'Success!',
      text: options.text || '',
      confirmButtonText: 'OK',
      confirmButtonColor: '#10B981',
      timer: options.timer,
      showConfirmButton: options.showConfirmButton !== false,
      ...options
    });
  },

  // Error Alert
  error: async (options = {}) => {
    await SweetAlert.ensureSwalLoaded();
    if (!Swal) {
      alert(options.title || 'Error: ' + (options.text || ''));
      return { isConfirmed: true };
    }
    
    return Swal.fire({
      icon: 'error',
      title: options.title || 'Error!',
      text: options.text || '',
      confirmButtonText: 'OK',
      confirmButtonColor: '#EF4444',
      ...options
    });
  },

  // Warning Alert
  warning: async (options = {}) => {
    await SweetAlert.ensureSwalLoaded();
    if (!Swal) return { isConfirmed: true };
    
    return Swal.fire({
      icon: 'warning',
      title: options.title || 'Warning!',
      text: options.text || '',
      confirmButtonText: 'OK',
      confirmButtonColor: '#F59E0B',
      ...options
    });
  },

  // Info Alert
  info: async (options = {}) => {
    await SweetAlert.ensureSwalLoaded();
    if (!Swal) return { isConfirmed: true };
    
    return Swal.fire({
      icon: 'info',
      title: options.title || 'Info',
      text: options.text || '',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3B82F6',
      ...options
    });
  },

  // Confirmation Alert
  confirm: async (options = {}) => {
    await SweetAlert.ensureSwalLoaded();
    if (!Swal) {
      const result = window.confirm((options.title || 'Confirm') + ': ' + (options.text || ''));
      return { isConfirmed: result, isDenied: false, isDismissed: !result };
    }
    
    return Swal.fire({
      icon: 'question',
      title: options.title || 'Are you sure?',
      text: options.text || '',
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || 'Yes',
      cancelButtonText: options.cancelButtonText || 'No',
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#6B7280',
      ...options
    });
  },

  // Delete Confirmation
  confirmDelete: async (options = {}) => {
    await SweetAlert.ensureSwalLoaded();
    if (!Swal) {
      const result = window.confirm((options.title || 'Delete?') + ': ' + (options.text || ''));
      return { isConfirmed: result, isDenied: false, isDismissed: !result };
    }
    
    return Swal.fire({
      icon: 'warning',
      title: options.title || 'Delete?',
      text: options.text || 'This action cannot be undone!',
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || 'Yes, Delete!',
      cancelButtonText: options.cancelButtonText || 'Cancel',
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      ...options
    });
  },

  // Loading Alert
  loading: async (options = {}) => {
    await SweetAlert.ensureSwalLoaded();
    if (!Swal) return null;
    
    return Swal.fire({
      title: options.title || 'Loading...',
      text: options.text || '',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
      ...options
    });
  },

  // Toast Success
  toastSuccess: async (options = {}) => {
    await SweetAlert.ensureSwalLoaded();
    if (!Swal) {
      console.log('Success:', options.title);
      return null;
    }
    
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
    
    return Toast.fire({
      icon: 'success',
      title: options.title || 'Success!',
      ...options
    });
  },

  // Toast Error
  toastError: async (options = {}) => {
    await SweetAlert.ensureSwalLoaded();
    if (!Swal) {
      console.error('Error:', options.title);
      return null;
    }
    
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
    
    return Toast.fire({
      icon: 'error',
      title: options.title || 'Error!',
      ...options
    });
  },

  // Close all alerts
  close: () => {
    if (Swal && Swal.close) {
      Swal.close();
    }
  }
};

export default SweetAlert;