import ResetPasswordForm from "@/features/auth/components/reset/ResetPasswordForm";

export default function ResetPasswordLeftPanel() {
  return (
    <div className="auth-form-panel relative z-10 flex flex-col justify-center order-2 md:order-1 p-8 md:p-12">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
          Reestablecer contraseña
        </h1>
        <p className="text-gray-600">
          Ingresa tu nueva contraseña para recuperar el acceso.
        </p>
      </div>

      <ResetPasswordForm />

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
