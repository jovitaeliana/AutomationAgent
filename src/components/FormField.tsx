import React from 'react';

const inputStyle = "w-full px-3 py-2 border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-app-bg-content";

interface InputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}
export const InputField: React.FC<InputFieldProps> = ({ label, type = "text", placeholder, value, onChange, ...rest }) => (
  <div>
    <label className="block text-sm font-medium text-app-text mb-2">{label}</label>
    <input type={type} className={inputStyle} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
  </div>
);

interface TextareaFieldProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}
export const TextareaField: React.FC<TextareaFieldProps> = ({ label, rows = 3, placeholder, value, onChange, ...rest }) => (
  <div>
    <label className="block text-sm font-medium text-app-text mb-2">{label}</label>
    <textarea className={inputStyle} rows={rows} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} {...rest}></textarea>
  </div>
);

interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export const SelectField: React.FC<SelectFieldProps> = ({ label, options, value, onChange, ...rest }) => (
  <div>
    <label className="block text-sm font-medium text-app-text mb-2">{label}</label>
    <select 
      className={inputStyle} 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    >
      <option value="" disabled>Select an option...</option>
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  </div>
);