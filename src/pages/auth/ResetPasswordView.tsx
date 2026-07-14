import { useState } from "react";
import { Formik, Form } from "formik";
import { Lock, Eye, EyeOff, Key, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { resetPassword } from "@/services/authApi";
import {
  resetPasswordInitialValues,
  resetPasswordValidationSchema,
  type ResetPasswordFormValues,
} from "@/validation/authSchemas";
import { AuthField } from "@/components/auth/AuthField";

interface ResetPasswordViewProps {
  email: string;
  onResetSuccess: () => void;
  onBackToLogin: () => void;
}

export default function ResetPasswordView({
  email,
  onResetSuccess,
  onBackToLogin,
}: ResetPasswordViewProps) {
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    setApiError("");
    try {
      await resetPassword({
        email,
        otp: values.otp.trim(),
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.");
      onResetSuccess();
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : "Đặt lại mật khẩu thất bại. Vui lòng thử lại."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafd] flex justify-center px-4 py-8 md:py-12 items-start">
      <div className="w-full max-w-3xl bg-white border border-slate-200/80 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden my-auto">
        <div className="w-full md:w-1/2 h-48 md:h-auto md:self-stretch relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2000"
            alt="AI background"
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ objectPosition: "75% center" }}
          />
        </div>

        <div className="w-full md:w-1/2 p-5 md:p-6 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto">
            <button
              onClick={onBackToLogin}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors font-medium cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </button>

            <h2 className="text-xl font-bold text-[#202124] mb-1.5">
              Đặt lại mật khẩu
            </h2>
            <p className="text-[#5f6368] text-sm mb-5">
              Mã OTP đặt lại mật khẩu đã gửi đến email <strong className="text-slate-800">{email}</strong>.
            </p>

            <Formik
              initialValues={resetPasswordInitialValues}
              validationSchema={resetPasswordValidationSchema}
              onSubmit={handleSubmit}
              validateOnBlur
              validateOnChange
            >
              {(formik) => (
                <Form className="space-y-3" noValidate>
                  <AuthField
                    formik={formik}
                    name="otp"
                    label="Mã OTP"
                    type="text"
                    placeholder="Mã OTP gồm 6 số"
                    icon={<Key className="w-5 h-5" />}
                  />

                  <AuthField
                    formik={formik}
                    name="newPassword"
                    label="Mật khẩu mới"
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
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
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
                    label="Xác nhận mật khẩu mới"
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
                        aria-label={showConfirm ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
                      >
                        {showConfirm ? (
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
                        Đang đặt lại mật khẩu...
                      </>
                    ) : (
                      "Xác nhận mật khẩu mới"
                    )}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
}
