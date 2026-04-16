-- ============================================
-- Sesion 3 — Autenticacion con Google
-- Agrega campos de identidad a la tabla usuarios
-- para vincular con Supabase Auth y almacenar
-- datos del canal verificado al registrarse.
-- ============================================

-- auth_id: vincula con auth.users.id de Supabase
ALTER TABLE usuarios ADD COLUMN auth_id UUID UNIQUE;

-- Datos del perfil de Google
ALTER TABLE usuarios ADD COLUMN email TEXT;
ALTER TABLE usuarios ADD COLUMN nombre TEXT;
ALTER TABLE usuarios ADD COLUMN avatar_url TEXT;

-- Foto estatica del dia del registro (seccion 6F.5)
ALTER TABLE usuarios ADD COLUMN videos_al_registro INTEGER NOT NULL DEFAULT 0;

-- Indice para buscar usuario por auth_id (lookup frecuente)
CREATE INDEX idx_usuarios_auth_id ON usuarios(auth_id);

-- RLS: los usuarios solo pueden leer su propio registro
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_select_own" ON usuarios
    FOR SELECT
    USING (auth.uid() = auth_id);

CREATE POLICY "usuarios_insert_own" ON usuarios
    FOR INSERT
    WITH CHECK (auth.uid() = auth_id);

-- Permitir al service_role hacer todo (para el callback del server)
-- Supabase lo habilita por defecto, pero lo dejamos explicito.
