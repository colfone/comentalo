"use client";

import { useState } from "react";

export type ParametroConfig = {
  clave: string;
  valor: string;
  tipo: "integer" | "text" | "boolean" | "numeric";
  descripcion: string;
  updated_at: string;
  updated_by: string | null;
};

type RowState = {
  valor: string;
  dirty: boolean;
  saving: boolean;
  error: string | null;
  savedAt: number | null;
};

export default function ConfiguracionForm({
  parametros,
}: {
  parametros: ParametroConfig[];
}) {
  const [rows, setRows] = useState<Record<string, ParametroConfig>>(() =>
    Object.fromEntries(parametros.map((p) => [p.clave, p]))
  );
  const [state, setState] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      parametros.map((p) => [
        p.clave,
        {
          valor: p.valor,
          dirty: false,
          saving: false,
          error: null,
          savedAt: null,
        },
      ])
    )
  );

  function setRowValor(clave: string, valor: string) {
    setState((prev) => ({
      ...prev,
      [clave]: {
        ...prev[clave],
        valor,
        dirty: valor !== rows[clave].valor,
        error: null,
        savedAt: null,
      },
    }));
  }

  async function guardar(clave: string) {
    const valor = state[clave].valor;
    setState((prev) => ({
      ...prev,
      [clave]: { ...prev[clave], saving: true, error: null },
    }));

    try {
      const res = await fetch("/api/admin/configuracion", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clave, valor }),
      });
      const body = await res.json();

      if (!res.ok) {
        setState((prev) => ({
          ...prev,
          [clave]: {
            ...prev[clave],
            saving: false,
            error: body.error ?? "Error desconocido",
          },
        }));
        return;
      }

      const actualizado = body.parametro as ParametroConfig;
      setRows((prev) => ({ ...prev, [clave]: actualizado }));
      setState((prev) => ({
        ...prev,
        [clave]: {
          valor: actualizado.valor,
          dirty: false,
          saving: false,
          error: null,
          savedAt: Date.now(),
        },
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        [clave]: {
          ...prev[clave],
          saving: false,
          error: err instanceof Error ? err.message : "Error de red",
        },
      }));
    }
  }

  if (parametros.length === 0) {
    return (
      <div className="rounded-lg border border-black/10 bg-white p-6 text-center text-sm text-[#5b5e60]">
        No hay parámetros configurados.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/10 bg-[#f5f5f7] text-xs font-semibold uppercase tracking-wider text-[#5b5e60]">
            <th className="px-4 py-3 text-left">Parámetro</th>
            <th className="px-4 py-3 text-left">Valor</th>
            <th className="px-4 py-3 text-left">Última edición</th>
            <th className="px-4 py-3 text-right" />
          </tr>
        </thead>
        <tbody>
          {parametros.map((p) => {
            const fila = rows[p.clave];
            const st = state[p.clave];
            return (
              <tr
                key={p.clave}
                className="border-b border-black/5 last:border-0 align-top"
              >
                <td className="px-4 py-4">
                  <div className="font-mono text-xs font-semibold text-[#2c2f30]">
                    {fila.clave}
                  </div>
                  <div className="mt-1 text-xs text-[#5b5e60]">
                    {fila.descripcion}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-wider text-[#9097a0]">
                    {fila.tipo}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <ValorInput
                    tipo={fila.tipo}
                    valor={st.valor}
                    onChange={(v) => setRowValor(p.clave, v)}
                  />
                  {st.error && (
                    <div className="mt-1 text-xs text-red-700">{st.error}</div>
                  )}
                  {st.savedAt && !st.error && (
                    <div className="mt-1 text-xs text-green-700">
                      Guardado.
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-xs text-[#5b5e60]">
                  {new Date(fila.updated_at).toLocaleString("es-AR")}
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => guardar(p.clave)}
                    disabled={!st.dirty || st.saving}
                    className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: "#6200EE" }}
                  >
                    {st.saving ? "Guardando…" : "Guardar"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ValorInput({
  tipo,
  valor,
  onChange,
}: {
  tipo: ParametroConfig["tipo"];
  valor: string;
  onChange: (v: string) => void;
}) {
  const inputClass =
    "w-full rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm font-mono text-[#2c2f30] focus:border-[#6200EE] focus:outline-none";

  if (tipo === "boolean") {
    return (
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  return (
    <input
      type={tipo === "integer" || tipo === "numeric" ? "text" : "text"}
      inputMode={
        tipo === "integer"
          ? "numeric"
          : tipo === "numeric"
            ? "decimal"
            : "text"
      }
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    />
  );
}
