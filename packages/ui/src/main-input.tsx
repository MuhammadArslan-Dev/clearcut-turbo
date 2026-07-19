"use client";
import clsx from "clsx";
import React, { useState } from "react";
import type { InputHTMLAttributes } from "react";

interface MainInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  imageIcon?: string;
  error?: string;
  success?: string;
  variant?: "default" | "error" | "success";
  showIcon?: boolean;
  showError?: boolean;
  inputType?: "text" | "number" | "password" | "phone";
  maxLength?: number;
  inputClassName?: string;
  inputPrefix?: React.ReactNode;
}

const colors = {
  gray: "#6C849D2E",
  lightGray: "#6C849D1F",
  primary: "var(--color-brand)",
  lightPrimary: "rgba(0, 123, 255, 0.1)",
  error: "#dc3545",
  lightError: "rgba(220, 53, 69, 0.1)",
  success: "#28a745",
  lightSuccess: "rgba(40, 167, 69, 0.1)",
  border: "#ced4da",
  text: "#212529",
  placeholder: "#6c757d",
};

const MainInput = React.forwardRef<HTMLInputElement, MainInputProps>(({
  label,
  icon,
  imageIcon,
  error,
  success,
  variant = "default",
  showIcon = true,
  showError = true,
  inputType = "text",
  maxLength,
  className,
  inputClassName,
  onChange,
  inputPrefix,
  ...rest
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return colors.error;
    if (success) return colors.success;
    if (variant === "error") return colors.error;
    if (variant === "success") return colors.success;
    if (isFocused) return colors.primary;
    return colors.gray;
  };

  const getBackgroundColor = () => {
    if (error) return colors.lightError;
    if (success) return colors.lightSuccess;
    if (isFocused) return colors.lightPrimary;
    return colors.lightGray;
  };

  // ✅ phone-safe change handler
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // only digits
    if (maxLength && value.length > maxLength) {
      value = value.slice(0, maxLength);
    }
    if (onChange) {
      onChange({
        ...e,
        target: { ...e.target, value }, // enforce cleaned value
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const getInputType = () => {
    if (inputType === "phone") return "tel"; // ✅ shows numeric keypad on mobile, no spinners
    if (inputType === "number") return "number";
    return inputType;
  };

  return (
    <div className="h-full">
      {label && (
        <label className="block mb-2 text-base text-gray-900">{label}</label>
      )}
      <div
        className={`flex items-center border-b-2 px-3  py-1.5 transition-colors ${
          className ?? ""
        }`}
        style={{
          borderBottomColor: getBorderColor(),
          backgroundColor: getBackgroundColor(),
        }}
      >
        {showIcon && (icon || imageIcon) && (
          <div className="mr-3 flex items-center">
            {icon}
            {imageIcon && (
              <img
                src={imageIcon}
                alt="icon"
                className="w-6 h-6 object-contain"
              />
            )}
          </div>
        )}

        {inputPrefix && (
          <span className="body-large !font-semibold text-[var(--color-text-gray-normal)] mr-1 shrink-0">
            {inputPrefix}
          </span>
        )}

        <input
          ref={ref}
          type={getInputType()}
          inputMode={inputType === "phone" ? "numeric" : undefined}
          maxLength={inputType === "phone" ? maxLength : undefined}
          className={clsx(
            "flex-1  bg-transparent outline-none placeholder-gray-500",
            inputClassName ?? "text-base text-gray-900",
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={inputType === "phone" ? handlePhoneChange : onChange}
          {...rest}
        />
      </div>
      {showError && (error || success) && (
        <p
          className={clsx(
            "absolute left-0 top-full mt-1 text-xs leading-tight z-10",
            error ? "text-red-600" : "text-green-600",
          )}
        >
          {error || success}
        </p>
      )}
    </div>
  );
});

MainInput.displayName = "MainInput";

export default MainInput;
