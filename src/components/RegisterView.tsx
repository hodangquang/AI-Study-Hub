import { useState } from "react";
import { Formik, Form } from "formik";
import { Mail, Lock, User, Eye, EyeOff, Chrome, Github } from "lucide-react";
import {
  registerInitialValues,
  registerValidationSchema,
  type RegisterFormValues,
} from "../validation/authSchemas";
import { AuthField, AuthCheckboxField } from "./auth/AuthField";

interface RegisterViewProps {
  onRegister: (user: {
    fullName: string;
    email: string;
    avatarUrl: string;
  }) => void;
  onSwitchToLogin: () => void;
}

export default function RegisterView({
  onRegister,
  onSwitchToLogin,
}: RegisterViewProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (values: RegisterFormValues) => {
    onRegister({
      fullName: values.fullName.trim(),
      email: values.email.trim().toLowerCase(),
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(values.fullName.trim())}&background=6366F1&color=fff`,
    });
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f8fafd] flex justify-center px-4 py-6 items-center">
      <div className="w-full max-w-3xl bg-white border border-slate-200/80 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-1/2 h-48 md:h-auto md:self-stretch relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2000"
            alt="AI background"
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ objectPosition: "75% center" }}
          />
        </div>

        <div className="w-full md:w-1/2 p-5 md:p-6 flex flex-col justify-center overflow-y-auto max-h-full">
          <div className="w-full max-w-sm mx-auto">
            <h2 className="text-xl font-bold text-[#202124] mb-0.5">
              Tạo tài khoản
            </h2>
            <p className="text-[#5f6368] text-sm mb-3">
              Bắt đầu hành trình học tập thông minh
            </p>

            <Formik
              initialValues={registerInitialValues}
              validationSchema={registerValidationSchema}
              onSubmit={handleSubmit}
              validateOnBlur
              validateOnChange
            >
              {(formik) => (
                <Form className="space-y-2" noValidate>
                  <AuthField
                    formik={formik}
                    name="fullName"
                    label="Họ và tên"
                    type="text"
                    placeholder="Nguyễn Minh Khôi"
                    autoComplete="name"
                    icon={<User className="w-5 h-5" />}
                  />

                  <AuthField
                    formik={formik}
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="ten.ho@sinhvien.edu.vn"
                    autoComplete="email"
                    icon={<Mail className="w-5 h-5" />}
                  />

                  <AuthField
                    formik={formik}
                    name="password"
                    label="Mật khẩu"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    icon={<Lock className="w-5 h-5" />}
                    hint="Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                        tabIndex={-1}
                        aria-label={
                          showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    }
                  />

                  <AuthField
                    formik={formik}
                    name="confirmPassword"
                    label="Xác nhận mật khẩu"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    icon={<Lock className="w-5 h-5" />}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                        tabIndex={-1}
                        aria-label={
                          showConfirm
                            ? "Ẩn xác nhận mật khẩu"
                            : "Hiện xác nhận mật khẩu"
                        }
                      >
                        {showConfirm ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    }
                  />

                  <AuthCheckboxField
                    formik={formik}
                    name="acceptTerms"
                    label={
                      <>
                        Tôi đồng ý với{" "}
                        <span className="text-indigo-400">
                          Điều khoản sử dụng
                        </span>{" "}
                        và{" "}
                        <span className="text-indigo-400">
                          Chính sách bảo mật
                        </span>{" "}
                        của AI Study Hub
                      </>
                    }
                  />

                  <button
                    type="submit"
                    disabled={formik.isSubmitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-indigo-500/30"
                  >
                    Đăng ký
                  </button>
                </Form>
              )}
            </Formik>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#f1f3f4] text-[#5f6368]">
                  Hoặc tiếp tục với
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#e8f0fe] border border-[#d2e3fc] rounded-lg text-[#1967d2] hover:bg-[#dbeafe] hover:text-[#1967d2] cursor-pointer text-sm font-medium transition-colors"
                title="Sắp ra mắt"
              >
                <Chrome className="w-5 h-5" />
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#f1f3f4] border border-[#e0e3e7] rounded-lg text-[#202124] hover:bg-[#eceff1] hover:text-[#1967d2] cursor-pointer text-sm font-medium transition-colors"
                title="Sắp ra mắt"
              >
                <Github className="w-5 h-5" />
                GitHub
              </button>
            </div>

            <div className="mt-5 text-center text-[#5f6368]">
              Đã có tài khoản?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-[#1967d2] hover:text-[#174ea6] font-medium transition-colors"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
