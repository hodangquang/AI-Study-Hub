import type { ReactNode } from "react";
import type { FormikProps } from "formik";

type AuthFieldProps<T extends Record<string, unknown>> = {
  formik: FormikProps<T>;
  name: keyof T & string;
  label: string;
  type?: string;
  placeholder?: string;
  icon: ReactNode;
  autoComplete?: string;
  disabled?: boolean;
  rightElement?: ReactNode;
  hint?: string;
};

export function AuthField<T extends Record<string, unknown>>({
  formik,
  name,
  label,
  type = "text",
  placeholder,
  icon,
  autoComplete,
  disabled,
  rightElement,
  hint,
}: AuthFieldProps<T>) {
  const touched = formik.touched[name as keyof typeof formik.touched];
  const error = formik.errors[name as keyof typeof formik.errors];
  const hasError = Boolean(touched && error);
  const value = formik.values[name as keyof T];

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-300 mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          {icon}
        </span>
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled || formik.isSubmitting}
          value={String(value ?? "")}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : hint ? `${name}-hint` : undefined}
          className={`w-full pl-10 pr-10 py-2.5 bg-slate-800/60 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-60 ${
            hasError
              ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/20"
              : "border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20"
          }`}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {hint && !hasError && (
        <p id={`${name}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {hasError && (
        <p id={`${name}-error`} className="mt-1 text-xs text-red-400" role="alert">
          {String(error)}
        </p>
      )}
    </div>
  );
}

export function AuthCheckboxField<T extends Record<string, unknown>>({
  formik,
  name,
  label,
  disabled,
}: {
  formik: FormikProps<T>;
  name: keyof T & string;
  label: ReactNode;
  disabled?: boolean;
}) {
  const touched = formik.touched[name as keyof typeof formik.touched];
  const error = formik.errors[name as keyof typeof formik.errors];
  const hasError = Boolean(touched && error);
  const checked = Boolean(formik.values[name as keyof T]);

  return (
    <div>
      <label className="flex items-start gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          disabled={disabled || formik.isSubmitting}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/30"
        />
        <span className="text-sm text-slate-400 leading-snug">{label}</span>
      </label>
      {hasError && (
        <p className="mt-1 text-xs text-red-400 ml-6" role="alert">
          {String(error)}
        </p>
      )}
    </div>
  );
}
