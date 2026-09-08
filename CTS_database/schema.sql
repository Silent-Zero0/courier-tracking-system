-- ============================================================
-- COURIER TRACKING SYSTEM
-- Database Schema
-- PostgreSQL
-- ============================================================


-- ============================================================
-- 1. ROLES
-- ============================================================

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);


-- ============================================================
-- 2. HUBS
-- ============================================================

CREATE TABLE hubs (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT hubs_status_check
        CHECK (status IN ('ACTIVE', 'INACTIVE'))
);


-- ============================================================
-- 3. USERS
-- ============================================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone VARCHAR(20),
    role_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_role_fk
        FOREIGN KEY (role_id)
        REFERENCES roles(id),

    CONSTRAINT users_status_check
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'))
);


-- ============================================================
-- 4. SHIPMENTS
-- ============================================================

CREATE TABLE shipments (
    id BIGSERIAL PRIMARY KEY,

    tracking_number VARCHAR(50) NOT NULL UNIQUE,

    sender_id BIGINT NOT NULL,

    receiver_name VARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    receiver_email VARCHAR(255),

    receiver_address TEXT NOT NULL,
    receiver_city VARCHAR(100) NOT NULL,
    receiver_state VARCHAR(100),
    receiver_postal_code VARCHAR(20),

    origin_hub_id BIGINT,
    destination_hub_id BIGINT,

    current_status VARCHAR(30) NOT NULL DEFAULT 'BOOKED',

    expected_delivery DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT shipments_sender_fk
        FOREIGN KEY (sender_id)
        REFERENCES users(id),

    CONSTRAINT shipments_origin_hub_fk
        FOREIGN KEY (origin_hub_id)
        REFERENCES hubs(id),

    CONSTRAINT shipments_destination_hub_fk
        FOREIGN KEY (destination_hub_id)
        REFERENCES hubs(id),

    CONSTRAINT shipments_status_check
        CHECK (
            current_status IN (
                'BOOKED',
                'PICKED_UP',
                'ORIGIN_HUB',
                'IN_TRANSIT',
                'DESTINATION_HUB',
                'OUT_FOR_DELIVERY',
                'DELIVERED',
                'DELIVERY_FAILED',
                'CANCELLED'
            )
        )
);


-- ============================================================
-- 5. TRACKING EVENTS
-- ============================================================

CREATE TABLE tracking_events (
    id BIGSERIAL PRIMARY KEY,

    shipment_id BIGINT NOT NULL,

    status VARCHAR(30) NOT NULL,

    hub_id BIGINT,

    description TEXT,

    updated_by BIGINT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT tracking_events_shipment_fk
        FOREIGN KEY (shipment_id)
        REFERENCES shipments(id)
        ON DELETE CASCADE,

    CONSTRAINT tracking_events_hub_fk
        FOREIGN KEY (hub_id)
        REFERENCES hubs(id),

    CONSTRAINT tracking_events_updated_by_fk
        FOREIGN KEY (updated_by)
        REFERENCES users(id),

    CONSTRAINT tracking_events_status_check
        CHECK (
            status IN (
                'BOOKED',
                'PICKED_UP',
                'ORIGIN_HUB',
                'IN_TRANSIT',
                'DESTINATION_HUB',
                'OUT_FOR_DELIVERY',
                'DELIVERED',
                'DELIVERY_FAILED',
                'CANCELLED'
            )
        )
);


-- ============================================================
-- 6. DELIVERY ASSIGNMENTS
-- ============================================================

CREATE TABLE delivery_assignments (
    id BIGSERIAL PRIMARY KEY,

    shipment_id BIGINT NOT NULL,
    agent_id BIGINT NOT NULL,
    assigned_by BIGINT NOT NULL,

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED',

    CONSTRAINT delivery_assignments_shipment_fk
        FOREIGN KEY (shipment_id)
        REFERENCES shipments(id)
        ON DELETE CASCADE,

    CONSTRAINT delivery_assignments_agent_fk
        FOREIGN KEY (agent_id)
        REFERENCES users(id),

    CONSTRAINT delivery_assignments_assigned_by_fk
        FOREIGN KEY (assigned_by)
        REFERENCES users(id),

    CONSTRAINT delivery_assignments_status_check
        CHECK (
            status IN (
                'ASSIGNED',
                'IN_PROGRESS',
                'COMPLETED',
                'FAILED',
                'CANCELLED'
            )
        )
);


-- ============================================================
-- 7. COMPLAINTS
-- ============================================================

CREATE TABLE complaints (
    id BIGSERIAL PRIMARY KEY,

    shipment_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,

    category VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,

    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',

    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT complaints_shipment_fk
        FOREIGN KEY (shipment_id)
        REFERENCES shipments(id)
        ON DELETE CASCADE,

    CONSTRAINT complaints_customer_fk
        FOREIGN KEY (customer_id)
        REFERENCES users(id),

    CONSTRAINT complaints_category_check
        CHECK (
            category IN (
                'DELAY',
                'WRONG_STATUS',
                'DAMAGED',
                'ADDRESS',
                'DELIVERY',
                'OTHER'
            )
        ),

    CONSTRAINT complaints_priority_check
        CHECK (
            priority IN (
                'LOW',
                'MEDIUM',
                'HIGH',
                'URGENT'
            )
        ),

    CONSTRAINT complaints_status_check
        CHECK (
            status IN (
                'OPEN',
                'UNDER_REVIEW',
                'RESOLVED'
            )
        )
);


-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,
    shipment_id BIGINT,

    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,

    type VARCHAR(30) NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT notifications_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT notifications_shipment_fk
        FOREIGN KEY (shipment_id)
        REFERENCES shipments(id)
        ON DELETE CASCADE
);

CREATE TABLE auth_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    jti VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT auth_sessions_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_shipments_sender_id
    ON shipments(sender_id);

CREATE INDEX idx_shipments_current_status
    ON shipments(current_status);

CREATE INDEX idx_tracking_events_shipment_id
    ON tracking_events(shipment_id);

CREATE INDEX idx_tracking_events_created_at
    ON tracking_events(created_at);

CREATE INDEX idx_delivery_assignments_agent_id
    ON delivery_assignments(agent_id);

CREATE INDEX idx_complaints_customer_id
    ON complaints(customer_id);

CREATE INDEX idx_complaints_status
    ON complaints(status);

CREATE INDEX idx_notifications_user_id
    ON notifications(user_id);

CREATE INDEX idx_notifications_is_read
    ON notifications(is_read);

CREATE INDEX idx_auth_sessions_user_id
    ON auth_sessions(user_id);

CREATE INDEX idx_auth_sessions_expires_at
    ON auth_sessions(expires_at);

CREATE INDEX idx_auth_sessions_revoked_at
    ON auth_sessions(revoked_at);