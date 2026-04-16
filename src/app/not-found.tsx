export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-6xl font-bold text-white">
          <span className="text-[#6B3FA0]">4</span>
          <span className="text-[#E87722]">0</span>
          <span className="text-[#6B3FA0]">4</span>
        </h1>
        <p className="mt-4 text-lg text-gray-300">
          Esta pagina no existe
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Puede que el enlace este roto o que la pagina haya sido movida.
        </p>
        <a
          href="/dashboard"
          className="mt-8 inline-block rounded-lg bg-[#6B3FA0] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#5a3588]"
        >
          Ir al dashboard
        </a>
      </div>
    </main>
  );
}
