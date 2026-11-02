import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const PasswordInput = ({
  name = 'password',
  value,
  onChange,
  placeholder = '••••••••',
  required = false,
  className = '',
  id,
  autoComplete,
  disabled = false,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-full">
      <input
        type={showPassword ? 'text' : 'password'}
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`${className} pr-11`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        tabIndex={-1}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1 rounded-lg focus:outline-none"
        title={showPassword ? 'Hide password' : 'Show password'}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <FiEyeOff className="w-4 h-4 text-slate-500 dark:text-slate-300" />
        ) : (
          <FiEye className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;

