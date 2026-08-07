"use client";
import React, { useState, useRef, useEffect, createRef } from "react";

interface OTPInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  length?: number;
  onCodeFilled?: (code: string) => void;
  error?: string;
  success?: string;
  variant?: "default" | "error" | "success";
  spaceX?: number;
}

const colors = {
  gray: "#6C849D2E",
  lightGray: "#6C849D1F",
  primary: "#0083ff",
  lightPrimary: "rgba(0, 123, 255, 0.1)",
  error: "#dc3545",
  lightError: "rgba(220, 53, 69, 0.1)",
  success: "#28a745",
  lightSuccess: "rgba(40, 167, 69, 0.1)",
};

const OTPInput: React.FC<OTPInputProps> = ({
  length = 4,
  onCodeFilled,
  error,
  success,
  className,
  spaceX = 2,
  ...rest
}) => {
  const finalLength = Math.max(4, Math.min(6, length));
  const [otp, setOtp] = useState<string[]>(new Array(finalLength).fill(""));
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const inputRefs = useRef<Array<React.RefObject<HTMLInputElement | null>>>(
    Array(finalLength)
      .fill(0)
      .map(() => createRef<HTMLInputElement>())
  );

  useEffect(() => {
    if (inputRefs.current[0]?.current) {
      inputRefs.current[0].current.focus();
      setFocusedIndex(0);
    }
  }, []);

  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  useEffect(() => {
    const fullCode = otp.join("");
    if (fullCode.length === finalLength && fullCode !== submittedCode) {
      setSubmittedCode(fullCode);
      if (onCodeFilled) {
        onCodeFilled(fullCode);
      }
    }
  }, [otp, finalLength, submittedCode, onCodeFilled]);

  const handleChange = (text: string, index: number) => {
    const digits = text.replace(/\D/g, ""); // only numbers
    const newOtp = [...otp];

    if (digits.length === 1) {
      // Normal single digit input
      newOtp[index] = digits;
      setOtp(newOtp);

      if (index < finalLength - 1) {
        inputRefs.current[index + 1].current?.focus();
        setFocusedIndex(index + 1);
      }
    } else if (digits.length > 1) {
      // User pasted or autofilled multiple digits
      for (let i = 0; i < digits.length && index + i < finalLength; i++) {
        newOtp[index + i] = digits[i];
      }
      setOtp(newOtp);

      const lastIndex = Math.min(index + digits.length - 1, finalLength - 1);
      inputRefs.current[lastIndex]?.current?.focus();
      setFocusedIndex(lastIndex);
    } else {
      // Backspace clears
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1].current?.focus();
      setFocusedIndex(index - 1);
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number
  ) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("Text").replace(/\D/g, "");
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      if (index + i < finalLength) {
        newOtp[index + i] = pastedData[i];
      }
    }
    setOtp(newOtp);

    const lastFilledIndex = Math.min(
      index + pastedData.length - 1,
      finalLength - 1
    );
    inputRefs.current[lastFilledIndex]?.current?.focus();
    setFocusedIndex(lastFilledIndex);
  };

  const getCellBorderColor = (index: number) => {
    if (error) return colors.error;
    if (success) return colors.success;
    if (focusedIndex === index) return colors.primary;
    return colors.gray;
  };

  const getCellBackgroundColor = (index: number) => {
    if (error) return colors.lightError;
    if (success) return colors.lightSuccess;
    if (focusedIndex === index) return colors.lightPrimary;
    return colors.lightGray;
  };

  const gapClasses: Record<number, string> = {
    1: "gap-1",
    2: "gap-2",
    3: "gap-3",
    4: "gap-4",
    5: "gap-5",
    6: "gap-6",
    7: "gap-7",
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`flex ${gapClasses[spaceX] || "gap-2"}`}>
        {Array.from({ length: finalLength }).map((_, index) => (
          <div
            key={index}
            className="w-12 h-12 flex items-center justify-center"
            style={{
              borderBottom: `2px solid ${getCellBorderColor(index)}`,
              backgroundColor: getCellBackgroundColor(index),
            }}
            onClick={() => inputRefs.current[index].current?.focus()}
          >
            <input
              ref={inputRefs.current[index]}
              id={`otp-${index}`} // ✅ unique id
              name={`otp-${index}`} // ✅ unique name
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code" // ✅ helps autofill OTP
              maxLength={1}
              value={otp[index]}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={(e) => handlePaste(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(-1)}
              className={`w-full h-full text-center text-2xl outline-none bg-transparent ${className}`}
              {...rest}
            />
          </div>
        ))}
      </div>
      {/* {(error || success) && ( */}
        <p
          className={`${error ? "text-red-500" : "text-green-500"} text-sm mt-2 h-5`}
        >
          {success || error}
        </p>
      {/* )} */}
    </div>
  );
};

export default OTPInput;
