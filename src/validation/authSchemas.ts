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
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

export const registerValidationSchema = Yup.object({
  fullName: Yup.string()
    .trim()
    .required("Vui lòng nhập họ và tên")
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên không được vượt quá 100 ký tự")
    .matches(
      /^[\p{L}\s.'-]+$/u,
      "Họ và tên chỉ được chứa chữ cái, khoảng trắng và dấu . ' -",
    ),
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
