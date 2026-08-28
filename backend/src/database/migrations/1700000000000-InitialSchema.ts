import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline schema for MySQL production deployments.
 *
 * Local dev uses TypeORM `synchronize` against sql.js for zero-setup; this
 * migration is the canonical, reviewed DDL applied with
 * `npm run migration:run` on MySQL/MariaDB environments.
 */
export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const stmts = [
      `CREATE TABLE IF NOT EXISTS users (
        id CHAR(36) PRIMARY KEY,
        email VARCHAR(191) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(120) NOT NULL,
        role VARCHAR(16) NOT NULL DEFAULT 'user',
        is_email_verified TINYINT(1) NOT NULL DEFAULT 0,
        email_verify_token VARCHAR(255) NULL,
        reset_token_hash VARCHAR(255) NULL,
        reset_token_expires DATETIME NULL,
        refresh_token_hash VARCHAR(255) NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'active',
        last_active_at DATETIME NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS user_settings (
        id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NOT NULL UNIQUE,
        profile_visibility VARCHAR(16) NOT NULL DEFAULT 'public',
        show_online_status TINYINT(1) NOT NULL DEFAULT 1,
        show_distance TINYINT(1) NOT NULL DEFAULT 1,
        notif_message TINYINT(1) NOT NULL DEFAULT 1,
        notif_like TINYINT(1) NOT NULL DEFAULT 1,
        notif_match TINYINT(1) NOT NULL DEFAULT 1,
        notif_system TINYINT(1) NOT NULL DEFAULT 1,
        CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS interests (
        id CHAR(36) PRIMARY KEY,
        slug VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL,
        emoji VARCHAR(16) NULL,
        category VARCHAR(24) NOT NULL DEFAULT 'lifestyle',
        active TINYINT(1) NOT NULL DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS profiles (
        id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL,
        dob DATE NULL,
        gender VARCHAR(16) NOT NULL DEFAULT 'other',
        bio TEXT NULL,
        city VARCHAR(120) NULL,
        country VARCHAR(120) NULL,
        lat FLOAT NULL,
        lng FLOAT NULL,
        main_photo_url VARCHAR(500) NULL,
        verification VARCHAR(16) NOT NULL DEFAULT 'none',
        verification_requested_at DATETIME NULL,
        onboarding_completed TINYINT(1) NOT NULL DEFAULT 0,
        boosted_until DATETIME NULL,
        avatar_style VARCHAR(32) NULL,
        profile_theme VARCHAR(32) NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS profile_photos (
        id CHAR(36) PRIMARY KEY,
        profile_id CHAR(36) NOT NULL,
        url VARCHAR(500) NOT NULL,
        source VARCHAR(16) NOT NULL DEFAULT 'external',
        public_id VARCHAR(255) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        CONSTRAINT fk_photo_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
        INDEX idx_photo_profile (profile_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS user_interests (
        id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        interest_id CHAR(36) NOT NULL,
        INDEX idx_ui_user (user_id),
        INDEX idx_ui_interest (interest_id),
        CONSTRAINT fk_ui_interest FOREIGN KEY (interest_id) REFERENCES interests(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS dating_preferences (
        id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NOT NULL UNIQUE,
        show_me VARCHAR(16) NOT NULL DEFAULT 'everyone',
        age_min INT NOT NULL DEFAULT 21,
        age_max INT NOT NULL DEFAULT 35,
        max_distance_km INT NOT NULL DEFAULT 50,
        intention VARCHAR(24) NOT NULL DEFAULT 'long_term'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS likes (
        id CHAR(36) PRIMARY KEY,
        liker_id CHAR(36) NOT NULL,
        liked_id CHAR(36) NOT NULL,
        type VARCHAR(16) NOT NULL DEFAULT 'like',
        is_matched TINYINT(1) NOT NULL DEFAULT 0,
        rewindable_until DATETIME NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX idx_like_pair (liker_id, liked_id),
        INDEX idx_like_liker (liker_id),
        INDEX idx_like_liked (liked_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS matches (
        id CHAR(36) PRIMARY KEY,
        user_one_id CHAR(36) NOT NULL,
        user_two_id CHAR(36) NOT NULL,
        conversation_id CHAR(36) NULL,
        compatibility_score INT NOT NULL DEFAULT 0,
        is_super TINYINT(1) NOT NULL DEFAULT 0,
        unmatched TINYINT(1) NOT NULL DEFAULT 0,
        unmatched_by CHAR(36) NULL,
        unmatched_at DATETIME NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX idx_match_users (user_one_id, user_two_id),
        INDEX idx_match_one (user_one_id),
        INDEX idx_match_two (user_two_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS conversations (
        id CHAR(36) PRIMARY KEY,
        match_id CHAR(36) NULL,
        last_message_at DATETIME NULL,
        last_message_preview VARCHAR(255) NULL,
        is_closed TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS conversation_participants (
        id CHAR(36) PRIMARY KEY,
        conversation_id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        unread_count INT NOT NULL DEFAULT 0,
        last_read_at DATETIME NULL,
        is_hidden TINYINT(1) NOT NULL DEFAULT 0,
        INDEX idx_cp_conv (conversation_id),
        INDEX idx_cp_user (user_id),
        CONSTRAINT fk_cp_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS messages (
        id CHAR(36) PRIMARY KEY,
        conversation_id CHAR(36) NOT NULL,
        sender_id CHAR(36) NOT NULL,
        body TEXT NULL,
        type VARCHAR(12) NOT NULL DEFAULT 'text',
        status VARCHAR(12) NOT NULL DEFAULT 'sent',
        deleted_at DATETIME NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX idx_msg_conv (conversation_id),
        INDEX idx_msg_sender (sender_id),
        CONSTRAINT fk_msg_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS message_attachments (
        id CHAR(36) PRIMARY KEY,
        message_id CHAR(36) NOT NULL,
        url VARCHAR(500) NOT NULL,
        public_id VARCHAR(255) NULL,
        mime VARCHAR(32) NULL,
        size INT NULL,
        duration_sec INT NULL,
        CONSTRAINT fk_att_msg FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        type VARCHAR(24) NOT NULL,
        title VARCHAR(200) NOT NULL,
        body TEXT NULL,
        data TEXT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX idx_notif_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS blocks (
        id CHAR(36) PRIMARY KEY,
        blocker_id CHAR(36) NOT NULL,
        blocked_id CHAR(36) NOT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX idx_block_pair (blocker_id, blocked_id),
        INDEX idx_block_blocker (blocker_id),
        INDEX idx_block_blocked (blocked_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS reports (
        id CHAR(36) PRIMARY KEY,
        reporter_id CHAR(36) NOT NULL,
        reported_id CHAR(36) NOT NULL,
        reason VARCHAR(24) NOT NULL,
        details TEXT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'open',
        resolved_by CHAR(36) NULL,
        resolved_at DATETIME NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX idx_report_reporter (reporter_id),
        INDEX idx_report_reported (reported_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS profile_views (
        id CHAR(36) PRIMARY KEY,
        viewer_id CHAR(36) NOT NULL,
        viewed_id CHAR(36) NOT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX idx_view_pair (viewer_id, viewed_id),
        INDEX idx_view_viewed (viewed_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS premium_plans (
        id CHAR(36) PRIMARY KEY,
        name VARCHAR(64) NOT NULL,
        tier VARCHAR(24) NOT NULL DEFAULT 'premium',
        price INT NOT NULL,
        currency VARCHAR(8) NOT NULL DEFAULT 'XAF',
        period_days INT NOT NULL,
        daily_like_limit INT NOT NULL DEFAULT 200,
        super_likes_per_week INT NOT NULL DEFAULT 5,
        includes_boost TINYINT(1) NOT NULL DEFAULT 0,
        see_who_likes_you TINYINT(1) NOT NULL DEFAULT 1,
        advanced_filters TINYINT(1) NOT NULL DEFAULT 1,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        position INT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS premium_subscriptions (
        id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NOT NULL UNIQUE,
        plan_id CHAR(36) NULL,
        plan_name VARCHAR(64) NOT NULL DEFAULT 'Premium',
        status VARCHAR(16) NOT NULL DEFAULT 'active',
        started_at DATETIME NOT NULL,
        expires_at DATETIME NOT NULL,
        cancelled_at DATETIME NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS payments (
        id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        kind VARCHAR(16) NOT NULL DEFAULT 'subscription',
        plan_id CHAR(36) NULL,
        amount INT NOT NULL,
        currency VARCHAR(8) NOT NULL DEFAULT 'XAF',
        provider VARCHAR(32) NOT NULL DEFAULT 'mock',
        provider_ref VARCHAR(128) NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        payer_reference VARCHAR(128) NULL,
        paid_at DATETIME NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX idx_payment_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    ];
    for (const stmt of stmts) {
      await queryRunner.query(stmt);
    }
  }

  public async down(): Promise<void> {
    // Intentionally empty: destroying baseline data is a manual DBA action.
  }
}
