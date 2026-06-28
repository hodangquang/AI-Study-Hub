import { useState } from "react";
import { Formik, Form } from "formik";
import { Mail, Lock, Eye, EyeOff, Chrome, Github, Loader2 } from "lucide-react";
import { loginAccount } from "@/services/authApi";
import type { AuthSession } from "@/types/auth";
import {
  loginInitialValues,
  loginValidationSchema,
  type LoginFormValues,
} from "@/validation/authSchemas";
import { AuthField } from "@/components/auth/AuthField";

interface LoginViewProps {
  onLogin: (session: AuthSession) => void;
  onSwitchToRegister: () => void;
}

export default function LoginView({
  onLogin,
  onSwitchToRegister,
}: LoginViewProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleSubmit = async (values: LoginFormValues) => {
    setApiError("");
    try {
      const session = await loginAccount(
        values.email.trim(),
        values.password,
      );
      onLogin(session);
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : "Đăng nhập thất bại. Vui lòng thử lại.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafd] flex justify-center px-4 py-8 md:py-12 items-start">
      <div className="w-full max-w-5xl bg-white border border-slate-200/80 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden my-auto">
        <div className="w-full md:w-1/2 h-48 md:h-auto md:self-stretch relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2000"
            alt="AI background"
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ objectPosition: "75% center" }}
          />
        </div>

        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Đăng nhập</h2>
            <p className="text-slate-500 mb-8">
              Chào mừng bạn quay trở lại AI Study Hub!
            </p>

            <Formik
              initialValues={loginInitialValues}
              validationSchema={loginValidationSchema}
              onSubmit={handleSubmit}
              validateOnBlur
              validateOnChange
            >
              {(formik) => (
                <Form className="space-y-4" noValidate>
                   <AuthField
                    formik={formik}
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="email@example.com"
                    autoComplete="email"
                    icon={<Mail className="w-5 h-5" />}
                  />

                  <AuthField
                    formik={formik}
                    name="password"
                    label="Mật khẩu"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    icon={<Lock className="w-5 h-5" />}
                    labelRight={
                      <button
                        type="button"
                        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Quên mật khẩu?
                      </button>
                    }
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

                  {apiError && (
                    <div
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                      role="alert"
                    >
                      {apiError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={formik.isSubmitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/30"
                  >
                    {formik.isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang đăng nhập...
                      </>
                    ) : (
                      "Đăng nhập"
                    )}
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

            <div className="mt-8 text-center text-slate-500">
              Chưa có tài khoản?{" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
              >
                Đăng ký ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
