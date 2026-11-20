export default function RightPanel() {
  return (
    <div className="hidden md:flex flex-col justify-between relative bg-secondary p-12 text-white overflow-hidden order-1 md:order-2">
      <div className="absolute inset-0 bg-secondary">
        <svg
          className="absolute bottom-0 right-0 w-full h-full opacity-10"
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M45.7,-76.3C58.9,-69.3,69.1,-58.3,77.3,-46.2C85.5,-34.1,91.7,-20.9,90.4,-8.2C89.1,4.5,80.3,16.7,70.9,27.3C61.5,37.9,51.5,46.9,40.6,53.4C29.7,59.9,17.9,63.9,5.7,65.8C-6.5,67.7,-19.1,67.5,-30.9,62.8C-42.7,58.1,-53.7,48.9,-61.8,37.6C-69.9,26.3,-75.1,12.9,-76.3,-1.2C-77.5,-15.3,-74.7,-30.1,-65.9,-41.8C-57.1,-53.5,-42.3,-62.1,-27.9,-68.2C-13.5,-74.3,0.5,-77.9,14.6,-78.9L14.6,0L0,0Z"
            fill="#ffffff"
            transform="translate(200 200) scale(1.8)"
          />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-purple-900 to-black opacity-60" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-2">
          <h2 className="font-display font-bold text-5xl tracking-tight">UVG</h2>
          <div className="h-12 w-0.5 bg-white/30" />
          <div className="text-xs font-medium uppercase tracking-widest leading-relaxed opacity-90">
            Universidad
            <br />
            del Valle
            <br />
            de Guatemala
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-grow flex items-center justify-center my-8">
        <div className="relative w-52 h-52 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-2xl">
                                      
          <svg
            className="w-28 h-28 opacity-95 drop-shadow-lg"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 3L1.5 8.25 12 13.5 22.5 8.25 12 3Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M4.5 10.5V15c0 .9 3 3 7.5 3s7.5-2.1 7.5-3v-4.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M22.5 8.25V14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <span className="material-symbols-rounded text-white text-[18px] leading-none">
              science
            </span>
          </div>

          <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-white text-secondary rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <span className="material-symbols-rounded text-[16px] leading-none">
              psychology
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 space-y-4">
        <blockquote className="text-lg font-light italic opacity-90 border-l-4 border-primary pl-4">
          "Excelencia que trasciende"
        </blockquote>

        <p className="text-xs text-white/60 font-light leading-relaxed">
          Acceda a las herramientas de análisis cualitativo, repositorios de datos y
          gestión de proyectos académicos.
        </p>
      </div>
    </div>
  );
}
