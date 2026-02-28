-- Nexus EAM database initialization

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
DO $$ BEGIN
    CREATE TYPE item_type_enum AS ENUM ('consumable', 'asset');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE item_status_enum AS ENUM ('in_stock', 'in_service', 'idle', 'loaned', 'damaged', 'retired');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('admin', 'operator', 'viewer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Tables (created by Alembic, but as fallback for fresh init)

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'operator',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS containers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(500),
    qr_code_id VARCHAR(100) UNIQUE NOT NULL,
    parent_container_id UUID REFERENCES containers(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_type VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    container_id UUID REFERENCES containers(id),
    parent_item_id UUID REFERENCES items(id),
    location_note VARCHAR(500),
    quantity NUMERIC(12,4) NOT NULL DEFAULT 1,
    unit VARCHAR(20) NOT NULL DEFAULT '个',
    min_stock NUMERIC(12,4),
    unit_price NUMERIC(12,2),
    purchase_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'in_stock',
    assigned_to VARCHAR(255),
    attributes JSONB NOT NULL DEFAULT '{}',
    image_url VARCHAR(500),
    restock_url TEXT,
    barcode VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS ix_items_name ON items(name);
CREATE INDEX IF NOT EXISTS ix_items_sku ON items(sku);
CREATE INDEX IF NOT EXISTS ix_items_category ON items(category);
CREATE INDEX IF NOT EXISTS ix_items_barcode ON items(barcode);
CREATE INDEX IF NOT EXISTS ix_items_container_id ON items(container_id);
CREATE INDEX IF NOT EXISTS ix_items_parent_item_id ON items(parent_item_id);
CREATE INDEX IF NOT EXISTS ix_items_type_category ON items(item_type, category);
CREATE INDEX IF NOT EXISTS ix_items_status ON items(status);
CREATE INDEX IF NOT EXISTS ix_containers_qr_code_id ON containers(qr_code_id);
CREATE INDEX IF NOT EXISTS ix_containers_parent ON containers(parent_container_id);
CREATE INDEX IF NOT EXISTS ix_users_username ON users(username);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);

-- Admin user is auto-created by the backend on first startup (password: admin123)

-- Seed: sample containers
INSERT INTO containers (id, name, description, location, qr_code_id)
VALUES
    ('a0000000-0000-0000-0000-000000000001', '透明耗材箱A', '3D打印耗材和电子元器件', 'Torrington仓库-货架3', 'CTN-001'),
    ('a0000000-0000-0000-0000-000000000002', '万兆网络配件盒', '光纤、网线、SFP模块', 'Torrington仓库-货架2', 'CTN-002'),
    ('a0000000-0000-0000-0000-000000000003', 'Tundra车载工具箱', '现场施工工具', 'Toyota Tundra后备箱', 'CTN-003')
ON CONFLICT (qr_code_id) DO NOTHING;

-- Seed: sample items
INSERT INTO items (name, item_type, category, container_id, quantity, unit, min_stock, unit_price, status, attributes, barcode)
VALUES
    ('黑色PLA耗材 1kg', 'consumable', '3D耗材',
     'a0000000-0000-0000-0000-000000000001', 5, '卷', 2, 25.99,
     'in_stock', '{"material":"PLA","color":"black","diameter_mm":1.75,"weight_kg":1.0}', 'PLA-BLK-001'),
    ('白色PLA耗材 1kg', 'consumable', '3D耗材',
     'a0000000-0000-0000-0000-000000000001', 1, '卷', 2, 25.99,
     'in_stock', '{"material":"PLA","color":"white","diameter_mm":1.75,"weight_kg":1.0}', 'PLA-WHT-001'),
    ('LC-LC单模光纤 5m', 'consumable', '光纤',
     'a0000000-0000-0000-0000-000000000002', 8, '条', 3, 12.50,
     'in_stock', '{"length_m":5,"connector":"LC-LC","speed":"10G","color":"yellow"}', 'FBR-LC5M-001'),
    ('Cat6网线 3m', 'consumable', '网线',
     'a0000000-0000-0000-0000-000000000002', 15, '条', 5, 3.99,
     'in_stock', '{"length_m":3,"connector":"RJ45","speed":"1G","color":"blue"}', 'CAT6-3M-001')
ON CONFLICT (barcode) DO NOTHING;

INSERT INTO items (name, item_type, category, quantity, unit, unit_price, status, attributes, sku, barcode)
VALUES
    ('RTX 3090', 'asset', 'GPU', 1, '个', 1499.00,
     'in_service', '{"model":"RTX 3090","vram_gb":24,"tdp_w":350,"slot":"PCIe x16"}', 'GPU-3090-001', 'GPU-3090-001'),
    ('RTX 3090 #2', 'asset', 'GPU', 1, '个', 1499.00,
     'idle', '{"model":"RTX 3090","vram_gb":24,"tdp_w":350,"slot":"PCIe x16"}', 'GPU-3090-002', 'GPU-3090-002'),
    ('Antminer S19 Pro', 'asset', '矿机', 1, '个', 2500.00,
     'in_service', '{"hashrate":"110TH/s","algorithm":"SHA-256","psu_w":3250,"serial":"ANT-S19P-001"}', 'MINER-S19P-001', 'MINER-S19P-001')
ON CONFLICT (barcode) DO NOTHING;

-- Additional mock data for testing UI
INSERT INTO containers (id, name, description, location, qr_code_id)
VALUES
    ('a0000000-0000-0000-0000-000000000004', 'GPU矿机专用柜 (mock)', '矿机和GPU设备', 'Torrington仓库-货架1', 'CTN-004'),
    ('a0000000-0000-0000-0000-000000000005', '太阳能安装物料箱 (mock)', '太阳能板安装配件', 'Toyota Tundra后备箱-左侧', 'CTN-005'),
    ('a0000000-0000-0000-0000-000000000006', '电子元器件收纳盒 (mock)', '各类SMD元器件', 'Torrington仓库-货架3-第2层', 'CTN-006')
ON CONFLICT (qr_code_id) DO NOTHING;

INSERT INTO items (name, item_type, category, container_id, quantity, unit, min_stock, unit_price, status, attributes, barcode, assigned_to, location_note)
VALUES
    ('红色PETG耗材 1kg (mock)', 'consumable', '3D耗材',
     'a0000000-0000-0000-0000-000000000001', 3, '卷', 2, 32.99,
     'in_stock', '{"material":"PETG","color":"red","diameter_mm":1.75,"weight_kg":1.0}', 'PETG-RED-MOCK', NULL, NULL),
    ('透明PETG耗材 1kg (mock)', 'consumable', '3D耗材',
     'a0000000-0000-0000-0000-000000000001', 0.5, '卷', 2, 35.99,
     'in_stock', '{"material":"PETG","color":"transparent","diameter_mm":1.75,"weight_kg":1.0}', 'PETG-CLR-MOCK', NULL, NULL),
    ('SFP+ 10G光模块 (mock)', 'consumable', '光纤',
     'a0000000-0000-0000-0000-000000000002', 4, '个', 2, 45.00,
     'in_stock', '{"speed":"10G","type":"SFP+","wavelength":"850nm"}', 'SFP-10G-MOCK', NULL, NULL),
    ('Cat6A网线 5m (mock)', 'consumable', '网线',
     'a0000000-0000-0000-0000-000000000002', 2, '条', 5, 8.99,
     'in_stock', '{"length_m":5,"connector":"RJ45","speed":"10G","color":"green"}', 'CAT6A-5M-MOCK', NULL, NULL),
    ('10kΩ电阻 0402 (mock)', 'consumable', '电子元器件',
     'a0000000-0000-0000-0000-000000000006', 500, '片', 100, 0.02,
     'in_stock', '{"package":"SMD-0402","value":"10kΩ","tolerance":"1%"}', 'RES-10K-MOCK', NULL, NULL),
    ('100μF电容 (mock)', 'consumable', '电子元器件',
     'a0000000-0000-0000-0000-000000000006', 50, '片', 80, 0.15,
     'in_stock', '{"package":"SMD-0805","value":"100μF","voltage":"16V"}', 'CAP-100UF-MOCK', NULL, NULL),
    ('太阳能MC4连接器 (mock)', 'consumable', '太阳能配件',
     'a0000000-0000-0000-0000-000000000005', 8, '对', 10, 3.50,
     'in_stock', '{"type":"MC4","rating":"30A","gender":"pair"}', 'MC4-PAIR-MOCK', NULL, 'Tundra后备箱'),
    ('6AWG太阳能电缆 (mock)', 'consumable', '太阳能配件',
     'a0000000-0000-0000-0000-000000000005', 15, 'm', 20, 2.80,
     'in_stock', '{"gauge":"6AWG","color":"red/black","rating":"600V"}', 'CABLE-6AWG-MOCK', NULL, 'Tundra后备箱'),
    ('RTX 4090 (mock)', 'asset', 'GPU', 'a0000000-0000-0000-0000-000000000004', 1, '个', NULL, 2199.00,
     'in_service', '{"model":"RTX 4090","vram_gb":24,"tdp_w":450,"slot":"PCIe x16"}', 'GPU-4090-MOCK', '矿机#1主板', NULL),
    ('RTX 3080 (mock)', 'asset', 'GPU', 'a0000000-0000-0000-0000-000000000004', 1, '个', NULL, 799.00,
     'loaned', '{"model":"RTX 3080","vram_gb":10,"tdp_w":320,"slot":"PCIe x16"}', 'GPU-3080-MOCK', 'Mike-太阳能项目', NULL),
    ('RTX 3070 (mock)', 'asset', 'GPU', NULL, 1, '个', NULL, 599.00,
     'idle', '{"model":"RTX 3070","vram_gb":8,"tdp_w":220,"slot":"PCIe x16"}', 'GPU-3070-MOCK', NULL, 'Torrington仓库-待分配'),
    ('Whatsminer M30S++ (mock)', 'asset', '矿机', 'a0000000-0000-0000-0000-000000000004', 1, '个', NULL, 3200.00,
     'in_service', '{"hashrate":"112TH/s","algorithm":"SHA-256","psu_w":3472,"serial":"WM-M30S-001"}', 'MINER-M30S-MOCK', NULL, NULL),
    ('Whatsminer M50 (mock)', 'asset', '矿机', NULL, 1, '个', NULL, 4500.00,
     'damaged', '{"hashrate":"126TH/s","algorithm":"SHA-256","psu_w":3276,"serial":"WM-M50-001","damage_note":"PSU故障"}', 'MINER-M50-MOCK', NULL, '维修区'),
    ('Ubiquiti USW-Pro-48 (mock)', 'asset', '网络设备', NULL, 1, '个', NULL, 699.00,
     'in_service', '{"ports":48,"speed":"1G","poe":true,"mgmt":"UniFi"}', 'SW-USW48-MOCK', NULL, 'Torrington仓库-机柜'),
    ('MikroTik CRS326 (mock)', 'asset', '网络设备', NULL, 1, '个', NULL, 269.00,
     'loaned', '{"ports":24,"speed":"10G SFP+","mgmt":"RouterOS"}', 'SW-CRS326-MOCK', 'David-远程机房', NULL),
    ('Dewalt DCD791 电钻 (mock)', 'asset', '电动工具',
     'a0000000-0000-0000-0000-000000000003', 1, '个', NULL, 189.00,
     'in_service', '{"voltage":"20V","brand":"Dewalt","battery_type":"DCB205"}', 'TOOL-DCD791-MOCK', NULL, 'Tundra工具箱'),
    ('Dewalt DCF887 冲击钻 (mock)', 'asset', '电动工具',
     'a0000000-0000-0000-0000-000000000003', 1, '个', NULL, 159.00,
     'idle', '{"voltage":"20V","brand":"Dewalt","battery_type":"DCB203"}', 'TOOL-DCF887-MOCK', NULL, 'Tundra工具箱'),
    ('Fluke 87V万用表 (mock)', 'asset', '电动工具', NULL, 1, '个', NULL, 425.00,
     'loaned', '{"brand":"Fluke","model":"87V","type":"multimeter"}', 'TOOL-FLUKE-MOCK', 'Alex-现场测量', NULL),
    ('Creality Ender-3 S1 (mock)', 'asset', '3D打印机', NULL, 1, '个', NULL, 399.00,
     'in_service', '{"brand":"Creality","model":"Ender-3 S1","build_vol":"220x220x270mm"}', 'PRINTER-E3S1-MOCK', NULL, 'Torrington仓库-工作台'),
    ('树莓派 4B 8GB (mock)', 'asset', '单板电脑', NULL, 1, '个', NULL, 75.00,
     'retired', '{"model":"Raspberry Pi 4B","ram":"8GB","status_note":"SD卡槽损坏"}', 'SBC-RPI4-MOCK', NULL, '报废区')
ON CONFLICT (barcode) DO NOTHING;
