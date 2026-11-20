import RegisterForm from "@/features/auth/components/register/RegisterForm";

export default function LeftPanel() {
  return (
    <div className="auth-form-panel relative z-10 flex flex-col justify-center order-2 md:order-1 p-8 md:p-12">
      <div className="mb-8">
        <div className="md:hidden mb-6 flex items-center gap-3">
          <div className="font-display font-bold text-3xl tracking-tight text-secondary">
            UVG
          </div>
          <div className="h-8 w-px bg-gray-300" />
          <div className="text-xs uppercase tracking-wider leading-tight text-gray-500">
            Universidad
            <br />
            del Valle
            <br />
            de Guatemala
          </div>
        </div>

        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
          Crear cuenta
        </h1>
        <p className="text-gray-600">
          Regístrate para acceder a la Plataforma de Investigación Cualitativa
        </p>
      </div>

      <RegisterForm />

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <a
            href="/login"
            className="font-medium text-primary hover:text-green-700 transition-colors"
          >
            Inicia sesión
          </a>
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center text-gray-400">
        <span className="text-xs">© 2024 Universidad del Valle de Guatemala</span>
      </div>
    </div>
  );
}
