"""add review datasets and rows

Revision ID: 1d27a7c7ff22
Revises: c6bbfa28a4ce
Create Date: 2026-02-25 13:02:37.520156

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = '1d27a7c7ff22'
down_revision: Union[str, Sequence[str], None] = 'c6bbfa28a4ce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table(
        "review_datasets",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), nullable=True),
        sa.Column("dataset_name", sa.String(length=200), nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=False, server_default="naver_place_reviews_excel"),
        sa.Column("place_name", sa.String(length=200), nullable=True),
        sa.Column("place_category", sa.String(length=100), nullable=True),
        sa.Column("place_area", sa.String(length=100), nullable=True),
        sa.Column("default_year", sa.Integer(), nullable=False),
        sa.Column("extracted_blocks", sa.JSON(), nullable=True),
        sa.Column("extracted_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_review_datasets_user_id", "review_datasets", ["user_id"])

    op.create_table(
        "review_rows",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("dataset_id", sa.String(length=36), sa.ForeignKey("review_datasets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nickname", sa.String(length=120), nullable=True),
        sa.Column("review_text", sa.Text(), nullable=False),
        sa.Column("review_date", sa.Date(), nullable=False),
        sa.Column("visit_count", sa.Integer(), nullable=True),
        sa.Column("meta", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_review_rows_dataset_id", "review_rows", ["dataset_id"])
    op.create_index("ix_review_rows_review_date", "review_rows", ["review_date"])
    op.create_index("ix_review_rows_dataset_date", "review_rows", ["dataset_id", "review_date"])


def downgrade():
    op.drop_index("ix_review_rows_dataset_date", table_name="review_rows")
    op.drop_index("ix_review_rows_review_date", table_name="review_rows")
    op.drop_index("ix_review_rows_dataset_id", table_name="review_rows")
    op.drop_table("review_rows")

    op.drop_index("ix_review_datasets_user_id", table_name="review_datasets")
    op.drop_table("review_datasets")
