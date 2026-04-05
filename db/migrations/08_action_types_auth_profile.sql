-- AUTH_PROFILE_UPDATED — actualización de perfil propio (nombre / contraseña)
INSERT INTO logs.action_types (code, module, description)
VALUES ('AUTH_PROFILE_UPDATED', 'auth', 'Perfil de usuario actualizado (nombre o contraseña)')
ON CONFLICT (code) DO NOTHING;
