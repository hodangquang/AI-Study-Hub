import { useState } from "react";
import { Formik, Form } from "formik";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { forgotPassword } from "@/services/authApi";
import {
  forgotPasswordInitialValues,
  forgotPasswordValidationSchema,
  type ForgotPasswordFormValues,
} from "@/validation/authSchemas";
import { AuthField } from "@/components/auth/AuthField";

interface ForgotPasswordViewProps {
  onCodeSent: (email: string) => void;
  onBackToLogin: () => void;
}

export default function ForgotPasswordView({
  onCodeSent,
  onBackToLogin,
}: ForgotPasswordViewProps) {
  const [apiError, setApiError] = useState("");

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    setApiError("");
    const targetEmail = values.email.trim();
    try {
      await forgotPassword(targetEmail);
      toast.success(
        "Đã gửi mã đặt lại mật khẩu! Vui lòng kiểm tra hộp thư của bạn."
      );
      onCodeSent(targetEmail);
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : "Yêu cầu đặt lại mật khẩu thất bại. Vui lòng thử lại."
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
              Quên mật khẩu?
            </h2>
            <p className="text-[#5f6368] text-sm mb-5">
              Nhập email đăng ký của bạn. Chúng tôi sẽ gửi một mã OTP đặt lại mật khẩu.
            </p>

            <Formik
              initialValues={forgotPasswordInitialValues}
              validationSchema={forgotPasswordValidationSchema}
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
                    placeholder="ten.ho@student.edu.vn"
                    icon={<Mail className="w-5 h-5" />}
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
                        Đang gửi yêu cầu...
                      </>
                    ) : (
                      "Tiếp tục"
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
