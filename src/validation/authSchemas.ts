import * as Yup from "yup";

const emailField = Yup.string()
  .trim()
  .required("Vui lòng nhập email")
  .email("Email không đúng định dạng (ví dụ: ten.ho@sinhvien.edu.vn)")
  .max(255, "Email không được vượt quá 255 ký tự");

const strongPasswordField = Yup.string()
  .required("Vui lòng nhập mật khẩu")
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
  .max(128, "Mật khẩu không được vượt quá 128 ký tự")
  .matches(/[a-z]/, "Mật khẩu phải có ít nhất một chữ thường (a-z)")
  .matches(/[A-Z]/, "Mật khẩu phải có ít nhất một chữ hoa (A-Z)")
  .matches(/[0-9]/, "Mật khẩu phải có ít nhất một chữ số (0-9)")
  .matches(
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
    "Mật khẩu phải có ít nhất một ký tự đặc biệt (!@#$...)",
  );

export const loginInitialValues = {
  email: "",
  password: "",
};

export const loginValidationSchema = Yup.object({
  email: emailField,
  password: Yup.string()
    .required("Vui lòng nhập mật khẩu")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .max(128, "Mật khẩu không được vượt quá 128 ký tự"),
});

export type LoginFormValues = Yup.InferType<typeof loginValidationSchema>;

export const registerInitialValues = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

const usernameField = Yup.string()
  .trim()
  .required("Vui lòng nhập tên đăng nhập")
  .min(3, "Tên đăng nhập phải từ 3 đến 30 ký tự")
  .max(30, "Tên đăng nhập phải từ 3 đến 30 ký tự")
  .matches(
    /^[a-zA-Z0-9_]+$/,
    "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới (_)"
  );

export const registerValidationSchema = Yup.object({
  fullName: Yup.string()
    .trim()
    .required("Vui lòng nhập họ và tên")
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên không được vượt quá 100 ký tự")
    .matches(
      /^[\p{L}\s.'-]+$/u,
      "Họ và tên chỉ được chứa chữ cái, khoảng trắng và dấu . ' -"
    ),
  username: usernameField,
  email: emailField,
  password: strongPasswordField,
  confirmPassword: Yup.string()
    .required("Vui lòng xác nhận mật khẩu")
    .oneOf([Yup.ref("password")], "Mật khẩu xác nhận không khớp"),
  acceptTerms: Yup.boolean()
    .oneOf([true], "Bạn cần đồng ý với điều khoản sử dụng")
    .required("Bạn cần đồng ý với điều khoản sử dụng"),
});

export type RegisterFormValues = Yup.InferType<typeof registerValidationSchema>;

// Verify Email
export const verifyEmailInitialValues = {
  otp: "",
};

export const verifyEmailValidationSchema = Yup.object({
  otp: Yup.string()
    .trim()
    .required("Vui lòng nhập mã OTP")
    .length(6, "Mã OTP phải gồm đúng 6 ký tự"),
});

export type VerifyEmailFormValues = Yup.InferType<typeof verifyEmailValidationSchema>;

// Forgot Password
export const forgotPasswordInitialValues = {
  email: "",
};

export const forgotPasswordValidationSchema = Yup.object({
  email: emailField,
});

export type ForgotPasswordFormValues = Yup.InferType<typeof forgotPasswordValidationSchema>;

// Reset Password
export const resetPasswordInitialValues = {
  otp: "",
  newPassword: "",
  confirmPassword: "",
};

export const resetPasswordValidationSchema = Yup.object({
  otp: Yup.string()
    .trim()
    .required("Vui lòng nhập mã OTP")
    .length(6, "Mã OTP phải gồm đúng 6 ký tự"),
  newPassword: strongPasswordField,
  confirmPassword: Yup.string()
    .required("Vui lòng xác nhận mật khẩu mới")
    .oneOf([Yup.ref("newPassword")], "Mật khẩu xác nhận không khớp"),
});

export type ResetPasswordFormValues = Yup.InferType<typeof resetPasswordValidationSchema>;

