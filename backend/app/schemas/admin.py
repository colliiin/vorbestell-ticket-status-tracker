from pydantic import BaseModel

class StatsOut(BaseModel):
    total: int
    open: int
    in_progress: int
    ready_for_pickup: int
    completed: int
    not_completed: int
    total_revenue: str
