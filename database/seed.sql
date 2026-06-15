-- Seed data for ER:LC CAD
USE erlc_cad;

INSERT INTO departments (name, type, callsign_prefix, color) VALUES
  ('Liberty County Sheriff', 'police', 'LCSO', '#1e40af'),
  ('Liberty Police Department', 'police', 'LPD', '#1d4ed8'),
  ('Liberty County Fire Rescue', 'fire', 'LCFR', '#dc2626'),
  ('Liberty County EMS', 'ems', 'LCEMS', '#16a34a'),
  ('Communications', 'dispatch', 'DISP', '#7c3aed'),
  ('Administration', 'admin', 'ADM', '#64748b'),
  ('Civilian', 'civilian', 'CIV', '#94a3b8')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO ranks (department_id, name, level, permissions) VALUES
  (1, 'Deputy', 1, '["mdt.basic"]'),
  (1, 'Sergeant', 5, '["mdt.basic","mdt.supervisor"]'),
  (1, 'Sheriff', 10, '["mdt.basic","mdt.supervisor","mdt.admin"]'),
  (4, 'EMT', 1, '["ems.basic"]'),
  (4, 'Paramedic', 5, '["ems.basic","ems.supervisor"]'),
  (3, 'Firefighter', 1, '["fire.basic"]'),
  (5, 'Dispatcher', 1, '["dispatch.basic"]'),
  (6, 'Administrator', 10, '["admin.all"]')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO server_config (config_key, config_value) VALUES
  ('server_name', 'Liberty County CAD'),
  ('server_logo', '')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
