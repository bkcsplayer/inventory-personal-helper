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
