"""variants architecture core tables

Revision ID: 5e432ce1f84d
Revises: 963901c09645
Create Date: 2026-02-28 18:09:26.658644

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5e432ce1f84d'
down_revision: Union[str, Sequence[str], None] = '963901c09645'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from alembic import op

# revision identifiers, used by Alembic.
revision = "5e432ce1f84d"
down_revision = "963901c09645"
branch_labels = None
depends_on = None




def upgrade() -> None:
    stmts = [
        # stores
        """
        CREATE TABLE IF NOT EXISTS stores (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          platform TEXT NOT NULL DEFAULT 'naver_place',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """,
        "CREATE INDEX IF NOT EXISTS ix_stores_user_id ON stores(user_id)",

        # review_imports
        """
        CREATE TABLE IF NOT EXISTS review_imports (
          id TEXT PRIMARY KEY,
          store_id TEXT NOT NULL,
          source TEXT NOT NULL DEFAULT 'naver_place_excel',
          file_name TEXT,
          file_hash TEXT,
          period_start TEXT,
          period_end TEXT,
          total_rows INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'processing',
          error_message TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """,
        "CREATE INDEX IF NOT EXISTS ix_review_imports_store_id_created_at ON review_imports(store_id, created_at)",

        # reviews
        """
        CREATE TABLE IF NOT EXISTS reviews (
          id TEXT PRIMARY KEY,
          store_id TEXT NOT NULL,
          import_id TEXT,
          external_review_key TEXT,
          review_date TEXT,
          rating REAL,
          content_raw TEXT NOT NULL,
          content_clean TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """,
        "CREATE INDEX IF NOT EXISTS ix_reviews_store_id_review_date ON reviews(store_id, review_date)",
        "CREATE INDEX IF NOT EXISTS ix_reviews_store_id_created_at ON reviews(store_id, created_at)",

        # positioning_vectors
        """
        CREATE TABLE IF NOT EXISTS positioning_vectors (
          id TEXT PRIMARY KEY,
          store_id TEXT NOT NULL,
          period_start TEXT,
          period_end TEXT,
          vector_json TEXT NOT NULL,
          computed_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """,
        "CREATE INDEX IF NOT EXISTS ix_positioning_vectors_store_period ON positioning_vectors(store_id, period_start, period_end)",
        "CREATE INDEX IF NOT EXISTS ix_positioning_vectors_store_computed_at ON positioning_vectors(store_id, computed_at)",

        # generations
        """
        CREATE TABLE IF NOT EXISTS generations (
          id TEXT PRIMARY KEY,
          store_id TEXT NOT NULL,
          channel TEXT NOT NULL DEFAULT 'meta_ads',
          tone TEXT NOT NULL,
          target TEXT NOT NULL,
          prompt_version TEXT NOT NULL DEFAULT 'v1',
          input_json TEXT NOT NULL,
          usage_json TEXT,
          status TEXT NOT NULL DEFAULT 'succeeded',
          error_message TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """,
        "CREATE INDEX IF NOT EXISTS ix_generations_store_created_at ON generations(store_id, created_at)",

        # variants
        """
        CREATE TABLE IF NOT EXISTS variants (
          id TEXT PRIMARY KEY,
          generation_id TEXT NOT NULL,
          idx INTEGER NOT NULL,
          type TEXT NOT NULL DEFAULT 'primary',
          content TEXT NOT NULL,
          payload_json TEXT,
          tone TEXT NOT NULL,
          target TEXT NOT NULL,
          is_selected INTEGER NOT NULL DEFAULT 0,
          derived_from_variant_id TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """,
        "CREATE UNIQUE INDEX IF NOT EXISTS ux_variants_generation_idx ON variants(generation_id, idx)",
        "CREATE INDEX IF NOT EXISTS ix_variants_generation_id ON variants(generation_id)",

        # ads
        """
        CREATE TABLE IF NOT EXISTS ads (
          id TEXT PRIMARY KEY,
          store_id TEXT NOT NULL,
          variant_id TEXT NOT NULL,
          meta_ad_id TEXT NOT NULL,
          meta_account_id TEXT NOT NULL,
          meta_campaign_id TEXT,
          meta_adset_id TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """,
        "CREATE UNIQUE INDEX IF NOT EXISTS ux_ads_meta_ad_id ON ads(meta_ad_id)",
        "CREATE INDEX IF NOT EXISTS ix_ads_store_created_at ON ads(store_id, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_ads_variant_id ON ads(variant_id)",

        # ad_performance_daily
        """
        CREATE TABLE IF NOT EXISTS ad_performance_daily (
          id TEXT PRIMARY KEY,
          ad_id TEXT NOT NULL,
          perf_date TEXT NOT NULL,
          impressions INTEGER NOT NULL DEFAULT 0,
          clicks INTEGER NOT NULL DEFAULT 0,
          ctr REAL NOT NULL DEFAULT 0,
          raw_json TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """,
        "CREATE UNIQUE INDEX IF NOT EXISTS ux_ad_perf_ad_date ON ad_performance_daily(ad_id, perf_date)",
        "CREATE INDEX IF NOT EXISTS ix_ad_perf_date ON ad_performance_daily(perf_date)",
    ]

    for s in stmts:
        op.execute(s.strip())


def downgrade():
    op.execute("""
    DROP TABLE IF EXISTS ad_performance_daily;
    DROP TABLE IF EXISTS ads;
    DROP TABLE IF EXISTS variants;
    DROP TABLE IF EXISTS generations;
    DROP TABLE IF EXISTS positioning_vectors;
    DROP TABLE IF EXISTS reviews;
    DROP TABLE IF EXISTS review_imports;
    DROP TABLE IF EXISTS stores;
    """)

