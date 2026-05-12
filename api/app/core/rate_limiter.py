from fastapi import HTTPException, Request
import time
from collections import defaultdict

class RateLimiter:
    def __init__(self, requests_limit: int = 100, window_seconds: int = 60):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.history = defaultdict(list)

    async def check_rate_limit(self, identifier: str):
        now = time.time()
        # Clean up old requests
        self.history[identifier] = [t for t in self.history[identifier] if t > now - self.window_seconds]

        if len(self.history[identifier]) >= self.requests_limit:
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")

        self.history[identifier].append(now)

# Global instance
rate_limiter = RateLimiter()
