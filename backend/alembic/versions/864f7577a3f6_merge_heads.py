"""merge heads

Revision ID: 864f7577a3f6
Revises: 5e432ce1f84d, 963901c09645
Create Date: 2026-02-28 18:20:02.460274

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '864f7577a3f6'
down_revision: Union[str, Sequence[str], None] = ('5e432ce1f84d', '963901c09645')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
