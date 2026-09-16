from datetime import datetime, timezone
from app.scheduler import SCHEDULED_HOURS

def test_scheduled_hours():
    assert SCHEDULED_HOURS == [0, 6, 12, 18]
