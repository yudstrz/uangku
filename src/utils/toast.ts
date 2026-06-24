import toast from 'react-hot-toast';

export const showToast = {
  success: (msg: string, options?: any) => toast.success(msg),
  error: (msg: string, options?: any) => toast.error(msg),
  info: (msg: string, options?: any) => toast(msg),
  warn: (msg: string, options?: any) => toast(msg, { icon: '⚠️' }),
};
