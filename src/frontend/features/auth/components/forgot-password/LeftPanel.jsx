import ForgotPasswordForm from "@/features/auth/components/forgot-password/ForgotPasswordForm";

export default function ForgotPasswordLeftPanel() {
  return (
    <div className="auth-form-panel relative z-10 flex flex-col justify-center order-2 md:order-1 p-8 md:p-12">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
          Recuperar acceso
        </h1>
        <p className="text-gray-600">
          Te enviaremos un correo con un link para reestablecer tu contraseña.
        </p>
      </div>

      <ForgotPasswordForm />

      <div className="mt-8 text-center">
        <a
          href="/login"
          className="text-sm font-medium text-primary hover:text-green-700 transition-colors"
        >
          Volver a iniciar sesión
        </a>
      </div>
    </div>
  );
}
