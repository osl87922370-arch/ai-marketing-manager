"""add soft delete to generations"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_soft_delete_to_generations"
down_revision: Union[str, Sequence[str], None] = "864f7577a3f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
        op.add_column(
            "generations",
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
        op.add_column(
            "generations",
            sa.Column("deleted_at", sa.DateTime(), nullable=True),
        )


def downgrade() -> None:
        op.drop_column("generations", "deleted_at")
        op.drop_column("generations", "is_deleted")