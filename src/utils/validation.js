export const validateEmail = (email) => {
  if (!email) return false;
  const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.[A-Za-z]{2,})+$/;
  return re.test(String(email).toLowerCase());
};

export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  return null;
};

export const validatePhone = (phone) => {
  if (!phone) return false;
  const re = /^\+?[\d\s\-\(\)]+$/;
  return re.test(String(phone));
};

export const validateRequired = (value, fieldName = 'This field') => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};


