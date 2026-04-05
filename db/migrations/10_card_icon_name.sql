-- Ícono Material Symbols (nombre de glifo) por card
ALTER TABLE content.cards
  ADD COLUMN IF NOT EXISTS icon_name VARCHAR(100) NULL;

COMMENT ON COLUMN content.cards.icon_name IS 'Nombre del glifo Material Symbols Outlined (ej. settings_suggest); NULL = usar fallback en cliente';
