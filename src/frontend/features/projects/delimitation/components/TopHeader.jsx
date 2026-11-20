import Icon from "@/components/common/Icon";

export default function TopHeader() {
  return (
    <header className="flex items-center justify-between border-b border-[#005944]/10 px-8 py-3 bg-white z-20">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#005944] rounded flex items-center justify-center">
            <Icon name="school" className="text-white text-xl" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[#005944] text-lg font-black leading-none tracking-tight">
              UVG
            </h1>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Investigación Cualitativa
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-100" />

        <nav className="flex items-center gap-6">
          <a className="text-xs font-bold text-slate-400 hover:text-[#005944] transition-colors uppercase tracking-wider" href="/dashboard">
            Dashboard
          </a>
          <a className="text-xs font-bold text-[#005944] border-b-2 border-[#005944] px-1 uppercase tracking-wider" href="#">
            Delimitación
          </a>
          <a className="text-xs font-bold text-slate-400 hover:text-[#005944] transition-colors uppercase tracking-wider" href="#">
            Metodología
          </a>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-slate-400 hover:text-[#005944] transition-colors" type="button">
          <Icon name="notifications" className="text-xl" />
        </button>

        <div
          className="size-8 rounded-full bg-slate-200 border border-[#005944]/10 bg-cover bg-center"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDqZRmU4KmQ7Av1aPlZEeeImmmKnITDJflpxssIbtSdoOh7wqcjTNcTVJWcyQLKCiy4JujNFse9xd32u8sKs1_qIutGu9nW5oA8zjy3O36B4XAvjLV5Xisnjk7pS-niNM6Gd2nnByHl_wagdjRyEQEqQiWQjLomlN-rshC3zNeqIHCyIMy6jfVrnER93Tm8Pa0YINtteKoqtJwABC1w5VF1TORvb3cfj4SwW0zX1pFD319v3rRiatapCZRrd2n6K5HKSRelMiXo55H_")',
          }}
        />
      </div>
    </header>
  );
}