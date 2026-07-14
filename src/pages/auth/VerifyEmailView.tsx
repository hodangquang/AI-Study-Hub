import { useState, useEffect } from "react";
import { Formik, Form } from "formik";
import { Mail, Key, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { verifyEmail, resendVerificationEmail } from "@/services/authApi";
import {
  verifyEmailInitialValues,
  verifyEmailValidationSchema,
  type VerifyEmailFormValues,
} from "@/validation/authSchemas";
import { AuthField } from "@/components/auth/AuthField";

interface VerifyEmailViewProps {
  email: string;
  onVerificationSuccess: () => void;
  onBackToLogin: () => void;
}

export default function VerifyEmailView({
  email,
  onVerificationSuccess,
  onBackToLogin,
}: VerifyEmailViewProps) {
  const [apiError, setApiError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (values: VerifyEmailFormValues) => {
    setApiError("");
    try {
      await verifyEmail({
        email,
        otp: values.otp.trim(),
      });
      toast.success("Xác thực email thành công! Vui lòng đăng nhập.");
      onVerificationSuccess();
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Xác thực thất bại. Vui lòng thử lại."
      );
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setApiError("");
    setIsResending(true);
    try {
      await resendVerificationEmail(email);
      toast.success("Đã gửi lại mã OTP. Vui lòng kiểm tra email của bạn.");
      setResendCooldown(60);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Không thể gửi lại mã OTP."
      );
    } finally {
      setIsResending(false);
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
              Xác thực tài khoản
            </h2>
            <p className="text-[#5f6368] text-sm mb-5">
              Mã xác thực OTP đã được gửi đến email: <br />
              <strong className="text-indigo-600 font-semibold">{email}</strong>
            </p>

            <Formik
              initialValues={verifyEmailInitialValues}
              validationSchema={verifyEmailValidationSchema}
              onSubmit={handleSubmit}
              validateOnBlur
              validateOnChange
            >
              {(formik) => (
                <Form className="space-y-4" noValidate>
                  <AuthField
                    formik={formik}
                    name="otp"
                    label="Mã OTP"
                    type="text"
                    placeholder="Mã gồm 6 chữ số"
                    icon={<Key className="w-5 h-5" />}
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
                        Đang xác thực...
                      </>
                    ) : (
                      "Xác nhận"
                    )}
                  </button>
                </Form>
              )}
            </Formik>

            <div className="mt-6 text-center text-[#5f6368] text-sm">
              Bạn chưa nhận được mã?{" "}
              {resendCooldown > 0 ? (
                <span className="text-slate-400 font-medium">
                  Gửi lại sau {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isResending ? "Đang gửi..." : "Gửi lại mã OTP"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
